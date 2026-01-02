import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTopicRoutes(pool: Pool) {
  // Create a new topic
  router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create topic' });
    }
  });

  // Read all topics
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM topics');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  });

  // Read a single topic by ID
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM topics WHERE id = $1', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topic' });
    }
  });

  // Update a topic by ID
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE topics SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [name, description, id]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update topic' });
    }
  });

  // Delete a topic by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.status(200).json({ message: 'Topic deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete topic' });
    }
  });

  return router;
}