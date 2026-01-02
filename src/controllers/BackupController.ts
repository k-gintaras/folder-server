import { Controller, Post, Route, SuccessResponse } from 'tsoa';
import { BackupService } from '../services/BackupService';
import { Pool } from 'pg';
import path from 'path';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const indexRoot = process.env.INDEX_FOLDER ? path.resolve(process.cwd(), process.env.INDEX_FOLDER) : path.resolve(process.cwd(), 'public');
const backupService = new BackupService(pool, indexRoot);

@Route('api/backup')
export class BackupController extends Controller {
  /**
   * Create a database backup
   */
  @SuccessResponse('200', 'Backup successful')
  @Post('backup')
  public async createBackup(): Promise<{ message: string; path: string }> {
    return backupService.createBackup();
  }
}
