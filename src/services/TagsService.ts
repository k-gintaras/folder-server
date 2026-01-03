import { Pool } from 'pg';
import { Tag } from '../models';

export class TagsService {
  constructor(private pool: Pool) {}

  async createTag(data: { name: string }): Promise<Tag> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tags (name) VALUES ($1) RETURNING *',
        [data.name]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating tag:', error);
      
      // Handle duplicate constraint
      if (err.code === '23505') {
        throw new Error('A tag with this name already exists');
      }
      
      throw new Error(`Failed to create tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTags(): Promise<Tag[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tags');
      return result.rows;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw new Error(`Failed to fetch tags: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tags WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching tag ${id}:`, error);
      throw new Error(`Failed to fetch tag: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async updateTag(id: number, data: { name: string }): Promise<Tag | null> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE tags SET name = $1 WHERE id = $2 RETURNING *',
        [data.name, id]
      );
      
      if (result.rowCount === 0) {
        return null; // Tag not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error updating tag ${id}:`, error);
      
      // Handle duplicate constraint
      if (err.code === '23505') {
        throw new Error('A tag with this name already exists');
      }
      
      throw new Error(`Failed to update tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async deleteTag(id: number): Promise<Tag | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent tag ${id}`);
        return null; // Tag not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error deleting tag ${id}:`, error);
      
      // Handle foreign key constraint (tag still has associations)
      if (err.code === '23503') {
        throw new Error('Cannot delete tag: it is still being used by items, tag groups, or topics');
      }
      
      throw new Error(`Failed to delete tag: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
