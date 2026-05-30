const fs = require('fs');
const path = require('path');

const geminiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const plantIdKey = process.env.PLANT_ID_API_KEY || 'YOUR_PLANT_ID_API_KEY';

console.log('Running build script to inject API keys...');

// Helper to copy directories
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'public') {
        copyDirSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Create public directory
fs.mkdirSync('public', { recursive: true });

// 2. Copy all necessary folders
const dirsToCopy = ['css', 'js', 'assets'];
for (const dir of dirsToCopy) {
  copyDirSync(dir, path.join('public', dir));
}

// 3. Copy top-level files
const filesToCopy = ['index.html', 'manifest.json', 'favicon.ico'];
for (const file of filesToCopy) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('public', file));
  }
}

// 4. Inject keys into the copied files inside public/
let chatJsPath = path.join('public', 'js', 'api', 'chat.js');
let chatJs = fs.readFileSync(chatJsPath, 'utf8');
chatJs = chatJs.replace(/'YOUR_GEMINI_API_KEY'/g, `'${geminiKey}'`);
chatJs = chatJs.replace(/'YOUR_PLANT_ID_API_KEY'/g, `'${plantIdKey}'`);
fs.writeFileSync(chatJsPath, chatJs);

let cameraJsPath = path.join('public', 'js', 'ui', 'camera.js');
let cameraJs = fs.readFileSync(cameraJsPath, 'utf8');
cameraJs = cameraJs.replace(/'YOUR_PLANT_ID_API_KEY'/g, `'${plantIdKey}'`);
fs.writeFileSync(cameraJsPath, cameraJs);

console.log('Build script complete! Output is in the /public folder.');
