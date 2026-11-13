import './automation-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Profile source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap('prepareSurfaceFields();prepareBoundaryWarp();const L=','prepareSurfaceFields();prepareProfileConstraints();prepareBoundaryWarp();const L=');
swap('base=-z,innerHeight=base+innerDetail','base=profileSurfaceHeight(x,y,-z,th),innerHeight=base+innerDetail');
swap('return exteriorHeight(points[i][0],points[i][1],pair[1])','return profileConstraints?profileRimHeight(x,y):exteriorHeight(points[i][0],points[i][1],pair[1])');
swap('raw=new Float32Array(pos);','captureProfileProjection(pos,cx,cy,iw/L,ih/L);raw=new Float32Array(pos);');
swap('version:5,units:', 'version:6,profileGeometry:exportProfileGeometry(),units:');
swap('</script></body>',fs.readFileSync('profile-geometry.js','utf8')+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
