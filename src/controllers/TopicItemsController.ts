import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { TopicItemsService } from '../services/TopicItemsService';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const topicItemsService = new TopicItemsService(pool);

@Route('api/topic-items')
export class TopicItemsController extends Controller {
  /**
   * Get all topic-item relationships
   */
  @Get('/')
  public async getTopicItems(): Promise<any[]> {
    return topicItemsService.getAllTopicItems();
  }

  /**
   * Get a specific topic-item relationship
   */
  @Get('{topicId}/{itemId}')
  public async getTopicItem(@Path() topicId: number, @Path() itemId: number): Promise<any> {
    return topicItemsService.getTopicItem(topicId, itemId);
  }

  /**
   * Create a new topic-item relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTopicItem(@Body() body: { topicId: number; itemId: number }): Promise<any> {
    return topicItemsService.createTopicItem(body);
  }

  /**
   * Delete a topic-item relationship
   */
  @Delete('{topicId}/{itemId}')
  public async deleteTopicItem(@Path() topicId: number, @Path() itemId: number): Promise<{ message: string }> {
    const deleted = await topicItemsService.deleteTopicItem(topicId, itemId);
    if (!deleted) throw { status: 404, message: 'Topic-item relationship not found' };
    return { message: 'Topic-item relationship deleted successfully' };
  }
}
