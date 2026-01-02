import { Pool } from 'pg';

export class TagGroupsService {
  constructor(private pool: Pool) {}

  async createTagGroup(data: { name: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tag_groups (name) VALUES ($1) RETURNING *',
        [data.name]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTagGroups() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_groups');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTagGroupById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tag_groups WHERE id = $1', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateTagGroup(id: number, data: { name: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE tag_groups SET name = $1 WHERE id = $2 RETURNING *',
        [data.name, id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteTagGroup(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM tag_groups WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
