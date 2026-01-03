import { Pool } from 'pg';

export class ItemTagsService {
  constructor(private pool: Pool) {}

  async createItemTag(data: { itemId: number; tagId: number }) {
    if (!data.itemId || !data.tagId) {
      throw new Error('Both itemId and tagId are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) RETURNING *',
        [data.itemId, data.tagId]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating item tag:', error);
      
      // Handle foreign key constraint violations
      if (err.code === '23503') {
        throw new Error('Item or tag does not exist');
      }
      // Handle duplicate key violations
      if (err.code === '23505') {
        throw new Error('This item-tag association already exists');
      }
      
      throw new Error(`Failed to create item tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllItemTags() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM item_tags');
      return result.rows;
    } catch (error) {
      console.error('Error fetching item tags:', error);
      throw new Error(`Failed to fetch item tags: ${(error as Error).message}`);
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
    } catch (error) {
      console.error(`Error fetching item tag (itemId: ${itemId}, tagId: ${tagId}):`, error);
      throw new Error(`Failed to fetch item tag: ${(error as Error).message}`);
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
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent item tag (itemId: ${itemId}, tagId: ${tagId})`);
        return null; // Item-tag association not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting item tag (itemId: ${itemId}, tagId: ${tagId}):`, error);
      throw new Error(`Failed to delete item tag: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
