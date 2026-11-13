import './surfaces-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Finish patch source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap('const rimTarget=Math.floor(target*.06),edges=[];','const surfacePointCount=pos.length/3;const rimTarget=Math.floor(target*.06),edges=[];');
swap('raw=new Float32Array(pos);','matchRimHeights(pos,surfacePointCount,cx,cy,iw/L,ih/L);raw=new Float32Array(pos);');
html=html.replaceAll("'#0648ff'",'themeAccent()');
swap('</script></body>',fs.readFileSync('finish.js','utf8')+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
