import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

export class FilesService {
  constructor(private pool: Pool, private indexFolder: string) {}

  async getAllFiles() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getFileById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files WHERE id = $1', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async uploadFile(file: Express.Multer.File) {
    const targetPath = path.join(this.indexFolder, file.originalname);
    await fs.rename(file.path, targetPath);
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO files (path, type, size, last_modified, subtype) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [file.originalname, 'file', file.size, new Date().toISOString(), file.mimetype]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteFile(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM files WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) return null;
      const filePath = result.rows[0].path;
      try {
        await fs.unlink(filePath);
      } catch {}
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async moveFile(fileId: number, newFolder: string) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files WHERE id = $1', [fileId]);
      if (result.rowCount === 0) return null;
      const file = result.rows[0];
      const oldPath = file.path;
      const newPath = path.join(newFolder, path.basename(oldPath));
      await fs.rename(oldPath, newPath);
      await client.query('UPDATE files SET path = $1 WHERE id = $2', [newPath, fileId]);
      return { ...file, path: newPath };
    } finally {
      client.release();
    }
  }

  async moveMultiple(fileIds: number[], newFolder: string) {
    const client = await this.pool.connect();
    const results = [];
    try {
      for (const fileId of fileIds) {
        const result = await client.query('SELECT * FROM files WHERE id = $1', [fileId]);
        if (result.rowCount === 0) {
          results.push({ fileId, status: 'not_found' });
          continue;
        }
        const file = result.rows[0];
        const oldPath = file.path;
        const newPath = path.join(newFolder, path.basename(oldPath));
        try {
          await fs.rename(oldPath, newPath);
          await client.query('UPDATE files SET path = $1 WHERE id = $2', [newPath, fileId]);
          results.push({ fileId, status: 'moved', newPath });
        } catch (fsError) {
          results.push({ fileId, status: 'error', message: (fsError as Error).message });
        }
      }
      return results;
    } finally {
      client.release();
    }
  }
}
