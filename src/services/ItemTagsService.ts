import { Pool } from 'pg';

export class ItemTagsService {
  constructor(private pool: Pool) {}

  async createItemTag(data: { itemId: number; tagId: number }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) RETURNING *',
        [data.itemId, data.tagId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllItemTags() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM item_tags');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getItemTag(itemId: number, tagId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM item_tags WHERE item_id = $1 AND tag_id = $2',
        [itemId, tagId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteItemTag(itemId: number, tagId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM item_tags WHERE item_id = $1 AND tag_id = $2 RETURNING *',
        [itemId, tagId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
