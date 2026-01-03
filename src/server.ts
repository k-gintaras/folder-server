import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { initializeServer } from "./init-server";
import multer from "multer";
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
// All routes now handled by tsoa controllers
import { RegisterRoutes } from './routes';
import cors from "cors";


dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const hostPort = Number(process.env.APP_HOST_PORT ?? process.env.PORT ?? 4000);
const containerPort = Number(process.env.APP_CONTAINER_PORT ?? process.env.PORT ?? hostPort);
const listenPort = Number(process.env.PORT ?? containerPort);

const env = {
  hostPort,
  port: listenPort,
  indexFolder: process.env.INDEX_FOLDER ?? "public",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "postgres"
  }
};

const indexRoot = path.isAbsolute(env.indexFolder) ? env.indexFolder : path.resolve(process.cwd(), env.indexFolder);
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 5
});

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });


app.get("/", (req, res) => {
  res.json({
    message: "Folder server is running",
    env: {
      hostPort: env.hostPort,
      listenPort: env.port,
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

// tsoa controllers handle /api/* routes
RegisterRoutes(app);
app.use("/served", express.static(indexRoot));

// Serve generated Swagger UI if spec exists at dist/swagger.json
try {
  const swaggerPath = path.join(process.cwd(), 'dist', 'swagger.json');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    console.log('Serving API docs at http://localhost:' + env.hostPort + '/api-docs');
  } else {
    console.warn('Swagger spec not found at dist/swagger.json. Run `npx tsoa spec` to generate it.');
  }
} catch (error) {
  console.error('Failed to initialize Swagger UI:', (error as Error).message);
}

let server: ReturnType<typeof app.listen> | undefined;

async function startServer() {
  try {
    await initializeServer(pool, indexRoot, true); // Force indexing on every server start to detect new files
    server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`Folder server listening on port ${env.port} (host ${env.hostPort}), serving ${indexRoot}`);
    });
    
    // Handle server errors
    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      if ((err as any).code === 'EADDRINUSE') {
        console.error(`Port ${env.port} is already in use`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error during server initialization:', error);
    throw error;
  }
}

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
        process.exit(1);
      }
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep server running for minor errors, but exit for critical ones
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
    console.error('Critical error detected, shutting down...');
    shutdown();
  }
});
