import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTopicTagGroupsRoutes(pool: Pool) {
  // Create a new topic-tag-group relationship
  router.post('/', async (req, res) => {
    const { topicId, tagGroupId } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO topic_tag_groups (topic_id, tag_group_id) VALUES ($1, $2) RETURNING *',
        [topicId, tagGroupId]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create topic-tag-group relationship' });
    }
  });

  // Read all topic-tag-group relationships
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM topic_tag_groups');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topic-tag-group relationships' });
    }
  });

  // Read a specific topic-tag-group relationship by topic ID and tag group ID
  router.get('/:topicId/:tagGroupId', async (req, res) => {
    const { topicId, tagGroupId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM topic_tag_groups WHERE topic_id = $1 AND tag_group_id = $2',
        [topicId, tagGroupId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic-tag-group relationship not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch topic-tag-group relationship' });
    }
  });

  // Delete a topic-tag-group relationship by topic ID and tag group ID
  router.delete('/:topicId/:tagGroupId', async (req, res) => {
    const { topicId, tagGroupId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'DELETE FROM topic_tag_groups WHERE topic_id = $1 AND tag_group_id = $2 RETURNING *',
        [topicId, tagGroupId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Topic-tag-group relationship not found' });
      }
      res.status(200).json({ message: 'Topic-tag-group relationship deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete topic-tag-group relationship' });
    }
  });

  return router;
}