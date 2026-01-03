import { Body, Controller, Delete, Get, Path, Post, Route, SuccessResponse } from 'tsoa';
import { ItemTagsService } from '../services/ItemTagsService';
import { ItemTag, ApiError } from '../models';
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
  public async getItemTags(): Promise<ItemTag[]> {
    return itemTagsService.getAllItemTags();
  }

  /**
   * Get a specific item-tag relationship
   */
  @Get('{itemId}/{tagId}')
  public async getItemTag(@Path() itemId: number, @Path() tagId: number): Promise<ItemTag | ApiError> {
    const itemTag = await itemTagsService.getItemTag(itemId, tagId);
    if (!itemTag) {
      this.setStatus(404);
      return { error: 'Item-tag relationship not found' };
    }
    return itemTag;
  }

  /**
   * Create a new item-tag relationship
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createItemTag(@Body() body: { itemId: number; tagId: number }): Promise<ItemTag | ApiError> {
    try {
      this.setStatus(201);
      return await itemTagsService.createItemTag(body);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('duplicate') || message.includes('already exists')) {
        this.setStatus(409);
        return { error: 'Item-tag relationship already exists', details: message };
      }
      this.setStatus(400);
      return { error: 'Failed to create item-tag relationship', details: message };
    }
  }

  /**
   * Delete an item-tag relationship
   */
  @Delete('{itemId}/{tagId}')
  public async deleteItemTag(@Path() itemId: number, @Path() tagId: number): Promise<ItemTag | ApiError> {
    try {
      const deleted = await itemTagsService.deleteItemTag(itemId, tagId);
      if (!deleted) {
        this.setStatus(404);
        return { error: 'Item-tag relationship not found' };
      }
      return deleted;
    } catch (error) {
      this.setStatus(500);
      return { error: 'Failed to delete item-tag relationship', details: (error as Error).message };
    }
  }
}
