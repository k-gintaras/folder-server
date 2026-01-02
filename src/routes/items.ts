import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createItemRoutes(pool: Pool) {
  // Create a new item
  router.post('/', async (req, res) => {
    const { name, link, imageUrl, type } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO items (name, link, image_url, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, link, imageUrl, type]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  // Read all items
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM items');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  });

  // Read a single item by ID
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM items WHERE id = $1', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  });

  // Update an item by ID
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, link, imageUrl, type } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'UPDATE items SET name = $1, link = $2, image_url = $3, type = $4 WHERE id = $5 RETURNING *',
        [name, link, imageUrl, type, id]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // Delete an item by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}