import { Router } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();

export function createBackupRoutes(pool, indexRoot) {
  router.post('/backup', async (req, res) => {
    const backupFilePath = path.join(indexRoot, 'postgres-backup.sql');

    try {
      // Ensure the index folder exists
      if (!fs.existsSync(indexRoot)) {
        fs.mkdirSync(indexRoot, { recursive: true });
      }

      // Command to back up the database
      const command = `pg_dump --host=${pool.options.host} --port=${pool.options.port} --username=${pool.options.user} --no-password --file=${backupFilePath} ${pool.options.database}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup failed: ${stderr}`);
          return res.status(500).json({ error: 'Failed to back up the database', details: stderr });
        }

        console.log(`Backup successful: ${backupFilePath}`);
        res.status(200).json({ message: 'Backup successful', path: backupFilePath });
      });
    } catch (error) {
      console.error(`Failed to create backup: ${error.message}`);
      res.status(500).json({ error: 'Failed to create backup', details: error.message });
    }
  });

  return router;
}