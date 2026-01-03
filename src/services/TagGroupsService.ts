import { Pool } from 'pg';
import { TagGroup } from '../models';

export class TagGroupsService {
  constructor(private pool: Pool) {}

  async createTagGroup(data: { name: string }): Promise<TagGroup> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag group name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tag_groups (name) VALUES ($1) RETURNING *',
        [data.name]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating tag group:', error);
      
      // Handle duplicate name constraint
      if (err.code === '23505') {
        throw new Error('A tag group with this name already exists');
      }
      
      throw new Error(`Failed to create tag group: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTagGroups(): Promise<TagGroup[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_groups');
      return result.rows;
    } catch (error) {
      console.error('Error fetching tag groups:', error);
      throw new Error(`Failed to fetch tag groups: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTagGroupById(id: number): Promise<TagGroup | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_groups WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching tag group ${id}:`, error);
      throw new Error(`Failed to fetch tag group: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async updateTagGroup(id: number, data: { name: string }): Promise<TagGroup | null> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag group name is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE tag_groups SET name = $1 WHERE id = $2 RETURNING *',
        [data.name, id]
      );
      
      if (result.rowCount === 0) {
        return null; // Tag group not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error updating tag group ${id}:`, error);
      
      // Handle duplicate name constraint
      if (err.code === '23505') {
        throw new Error('A tag group with this name already exists');
      }
      
      throw new Error(`Failed to update tag group: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async deleteTagGroup(id: number): Promise<TagGroup | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM tag_groups WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent tag group ${id}`);
        return null; // Tag group not found
      }
      
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error(`Error deleting tag group ${id}:`, error);
      
      // Handle foreign key constraint (tag group still has tags or associations)
      if (err.code === '23503') {
        throw new Error('Cannot delete tag group: it is still being used by tags or topics');
      }
      
      throw new Error(`Failed to delete tag group: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
