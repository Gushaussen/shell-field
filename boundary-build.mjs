import './upgrade.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Boundary patch source mismatch: '+a.slice(0,90));html=html.replace(a,b)}
swap('prepareSurfaceFields();const L=','prepareSurfaceFields();prepareBoundaryWarp();const L=');
const oldMap='function mapped(x,y){let u=(x-cx)/w,v=(y-cy)/h;let r=u*Math.cos(ang)-v*Math.sin(ang),t=u*Math.sin(ang)+v*Math.cos(ang);if(mir)r=-r;return[(bb.minx+bb.maxx)/2+r*bw,(bb.miny+bb.maxy)/2+t*bh]}';
swap(oldMap,'function mapped(x,y){return boundaryMapped(x,y)}');
swap('if(bx<0||bx>1||by<0||by>1||!contains(b,bx,by))continue;','if(!Number.isFinite(bx)||!Number.isFinite(by))continue;');
swap('const detail=surfaceRelief(b,bx,by,rel),inner=surfaceRelief(a,x,y,rel)*.15,shared=detail*.35;add(x,y,z+shared+inner,ca);add(x,y,z+shared-th-Math.max(-th*.45,detail-inner),cb)','const pair=boundaryHeights(a,b,x,y,bx,by,z,th,rel);add(x,y,pair[0],ca);add(x,y,pair[1],cb)');
swap('const ca=sample(a,x,y),cb=sample(b,bx,by),v=Math.random();add(x,y,height(x,y)-0.02*v,ca.map((c,j)=>Math.round(c*(1-v)+cb[j]*v)))','const ca=sample(a,x,y),cb=sample(b,bx,by),v=Math.random(),pair=boundaryHeights(a,b,x,y,bx,by,height(x,y),th,rel);add(x,y,pair[0]*(1-v)+pair[1]*v,ca.map((c,j)=>Math.round(c*(1-v)+cb[j]*v)))');
const script=fs.readFileSync('boundary.js','utf8');
swap('</script></body>',script+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
