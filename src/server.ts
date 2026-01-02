import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { initializeServer } from "./init-server";
import multer from "multer";
import { createFileRoutes } from "./routes/files";
import { createTagRoutes } from "./routes/tags";
import { createTagGroupRoutes } from "./routes/tagGroups";
import { createTagGroupTagsRoutes } from "./routes/tagGroupTags";
import { createTopicRoutes } from "./routes/topics";
import { createTopicTagGroupsRoutes } from "./routes/topicTagGroups";
import { createItemRoutes } from "./routes/items";
import { createItemTagsRoutes } from "./routes/itemTags";
import { createTopicItemsRoutes } from "./routes/topicItems";
import { createBackupRoutes } from "./routes/backup";
import cors from "cors";


dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const env = {
  port: Number(process.env.PORT ?? 4000),
  indexFolder: process.env.INDEX_FOLDER ?? "public",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "postgres"
  }
};

const indexRoot = path.resolve(process.cwd(), env.indexFolder);
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 5
});

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });


app.get("/", (req, res) => {
  res.json({
    message: "Folder server is running",
    env: {
      port: env.port,
      indexFolder: indexRoot,
      db: env.db
    }
  });
});

app.get("/api/status", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT 1 AS ready");
    client.release();
    res.json({
      database: {
        ready: Boolean(result.rows[0]?.ready === 1),
        connection: {
          host: env.db.host,
          port: env.db.port,
          database: env.db.database
        }
      },
      indexFolder: indexRoot
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to reach Postgres", details: (error as Error).message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/files", createFileRoutes(pool));
app.use("/api/tags", createTagRoutes(pool));
app.use("/api/tag-groups", createTagGroupRoutes(pool));
app.use("/api/tag-group-tags", createTagGroupTagsRoutes(pool));
app.use("/api/topics", createTopicRoutes(pool));
app.use("/api/topic-tag-groups", createTopicTagGroupsRoutes(pool));
app.use("/api/items", createItemRoutes(pool));
console.log('Registering /api/items in server.ts');
app.use("/api/item-tags", createItemTagsRoutes(pool));
app.use("/api/topic-items", createTopicItemsRoutes(pool));
app.use("/api/backup", createBackupRoutes(pool, indexRoot));
app.use("/served", express.static(indexRoot));

let server: ReturnType<typeof app.listen> | undefined;

async function startServer() {
  await initializeServer(pool, indexRoot, true); // Force indexing on every server start to detect new files
  server = app.listen(env.port, () => {
    console.log(`Folder server listening on port ${env.port}, serving ${indexRoot}`);
  });
}

const shutdown = async () => {
  await pool.end();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

startServer().catch((error) => {
  console.error("Failed to start folder server", error);
  process.exit(1);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
