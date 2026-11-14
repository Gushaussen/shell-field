import './particle-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Library insertion point missing');
html=html.replace(marker,fs.readFileSync('library-save.js','utf8')+'\n'+marker);
fs.writeFileSync('public/index.html',html);
