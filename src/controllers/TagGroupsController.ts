import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagGroupsService } from '../services/TagGroupsService';
import { TagGroup } from '../models';
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
  public async getTagGroup(@Path() id: number): Promise<TagGroup | null> {
    const tagGroup = await tagGroupsService.getTagGroupById(id);
    if (!tagGroup) {
      this.setStatus(404);
      return null;
    }
    return tagGroup;
  }

  /**
   * Create a new tag group
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTagGroup(@Body() body: { name: string }): Promise<TagGroup> {
    return tagGroupsService.createTagGroup(body);
  }

  /**
   * Update a tag group by ID
   */
  @Put('{id}')
  public async updateTagGroup(@Path() id: number, @Body() body: { name: string }): Promise<TagGroup | null> {
    const updated = await tagGroupsService.updateTagGroup(id, body);
    if (!updated) {
      this.setStatus(404);
      return null;
    }
    return updated;
  }

  /**
   * Delete a tag group by ID
   */
  @Delete('{id}')
  public async deleteTagGroup(@Path() id: number): Promise<TagGroup | null> {
    const deleted = await tagGroupsService.deleteTagGroup(id);
    if (!deleted) {
      this.setStatus(404);
      return null;
    }
    return deleted;
  }
}
