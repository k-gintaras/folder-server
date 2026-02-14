const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '..', 'src', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Replace the default multer() with our configured multer
content = content.replace(
  'const upload = multer();',
  'const upload = require(\'./multer-config\');'
);

fs.writeFileSync(routesPath, content);
console.log('✅ Patched routes.ts to use multer-config');
