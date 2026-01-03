import { Pool } from 'pg';
import { TopicItem } from '../models';

export class TopicItemsService {
  constructor(private pool: Pool) {}

  async createTopicItem(data: { topicId: number; itemId: number }): Promise<TopicItem> {
    if (!data.topicId || !data.itemId) {
      throw new Error('Both topicId and itemId are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topic_items (topic_id, item_id) VALUES ($1, $2) RETURNING *',
        [data.topicId, data.itemId]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating topic item:', error);
      
      // Handle foreign key constraint violations
      if (err.code === '23503') {
        throw new Error('Topic or item does not exist');
      }
      // Handle duplicate key violations
      if (err.code === '23505') {
        throw new Error('This topic-item association already exists');
      }
      
      throw new Error(`Failed to create topic item: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTopicItems(): Promise<TopicItem[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topic_items');
      return result.rows;
    } catch (error) {
      console.error('Error fetching topic items:', error);
      throw new Error(`Failed to fetch topic items: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTopicItem(topicId: number, itemId: number): Promise<TopicItem | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM topic_items WHERE topic_id = $1 AND item_id = $2',
        [topicId, itemId]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching topic item (topicId: ${topicId}, itemId: ${itemId}):`, error);
      throw new Error(`Failed to fetch topic item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async deleteTopicItem(topicId: number, itemId: number): Promise<TopicItem | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM topic_items WHERE topic_id = $1 AND item_id = $2 RETURNING *',
        [topicId, itemId]
      );
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent topic item (topicId: ${topicId}, itemId: ${itemId})`);
        return null; // Topic-item association not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting topic item (topicId: ${topicId}, itemId: ${itemId}):`, error);
      throw new Error(`Failed to delete topic item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
