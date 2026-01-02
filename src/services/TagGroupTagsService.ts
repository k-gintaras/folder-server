import { Pool } from 'pg';

export class TagGroupTagsService {
  constructor(private pool: Pool) {}

  async createTagGroupTag(data: { tagGroupId: number; tagId: number }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tag_group_tags (tag_group_id, tag_id) VALUES ($1, $2) RETURNING *',
        [data.tagGroupId, data.tagId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTagGroupTags() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_group_tags');
      return result.rows;
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
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
