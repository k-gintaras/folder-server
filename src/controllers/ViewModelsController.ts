import { Controller, Get, Path, Route } from 'tsoa';
import { Pool } from 'pg';
import { ViewModelsService } from '../services/ViewModelsService';
import { ItemWithTags, TagGroupWithTags, TopicWithSchema } from '../models';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  max: 5,
});

const viewModelsService = new ViewModelsService(pool);

@Route('api/view')
export class ViewModelsController extends Controller {
  /**
   * Get tag groups with their tags
   */
  @Get('tag-groups')
  public async getTagGroupsWithTags(): Promise<TagGroupWithTags[]> {
    return viewModelsService.getTagGroupsWithTags();
  }

  /**
   * Get a topic with its tag group schema
   */
  @Get('topics/{id}/schema')
  public async getTopicWithSchema(@Path() id: number): Promise<TopicWithSchema | null> {
    return viewModelsService.getTopicWithSchema(id);
  }

  /**
   * Get an item with its tags
   */
  @Get('items/{id}/tags')
  public async getItemWithTags(@Path() id: number): Promise<ItemWithTags | null> {
    return viewModelsService.getItemWithTags(id);
  }
}
