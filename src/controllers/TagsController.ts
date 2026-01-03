import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagsService } from '../services/TagsService';
import { Tag } from '../models';
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
  public async getTags(): Promise<Tag[]> {
    return tagsService.getAllTags();
  }

  /**
   * Get a tag by ID
   */
  @Get('{id}')
  public async getTag(@Path() id: number): Promise<Tag | null> {
    const tag = await tagsService.getTagById(id);
    if (!tag) {
      this.setStatus(404);
      return null;
    }
    return tag;
  }

  /**
   * Create a new tag
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTag(@Body() body: { group: string; name: string }): Promise<Tag> {
    return tagsService.createTag(body);
  }

  /**
   * Update a tag by ID
   */
  @Put('{id}')
  public async updateTag(@Path() id: number, @Body() body: { group: string; name: string }): Promise<Tag | null> {
    const updated = await tagsService.updateTag(id, body);
    if (!updated) {
      this.setStatus(404);
      return null;
    }
    return updated;
  }

  /**
   * Delete a tag by ID
   */
  @Delete('{id}')
  public async deleteTag(@Path() id: number): Promise<Tag | null> {
    const deleted = await tagsService.deleteTag(id);
    if (!deleted) {
      this.setStatus(404);
      return null;
    }
    return deleted;
  }
}
