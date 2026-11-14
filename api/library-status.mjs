import { createHash, timingSafeEqual } from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest();
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const origin=req.headers.origin;
  if(origin){try{const u=new URL(origin);if(u.protocol!=='https:'||u.host!==req.headers.host)return res.status(403).json({error:'Origin not allowed'});}catch{return res.status(403).json({error:'Origin not allowed'});}}
  const key=process.env.SHELL_LIBRARY_ACCESS_KEY;
  if(!key||key.length<32)return res.status(503).json({error:'Owner access is not configured. Add SHELL_LIBRARY_ACCESS_KEY with at least 32 random characters in Vercel, then redeploy.'});
  const authorization=req.headers.authorization||'';
  if(!authorization.startsWith('Bearer ')||authorization.length>1024||!timingSafeEqual(hash(authorization.slice(7)),hash(key)))return res.status(401).json({error:'Owner access key is incorrect'});
  const token=process.env.SHELL_LIBRARY_GITHUB_TOKEN;
  if(!token)return res.status(503).json({error:'SHELL_LIBRARY_GITHUB_TOKEN is missing from this deployment'});
  try{
    const response=await fetch('https://api.github.com/repos/Gushaussen/shell-field',{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(12000)});
    if(!response.ok)return res.status(502).json({error:'GitHub repository access failed',githubStatus:response.status});
    const repository=await response.json();
    return res.status(200).json({ok:true,repository:repository.full_name,branch:repository.default_branch,readAccessVerified:true,writeAccessVerified:false,message:'Repository read access confirmed. No files were written. Write permission still needs a controlled save test.'});
  }catch{return res.status(502).json({error:'Could not reach GitHub. Try again.'});}
}
