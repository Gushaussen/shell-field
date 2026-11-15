import fs from 'node:fs';
let html=fs.readFileSync('index.html','utf8');
const extra=fs.readFileSync('upgrade.js','utf8');
const revision=fs.readFileSync('revision.js','utf8');
function replaceOnce(before,after){if(!html.includes(before))throw Error('Expected source fragment missing: '+before.slice(0,80));html=html.replace(before,after)}
replaceOnce('renderer.setSize(r.width,r.height);','renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);');
replaceOnce('editor.width=Math.max(1,r.width*devicePixelRatio);editor.height=Math.max(1,r.height*devicePixelRatio);','const pw=Math.max(1,Math.round(r.width*devicePixelRatio)),ph=Math.max(1,Math.round(r.height*devicePixelRatio));if(editor.width!==pw)editor.width=pw;if(editor.height!==ph)editor.height=ph;');
replaceOnce("const L=endpointDistance(),iw=", "prepareSurfaceFields();const L=endpointDistance(),iw=");
replaceOnce("function height(x,y){const nx=(x-cx)/w,ny=(y-cy)/h;let radial=Math.sqrt(nx*nx+ny*ny);let base=Math.max(0,1-Math.pow(2*radial,2));let shaped=Math.pow(base,1+(1-dome)*1.5);let rim=1-Math.pow(Math.min(1,radial),1/(0.2+rimround*1.8));let longitudinal=1+tiplean*2*(nx);let cross=1+(crossround-0.5)*0.8*(1-Math.abs(ny));let influence=0.5+profile*0.5;return dome*0.45*shaped*rim*longitudinal*cross*influence+deeppos*0.2*(1-Math.abs(nx))}", "function height(x,y){return dep*Math.pow(outlineDepth(x,y),.8)}");
replaceOnce('add(x,y,z+la*rel,ca);add(x,y,z-th+lb*rel,cb)', 'const detail=surfaceRelief(b,bx,by,rel),inner=surfaceRelief(a,x,y,rel)*.15,shared=detail*.35;add(x,y,z+shared+inner,ca);add(x,y,z+shared-th-Math.max(-th*.45,detail-inner),cb)');
replaceOnce('</style>',`\nhtml,body{width:100%;height:100%;}main{min-height:0;overflow:hidden;}aside,.work,.views{min-height:0;}.work{overflow:hidden;}.work>header,.work>footer{flex-shrink:0;}.views{grid-template-rows:minmax(0,1fr);overflow:hidden;}.views>.card{min-width:0;min-height:0;contain:size layout;}#editor,#viewer>canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;}#status{position:sticky;bottom:0;background:white;padding:12px;border:1px solid var(--b);border-radius:10px;z-index:5;overflow-wrap:anywhere;}h3{font-size:10px;letter-spacing:1px;margin-top:18px;}.workflow-note{font-size:10px;line-height:1.6;border-left:2px solid var(--b);padding-left:9px;}@media(max-width:1000px){.views{grid-template-rows:repeat(2,minmax(0,1fr));}}@media(max-width:650px){main{height:auto;overflow:visible;}aside{overflow:visible;}.work{height:850px;flex:none;}.views{min-height:0;}}\n</style>`);
if(!html.includes('</script></body>'))throw Error('Expected shell module not found');
fs.mkdirSync('public',{recursive:true});
fs.writeFileSync('public/index.html',html.replace('</script></body>',extra+'\n'+revision+'\n</script></body>'));
