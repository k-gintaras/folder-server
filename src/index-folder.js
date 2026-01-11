const path = require('path');
const fs = require('fs');
const { stat } = require('fs/promises');

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

function normSlashes(p) {
  return p.replace(/\\/g, '/');
}

function computeRelativePath(fullPath, rootDirectory) {
  const normalizedRoot = normSlashes(path.resolve(rootDirectory));
  const normalizedFull = normSlashes(path.resolve(fullPath));
  const rel = normalizedFull.replace(normalizedRoot, '');
  return rel.startsWith('/') ? rel : `/${rel}`;
}

function getNameWithoutExt(fullPath) {
  const base = path.basename(fullPath);
  return path.parse(base).name; // name without extension
}

function baseLower(fullPath) {
  return path.basename(fullPath).toLowerCase();
}

function nameNoExtLower(fullPath) {
  return path.parse(path.basename(fullPath)).name.toLowerCase();
}

// Windows-ish copy patterns:
// - "name - Copy"
// - "name - Copy (2)"
// - "name (1)" / "name (2)" etc.
function canonicalizeCopyName(nameNoExt) {
  // remove trailing " - copy" or " - copy (n)"
  let s = nameNoExt.replace(/\s*-\s*copy(\s*\(\d+\))?\s*$/i, '');

  // remove trailing " (n)" (common Windows duplicate numbering)
  s = s.replace(/\s*\(\d+\)\s*$/i, '');

  return s.trim();
}

function isCopyVariant(nameNoExt) {
  const s = nameNoExt.trim();
  return (
    /\s*-\s*copy(\s*\(\d+\))?\s*$/i.test(s) ||
    /\s*\(\d+\)\s*$/i.test(s)
  );
}

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function safeMoveSync(src, dest) {
  ensureDirSync(path.dirname(dest));
  if (!fs.existsSync(src)) return false;

  let finalDest = dest;
  if (fs.existsSync(finalDest)) {
    const ext = path.extname(dest);
    const base = path.basename(dest, ext);
    const dir = path.dirname(dest);
    let i = 2;
    while (fs.existsSync(path.join(dir, `${base}__dup${i}${ext}`))) i++;
    finalDest = path.join(dir, `${base}__dup${i}${ext}`);
  }

  fs.renameSync(src, finalDest);
  return finalDest;
}

/**
 * Boss rules:
 * - duplicates (by nameWithoutExt, case-insensitive) => move ALL to __DUPLICATES__ and skip indexing them.
 * - items are keyed by name (full filename with ext, as you already store in items.name)
 * - on reindex: if item exists by name => UPDATE link; else INSERT item
 */
