import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export class BackupService {
  constructor(private pool: Pool, private indexRoot: string) {}

  async createBackup(): Promise<{ message: string; path: string }> {
    const backupFilePath = path.join(this.indexRoot, 'postgres-backup.sql');
    if (!fs.existsSync(this.indexRoot)) {
      fs.mkdirSync(this.indexRoot, { recursive: true });
    }
    const command = `pg_dump --host=${this.pool.options.host} --port=${this.pool.options.port} --username=${this.pool.options.user} --no-password --file=${backupFilePath} ${this.pool.options.database}`;
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ error: 'Failed to back up the database', details: stderr });
        } else {
          resolve({ message: 'Backup successful', path: backupFilePath });
        }
      });
    });
  }
}
