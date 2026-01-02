# API Quick Reference

TypeScript + Express folder server that verifies a Postgres connection and exposes directory indexing.

## POST /api/backup/backup
- Parameters: None
- Input object: None
- Output:
  - 200: object (path, message)

## GET /api/files
- Parameters: None
- Input object: None
- Output:
  - 200: array

## DELETE /api/files/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object (file, status)

## GET /api/files/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object

## POST /api/files/move
- Parameters: None
- Input object: object (newFolder, fileId)
- Output:
  - 200: object (file, status)

## POST /api/files/move-multiple
- Parameters: None
- Input object: object (newFolder, fileIds)
- Output:
  - 200: object (results)

## POST /api/files/upload
- Parameters: None
- Input object: None
- Output:
  - 201: object

## GET /api/item-tags
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/item-tags
- Parameters: None
- Input object: object (tagId, itemId)
- Output:
  - 201: object

## DELETE /api/item-tags/{itemId}/{tagId}
- Parameters: itemId (path, required), tagId (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/item-tags/{itemId}/{tagId}
- Parameters: itemId (path, required), tagId (path, required)
- Input object: None
- Output:
  - 200: object

## GET /api/items
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/items
- Parameters: None
- Input object: object (type, imageUrl, link, name)
- Output:
  - 201: object

## DELETE /api/items/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/items/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object

## PUT /api/items/{id}
- Parameters: id (path, required)
- Input object: object (type, imageUrl, link, name)
- Output:
  - 200: object

## GET /api/tag-group-tags
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/tag-group-tags
- Parameters: None
- Input object: object (tagId, tagGroupId)
- Output:
  - 201: object

## DELETE /api/tag-group-tags/{tagGroupId}/{tagId}
- Parameters: tagGroupId (path, required), tagId (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/tag-group-tags/{tagGroupId}/{tagId}
- Parameters: tagGroupId (path, required), tagId (path, required)
- Input object: None
- Output:
  - 200: object

## GET /api/tag-groups
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/tag-groups
- Parameters: None
- Input object: object (name)
- Output:
  - 201: object

## DELETE /api/tag-groups/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/tag-groups/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object

## PUT /api/tag-groups/{id}
- Parameters: id (path, required)
- Input object: object (name)
- Output:
  - 200: object

## GET /api/tags
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/tags
- Parameters: None
- Input object: object (name, group)
- Output:
  - 201: object

## DELETE /api/tags/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/tags/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object

## PUT /api/tags/{id}
- Parameters: id (path, required)
- Input object: object (name, group)
- Output:
  - 200: object

## GET /api/topic-items
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/topic-items
- Parameters: None
- Input object: object (itemId, topicId)
- Output:
  - 201: object

## DELETE /api/topic-items/{topicId}/{itemId}
- Parameters: topicId (path, required), itemId (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/topic-items/{topicId}/{itemId}
- Parameters: topicId (path, required), itemId (path, required)
- Input object: None
- Output:
  - 200: object

## GET /api/topic-tag-groups
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/topic-tag-groups
- Parameters: None
- Input object: object (tagGroupId, topicId)
- Output:
  - 201: object

## DELETE /api/topic-tag-groups/{topicId}/{tagGroupId}
- Parameters: topicId (path, required), tagGroupId (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/topic-tag-groups/{topicId}/{tagGroupId}
- Parameters: topicId (path, required), tagGroupId (path, required)
- Input object: None
- Output:
  - 200: object

## GET /api/topics
- Parameters: None
- Input object: None
- Output:
  - 200: array

## POST /api/topics
- Parameters: None
- Input object: object (description, name)
- Output:
  - 201: object

## DELETE /api/topics/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object (message)

## GET /api/topics/{id}
- Parameters: id (path, required)
- Input object: None
- Output:
  - 200: object

## PUT /api/topics/{id}
- Parameters: id (path, required)
- Input object: object (description, name)
- Output:
  - 200: object

