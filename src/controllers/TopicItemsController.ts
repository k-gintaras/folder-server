import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { TopicItemsService } from '../services/TopicItemsService';
import { TopicItem, ApiError } from '../models';
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
  public async getTopicItems(): Promise<TopicItem[]> {
    return topicItemsService.getAllTopicItems();
  }

  /**
   * Get a specific topic-item relationship
   */
  @Get('{topicId}/{itemId}')
  public async getTopicItem(@Path() topicId: number, @Path() itemId: number): Promise<TopicItem | ApiError> {
    const topicItem = await topicItemsService.getTopicItem(topicId, itemId);
    if (!topicItem) {
      this.setStatus(404);
      return { error: 'Topic-item relationship not found' };
    }
    return topicItem;
  }

  /**
   * Create a new topic-item relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTopicItem(@Body() body: { topicId: number; itemId: number }): Promise<TopicItem | ApiError> {
    try {
      this.setStatus(201);
      return await topicItemsService.createTopicItem(body);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('duplicate') || message.includes('already exists')) {
        this.setStatus(409);
        return { error: 'Topic-item relationship already exists', details: message };
      }
      this.setStatus(400);
      return { error: 'Failed to create topic-item relationship', details: message };
    }
  }

  /**
   * Delete a topic-item relationship
   */
  @Delete('{topicId}/{itemId}')
  public async deleteTopicItem(@Path() topicId: number, @Path() itemId: number): Promise<TopicItem | ApiError> {
    try {
      const deleted = await topicItemsService.deleteTopicItem(topicId, itemId);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'Topic-item relationship not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete topic-item relationship', details: (error as Error).message };
    }
  }
}
