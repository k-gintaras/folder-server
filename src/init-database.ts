import { PoolClient } from "pg";
import fs from "fs";
import path from "path";

export async function ensureDatabase(client: PoolClient) {
  const schemaPath = path.resolve(__dirname, "../schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  try {
    await client.query(schema);
    console.log("✅ Database schema ensured");
  } catch (error) {
    console.error("❌ Failed to ensure database schema", error);
    throw error;
  }
}