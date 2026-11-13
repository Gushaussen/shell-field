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
swap('</script></body>',extra+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
