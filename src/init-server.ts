import { Pool } from "pg";
import { ensureDatabase } from "./init-database";
import { scanDirectory } from "./index-folder";
import path from "path";

export async function initializeServer(pool: Pool, indexRoot: string, forceIndex = false) {
  const client = await pool.connect();
  try {
    await ensureDatabase(client);

    const countResult = await client.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM files");
    const total = Number(countResult.rows[0]?.count ?? 0);

    if (!forceIndex && total > 0) {
      console.log("➡️ Skipping indexing as files already exist");
      return;
    }

    console.log(`➡️ Indexing ${indexRoot}`);
    await scanDirectory(client, indexRoot, indexRoot, null);
    console.log("✅ Initial index complete");
  } finally {
    client.release();
  }
}