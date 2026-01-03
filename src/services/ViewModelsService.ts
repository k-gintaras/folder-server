import { Pool } from 'pg';
import {
  ItemWithTags,
  Tag,
  TagGroupWithTags,
  TopicWithSchema,
} from '../models';

export class ViewModelsService {
  constructor(private pool: Pool) {}

  async getTagGroupsWithTags(): Promise<TagGroupWithTags[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT tg.id,
                tg.name,
                COALESCE(json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
         FROM tag_groups tg
         LEFT JOIN tag_group_tags tgt ON tgt.tag_group_id = tg.id
         LEFT JOIN tags t ON t.id = tgt.tag_id
         GROUP BY tg.id
         ORDER BY tg.id`
      );
      return result.rows as TagGroupWithTags[];
    } catch (error) {
      console.error('Error fetching tag groups with tags:', error);
      throw new Error(`Failed to fetch tag groups with tags: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTopicWithSchema(topicId: number): Promise<TopicWithSchema | null> {
    const client = await this.pool.connect();
    try {
      const topicResult = await client.query('SELECT * FROM topics WHERE id = $1', [topicId]);
      if (topicResult.rowCount === 0) {
        return null;
      }

      const tagGroupsResult = await client.query(
        `SELECT tg.id,
                tg.name,
                COALESCE(json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
         FROM topic_tag_groups ttg
         JOIN tag_groups tg ON tg.id = ttg.tag_group_id
         LEFT JOIN tag_group_tags tgt ON tgt.tag_group_id = tg.id
         LEFT JOIN tags t ON t.id = tgt.tag_id
         WHERE ttg.topic_id = $1
         GROUP BY tg.id
         ORDER BY tg.id`,
        [topicId]
      );

      return {
        ...topicResult.rows[0],
        tag_groups: tagGroupsResult.rows as TagGroupWithTags[],
      };
    } catch (error) {
      console.error(`Error fetching topic schema for ${topicId}:`, error);
      throw new Error(`Failed to fetch topic schema: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getItemWithTags(itemId: number): Promise<ItemWithTags | null> {
    const client = await this.pool.connect();
    try {
      const itemResult = await client.query('SELECT * FROM items WHERE id = $1', [itemId]);
      if (itemResult.rowCount === 0) {
        return null;
      }

      const tagsResult = await client.query(
        `SELECT t.*
         FROM item_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.item_id = $1
         ORDER BY t.id`,
        [itemId]
      );

      return {
        ...itemResult.rows[0],
        tags: tagsResult.rows as Tag[],
      };
    } catch (error) {
      console.error(`Error fetching item with tags for ${itemId}:`, error);
      throw new Error(`Failed to fetch item with tags: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
