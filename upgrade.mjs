import fs from 'node:fs';
let html=fs.readFileSync('index.html','utf8');
const extra=fs.readFileSync('upgrade.js','utf8');
function replaceOnce(before,after){if(!html.includes(before))throw Error('Expected source fragment missing: '+before.slice(0,80));html=html.replace(before,after)}
replaceOnce('renderer.setSize(r.width,r.height);','renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);');
replaceOnce('editor.width=Math.max(1,r.width*devicePixelRatio);editor.height=Math.max(1,r.height*devicePixelRatio);','const pw=Math.max(1,Math.round(r.width*devicePixelRatio)),ph=Math.max(1,Math.round(r.height*devicePixelRatio));if(editor.width!==pw)editor.width=pw;if(editor.height!==ph)editor.height=ph;');
replaceOnce('</style>',`\n/* Canvas backing buffers must never determine the CSS size of their containers. */
html,body{width:100%;height:100%;}
main{min-height:0;overflow:hidden;}
aside,.work,.views{min-height:0;}
.work{overflow:hidden;}
.work>header,.work>footer{flex-shrink:0;}
.views{grid-template-rows:minmax(0,1fr);overflow:hidden;}
.views>.card{min-width:0;min-height:0;contain:size layout;}
#editor,#viewer>canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;}
@media(max-width:1000px){.views{grid-template-rows:repeat(2,minmax(0,1fr));}}
@media(max-width:650px){main{height:auto;overflow:visible;}aside{overflow:visible;}.work{height:850px;flex:none;}.views{min-height:0;}}
</style>`);
if(!html.includes('</script></body>'))throw Error('Expected shell module not found');
fs.mkdirSync('public',{recursive:true});
fs.writeFileSync('public/index.html',html.replace('</script></body>',extra+'\n</script></body>'));
