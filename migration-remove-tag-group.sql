-- Migration: Remove "group" column from tags table
-- This migration removes the deprecated "group" column from the tags table
-- since tag grouping is now handled via the tag_groups and tag_group_tags tables

-- Drop the "group" column from tags table
ALTER TABLE tags DROP COLUMN IF EXISTS "group";

-- Note: If you want to preserve existing group data before dropping,
-- you could create tag_group records and link them via tag_group_tags.
-- This migration simply removes the column. If you need to migrate data,
-- uncomment and adjust the following section:

-- -- Step 1: Create tag groups from existing unique group values
-- INSERT INTO tag_groups (name)
-- SELECT DISTINCT "group" FROM tags
-- WHERE "group" IS NOT NULL
-- ON CONFLICT DO NOTHING;
-- 
-- -- Step 2: Link tags to their tag groups
-- INSERT INTO tag_group_tags (tag_group_id, tag_id)
-- SELECT tg.id, t.id
-- FROM tags t
-- JOIN tag_groups tg ON tg.name = t."group"
-- WHERE t."group" IS NOT NULL
-- ON CONFLICT DO NOTHING;
-- 
-- -- Step 3: Now drop the column
-- ALTER TABLE tags DROP COLUMN "group";
