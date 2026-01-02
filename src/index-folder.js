const path = require('path');
const fs = require('fs');
const { stat } = require('fs/promises');

// File type detection (moved from index-folder.js)
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm', '.flv'];
const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'];
const textExtensions = ['.txt', '.md', '.pdf', '.docx', '.rtf', '.html', '.json', '.csv'];

function getFileSubtype(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (videoExtensions.includes(ext)) return 'video';
  if (audioExtensions.includes(ext)) return 'audio';
  if (imageExtensions.includes(ext)) return 'image';
  if (textExtensions.includes(ext)) return 'text';
  return 'text';
}

async function indexSingleItem(db, fullPath, rootDirectory, parentId = null) {
  const normalizedRoot = path.resolve(rootDirectory).replace(/\\/g, '/');
  const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
  const relativePath = normalizedFullPath.replace(normalizedRoot, '');

  try {
    const stats = await stat(fullPath);
    const isDirectory = stats.isDirectory();
    const type = isDirectory ? 'directory' : 'file';
    const subtype = isDirectory ? 'text' : getFileSubtype(fullPath);
    const size = isDirectory ? null : stats.size;
    const lastModified = stats.mtime.toISOString();

    const existing = await db.query('SELECT id, type FROM files WHERE path = $1 LIMIT 1', [relativePath]);
    if (existing.rowCount > 0) {
      // File already exists - update it instead of inserting
      const existingId = existing.rows[0].id;
      await db.query(
        `UPDATE files SET size = $1, last_modified = $2, subtype = $3 WHERE id = $4`,
        [size, lastModified, subtype, existingId]
      );

      // Ensure the file is inserted into the items table if it doesn't exist
      if (!isDirectory) {
        const fileName = path.basename(fullPath);
        try {
          const itemCheck = await db.query('SELECT id FROM items WHERE link = $1 LIMIT 1', [relativePath]);
          if (itemCheck.rowCount === 0) {
            const itemInsertResult = await db.query(
              `INSERT INTO items (name, link, type) VALUES ($1, $2, $3) RETURNING id`,
              [fileName, relativePath, 'file']
            );
            console.log(`✅ Created missing item: ${fileName} with link ${relativePath}, ID: ${itemInsertResult.rows[0].id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to ensure item for ${fileName}:`, error.message);
        }
      }

      return { id: existingId, status: 'updated', type };
    }

    const insertResult = await db.query(
      `INSERT INTO files (path, type, parent_id, size, last_modified, subtype)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [relativePath, type, parentId, size, lastModified, subtype]
    );

    console.log(`✅ Indexed: ${relativePath} (${subtype})`);

    // Create an item for each file
    if (!isDirectory) {
      const fileName = path.basename(fullPath);
      try {
        const itemInsertResult = await db.query(
          `INSERT INTO items (name, link, type) VALUES ($1, $2, $3) RETURNING id`,
          [fileName, relativePath, 'file']
        );
        console.log(`✅ Created item: ${fileName} with link ${relativePath}, ID: ${itemInsertResult.rows[0].id}`);
      } catch (error) {
        console.error(`❌ Failed to create item for ${fileName}:`, error.message);
      }
    }

    return { id: insertResult.rows[0].id, status: 'indexed', type };
  } catch (error) {
    console.error(`Failed to index ${fullPath}:`, error?.message ?? error);
    return { id: null, status: 'error', type: null };
  }
}

const scanDirectory = async (db, ROOT_DIRECTORY, dir, parentId = null) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.error(`❌ readdir failed for ${dir}:`, e.message);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    try {
      const result = await indexSingleItem(db, fullPath, ROOT_DIRECTORY, parentId);
      if (result.type === 'directory') await scanDirectory(db, ROOT_DIRECTORY, fullPath, result.id);
    } catch (error) {
      console.error(`Failed to index ${fullPath}:`, error?.message ?? error);
    }
  }
};


module.exports = { indexSingleItem, getFileSubtype, scanDirectory };
