import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

export function createTagGroupTagsRoutes(pool: Pool) {
  // Create a new tag-group-tag relationship
  router.post('/', async (req, res) => {
    const { tagGroupId, tagId } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'INSERT INTO tag_group_tags (tag_group_id, tag_id) VALUES ($1, $2) RETURNING *',
        [tagGroupId, tagId]
      );
      client.release();
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create tag-group-tag relationship' });
    }
  });

  // Read all tag-group-tag relationships
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tag_group_tags');
      client.release();
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tag-group-tag relationships' });
    }
  });

  // Read a specific tag-group-tag relationship by tag group ID and tag ID
  router.get('/:tagGroupId/:tagId', async (req, res) => {
    const { tagGroupId, tagId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM tag_group_tags WHERE tag_group_id = $1 AND tag_id = $2',
        [tagGroupId, tagId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag-group-tag relationship not found' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tag-group-tag relationship' });
    }
  });

  // Delete a tag-group-tag relationship by tag group ID and tag ID
  router.delete('/:tagGroupId/:tagId', async (req, res) => {
    const { tagGroupId, tagId } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query(
        'DELETE FROM tag_group_tags WHERE tag_group_id = $1 AND tag_id = $2 RETURNING *',
        [tagGroupId, tagId]
      );
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tag-group-tag relationship not found' });
      }
      res.status(200).json({ message: 'Tag-group-tag relationship deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete tag-group-tag relationship' });
    }
  });

  return router;
}