import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TopicsService } from '../services/TopicsService';
import { Topic, ApiError } from '../models';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const topicsService = new TopicsService(pool);

@Route('api/topics')
export class TopicsController extends Controller {
  /**
   * Get all topics
   */
  @Get('/')
  public async getTopics(): Promise<Topic[]> {
    return topicsService.getAllTopics();
  }

  /**
   * Get a topic by ID
   */
  @Get('{id}')
  public async getTopic(@Path() id: number): Promise<Topic | ApiError> {
    const topic = await topicsService.getTopicById(id);
    if (!topic) {
      this.setStatus(404);
      return { error: 'Topic not found' };
    }
    return topic;
  }

  /**
   * Create a new topic
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTopic(@Body() body: { name: string; description: string }): Promise<Topic | ApiError> {
    try {
      this.setStatus(201);
      return await topicsService.createTopic(body);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('duplicate') || message.includes('already exists')) {
        this.setStatus(409);
        return { error: 'Topic already exists', details: message };
      }
      this.setStatus(500);
      return { error: 'Failed to create topic', details: message };
    }
  }

  /**
   * Update a topic by ID
   */
  @Put('{id}')
  public async updateTopic(@Path() id: number, @Body() body: { name: string; description: string }): Promise<Topic | ApiError> {
    try {
      const updated = await topicsService.updateTopic(id, body);
      if (!updated) {
        this.setStatus(404);
        return { error: 'Topic not found' };
      }
      return updated;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to update topic', details: (error as Error).message };
    }
  }

  /**
   * Delete a topic by ID
   */
  @Delete('{id}')
  public async deleteTopic(@Path() id: number): Promise<Topic | ApiError> {
    try {
      const deleted = await topicsService.deleteTopic(id);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'Topic not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete topic', details: (error as Error).message };
    }
  }
}
