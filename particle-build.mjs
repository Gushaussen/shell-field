import fs from 'node:fs';
fs.mkdirSync('public',{recursive:true});
let html=fs.readFileSync('index.html','utf8');
const marker='</script></body>';
if(!html.includes(marker))throw Error('Interface insertion point missing');
const injected=[
 'interface.js',
 'organic-interface.js',
 'particle-buttons.js'
].map(file=>fs.readFileSync(file,'utf8')).join('\n');
html=html.replace(marker,injected+'\n'+marker);
fs.writeFileSync('public/index.html',html);
