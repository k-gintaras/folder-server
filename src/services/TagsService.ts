import { Pool } from 'pg';

export class TagsService {
  constructor(private pool: Pool) {}

  async createTag(data: { group: string; name: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO tags ("group", name) VALUES ($1, $2) RETURNING *',
        [data.group, data.name]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTags() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tags');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTagById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM tags WHERE id = $1', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateTag(id: number, data: { group: string; name: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE tags SET "group" = $1, name = $2 WHERE id = $3 RETURNING *',
        [data.group, data.name, id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteTag(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
