import {createHash,timingSafeEqual} from 'node:crypto';
const hash=v=>createHash('sha256').update(v).digest();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}
 const key=process.env.SHELL_LIBRARY_ACCESS_KEY,token=process.env.SHELL_LIBRARY_GITHUB_TOKEN,auth=req.headers.authorization||'';
 if(!key||key.length<32||!token)return res.status(503).json({error:'Library secrets missing'});
 if(auth.length>1024||!auth.startsWith('Bearer ')||!timingSafeEqual(hash(auth.slice(7)),hash(key)))return res.status(401).json({error:'Incorrect owner-access key'});
 if(req.headers.origin){try{const u=new URL(req.headers.origin);if(u.protocol!=='https:'||u.host!==req.headers.host)return res.status(403).json({error:'Origin not allowed'});}catch{return res.status(403).json({error:'Origin not allowed'});}}
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 async function gh(path,method='GET',body){const response=await fetch('https://api.github.com/repos/Gushaussen/shell-field'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});if(!response.ok){const error=new Error('GitHub request failed');error.status=response.status;throw error}return response.json()}
 try{
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!b||JSON.stringify(b).length>2048||typeof b.id!=='string'||!/^specimen-[a-f0-9-]{36}$/.test(b.id)||!['inspect','delete'].includes(b.action))return res.status(400).json({error:'Invalid deletion request'});
  if(b.action==='delete'&&(typeof b.expectedTree!=='string'||!/^[a-f0-9]{40}$/.test(b.expectedTree)||typeof b.confirmName!=='string'||b.confirmName.length>120))return res.status(400).json({error:'Deletion confirmation missing'});
  const path='library/specimens/'+b.id;
  for(let attempt=0;attempt<3;attempt++){
   const ref=await gh('/git/ref/heads/main'),tree=await gh('/git/trees/'+ref.object.sha+'?recursive=1');
   if(tree.truncated)return res.status(413).json({error:'Repository tree is too large for safe deletion'});
   const entry=tree.tree.find(e=>e.path===path&&e.type==='tree');
   if(!entry)return res.status(404).json({error:'Specimen is no longer on main. Refresh the library to check.'});
   const file=await gh('/contents/'+path+'/specimen.json?ref='+ref.object.sha),record=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
   if(record.id!==b.id||typeof record.name!=='string')return res.status(409).json({error:'Specimen metadata does not match folder'});
   if(b.action==='inspect')return res.status(200).json({id:b.id,name:record.name,tree:entry.sha,files:tree.tree.filter(e=>e.type==='blob'&&e.path.startsWith(path+'/')).length});
   if(entry.sha!==b.expectedTree||record.name!==b.confirmName)return res.status(409).json({error:'Specimen changed or name does not match. Reopen the deletion confirmation.'});
   const nextTree=await gh('/git/trees','POST',{base_tree:tree.sha,tree:[{path,mode:'040000',type:'tree',sha:null}]});
   const commit=await gh('/git/commits','POST',{message:'Delete shell specimen '+b.id,tree:nextTree.sha,parents:[ref.object.sha]});
   try{await gh('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});return res.status(200).json({ok:true,id:b.id,commit:commit.sha,historyPreserved:true});}catch(error){if(![409,422].includes(error.status)||attempt===2)throw error}
  }
 }catch(error){return res.status(502).json({error:'Deletion was not confirmed. Refresh the library before retrying.',githubStatus:error.status||null});}
}
