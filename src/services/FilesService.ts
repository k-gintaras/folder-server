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

    // File should be saved by multer - check if it has a path
    let targetPath: string;
    if (file.path) {
      // Multer saved the file and provided the path
      targetPath = file.path;
    } else {
      // Fallback: construct path from INDEX_FOLDER and filename
      targetPath = path.join(this.indexFolder, file.originalname);
    }
    
    console.log('Checking for uploaded file at:', targetPath);
    
    try {
      await fs.access(targetPath);
      console.log('File exists on disk at:', targetPath);
    } catch (error) {
      throw new Error(`Uploaded file not found at expected location: ${targetPath}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if file already exists in database
      const existingResult = await client.query(
        `SELECT id FROM files WHERE path = $1`,
        [file.originalname]
      );
      
      const nameWithoutExt = path.parse(file.originalname).name;
      
      let fileRecord;
      if (existingResult.rowCount && existingResult.rowCount > 0) {
        // Database record exists - update it (handles case where physical file was deleted)
        const fileId = existingResult.rows[0].id;
        const fileResult = await client.query(
          `UPDATE files SET type = $1, size = $2, last_modified = $3, subtype = $4, name = $5 WHERE id = $6 RETURNING *`,
          ['file', file.size, new Date().toISOString(), file.mimetype, nameWithoutExt, fileId]
        );
        fileRecord = fileResult.rows[0];
        console.log(`Updated existing file record for: ${file.originalname} (file was re-uploaded)`);
      } else {
        // No database record - create new entries
        const fileResult = await client.query(
          `INSERT INTO files (path, type, size, last_modified, subtype, name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [file.originalname, 'file', file.size, new Date().toISOString(), file.mimetype, nameWithoutExt]
        );
        fileRecord = fileResult.rows[0];
        
        // Also insert into items table for new file
        await client.query(
          `INSERT INTO items (name, link, type) VALUES ($1, $2, $3)`,
          [file.originalname, `/served/${file.originalname}`, 'file']
        );
        console.log(`Created new file record for: ${file.originalname}`);
      }
      
      await client.query('COMMIT');
      return fileRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving file to database:', error);
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
      await client.query('BEGIN');
      
      const result = await client.query('DELETE FROM files WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const fileRecord = result.rows[0];
      const filePath = fileRecord.path;
      
      // Also delete from items table
      await client.query(
        `DELETE FROM items WHERE name = $1 AND type = 'file'`,
        [filePath]
      );
      
      await client.query('COMMIT');
      
      // Delete physical file
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.indexFolder, filePath);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        // File might not exist or permission denied - log but don't crash
        console.warn(`Could not delete file ${fullPath}:`, (error as Error).message);
      }
      
      return fileRecord;
    } catch (error) {
      await client.query('ROLLBACK');
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
      
      // Only allow moving files, not folders
      if (file.type === 'directory') {
        throw new Error('Moving folders is not supported. Folders contain nested items with complex path dependencies that would require updating multiple database records and item links. Please move individual files instead.');
      }
      
      // file.path starts with / but is relative to indexFolder (e.g., /2022/file.jpg)
      // Remove leading slash and join with indexFolder
      const relPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      const oldPath = path.join(this.indexFolder, relPath);
      
      // Resolve the new folder path relative to indexFolder
      const newFolderPath = path.isAbsolute(newFolder) ? newFolder : path.join(this.indexFolder, newFolder);
      
      // Ensure the destination folder exists
      try {
        await fs.mkdir(newFolderPath, { recursive: true });
      } catch (mkdirError) {
        console.error(`Error creating directory ${newFolderPath}:`, mkdirError);
        throw new Error(`Failed to create destination folder: ${(mkdirError as Error).message}`);
      }
      
      const fileName = path.basename(oldPath);
      const newPath = path.join(newFolderPath, fileName);
      
      // Store the relative path for the database (with leading slash to match existing format)
      const relativePath = '/' + (path.isAbsolute(newFolder) 
        ? path.relative(this.indexFolder, newPath)
        : path.join(newFolder, fileName));
      
      try {
        await fs.rename(oldPath, newPath);
      } catch (error) {
        console.error(`Error moving file ${fileId}:`, error);
        throw new Error(`Failed to move file: ${(error as Error).message}`);
      }
      
        await client.query('UPDATE files SET path = $1 WHERE id = $2', [relativePath, fileId]);
      
        // Also update the items table link
        const fileNameWithoutExt = path.parse(fileName).name;
        await client.query(
          'UPDATE items SET link = $1 WHERE name = $2 AND type = $3',
          [relativePath, fileNameWithoutExt, 'file']
        );
      
      return { ...file, path: relativePath };
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
    
    // Resolve the new folder path relative to indexFolder
    const newFolderPath = path.isAbsolute(newFolder) ? newFolder : path.join(this.indexFolder, newFolder);
    
    // Ensure the destination folder exists
    try {
      await fs.mkdir(newFolderPath, { recursive: true });
    } catch (mkdirError) {
      console.error(`Error creating directory ${newFolderPath}:`, mkdirError);
      // Return error for all files if we can't create the destination folder
      return fileIds.map(fileId => ({
        fileId,
        status: 'error',
        message: `Failed to create destination folder: ${(mkdirError as Error).message}`
      }));
    }
    
    try {
      for (const fileId of fileIds) {
        try {
          const result = await client.query('SELECT * FROM files WHERE id = $1', [fileId]);
          if (result.rowCount === 0) {
            results.push({ fileId, status: 'not_found' });
            continue;
          }
          
          const file = result.rows[0];
          
          // Only allow moving files, not folders
          if (file.type === 'directory') {
            results.push({
              fileId,
              status: 'error',
              message: 'Moving folders is not supported. Folders contain nested items with complex path dependencies that would require updating multiple database records and item links. Please move individual files instead.'
            });
            continue;
          }
          
          const oldPath = path.isAbsolute(file.path) ? file.path : path.join(this.indexFolder, file.path);
          const fileName = path.basename(oldPath);
          const newPath = path.join(newFolderPath, fileName);
          
          // Store the relative path for the database (relative to indexFolder)
          const relativePath = path.isAbsolute(newFolder) 
            ? path.relative(this.indexFolder, newPath)
            : path.join(newFolder, fileName);
          
          try {
            await fs.rename(oldPath, newPath);
            await client.query('UPDATE files SET path = $1 WHERE id = $2', [relativePath, fileId]);
            results.push({ fileId, status: 'moved', newPath: relativePath });
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

  async searchFilesByName(searchName: string): Promise<File[]> {
    const client = await this.pool.connect();
    try {
      // Search for files where name contains the search term (case-insensitive)
      const result = await client.query(
        `SELECT * FROM files WHERE name ILIKE $1 AND type = 'file' ORDER BY name ASC`,
        [`%${searchName}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error searching files by name:', error);
      throw new Error(`Failed to search files: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
