import { Router } from "express";
import { Pool } from "pg";
import multer from "multer";
import fs from "fs/promises";
import path from "path";

const router = Router();
const upload = multer({ dest: "uploads/" });

export function createFileRoutes(pool: Pool) {
  router.get("/", async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT * FROM files");
      client.release();
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Unable to fetch files", details: (error as Error).message });
    }
  });

router.get("/:id", async (req, res) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const client = await pool.connect();
    const result = await client.query("SELECT path FROM files WHERE id = $1", [fileId]);
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = result.rows[0].path;
    const absolutePath = path.resolve("uploads", filePath); // Ensure the path is absolute
    res.sendFile(absolutePath);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch file", details: (error as Error).message });
  }
});

  router.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.INDEX_FOLDER) {
        return res.status(500).json({ error: "INDEX_FOLDER environment variable is not set" });
      }

      const targetPath = path.join(process.env.INDEX_FOLDER, file.originalname);
      await fs.rename(file.path, targetPath); // Move file to INDEX_FOLDER

      const client = await pool.connect();
      const result = await client.query(
        `INSERT INTO files (path, type, size, last_modified, subtype) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          file.originalname, // Store relative path
          "file",
          file.size,
          new Date().toISOString(),
          file.mimetype
        ]
      );
      client.release();

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Unable to upload file", details: (error as Error).message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id, 10);
      const client = await pool.connect();
      const result = await client.query("DELETE FROM files WHERE id = $1 RETURNING *", [fileId]);
      client.release();

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = result.rows[0].path;
      try {
        await fs.unlink(filePath);
      } catch (fsError) {
        console.error(`Failed to delete file at ${filePath}:`, (fsError as Error).message);
      }

      res.json({ status: "deleted", file: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete file", details: (error as Error).message });
    }
  });

  router.post("/move", async (req, res) => {
    const { fileId, newFolder } = req.body;

    if (!fileId || !newFolder) {
      return res.status(400).json({ error: "Missing fileId or newFolder in request body" });
    }

    try {
      const client = await pool.connect();
      const result = await client.query("SELECT * FROM files WHERE id = $1", [fileId]);

      if (result.rowCount === 0) {
        client.release();
        return res.status(404).json({ error: "File not found" });
      }

      const file = result.rows[0];
      const oldPath = file.path;
      const newPath = path.join(newFolder, path.basename(oldPath));

      await fs.rename(oldPath, newPath);

      await client.query("UPDATE files SET path = $1 WHERE id = $2", [newPath, fileId]);
      client.release();

      res.json({ status: "moved", file: { ...file, path: newPath } });
    } catch (error) {
      res.status(500).json({ error: "Unable to move file", details: (error as Error).message });
    }
  });

  router.post("/move-multiple", async (req, res) => {
    const { fileIds, newFolder } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || !newFolder) {
      return res.status(400).json({ error: "Missing fileIds (array) or newFolder in request body" });
    }

    try {
      const client = await pool.connect();
      const results = [];

      for (const fileId of fileIds) {
        const result = await client.query("SELECT * FROM files WHERE id = $1", [fileId]);

        if (result.rowCount === 0) {
          results.push({ fileId, status: "not_found" });
          continue;
        }

        const file = result.rows[0];
        const oldPath = file.path;
        const newPath = path.join(newFolder, path.basename(oldPath));

        try {
          await fs.rename(oldPath, newPath);
          await client.query("UPDATE files SET path = $1 WHERE id = $2", [newPath, fileId]);
          results.push({ fileId, status: "moved", newPath });
        } catch (fsError) {
          results.push({ fileId, status: "error", message: (fsError as Error).message });
        }
      }

      client.release();
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: "Unable to move files", details: (error as Error).message });
    }
  });

  return router;
}