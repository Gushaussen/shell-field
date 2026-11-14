import './particle-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Library insertion point missing');
html=html.replace(marker,['library-save.js','library-window.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n')+'\n'+marker);
fs.writeFileSync('public/index.html',html);
