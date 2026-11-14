import './surfaces-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Finish patch source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap('const rimTarget=Math.floor(target*.06),edges=[];','const rimTarget=0,edges=[];');
swap('pos.length/3<target*.94','pos.length/3<target');
html=html.replaceAll("'#0648ff'",'themeAccent()');
let extra=fs.readFileSync('finish.js','utf8');
const oldNote='Rim height follows nearby sampled surface heights through a narrow blended edge band, not a fixed bottom plane. This slightly adjusts the edge region; the central bowl and ridge positions are retained. The profile remains approximate and may soften very sharp edge detail.';
if(!extra.includes(oldNote))throw Error('Expected edge note missing');
extra=extra.replace(oldNote,'Open-edge point cloud: the separate generated rim wall and edge-smoothing pass are disabled. Only the detailed interior and exterior surfaces are sampled. Their edge gap is not bridged; this is not a closed or watertight shell. No fixed-height skirt is added.');
const additionalThemes=JSON.parse(fs.readFileSync('theme-palettes.json','utf8'));
const ids=new Set(['original','inverse','dark','shell']);
for(const theme of additionalThemes){
  if(!/^[a-z][a-z0-9-]*$/.test(theme.id)||ids.has(theme.id))throw Error('Invalid or duplicate theme id');
  ids.add(theme.id);
  if(!/^[A-Z /]+$/.test(theme.label))throw Error('Invalid theme label');
  for(const key of ['page','panel','text','accent','line','soft','on','grid','minor'])if(!/^#[0-9a-f]{6}$/i.test(theme.palette[key]))throw Error('Invalid theme palette: '+theme.id);
}
function patchTheme(a,b){if(!extra.includes(a))throw Error('Theme patch source mismatch: '+a.slice(0,100));extra=extra.replace(a,b)}
patchTheme('<option value="shell">SHELL PALETTE</option></select>','<option value="shell">SHELL PALETTE</option>'+additionalThemes.map(t=>'<option value="'+t.id+'">'+t.label+'</option>').join('')+'</select>');
patchTheme('function shellPalette(){','Object.assign(palettes,'+JSON.stringify(Object.fromEntries(additionalThemes.map(t=>[t.id,t.palette])))+');\nfunction shellPalette(){');
patchTheme("['original','inverse','dark','shell'].includes(savedTheme)",JSON.stringify([...ids])+'.includes(savedTheme)');
swap('</script></body>',extra+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
