import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { ItemTagsService } from '../services/ItemTagsService';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const itemTagsService = new ItemTagsService(pool);

@Route('api/item-tags')
export class ItemTagsController extends Controller {
  /**
   * Get all item-tag relationships
   */
  @Get('/')
  public async getItemTags(): Promise<any[]> {
    return itemTagsService.getAllItemTags();
  }

  /**
   * Get a specific item-tag relationship
   */
  @Get('{itemId}/{tagId}')
  public async getItemTag(@Path() itemId: number, @Path() tagId: number): Promise<any> {
    return itemTagsService.getItemTag(itemId, tagId);
  }

  /**
   * Create a new item-tag relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createItemTag(@Body() body: { itemId: number; tagId: number }): Promise<any> {
    return itemTagsService.createItemTag(body);
  }

  /**
   * Delete an item-tag relationship
   */
  @Delete('{itemId}/{tagId}')
  public async deleteItemTag(@Path() itemId: number, @Path() tagId: number): Promise<{ message: string }> {
    const deleted = await itemTagsService.deleteItemTag(itemId, tagId);
    if (!deleted) throw { status: 404, message: 'Item-tag relationship not found' };
    return { message: 'Item-tag relationship deleted successfully' };
  }
}
