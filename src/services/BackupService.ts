import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export interface BackupSuccess {
  ok: true;
  message: string;
  path: string;
}

export interface BackupFailure {
  ok: false;
  error: string;
  details?: string;
}

export type BackupResult = BackupSuccess | BackupFailure;


export class BackupService {
  constructor(private pool: Pool, private indexRoot: string) {}

  async createBackup(): Promise<BackupResult> {
    // Validate pool options exist
    if (!this.pool.options.host || !this.pool.options.database) {
      throw new Error('Database connection options are missing');
    }

    const backupFilePath = path.join(this.indexRoot, 'postgres-backup.sql');
    
    // Ensure backup directory exists
    try {
      if (!fs.existsSync(this.indexRoot)) {
        fs.mkdirSync(this.indexRoot, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${(error as Error).message}`);
    }

    const command = `pg_dump --host=${this.pool.options.host} --port=${this.pool.options.port} --username=${this.pool.options.user} --no-password --file=${backupFilePath} ${this.pool.options.database}`;
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const execProcess = exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          // Check for specific error types
          if (error.killed) {
            reject({ ok: false, error: 'Backup timed out after 60 seconds', details: stderr });
          } else if (stderr.includes('command not found') || stderr.includes('pg_dump')) {
            reject({ ok: false, error: 'pg_dump not found - PostgreSQL client tools not installed', details: stderr });
          } else {
            reject({ ok: false, error: 'Failed to back up the database', details: stderr || error.message });
          }
        } else {
          // Verify backup file was created
          try {
            if (fs.existsSync(backupFilePath)) {
              resolve({ ok: true, message: 'Backup successful', path: backupFilePath });
            } else {
              reject({ ok: false, error: 'Backup completed but file not found', details: backupFilePath });
            }
          } catch (err) {
            reject({ ok: false, error: 'Error verifying backup file', details: (err as Error).message });
          }
        }
      });

      // Handle process errors
      execProcess.on('error', (err) => {
        reject({ ok: false, error: 'Failed to execute backup command', details: err.message });
      });
    });
  }
}
