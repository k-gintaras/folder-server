import { Pool } from "pg";
import { ensureDatabase } from "./init-database";
import { scanDirectoryBossy } from "./index-folder";
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

    console.log(`➡️ Hard reindex - clearing files and items tables`);
    await client.query("DELETE FROM files");
    await client.query("DELETE FROM items WHERE type = 'file'");
    
    console.log(`➡️ Indexing ${indexRoot} with duplicate detection`);
    await scanDirectoryBossy(client, indexRoot);
    console.log("✅ Initial index complete");
  } finally {
    client.release();
  }
}