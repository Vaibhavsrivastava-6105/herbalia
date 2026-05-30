const fs = require('fs');

const geminiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const plantIdKey = process.env.PLANT_ID_API_KEY || 'YOUR_PLANT_ID_API_KEY';

console.log('Running build script to inject API keys...');

let chatJs = fs.readFileSync('js/api/chat.js', 'utf8');
chatJs = chatJs.replace(/'YOUR_GEMINI_API_KEY'/g, `'${geminiKey}'`);
chatJs = chatJs.replace(/'YOUR_PLANT_ID_API_KEY'/g, `'${plantIdKey}'`);
fs.writeFileSync('js/api/chat.js', chatJs);

let cameraJs = fs.readFileSync('js/ui/camera.js', 'utf8');
cameraJs = cameraJs.replace(/'YOUR_PLANT_ID_API_KEY'/g, `'${plantIdKey}'`);
fs.writeFileSync('js/ui/camera.js', cameraJs);

console.log('Build script complete!');
