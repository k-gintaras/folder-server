import { Pool } from 'pg';

export class TopicTagGroupsService {
  constructor(private pool: Pool) {}

  async createTopicTagGroup(data: { topicId: number; tagGroupId: number }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topic_tag_groups (topic_id, tag_group_id) VALUES ($1, $2) RETURNING *',
        [data.topicId, data.tagGroupId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTopicTagGroups() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topic_tag_groups');
      return result.rows;
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
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
