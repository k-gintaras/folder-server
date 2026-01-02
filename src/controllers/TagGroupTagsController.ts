import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { TagGroupTagsService } from '../services/TagGroupTagsService';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const tagGroupTagsService = new TagGroupTagsService(pool);

@Route('api/tag-group-tags')
export class TagGroupTagsController extends Controller {
  /**
   * Get all tag-group-tag relationships
   */
  @Get('/')
  public async getTagGroupTags(): Promise<any[]> {
    return tagGroupTagsService.getAllTagGroupTags();
  }

  /**
   * Get a specific tag-group-tag relationship
   */
  @Get('{tagGroupId}/{tagId}')
  public async getTagGroupTag(@Path() tagGroupId: number, @Path() tagId: number): Promise<any> {
    return tagGroupTagsService.getTagGroupTag(tagGroupId, tagId);
  }

  /**
   * Create a new tag-group-tag relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTagGroupTag(@Body() body: { tagGroupId: number; tagId: number }): Promise<any> {
    return tagGroupTagsService.createTagGroupTag(body);
  }

  /**
   * Delete a tag-group-tag relationship
   */
  @Delete('{tagGroupId}/{tagId}')
  public async deleteTagGroupTag(@Path() tagGroupId: number, @Path() tagId: number): Promise<{ message: string }> {
    const deleted = await tagGroupTagsService.deleteTagGroupTag(tagGroupId, tagId);
    if (!deleted) throw { status: 404, message: 'Tag-group-tag relationship not found' };
    return { message: 'Tag-group-tag relationship deleted successfully' };
  }
}
