import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagsService } from '../services/TagsService';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const tagsService = new TagsService(pool);

@Route('api/tags')
export class TagsController extends Controller {
  /**
   * Get all tags
   */
  @Get('/')
  public async getTags(): Promise<any[]> {
    return tagsService.getAllTags();
  }

  /**
   * Get a tag by ID
   */
  @Get('{id}')
  public async getTag(@Path() id: number): Promise<any> {
    return tagsService.getTagById(id);
  }

  /**
   * Create a new tag
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTag(@Body() body: { group: string; name: string }): Promise<any> {
    return tagsService.createTag(body);
  }

  /**
   * Update a tag by ID
   */
  @Put('{id}')
  public async updateTag(@Path() id: number, @Body() body: { group: string; name: string }): Promise<any> {
    return tagsService.updateTag(id, body);
  }

  /**
   * Delete a tag by ID
   */
  @Delete('{id}')
  public async deleteTag(@Path() id: number): Promise<{ message: string }> {
    const deleted = await tagsService.deleteTag(id);
    if (!deleted) throw { status: 404, message: 'Tag not found' };
    return { message: 'Tag deleted successfully' };
  }
}
