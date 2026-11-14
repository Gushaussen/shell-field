import {createHash,timingSafeEqual} from 'node:crypto';
const hash=v=>createHash('sha256').update(v).digest();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}
 const key=process.env.SHELL_LIBRARY_ACCESS_KEY,token=process.env.SHELL_LIBRARY_GITHUB_TOKEN,auth=req.headers.authorization||'';
 if(!key||key.length<32||!token)return res.status(503).json({error:'Library secrets missing'});
 if(auth.length>1024||!auth.startsWith('Bearer ')||!timingSafeEqual(hash(auth.slice(7)),hash(key)))return res.status(401).json({error:'Incorrect owner-access key'});
 if(req.headers.origin){try{const u=new URL(req.headers.origin);if(u.protocol!=='https:'||u.host!==req.headers.host)return res.status(403).json({error:'Origin not allowed'});}catch{return res.status(403).json({error:'Origin not allowed'});}}
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 async function get(path){const r=await fetch('https://api.github.com/repos/Gushaussen/shell-field'+path,{headers,signal:AbortSignal.timeout(15000)});if(!r.ok){const e=new Error('GitHub read failed');e.status=r.status;throw e;}return r.json();}
 try{
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>2048)return res.status(400).json({error:'Invalid request'});
  if(b.action==='list'){
   const ref=await get('/git/ref/heads/main'),tree=await get('/git/trees/'+ref.object.sha+'?recursive=1');
   if(tree.truncated)return res.status(413).json({error:'Repository tree is too large for this library version'});
   const ids=tree.tree.filter(e=>e.type==='blob'&&/^library\/specimens\/specimen-[a-f0-9-]{36}\/specimen\.json$/.test(e.path)).map(e=>e.path.split('/')[2]);
   return res.status(200).json({ids,revision:ref.object.sha});
  }
  if(typeof b.id!=='string'||!/^specimen-[a-f0-9-]{36}$/.test(b.id)||typeof b.revision!=='string'||!/^[a-f0-9]{40}$/.test(b.revision))return res.status(400).json({error:'Invalid specimen reference'});
  const base='/contents/library/specimens/'+b.id+'/',file=await get(base+'specimen.json?ref='+b.revision),metadata=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
  if(b.action==='metadata')return res.status(200).json(metadata);
  if(b.action!=='part'||!Number.isInteger(b.index)||b.index<0||b.index>=64)return res.status(400).json({error:'Invalid part request'});
  const part=metadata.archive?.parts?.[b.index];if(!part||!/^archive-[0-9]{3}\.bin$/.test(part.path)||part.bytes>524288)return res.status(400).json({error:'Invalid archive part'});
  const data=await get(base+part.path+'?ref='+b.revision);if(data.sha!==part.sha)return res.status(409).json({error:'Archive part hash mismatch'});
  return res.status(200).json({content:data.content,sha:data.sha});
 }catch(e){return res.status(502).json({error:'Library read failed',githubStatus:e.status||null});}
}
