import { Body, Controller, Delete, Get, Path, Post, Route, UploadedFile, SuccessResponse } from 'tsoa';
import { FilesService } from '../services/FilesService';
import { File, FileMoveResult } from '../models';
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
  public async getFile(@Path() id: number): Promise<File | null> {
    const file = await filesService.getFileById(id);
    if (!file) {
      this.setStatus(404);
      return null;
    }
    return file;
  }

  /**
   * Upload a file
   */
  @SuccessResponse('201', 'Created')
  @Post('upload')
  public async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<File> {
    return filesService.uploadFile(file);
  }

  /**
   * Delete a file by ID
   */
  @Delete('{id}')
  public async deleteFile(@Path() id: number): Promise<File | null> {
    const deleted = await filesService.deleteFile(id);
    if (!deleted) {
      this.setStatus(404);
      return null;
    }
    return deleted;
  }

  /**
   * Move a file
   */
  @Post('move')
  public async moveFile(@Body() body: { fileId: number; newFolder: string }): Promise<File | null> {
    const moved = await filesService.moveFile(body.fileId, body.newFolder);
    if (!moved) {
      this.setStatus(404);
      return null;
    }
    return moved;
  }

  /**
   * Move multiple files
   */
  @Post('move-multiple')
  public async moveMultiple(@Body() body: { fileIds: number[]; newFolder: string }): Promise<FileMoveResult[]> {
    return filesService.moveMultiple(body.fileIds, body.newFolder);
  }
}
