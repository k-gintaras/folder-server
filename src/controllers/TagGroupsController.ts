import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TagGroupsService } from '../services/TagGroupsService';
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
  public async getTagGroups(): Promise<any[]> {
    return tagGroupsService.getAllTagGroups();
  }

  /**
   * Get a tag group by ID
   */
  @Get('{id}')
  public async getTagGroup(@Path() id: number): Promise<any> {
    return tagGroupsService.getTagGroupById(id);
  }

  /**
   * Create a new tag group
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTagGroup(@Body() body: { name: string }): Promise<any> {
    return tagGroupsService.createTagGroup(body);
  }

  /**
   * Update a tag group by ID
   */
  @Put('{id}')
  public async updateTagGroup(@Path() id: number, @Body() body: { name: string }): Promise<any> {
    return tagGroupsService.updateTagGroup(id, body);
  }

  /**
   * Delete a tag group by ID
   */
  @Delete('{id}')
  public async deleteTagGroup(@Path() id: number): Promise<{ message: string }> {
    const deleted = await tagGroupsService.deleteTagGroup(id);
    if (!deleted) throw { status: 404, message: 'Tag group not found' };
    return { message: 'Tag group deleted successfully' };
  }
}
