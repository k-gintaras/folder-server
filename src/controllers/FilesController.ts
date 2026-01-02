import { Body, Controller, Delete, Get, Path, Post, Route, UploadedFile, SuccessResponse } from 'tsoa';
import { FilesService } from '../services/FilesService';
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
  public async getFiles(): Promise<any[]> {
    return filesService.getAllFiles();
  }

  /**
   * Get a file by ID
   */
  @Get('{id}')
  public async getFile(@Path() id: number): Promise<any> {
    return filesService.getFileById(id);
  }

  /**
   * Upload a file
   */
  @SuccessResponse('201', 'Created')
  @Post('upload')
  public async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<any> {
    return filesService.uploadFile(file);
  }

  /**
   * Delete a file by ID
   */
  @Delete('{id}')
  public async deleteFile(@Path() id: number): Promise<{ status: string; file: any }> {
    const deleted = await filesService.deleteFile(id);
    if (!deleted) throw { status: 404, message: 'File not found' };
    return { status: 'deleted', file: deleted };
  }

  /**
   * Move a file
   */
  @Post('move')
  public async moveFile(@Body() body: { fileId: number; newFolder: string }): Promise<{ status: string; file: any }> {
    const moved = await filesService.moveFile(body.fileId, body.newFolder);
    if (!moved) throw { status: 404, message: 'File not found' };
    return { status: 'moved', file: moved };
  }

  /**
   * Move multiple files
   */
  @Post('move-multiple')
  public async moveMultiple(@Body() body: { fileIds: number[]; newFolder: string }): Promise<{ results: any[] }> {
    const results = await filesService.moveMultiple(body.fileIds, body.newFolder);
    return { results };
  }
}
