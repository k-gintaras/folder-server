import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTopicItemsRoutes(pool: Pool) {
  // Create a new topic-item relationship
  router.post('/', async (req, res) => {
    const { topicId, itemId } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO topic_items (topic_id, item_id) VALUES ($1, $2) RETURNING *',
        [topicId, itemId]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create topic-item relationship' });
    }
  });

  // Read all topic-item relationships
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM topic_items');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topic-item relationships' });
    }
  });

  // Read a specific topic-item relationship by topic ID and item ID
  router.get('/:topicId/:itemId', async (req, res) => {
    const { topicId, itemId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM topic_items WHERE topic_id = $1 AND item_id = $2',
        [topicId, itemId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic-item relationship not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topic-item relationship' });
    }
  });

  // Delete a topic-item relationship by topic ID and item ID
  router.delete('/:topicId/:itemId', async (req, res) => {
    const { topicId, itemId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'DELETE FROM topic_items WHERE topic_id = $1 AND item_id = $2 RETURNING *',
        [topicId, itemId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic-item relationship not found' });
      }
      res.status(200).json({ message: 'Topic-item relationship deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete topic-item relationship' });
    }
  });

  return router;
}