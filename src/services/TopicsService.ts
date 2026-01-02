import { Pool } from 'pg';

export class TopicsService {
  constructor(private pool: Pool) {}

  async createTopic(data: { name: string; description: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING *',
        [data.name, data.description]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getAllTopics() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topics');
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTopicById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM topics WHERE id = $1', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateTopic(id: number, data: { name: string; description: string }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE topics SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [data.name, data.description, id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteTopic(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
