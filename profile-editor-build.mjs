import './profile-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Profile editor script insertion point missing');
html=html.replace(marker,fs.readFileSync('profile-editor.js','utf8')+'\n'+marker);
fs.writeFileSync('public/index.html',html);
