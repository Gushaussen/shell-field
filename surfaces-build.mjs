import './boundary-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Surface patch source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap('function boundaryHeights(a,b,x,y,bx,by,z,th,rel){const detail=surfaceRelief(b,bx,by,rel),inner=surfaceRelief(a,x,y,rel)*.15,shared=detail*.35;return[z+shared+inner,z+shared-th-Math.max(-th*.45,detail-inner)]}',`function boundaryHeights(a,b,x,y,bx,by,z,th,rel){const innerGain=+$('interiorRoughness').value,outerGain=+$('exteriorRoughness').value,innerDetail=surfaceRelief(a,x,y,rel)*innerGain,outerDetail=surfaceRelief(b,bx,by,rel)*outerGain,base=-z,innerHeight=base+innerDetail,outerHeight=Math.min(base-th-outerDetail,innerHeight-th*.25);return[innerHeight,outerHeight]}`);
swap('height(x,y)+.005,(y-cy)*ih/L','-height(x,y)+.005,(y-cy)*ih/L');
swap('</script></body>',fs.readFileSync('surfaces.js','utf8')+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
