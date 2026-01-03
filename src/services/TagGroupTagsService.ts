import { Pool } from 'pg';

export class TagGroupTagsService {
  constructor(private pool: Pool) {}

  async createTagGroupTag(data: { tagGroupId: number; tagId: number }) {
    if (!data.tagGroupId || !data.tagId) {
      throw new Error('Both tagGroupId and tagId are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tag_group_tags (tag_group_id, tag_id) VALUES ($1, $2) RETURNING *',
        [data.tagGroupId, data.tagId]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating tag group tag:', error);
      
      // Handle foreign key constraint violations
      if (err.code === '23503') {
        throw new Error('Tag group or tag does not exist');
      }
      // Handle duplicate key violations
      if (err.code === '23505') {
        throw new Error('This tag-group-tag association already exists');
      }
      
      throw new Error(`Failed to create tag group tag: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTagGroupTags() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_group_tags');
      return result.rows;
    } catch (error) {
      console.error('Error fetching tag group tags:', error);
      throw new Error(`Failed to fetch tag group tags: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTagGroupTag(tagGroupId: number, tagId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tag_group_tags WHERE tag_group_id = $1 AND tag_id = $2',
        [tagGroupId, tagId]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching tag group tag (tagGroupId: ${tagGroupId}, tagId: ${tagId}):`, error);
      throw new Error(`Failed to fetch tag group tag: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async deleteTagGroupTag(tagGroupId: number, tagId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM tag_group_tags WHERE tag_group_id = $1 AND tag_id = $2 RETURNING *',
        [tagGroupId, tagId]
      );
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent tag group tag (tagGroupId: ${tagGroupId}, tagId: ${tagId})`);
        return null; // Tag-group-tag association not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting tag group tag (tagGroupId: ${tagGroupId}, tagId: ${tagId}):`, error);
      throw new Error(`Failed to delete tag group tag: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
