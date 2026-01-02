import { Pool } from 'pg';

export class TopicItemsService {
  constructor(private pool: Pool) {}

  async createTopicItem(data: { topicId: number; itemId: number }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topic_items (topic_id, item_id) VALUES ($1, $2) RETURNING *',
        [data.topicId, data.itemId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTopicItems() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topic_items');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTopicItem(topicId: number, itemId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM topic_items WHERE topic_id = $1 AND item_id = $2',
        [topicId, itemId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteTopicItem(topicId: number, itemId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM topic_items WHERE topic_id = $1 AND item_id = $2 RETURNING *',
        [topicId, itemId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
