# API (generated)

Base URL: http://<host>:<port>

- GET /
  - Params: none
  - Returns: JSON

- GET /api/status
  - Params: none
  - Returns: JSON

- GET /api/health
  - Params: none
  - Returns: JSON

**/api/files**

- GET /api/files
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/files/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- POST /api/files/upload
  - Params: none
  - Returns: DB row(s) JSON

- DELETE /api/files/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- POST /api/files/move
  - Params: none
  - Returns: DB row(s) JSON

- POST /api/files/move-multiple
  - Params: none
  - Returns: DB row(s) JSON

**/api/tags**

- POST /api/tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tags/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- PUT /api/tags/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- DELETE /api/tags/:id
  - Params: path: id
  - Returns: DB row(s) JSON

**/api/tag-groups**

- POST /api/tag-groups
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tag-groups
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tag-groups/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- PUT /api/tag-groups/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- DELETE /api/tag-groups/:id
  - Params: path: id
  - Returns: DB row(s) JSON

**/api/tag-group-tags**

- POST /api/tag-group-tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tag-group-tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/tag-group-tags/:tagGroupId/:tagId
  - Params: path: tagGroupId, tagId
  - Returns: DB row(s) JSON

- DELETE /api/tag-group-tags/:tagGroupId/:tagId
  - Params: path: tagGroupId, tagId
  - Returns: DB row(s) JSON

**/api/topics**

- POST /api/topics
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topics
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topics/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- PUT /api/topics/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- DELETE /api/topics/:id
  - Params: path: id
  - Returns: DB row(s) JSON

**/api/topic-tag-groups**

- POST /api/topic-tag-groups
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topic-tag-groups
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topic-tag-groups/:topicId/:tagGroupId
  - Params: path: topicId, tagGroupId
  - Returns: DB row(s) JSON

- DELETE /api/topic-tag-groups/:topicId/:tagGroupId
  - Params: path: topicId, tagGroupId
  - Returns: DB row(s) JSON

**/api/items**

- POST /api/items
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/items
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/items/unassigned
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/items/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- PUT /api/items/:id
  - Params: path: id
  - Returns: DB row(s) JSON

- DELETE /api/items/:id
  - Params: path: id
  - Returns: DB row(s) JSON

**/api/item-tags**

- POST /api/item-tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/item-tags
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/item-tags/:itemId/:tagId
  - Params: path: itemId, tagId
  - Returns: DB row(s) JSON

- DELETE /api/item-tags/:itemId/:tagId
  - Params: path: itemId, tagId
  - Returns: DB row(s) JSON

**/api/topic-items**

- POST /api/topic-items
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topic-items
  - Params: none
  - Returns: DB row(s) JSON

- GET /api/topic-items/:topicId/:itemId
  - Params: path: topicId, itemId
  - Returns: DB row(s) JSON

- DELETE /api/topic-items/:topicId/:itemId
  - Params: path: topicId, itemId
  - Returns: DB row(s) JSON

**/api/backup**

- POST /api/backup/backup
  - Params: none
  - Returns: JSON

