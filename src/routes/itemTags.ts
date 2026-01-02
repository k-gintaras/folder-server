import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createItemTagsRoutes(pool: Pool) {
  // Create a new item-tag relationship
  router.post('/', async (req, res) => {
    const { itemId, tagId } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) RETURNING *',
        [itemId, tagId]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create item-tag relationship' });
    }
  });

  // Read all item-tag relationships
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM item_tags');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch item-tag relationships' });
    }
  });

  // Read a specific item-tag relationship by item ID and tag ID
  router.get('/:itemId/:tagId', async (req, res) => {
    const { itemId, tagId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM item_tags WHERE item_id = $1 AND tag_id = $2',
        [itemId, tagId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item-tag relationship not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch item-tag relationship' });
    }
  });

  // Delete an item-tag relationship by item ID and tag ID
  router.delete('/:itemId/:tagId', async (req, res) => {
    const { itemId, tagId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'DELETE FROM item_tags WHERE item_id = $1 AND tag_id = $2 RETURNING *',
        [itemId, tagId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item-tag relationship not found' });
      }
      res.status(200).json({ message: 'Item-tag relationship deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete item-tag relationship' });
    }
  });

  return router;
}