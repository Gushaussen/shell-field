import './organic-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Particle interface insertion point missing');
html=html.replace(marker,fs.readFileSync('particle-buttons.js','utf8')+'\n'+marker);
// Preserve DOM IDs used by editor initialization, but remove visible helper text.
html=html.replace(/(<p\b[^>]*class=["'][^"']*\b(?:note|workflow-note)\b[^"']*["'][^>]*>)[\s\S]*?<\/p>/g,(_,tag)=>tag.replace('<p','<p hidden style="display:none!important"')+'</p>');
html=html.replace(/const (\w+)=document\.createElement\('p'\);\1\.className='(?:note|workflow-note)';\1\.textContent='(?:[^'\\]|\\.)*';[^;\n]*\.after\(\1\);/g,(_,name)=>`const ${name}=document.createElement('p');`);
fs.writeFileSync('public/index.html',html);
