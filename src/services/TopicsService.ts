import { Pool } from 'pg';

export class TopicsService {
  constructor(private pool: Pool) {}

  async createTopic(data: { name: string; description: string }) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Topic name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING *',
        [data.name, data.description]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating topic:', error);
      
      // Handle duplicate name constraint
      if (err.code === '23505') {
        throw new Error('A topic with this name already exists');
      }
      
      throw new Error(`Failed to create topic: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTopics() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topics');
      return result.rows;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw new Error(`Failed to fetch topics: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTopicById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topics WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching topic ${id}:`, error);
      throw new Error(`Failed to fetch topic: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async updateTopic(id: number, data: { name: string; description: string }) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Topic name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE topics SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [data.name, data.description, id]
      );
      
      if (result.rowCount === 0) {
        return null; // Topic not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error updating topic ${id}:`, error);
      
      // Handle duplicate name constraint
      if (err.code === '23505') {
        throw new Error('A topic with this name already exists');
      }
      
      throw new Error(`Failed to update topic: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async deleteTopic(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent topic ${id}`);
        return null; // Topic not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error deleting topic ${id}:`, error);
      
      // Handle foreign key constraint (topic still has items or tag groups)
      if (err.code === '23503') {
        throw new Error('Cannot delete topic: it is still being used by items or tag groups');
      }
      
      throw new Error(`Failed to delete topic: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
