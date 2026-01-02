import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { TopicsService } from '../services/TopicsService';
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
  public async getTopics(): Promise<any[]> {
    return topicsService.getAllTopics();
  }

  /**
   * Get a topic by ID
   */
  @Get('{id}')
  public async getTopic(@Path() id: number): Promise<any> {
    return topicsService.getTopicById(id);
  }

  /**
   * Create a new topic
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createTopic(@Body() body: { name: string; description: string }): Promise<any> {
    return topicsService.createTopic(body);
  }

  /**
   * Update a topic by ID
   */
  @Put('{id}')
  public async updateTopic(@Path() id: number, @Body() body: { name: string; description: string }): Promise<any> {
    return topicsService.updateTopic(id, body);
  }

  /**
   * Delete a topic by ID
   */
  @Delete('{id}')
  public async deleteTopic(@Path() id: number): Promise<{ message: string }> {
    const deleted = await topicsService.deleteTopic(id);
    if (!deleted) throw { status: 404, message: 'Topic not found' };
    return { message: 'Topic deleted successfully' };
  }
}
