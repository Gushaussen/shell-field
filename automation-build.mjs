import './transition-build.mjs';
import fs from 'node:fs';
let html=fs.readFileSync('public/index.html','utf8');
function swap(a,b){if(!html.includes(a))throw Error('Automation source mismatch: '+a.slice(0,100));html=html.replace(a,b)}
swap("function mark(){dirty=true;", "function mark(){queueMicrotask(()=>scheduleShellAutomation());dirty=true;");
swap('</script></body>',fs.readFileSync('automation.js','utf8')+'\n</script></body>');
fs.writeFileSync('public/index.html',html);
