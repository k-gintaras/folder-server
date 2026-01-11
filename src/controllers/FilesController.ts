import { Body, Controller, Delete, Get, Path, Post, Route, UploadedFile, SuccessResponse } from 'tsoa';
import { FilesService } from '../services/FilesService';
import { File, FileMoveResult, ApiError } from '../models';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const indexFolder = process.env.INDEX_FOLDER ?? 'public';
const filesService = new FilesService(pool, indexFolder);

@Route('api/files')
export class FilesController extends Controller {
  /**
   * Get all files
   */
  @Get('/')
  public async getFiles(): Promise<File[]> {
    return filesService.getAllFiles();
  }

  /**
   * Get a file by ID
   */
  @Get('{id}')
  public async getFile(@Path() id: number): Promise<File | ApiError> {
    const file = await filesService.getFileById(id);
    if (!file) {
      this.setStatus(404);
      return { error: 'File not found' };
    }
    return file;
  }

  /**
   * Upload a file
   */
  @SuccessResponse('201', 'Created')
  @Post('upload')
  public async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<File | ApiError> {
    try {
      console.log('uploadFile received:', {
        fileExists: !!file,
        originalname: file?.originalname,
        filename: file?.filename,
        path: file?.path,
        size: file?.size,
        mimetype: file?.mimetype
      });
      
      if (!file) {
        this.setStatus(400);
        return { error: 'No file provided', details: 'File upload failed - file object is null' };
      }
      
      console.log('Processing file upload for:', file.originalname);
      this.setStatus(201);
      const result = await filesService.uploadFile(file);
      console.log('File upload completed successfully:', result.path);
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      this.setStatus(500);
      return { error: 'Failed to upload file', details: (error as Error).message };
    }
  }

  /**
   * Delete a file by ID
   */
  @Delete('{id}')
  public async deleteFile(@Path() id: number): Promise<File | ApiError> {
    try {
      const deleted = await filesService.deleteFile(id);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'File not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete file', details: (error as Error).message };
    }
  }

  /**
   * Move a file
   */
  @Post('move/:id/:folderName')
  public async moveFile(@Path() id: number, @Path() folderName: string): Promise<File | ApiError> {
    try {
      const moved = await filesService.moveFile(id, folderName);
      if (!moved) {
        this.setStatus(404);
        return { error: 'File not found' };
      }
      return moved;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to move file', details: (error as Error).message };
    }
  }

  /**
   * Move multiple files
   */
  @Post('move-multiple/:ids/:folderName')
  public async moveMultiple(@Path() ids: string, @Path() folderName: string): Promise<FileMoveResult[] | ApiError> {
    try {
      const fileIds = ids.split(',').map(id => parseInt(id, 10));
      return await filesService.moveMultiple(fileIds, folderName);
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to move files', details: (error as Error).message };
    }
  }

  /**
   * Search files by name (without extension)
   */
  @Get('search/{name}')
  public async searchFilesByName(@Path() name: string): Promise<File[]> {
    return filesService.searchFilesByName(name);
  }
}
