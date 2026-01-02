import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTagRoutes(pool: Pool) {
  // Create a new tag
  router.post('/', async (req, res) => {
    const { group, name } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO tags ("group", name) VALUES ($1, $2) RETURNING *',
        [group, name]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  });

  // Read all tags
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tags');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Read a single tag by ID
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tags WHERE id = $1', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tag' });
    }
  });

  // Update a tag by ID
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { group, name } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE tags SET "group" = $1, name = $2 WHERE id = $3 RETURNING *',
        [group, name, id]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update tag' });
    }
  });

  // Delete a tag by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM tags WHERE id = $1 RETURNING *', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  });

  return router;
}