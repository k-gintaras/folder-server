import { Pool } from 'pg';

export class TagsService {
  constructor(private pool: Pool) {}

  async createTag(data: { group: string; name: string }) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag name is required');
    }
    if (!data.group || data.group.trim() === '') {
      throw new Error('Tag group is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tags ("group", name) VALUES ($1, $2) RETURNING *',
        [data.group, data.name]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating tag:', error);
      
      // Handle duplicate constraint
      if (err.code === '23505') {
        throw new Error('A tag with this name and group already exists');
      }
      
      throw new Error(`Failed to create tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTags() {
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

  async getTagById(id: number) {
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

  async updateTag(id: number, data: { group: string; name: string }) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag name is required');
    }
    if (!data.group || data.group.trim() === '') {
      throw new Error('Tag group is required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE tags SET "group" = $1, name = $2 WHERE id = $3 RETURNING *',
        [data.group, data.name, id]
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
        throw new Error('A tag with this name and group already exists');
      }
      
      throw new Error(`Failed to update tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async deleteTag(id: number) {
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
