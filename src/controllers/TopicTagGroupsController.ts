import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { TopicTagGroupsService } from '../services/TopicTagGroupsService';
import { TopicTagGroup } from '../models';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const topicTagGroupsService = new TopicTagGroupsService(pool);

@Route('api/topic-tag-groups')
export class TopicTagGroupsController extends Controller {
  /**
   * Get all topic-tag-group relationships
   */
  @Get('/')
  public async getTopicTagGroups(): Promise<TopicTagGroup[]> {
    return topicTagGroupsService.getAllTopicTagGroups();
  }

  /**
   * Get a specific topic-tag-group relationship
   */
  @Get('{topicId}/{tagGroupId}')
  public async getTopicTagGroup(@Path() topicId: number, @Path() tagGroupId: number): Promise<TopicTagGroup | null> {
    const topicTagGroup = await topicTagGroupsService.getTopicTagGroup(topicId, tagGroupId);
    if (!topicTagGroup) {
      this.setStatus(404);
      return null;
    }
    return topicTagGroup;
  }

  /**
   * Create a new topic-tag-group relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTopicTagGroup(@Body() body: { topicId: number; tagGroupId: number }): Promise<TopicTagGroup> {
    return topicTagGroupsService.createTopicTagGroup(body);
  }

  /**
   * Delete a topic-tag-group relationship
   */
  @Delete('{topicId}/{tagGroupId}')
  public async deleteTopicTagGroup(@Path() topicId: number, @Path() tagGroupId: number): Promise<TopicTagGroup | null> {
    const deleted = await topicTagGroupsService.deleteTopicTagGroup(topicId, tagGroupId);
    if (!deleted) {
      this.setStatus(404);
      return null;
    }
    return deleted;
  }
}
