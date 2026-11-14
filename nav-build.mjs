import './undo-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Navigation insertion point missing');
let translator=fs.readFileSync('mesh-translator.js','utf8');
function patchTranslator(a,b){if(!translator.includes(a))throw Error('Mesh compatibility patch source mismatch: '+a);translator=translator.replace(a,b)}
patchTranslator("el('mtSource').onclick=()=>{try{","el('mtSource').onclick=()=>{try{const selection=meshTranslatorSelectPairedSource();const raw=selection.points;");
patchTranslator('points copied at current physical scale. This snapshot stays unchanged if Studio is edited.','points copied at current physical scale. ${selection.excluded.toLocaleString()} trailing points excluded from this translator copy. Studio and the saved specimen are unchanged.');
const scripts=['section-nav.js','tool-switcher.js','fluid-wordmark.js','studio-heading.js'];
const extras=scripts.map(path=>fs.readFileSync(path,'utf8'));
extras.push(fs.readFileSync('mesh-source-compatibility.js','utf8'),translator,fs.readFileSync('mesh-source-diagnostics.js','utf8'));
html=html.replace(marker,extras.join('\n')+'\n'+marker);
fs.writeFileSync('public/index.html',html);
