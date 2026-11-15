import fs from 'node:fs';
export function addDiagramCreator(html){
  const marker='</script></body>';
  if(!html.includes(marker))throw Error('Diagram Creator insertion point missing');
  const tag='<script type="module" src="./diagram-creator.js"></script>';
  if(html.includes(tag))return html;
  return html.replace(marker,tag+'\n'+marker);
}
export function copyDiagramCreator(){
  fs.mkdirSync('public/src',{recursive:true});
  fs.copyFileSync('diagram-creator.js','public/diagram-creator.js');
  fs.copyFileSync('src/diagram-data.mjs','public/src/diagram-data.mjs');
}
