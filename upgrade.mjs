import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const extra=fs.readFileSync('upgrade.js','utf8');
if(!html.includes('</script></body>'))throw Error('Expected shell module not found');
fs.mkdirSync('public',{recursive:true});
fs.writeFileSync('public/index.html',html.replace('</script></body>',extra+'\n</script></body>'));
