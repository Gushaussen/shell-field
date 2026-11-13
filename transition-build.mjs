import './finish-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Transition source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap('raw=new Float32Array(pos);','blendToExteriorBoundary(pos,rgb,cx,cy,iw/L,ih/L);raw=new Float32Array(pos);');
swap('Open-edge point cloud: the separate generated rim wall and edge-smoothing pass are disabled. Only the detailed interior and exterior surfaces are sampled. Their edge gap is not bridged; this is not a closed or watertight shell. No fixed-height skirt is added.','The interior blends into exterior-driven 3D boundary curves. No separate vertical rim wall or fixed-height skirt is added. Only a narrow exterior edge strip is adjusted to meet the same curves. This point cloud is not a watertight mesh.');
swap('</script></body>',fs.readFileSync('transition.js','utf8')+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
