import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagsService } from '../services/TagsService';
import { Tag, ApiError } from '../models';
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
  public async getTag(@Path() id: number): Promise<Tag | ApiError> {
    const tag = await tagsService.getTagById(id);
    if (!tag) {
      this.setStatus(404);
      return { error: 'Tag not found' };
    }
    return tag;
  }

  /**
   * Create a new tag
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTag(@Body() body: { name: string }): Promise<Tag | ApiError> {
    try {
      this.setStatus(201);
      return await tagsService.createTag(body);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('duplicate') || message.includes('already exists')) {
        this.setStatus(409);
        return { error: 'Tag already exists', details: message };
      }
      this.setStatus(500);
      return { error: 'Failed to create tag', details: message };
    }
  }

  /**
   * Update a tag by ID
   */
  @Put('{id}')
  public async updateTag(@Path() id: number, @Body() body: { name: string }): Promise<Tag | ApiError> {
    try {
      const updated = await tagsService.updateTag(id, body);
      if (!updated) {
        this.setStatus(404);
        return { error: 'Tag not found' };
      }
      return updated;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to update tag', details: (error as Error).message };
    }
  }

  /**
   * Delete a tag by ID
   */
  @Delete('{id}')
  public async deleteTag(@Path() id: number): Promise<Tag | ApiError> {
    try {
      const deleted = await tagsService.deleteTag(id);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'Tag not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete tag', details: (error as Error).message };
    }
  }
}
