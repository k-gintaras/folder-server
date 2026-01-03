import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { ItemsService } from '../services/ItemsService';
import { Item } from '../models';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5
});
const itemsService = new ItemsService(pool);

@Route('api/items')
export class ItemsController extends Controller {
  /**
   * Get all items
   */
  @Get('/')
  public async getItems(): Promise<Item[]> {
    return itemsService.getAllItems();
  }

  /**
   * Get an item by ID
   */
  @Get('{id}')
  public async getItem(@Path() id: number): Promise<Item | null> {
    const item = await itemsService.getItemById(id);
    if (!item) {
      this.setStatus(404);
      return null;
    }
    return item;
  }

  /**
   * Create a new item
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createItem(@Body() body: { name: string; link: string; imageUrl: string; type: string }): Promise<Item> {
    return itemsService.createItem(body);
  }

  /**
   * Update an item by ID
   */
  @Put('{id}')
  public async updateItem(@Path() id: number, @Body() body: { name: string; link: string; imageUrl: string; type: string }): Promise<Item | null> {
    const updated = await itemsService.updateItem(id, body);
    if (!updated) {
      this.setStatus(404);
      return null;
    }
    return updated;
  }

  /**
   * Delete an item by ID
   */
  @Delete('{id}')
  public async deleteItem(@Path() id: number): Promise<Item | null> {
    const deleted = await itemsService.deleteItem(id);
    if (!deleted) {
      this.setStatus(404);
      return null;
    }
    return deleted;
  }
}
