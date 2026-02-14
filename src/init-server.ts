import { Pool } from "pg";
import { ensureDatabase } from "./init-database";
import { scanDirectoryBossy } from "./index-folder";
import path from "path";
import fs from "fs";

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

    console.log(`➡️ Smart sync - updating database to match filesystem`);

    // Scan filesystem and update/insert files and items
    console.log(`➡️ Scanning ${indexRoot} with duplicate detection`);
    await scanDirectoryBossy(client, indexRoot);

    // Clean up stale file records (files that exist in DB but not on disk)
    console.log(`➡️ Cleaning up deleted files...`);
    const dbFiles = await client.query<{ path: string }>(
      "SELECT path FROM files WHERE type = 'file'"
    );

    const deletedPaths: string[] = [];
    for (const record of dbFiles.rows) {
      const fullPath = path.join(indexRoot, record.path);
      if (!fs.existsSync(fullPath)) {
        deletedPaths.push(record.path);
      }
    }

    if (deletedPaths.length > 0) {
      await client.query(
        "DELETE FROM files WHERE path = ANY($1)",
        [deletedPaths]
      );
      console.log(`🧹 Removed ${deletedPaths.length} deleted file(s) from database`);
    } else {
      console.log(`✅ No deleted files to clean up`);
    }

    // Clean up orphaned items (items whose files were deleted)
    const orphanedItems = await client.query<{ name: string }>(
      `DELETE FROM items
       WHERE type = 'file'
       AND name NOT IN (SELECT name FROM files WHERE type = 'file')
       RETURNING name`
    );

    if (orphanedItems.rowCount && orphanedItems.rowCount > 0) {
      console.log(`🧹 Removed ${orphanedItems.rowCount} orphaned item(s) from database`);
    }

    console.log("✅ Sync complete - database matches filesystem");
  } finally {
    client.release();
  }
}