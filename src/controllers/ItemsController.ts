import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse } from 'tsoa';
import { ItemsService } from '../services/ItemsService';
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
  public async getItems(): Promise<any[]> {
    return itemsService.getAllItems();
  }

  /**
   * Get an item by ID
   */
  @Get('{id}')
  public async getItem(@Path() id: number): Promise<any> {
    return itemsService.getItemById(id);
  }

  /**
   * Create a new item
   */
  @SuccessResponse('201', 'Created')
  @Post('/')
  public async createItem(@Body() body: { name: string; link: string; imageUrl: string; type: string }): Promise<any> {
    return itemsService.createItem(body);
  }

  /**
   * Update an item by ID
   */
  @Put('{id}')
  public async updateItem(@Path() id: number, @Body() body: { name: string; link: string; imageUrl: string; type: string }): Promise<any> {
    return itemsService.updateItem(id, body);
  }

  /**
   * Delete an item by ID
   */
  @Delete('{id}')
  public async deleteItem(@Path() id: number): Promise<{ message: string }> {
    const deleted = await itemsService.deleteItem(id);
    if (!deleted) throw { status: 404, message: 'Item not found' };
    return { message: 'Item deleted successfully' };
  }
}
