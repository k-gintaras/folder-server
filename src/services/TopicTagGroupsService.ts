import { Pool } from 'pg';

export class TopicTagGroupsService {
  constructor(private pool: Pool) {}

  async createTopicTagGroup(data: { topicId: number; tagGroupId: number }) {
    if (!data.topicId || !data.tagGroupId) {
      throw new Error('Both topicId and tagGroupId are required');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topic_tag_groups (topic_id, tag_group_id) VALUES ($1, $2) RETURNING *',
        [data.topicId, data.tagGroupId]
      );
      return result.rows[0];
    } catch (error) {
      const err = error as any;
      console.error('Error creating topic tag group:', error);
      
      // Handle foreign key constraint violations
      if (err.code === '23503') {
        throw new Error('Topic or tag group does not exist');
      }
      // Handle duplicate key violations
      if (err.code === '23505') {
        throw new Error('This topic-tag-group association already exists');
      }
      
      throw new Error(`Failed to create topic tag group: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getAllTopicTagGroups() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topic_tag_groups');
      return result.rows;
    } catch (error) {
      console.error('Error fetching topic tag groups:', error);
      throw new Error(`Failed to fetch topic tag groups: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async getTopicTagGroup(topicId: number, tagGroupId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM topic_tag_groups WHERE topic_id = $1 AND tag_group_id = $2',
        [topicId, tagGroupId]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching topic tag group (topicId: ${topicId}, tagGroupId: ${tagGroupId}):`, error);
      throw new Error(`Failed to fetch topic tag group: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  async deleteTopicTagGroup(topicId: number, tagGroupId: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM topic_tag_groups WHERE topic_id = $1 AND tag_group_id = $2 RETURNING *',
        [topicId, tagGroupId]
      );
      
      if (result.rowCount === 0) {
        console.warn(`Attempted to delete non-existent topic tag group (topicId: ${topicId}, tagGroupId: ${tagGroupId})`);
        return null; // Topic-tag-group association not found
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting topic tag group (topicId: ${topicId}, tagGroupId: ${tagGroupId}):`, error);
      throw new Error(`Failed to delete topic tag group: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}
