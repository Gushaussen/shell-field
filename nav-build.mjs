import './undo-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Navigation insertion point missing');
const scripts=['section-nav.js','tool-switcher.js','fluid-wordmark.js','studio-heading.js','mesh-translator.js'];
html=html.replace(marker,scripts.map(path=>fs.readFileSync(path,'utf8')).join('\n')+'\n'+marker);
fs.writeFileSync('public/index.html',html);
