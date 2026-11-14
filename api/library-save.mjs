import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
const repo='https://api.github.com/repos/Gushaussen/shell-field';
const digest=v=>createHash('sha256').update(v).digest();
const equal=(a,b)=>timingSafeEqual(digest(a),digest(b));
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}
 const key=process.env.SHELL_LIBRARY_ACCESS_KEY,token=process.env.SHELL_LIBRARY_GITHUB_TOKEN;
 if(!key||key.length<32||!token)return res.status(503).json({error:'Library secrets are not configured'});
 const auth=req.headers.authorization||'';
 if(auth.length>1024||!auth.startsWith('Bearer ')||!equal(auth.slice(7),key))return res.status(401).json({error:'Owner-access key is incorrect'});
 if(req.headers.origin){try{const u=new URL(req.headers.origin);if(u.protocol!=='https:'||u.host!==req.headers.host)return res.status(403).json({error:'Origin not allowed'});}catch{return res.status(403).json({error:'Origin not allowed'});}}
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 async function gh(path,method='GET',body){const r=await fetch(repo+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(18000)});if(!r.ok){const e=new Error('GitHub request failed');e.status=r.status;throw e;}return r.json();}
 const sign=(id,p)=>createHmac('sha256',key).update(`${id}:${p.index}:${p.sha}:${p.size}`).digest('hex');
 try{
  let b=req.body;if(typeof b==='string')b=JSON.parse(b);
  if(!b||JSON.stringify(b).length>850000)return res.status(413).json({error:'Request too large'});
  if(typeof b.id!=='string'||!/^specimen-[a-f0-9-]{36}$/.test(b.id))return res.status(400).json({error:'Invalid specimen ID'});
  if(b.action==='upload'){
   if(!Number.isInteger(b.index)||b.index<0||b.index>=64||typeof b.data!=='string'||b.data.length>700000||!b.data.length||b.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(b.data))return res.status(400).json({error:'Invalid upload chunk'});
   const bytes=Buffer.from(b.data,'base64');if(bytes.length>524288||bytes.toString('base64')!==b.data)return res.status(400).json({error:'Invalid chunk encoding'});
   const blob=await gh('/git/blobs','POST',{content:b.data,encoding:'base64'}),part={index:b.index,sha:blob.sha,size:bytes.length};
   return res.status(200).json({...part,receipt:sign(b.id,part)});
  }
  if(b.action!=='finish')return res.status(400).json({error:'Unknown action'});
  if(!Array.isArray(b.parts)||!b.parts.length||b.parts.length>64||typeof b.hash!=='string'||!/^[a-f0-9]{64}$/.test(b.hash))return res.status(400).json({error:'Invalid archive manifest'});
  for(let i=0;i<b.parts.length;i++){const p=b.parts[i];if(p.index!==i||!Number.isInteger(p.size)||p.size<1||p.size>524288||typeof p.sha!=='string'||!/^[a-f0-9]{40}$/.test(p.sha)||typeof p.receipt!=='string'||!equal(sign(b.id,p),p.receipt))return res.status(400).json({error:'Chunk receipt validation failed'});}
  const m=b.metadata;if(!m||typeof m.name!=='string'||!m.name.trim()||m.name.length>120)return res.status(400).json({error:'A specimen name is required'});
  for(const field of ['species','location','notes'])if(typeof m[field]!=='string'||m[field].length>(field==='notes'?2000:200))return res.status(400).json({error:'Invalid metadata'});
  if(!Number.isFinite(m.lengthMm)||m.lengthMm<=0||!Number.isInteger(m.pointCount)||m.pointCount<1||m.pointCount>2000000)return res.status(400).json({error:'Invalid model dimensions'});
  const base=`library/specimens/${b.id}`,record={schemaVersion:1,id:b.id,name:m.name.trim(),species:m.species,location:m.location,notes:m.notes,lengthMm:m.lengthMm,pointCount:m.pointCount,createdAt:new Date().toISOString(),approximateGeometry:true,archive:{encoding:'gzip-json',sha256:b.hash,bytes:b.parts.reduce((n,p)=>n+p.size,0),parts:b.parts.map(p=>({path:`archive-${String(p.index).padStart(3,'0')}.bin`,sha:p.sha,bytes:p.size}))}};
  for(let attempt=0;attempt<3;attempt++){
   const ref=await gh('/git/ref/heads/main'),parent=await gh('/git/commits/'+ref.object.sha);
   let existing=null;try{existing=await gh('/contents/'+base+'/specimen.json?ref='+ref.object.sha);}catch(e){if(e.status!==404)throw e;}
   if(existing){const previous=JSON.parse(Buffer.from(existing.content,'base64').toString());if(previous.archive?.sha256===b.hash)return res.status(200).json({ok:true,id:b.id,alreadySaved:true,url:`https://github.com/Gushaussen/shell-field/tree/main/${base}`});return res.status(409).json({error:'Specimen ID already exists; nothing overwritten'});}
   const tree=await gh('/git/trees','POST',{base_tree:parent.tree.sha,tree:[...b.parts.map(p=>({path:`${base}/archive-${String(p.index).padStart(3,'0')}.bin`,mode:'100644',type:'blob',sha:p.sha})),{path:base+'/specimen.json',mode:'100644',type:'blob',content:JSON.stringify(record,null,2)}]});
   const commit=await gh('/git/commits','POST',{message:`Save shell specimen ${b.id}`,tree:tree.sha,parents:[ref.object.sha]});
   try{await gh('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});return res.status(201).json({ok:true,id:b.id,commit:commit.sha,url:`https://github.com/Gushaussen/shell-field/tree/${commit.sha}/${base}`});}catch(e){if(![409,422].includes(e.status)||attempt===2)throw e;}
  }
 }catch(e){return res.status(502).json({error:'Save was not confirmed. You may retry with the same scan. Unfinished uploads are not listed as saved specimens.',githubStatus:e.status||null});}
}
