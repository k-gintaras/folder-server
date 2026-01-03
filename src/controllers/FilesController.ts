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
      
      this.setStatus(201);
      return await filesService.uploadFile(file);
    } catch (error) {
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
  @Post('move')
  public async moveFile(@Body() body: { fileId: number; newFolder: string }): Promise<File | ApiError> {
    try {
      const moved = await filesService.moveFile(body.fileId, body.newFolder);
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
  @Post('move-multiple')
  public async moveMultiple(@Body() body: { fileIds: number[]; newFolder: string }): Promise<FileMoveResult[] | ApiError> {
    try {
      return await filesService.moveMultiple(body.fileIds, body.newFolder);
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to move files', details: (error as Error).message };
    }
  }
}
