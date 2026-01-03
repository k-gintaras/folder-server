import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { File, FileMoveResult } from '../models';



export class FilesService {
  constructor(private pool: Pool, private indexFolder: string) {}

  async getAllFiles(): Promise<File[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files');
      return result.rows;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw new Error(`Failed to fetch files: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getFileById(id: number): Promise<File | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching file ${id}:`, error);
      throw new Error(`Failed to fetch file: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<File> {
    if (!file || !file.originalname) {
      throw new Error('Invalid file upload: file or filename missing');
    }

    // File is already saved to INDEX_FOLDER by multer with original filename
    // No need to move it, just verify it exists
    const targetPath = path.join(this.indexFolder, file.originalname);
    
    try {
      await fs.access(targetPath);
    } catch (error) {
      throw new Error(`Uploaded file not found at expected location: ${targetPath}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert into files table
      const fileResult = await client.query(
        `INSERT INTO files (path, type, size, last_modified, subtype) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [file.originalname, 'file', file.size, new Date().toISOString(), file.mimetype]
      );
      const fileRecord = fileResult.rows[0];
      
      // Also insert into items table
      await client.query(
        `INSERT INTO items (name, link, type) VALUES ($1, $2, $3)`,
        [file.originalname, `/served/${file.originalname}`, 'file']
      );
      
      await client.query('COMMIT');
      return fileRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error inserting file into database:', error);
      // Cleanup uploaded file if DB insert fails
      try {
        await fs.unlink(targetPath);
      } catch {}
      throw new Error(`Failed to save file metadata: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async deleteFile(id: number): Promise<File | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM files WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) return null;
      
      const filePath = result.rows[0].path;
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.indexFolder, filePath);
      
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        // File might not exist or permission denied - log but don't crash
        console.warn(`Could not delete file ${fullPath}:`, (error as Error).message);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting file ${id}:`, error);
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async moveFile(fileId: number, newFolder: string): Promise<File | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM files WHERE id = $1', [fileId]);
      if (result.rowCount === 0) return null;
      
      const file = result.rows[0];
      const oldPath = path.isAbsolute(file.path) ? file.path : path.join(this.indexFolder, file.path);
      const newPath = path.join(newFolder, path.basename(oldPath));
      
      try {
        await fs.rename(oldPath, newPath);
      } catch (error) {
        console.error(`Error moving file ${fileId}:`, error);
        throw new Error(`Failed to move file: ${(error as Error).message}`);
      }
      
      await client.query('UPDATE files SET path = $1 WHERE id = $2', [newPath, fileId]);
      return { ...file, path: newPath };
    } catch (error) {
      console.error(`Error in moveFile for ${fileId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async moveMultiple(fileIds: number[], newFolder: string): Promise<FileMoveResult[]> {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    const client = await this.pool.connect();
    const results: FileMoveResult[] = [];
    try {
      for (const fileId of fileIds) {
        try {
          const result = await client.query('SELECT * FROM files WHERE id = $1', [fileId]);
          if (result.rowCount === 0) {
            results.push({ fileId, status: 'not_found' });
            continue;
          }
          
          const file = result.rows[0];
          const oldPath = path.isAbsolute(file.path) ? file.path : path.join(this.indexFolder, file.path);
          const newPath = path.join(newFolder, path.basename(oldPath));
          
          try {
            await fs.rename(oldPath, newPath);
            await client.query('UPDATE files SET path = $1 WHERE id = $2', [newPath, fileId]);
            results.push({ fileId, status: 'moved', newPath });
          } catch (fsError) {
            console.error(`Error moving file ${fileId}:`, fsError);
            results.push({ fileId, status: 'error', message: (fsError as Error).message });
          }
        } catch (dbError) {
          console.error(`Database error for file ${fileId}:`, dbError);
          results.push({ fileId, status: 'error', message: (dbError as Error).message });
        }
      }
      return results;
    } finally {
      client.release();
    }
  }
}
