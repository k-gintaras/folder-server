import { Pool } from 'pg';

export class ItemsService {
  constructor(private pool: Pool) {}

  async createItem(data: { name: string; link: string; imageUrl: string; type: string }) {
    if (!data.name || !data.link) {
      throw new Error('Item name and link are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO items (name, link, image_url, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [data.name, data.link, data.imageUrl, data.type]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error(`Failed to create item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getAllItems() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM items');
      return result.rows;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error(`Failed to fetch items: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getItemById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM items WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw new Error(`Failed to fetch item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async updateItem(id: number, data: { name: string; link: string; imageUrl: string; type: string }) {
    if (!data.name || !data.link) {
      throw new Error('Item name and link are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE items SET name = $1, link = $2, image_url = $3, type = $4 WHERE id = $5 RETURNING *',
        [data.name, data.link, data.imageUrl, data.type, id]
      );
      
      if (result.rowCount === 0) {
        return null; // Item not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw new Error(`Failed to update item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async deleteItem(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent item ${id}`);
        return null; // Item not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw new Error(`Failed to delete item: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