async function indexSingleItem(db, fullPath, rootDirectory, parentId = null) {
  const relativePath = computeRelativePath(fullPath, rootDirectory);

  try {
    const stats = await stat(fullPath);
    const isDirectory = stats.isDirectory();
    const type = isDirectory ? 'directory' : 'file';
    const subtype = isDirectory ? 'text' : getFileSubtype(fullPath);
    const size = isDirectory ? null : stats.size;
    const lastModified = stats.mtime.toISOString();

    const baseName = path.basename(fullPath);
    const nameWithoutExt = isDirectory ? baseName : path.parse(baseName).name;

    const existing = await db.query('SELECT id, type FROM files WHERE path = $1 LIMIT 1', [relativePath]);

    if (existing.rowCount > 0) {
      const existingId = existing.rows[0].id;
      await db.query(
        `UPDATE files SET size=$1, last_modified=$2, subtype=$3, name=$4 WHERE id=$5`,
        [size, lastModified, subtype, nameWithoutExt, existingId]
      );

      if (!isDirectory) {
        // BOSS RULE 2: heal by item name (not by link)
        const itemName = nameWithoutExt; // store without extension, like files table
        const upd = await db.query(
          `UPDATE items SET link = $1 WHERE type='file' AND name = $2`,
          [relativePath, itemName]
        );

        if (upd.rowCount === 0) {
          await db.query(
            `INSERT INTO items (name, link, type) VALUES ($1, $2, $3)`,
            [itemName, relativePath, 'file']
          );
        }
      }

      return { id: existingId, status: 'updated', type };
    }

    const insertResult = await db.query(
      `INSERT INTO files (path, type, parent_id, size, last_modified, subtype, name)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [relativePath, type, parentId, size, lastModified, subtype, nameWithoutExt]
    );

    if (!isDirectory) {
      const itemName = nameWithoutExt; // store without extension, like files table

      // BOSS RULE 2 on insert too: if item already exists, update link; else create.
      const upd = await db.query(
        `UPDATE items SET link = $1 WHERE type='file' AND name = $2`,
        [relativePath, itemName]
      );

      if (upd.rowCount === 0) {
        await db.query(
          `INSERT INTO items (name, link, type) VALUES ($1, $2, $3)`,
          [itemName, relativePath, 'file']
        );
      }
    }

    return { id: insertResult.rows[0].id, status: 'indexed', type };
  } catch (error) {
    console.error(`Failed to index ${fullPath}:`, error?.message ?? error);
    return { id: null, status: 'error', type: null };
  }
}

function walkCollect(dir) {
  const out = { files: [], dirs: [] };
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.error(`❌ readdir failed for ${dir}:`, e.message);
    return out;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.dirs.push(fullPath);
      const child = walkCollect(fullPath);
      out.files.push(...child.files);
      out.dirs.push(...child.dirs);
    } else if (entry.isFile()) {
      out.files.push(fullPath);
    }
  }
  return out;
}

function findDuplicateGroupsByNameWithoutExt(fullPaths) {
  const map = new Map(); // key: canonicalized lower(nameWithoutExt) -> paths[]
  for (const p of fullPaths) {
    const nameNoExt = getNameWithoutExt(p);
    const canonical = canonicalizeCopyName(nameNoExt).toLowerCase();
    if (!map.has(canonical)) map.set(canonical, []);
    map.get(canonical).push(p);
  }
  const groups = [];
  for (const [key, paths] of map.entries()) {
    if (paths.length > 1) {
      groups.push({ key, paths });
    }
  }
  return groups;
}

function findCopyVariants(fullPaths) {
  // Find files that match copy patterns like "name - Copy" or "name (1)"
  const copies = [];
  for (const p of fullPaths) {
    const nameNoExt = getNameWithoutExt(p);
    if (isCopyVariant(nameNoExt)) {
      copies.push(p);
    }
  }
  return copies;
}

/**
 * Boss scan:
 * - pass 1: collect all files
 * - pass 2: quarantine duplicates (move ALL duplicates, skip indexing them)
 * - pass 3: quarantine copy variants ("name - Copy", "name (2)", etc.)
 * - pass 4: index directories + remaining files
 */
async function scanDirectoryBossy(db, ROOT_DIRECTORY) {
  const duplicatesDir = path.join(ROOT_DIRECTORY, '__DUPLICATES__');
  ensureDirSync(duplicatesDir);

  const { files: allFiles, dirs: allDirs } = walkCollect(ROOT_DIRECTORY);

  // ignore anything already in __DUPLICATES__
  const candidateFiles = allFiles.filter(p => !normSlashes(p).includes('/__DUPLICATES__/'));

  const quarantined = new Set();

  // Step 1: Find and quarantine exact duplicates (same canonical name)
  const dupGroups = findDuplicateGroupsByNameWithoutExt(candidateFiles);

  if (dupGroups.length > 0) {
    console.log(`⚠️ Found ${dupGroups.length} duplicate-name groups. Quarantining...`);

    for (const g of dupGroups) {
      for (const src of g.paths) {
        const base = path.basename(src);
        const dest = path.join(duplicatesDir, base);
        try {
          const finalDest = safeMoveSync(src, dest);
          quarantined.add(src);
          console.log(`🚫 DUPLICATE -> moved: ${src} -> ${finalDest}`);
        } catch (e) {
          console.error(`❌ Failed to move duplicate ${src}:`, e.message);
          // If move failed, still quarantine it logically so we don't index it by accident
          quarantined.add(src);
        }
      }
    }
  }

  // Step 2: Find and quarantine copy variants
  const remainingFiles = candidateFiles.filter(p => !quarantined.has(p));
  const copyVariants = findCopyVariants(remainingFiles);

  if (copyVariants.length > 0) {
    console.log(`⚠️ Found ${copyVariants.length} copy variants. Quarantining...`);

    for (const src of copyVariants) {
      const base = path.basename(src);
      const dest = path.join(duplicatesDir, base);
      try {
        const finalDest = safeMoveSync(src, dest);
        quarantined.add(src);
        console.log(`🚫 COPY VARIANT -> moved: ${src} -> ${finalDest}`);
      } catch (e) {
        console.error(`❌ Failed to move copy variant ${src}:`, e.message);
        quarantined.add(src);
      }
    }
  }

  // Index directories first (optional; keeps your parent_id tree)
  // Note: parent_id tree logic is path-based; this keeps your old behavior.
  // If you don't care about directory rows in DB, you can remove this.
  const dirIdByPath = new Map(); // fullPath -> files.id

  // Sort dirs by depth so parents indexed before children
  allDirs
    .filter(d => !normSlashes(d).includes('/__DUPLICATES__/'))
    .sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);

  for (const dirPath of allDirs) {
    if (normSlashes(dirPath).includes('/__DUPLICATES__/')) continue;

    const parentPath = path.dirname(dirPath);
    const parentId = dirIdByPath.get(parentPath) ?? null;

    const res = await indexSingleItem(db, dirPath, ROOT_DIRECTORY, parentId);
    if (res?.id) dirIdByPath.set(dirPath, res.id);
  }

  // Now index files that were not quarantined
  const filesToIndex = candidateFiles.filter(p => !quarantined.has(p));

  for (const fp of filesToIndex) {
    const parentDir = path.dirname(fp);
    const parentId = dirIdByPath.get(parentDir) ?? null;
    await indexSingleItem(db, fp, ROOT_DIRECTORY, parentId);
  }

  console.log(
    `✅ Scan complete. Indexed files: ${filesToIndex.length}. Quarantined duplicates: ${quarantined.size}.`
  );
}

module.exports = { indexSingleItem, getFileSubtype, scanDirectoryBossy };
