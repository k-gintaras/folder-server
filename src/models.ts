// Categorizer models (Postgres-aligned)
// Rule: models mirror DB results exactly (snake_case, lowercase).
// If you later add a mapping layer, you may introduce camelCase *view* models.

export type Id = number; // SERIAL in Postgres

// -------------------- Node-only: Root & status responses --------------------

export interface RootResponse {
  message: string;
  env: {
    port: number;
    indexFolder: string;
    db: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
}

export interface StatusResponse {
  database: {
    ready: boolean;
    connection: {
      host: string;
      port: number;
      database: string;
    };
  };
  indexFolder: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// -------------------- Base (table) models --------------------
// These mirror SELECT * FROM <table> exactly.

export interface File {
  id: Id;
  path: string;
  type: string;               // file | directory | etc.
  parent_id: Id | null;
  size: number | null;
  last_modified: string;      // TIMESTAMPTZ -> ISO string
  subtype: string;
}

export interface FileMoveResult {
  fileId: number;
  status: 'moved' | 'not_found' | 'error';
  newPath?: string;
  message?: string;
}

export interface Tag {
  id: Id;
  group: string;              // quoted column name: "group"
  name: string;
}

export interface TagGroup {
  id: Id;
  name: string;
}

export interface Topic {
  id: Id;
  name: string;
  description: string | null;
}

export interface Item {
  id: Id;
  name: string;
  link: string | null;
  image_url: string | null;
  type: string;               // DEFAULT 'file'
}

// -------------------- Junction (table) models --------------------
// Mirror junction tables exactly.

export interface TagGroupTag {
  tag_group_id: Id;
  tag_id: Id;
}

export interface TopicTagGroup {
  topic_id: Id;
  tag_group_id: Id;
}

export interface ItemTag {
  item_id: Id;
  tag_id: Id;
}

export interface TopicItem {
  topic_id: Id;
  item_id: Id;
}

// -------------------- Hydrated / View models (OPTIONAL) --------------------
// These are NOT raw DB rows. Use only for special endpoints or UI aggregation.

export interface TagGroupWithTags extends TagGroup {
  tags: Tag[];
}

export interface TopicWithSchema extends Topic {
  tag_groups: TagGroupWithTags[];
}

export interface ItemWithTags extends Item {
  tags: Tag[];
}
