import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagGroupsService } from '../services/TagGroupsService';
import { TagGroup, ApiError } from '../models';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const tagGroupsService = new TagGroupsService(pool);

@Route('api/tag-groups')
export class TagGroupsController extends Controller {
  /**
   * Get all tag groups
   */
  @Get('/')
  public async getTagGroups(): Promise<TagGroup[]> {
    return tagGroupsService.getAllTagGroups();
  }

  /**
   * Get a tag group by ID
   */
  @Get('{id}')
  public async getTagGroup(@Path() id: number): Promise<TagGroup | ApiError> {
    const tagGroup = await tagGroupsService.getTagGroupById(id);
    if (!tagGroup) {
      this.setStatus(404);
      return { error: 'Tag group not found' };
    }
    return tagGroup;
  }

  /**
   * Create a new tag group
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTagGroup(@Body() body: { name: string }): Promise<TagGroup | ApiError> {
    try {
      this.setStatus(201);
      return await tagGroupsService.createTagGroup(body);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('duplicate') || message.includes('already exists')) {
        this.setStatus(409);
        return { error: 'Tag group already exists', details: message };
      }
      this.setStatus(500);
      return { error: 'Failed to create tag group', details: message };
    }
  }

  /**
   * Update a tag group by ID
   */
  @Put('{id}')
  public async updateTagGroup(@Path() id: number, @Body() body: { name: string }): Promise<TagGroup | ApiError> {
    try {
      const updated = await tagGroupsService.updateTagGroup(id, body);
      if (!updated) {
        this.setStatus(404);
        return { error: 'Tag group not found' };
      }
      return updated;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to update tag group', details: (error as Error).message };
    }
  }

  /**
   * Delete a tag group by ID
   */
  @Delete('{id}')
  public async deleteTagGroup(@Path() id: number): Promise<TagGroup | ApiError> {
    try {
      const deleted = await tagGroupsService.deleteTagGroup(id);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'Tag group not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete tag group', details: (error as Error).message };
    }
  }
}
