import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTagGroupRoutes(pool: Pool) {
  // Create a new tag group
  router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO tag_groups (name) VALUES ($1) RETURNING *',
        [name]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create tag group' });
    }
  });

  // Read all tag groups
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tag_groups');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tag groups' });
    }
  });

  // Read a single tag group by ID
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tag_groups WHERE id = $1', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag group not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tag group' });
    }
  });

  // Update a tag group by ID
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE tag_groups SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag group not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update tag group' });
    }
  });

  // Delete a tag group by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM tag_groups WHERE id = $1 RETURNING *', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag group not found' });
      }
      res.status(200).json({ message: 'Tag group deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete tag group' });
    }
  });

  return router;
}