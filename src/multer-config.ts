const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get the INDEX_FOLDER from environment or use default
const indexFolder = process.env.INDEX_FOLDER ?? 'public';
const indexRoot = path.isAbsolute(indexFolder) 
  ? indexFolder 
  : path.resolve(process.cwd(), indexFolder);

console.log('Multer config: saving files to', indexRoot);

// Ensure the upload directory exists
if (!fs.existsSync(indexRoot)) {
  fs.mkdirSync(indexRoot, { recursive: true });
  console.log('Created upload directory:', indexRoot);
}

// Configure multer to save files with original filename in INDEX_FOLDER
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    console.log('Multer destination called for file:', file.originalname);
    cb(null, indexRoot);
  },
  filename: function (req: any, file: any, cb: any) {
    console.log('Multer filename called, using original name:', file.originalname);
    // Use original filename - this will automatically overwrite existing files
    cb(null, file.originalname);
  }
});

// Export the complete multer instance with storage configuration
module.exports = multer({ storage });
