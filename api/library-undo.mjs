import {createHash,timingSafeEqual} from 'node:crypto';
const digest=v=>createHash('sha256').update(v).digest();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}
 const key=process.env.SHELL_LIBRARY_ACCESS_KEY,token=process.env.SHELL_LIBRARY_GITHUB_TOKEN,auth=req.headers.authorization||'';
 if(!key||key.length<32||!token)return res.status(503).json({error:'Library secrets missing'});
 if(auth.length>1024||!auth.startsWith('Bearer ')||!timingSafeEqual(digest(auth.slice(7)),digest(key)))return res.status(401).json({error:'Incorrect owner-access key'});
 if(req.headers.origin){try{const u=new URL(req.headers.origin);if(u.protocol!=='https:'||u.host!==req.headers.host)return res.status(403).json({error:'Origin not allowed'});}catch{return res.status(403).json({error:'Origin not allowed'});}}
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 async function gh(path,method='GET',body){const r=await fetch('https://api.github.com/repos/Gushaussen/shell-field'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});if(!r.ok){const e=new Error('GitHub request failed');e.status=r.status;throw e}return r.json()}
 async function tree(sha){const t=await gh('/git/trees/'+sha+'?recursive=1');if(t.truncated)throw Error('Tree truncated');return t}
 try{
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>2048)return res.status(400).json({error:'Invalid request'});
  if(b.action==='list'){const ref=await gh('/git/ref/heads/main'),current=await tree(ref.object.sha),commits=await gh('/commits?sha='+ref.object.sha+'&path=library%2Fspecimens&per_page=100'),seen=new Set(),deleted=[];for(const c of commits){const match=/^Delete shell specimen (specimen-[a-f0-9-]{36})$/.exec(c.commit.message);if(!match||seen.has(match[1]))continue;const id=match[1];seen.add(id);if(!current.tree.some(e=>e.path==='library/specimens/'+id))deleted.push({id,deletionCommit:c.sha,date:c.commit.committer.date})}return res.status(200).json({deleted,historyWindow:100});}
  if(!['inspect','restore'].includes(b.action)||typeof b.id!=='string'||!/^specimen-[a-f0-9-]{36}$/.test(b.id)||typeof b.deletionCommit!=='string'||!/^[a-f0-9]{40}$/.test(b.deletionCommit))return res.status(400).json({error:'Invalid restoration reference'});
  const deletion=await gh('/git/commits/'+b.deletionCommit);if(deletion.message!=='Delete shell specimen '+b.id||deletion.parents.length!==1)return res.status(400).json({error:'Not a recognized specimen deletion commit'});
  const path='library/specimens/'+b.id,before=await tree(deletion.parents[0].sha),after=await tree(deletion.sha),entry=before.tree.find(e=>e.path===path&&e.type==='tree');
  if(!entry||after.tree.some(e=>e.path===path))return res.status(409).json({error:'Deletion history does not contain a recoverable specimen folder'});
  const file=await gh('/contents/'+path+'/specimen.json?ref='+deletion.parents[0].sha),record=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));if(record.id!==b.id||typeof record.name!=='string')return res.status(409).json({error:'Historical specimen metadata mismatch'});
  if(b.action==='inspect')return res.status(200).json({id:b.id,name:record.name,deletionCommit:b.deletionCommit,expectedTree:entry.sha,files:before.tree.filter(e=>e.type==='blob'&&e.path.startsWith(path+'/')).length});
  if(b.expectedTree!==entry.sha||b.confirmName!==record.name)return res.status(409).json({error:'Restoration confirmation does not match the historical specimen'});
  for(let attempt=0;attempt<3;attempt++){const ref=await gh('/git/ref/heads/main'),current=await tree(ref.object.sha);if(current.tree.some(e=>e.path===path))return res.status(409).json({error:'Specimen already exists on main. Nothing overwritten.'});const next=await gh('/git/trees','POST',{base_tree:current.sha,tree:[{path,mode:'040000',type:'tree',sha:entry.sha}]}),commit=await gh('/git/commits','POST',{message:'Restore shell specimen '+b.id,tree:next.sha,parents:[ref.object.sha]});try{await gh('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});return res.status(200).json({ok:true,id:b.id,commit:commit.sha});}catch(e){if(![409,422].includes(e.status)||attempt===2)throw e}}
 }catch(e){return res.status(502).json({error:'Recovery request was not confirmed. Refresh the library before retrying.',githubStatus:e.status||null});}
}
