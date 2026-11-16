const labTextureFeaturesPromise=import('./src/lab-texture-features.mjs');
const textureAdvancedInputs={};
const textureAdvancedBox=document.createElement('fieldset');
textureAdvancedBox.id='bbTextureAdvancedControls';
textureAdvancedBox.append(Object.assign(document.createElement('legend'),{textContent:'TEXTURE & FEATURES'}));
for(const [key,name] of [['contrast','Local contrast map'],['direction','Local direction map'],['multiscale','Multiscale texture'],['rhythm','Repetition spacing'],['features','Feature candidates & graph']]){
  const label=document.createElement('label');
  const input=document.createElement('input');
  input.type='checkbox';
  input.dataset.textureAdvanced=key;
  textureAdvancedInputs[key]=input;
  label.append(input,document.createTextNode(name));
  textureAdvancedBox.append(label);
}
dialog.append(textureAdvancedBox);
function labTextureAdvancedSettings(){return Object.freeze(Object.fromEntries(Object.entries(textureAdvancedInputs).map(([key,input])=>[key,input.checked])))}
const controlsBeforeTextureAdvanced=controls;controls=function(){controlsBeforeTextureAdvanced();for(const input of Object.values(textureAdvancedInputs))input.disabled=working};
const analyseBeforeTextureAdvanced=analyseSide;analyseSide=async function(data,index,settings,signal){
  const result=await analyseBeforeTextureAdvanced(data,index,settings,signal);
  const requested=settings.textureAdvanced||{};
  if(result.status!=='success'||!Object.values(requested).some(Boolean))return result;
  check(signal);
  const core=await labTextureFeaturesPromise;
  const saved=data.interior[index];
  const axis=index===0?data.ends:null;
  const records=result.extractions||(result.extractions={});
  const record=(key,fn)=>{try{const value=fn();records[key]={status:value.status==='unavailable'?'unavailable':'completed',source:'image-derived',methodVersion:core.LAB_TEXTURE_FEATURES_VERSION,method:'automatic',reviewState:'candidate',data:value}}catch(error){records[key]={status:'failed',source:'image-derived',error:error.message}}};
  try{
    const image=await decodeLibraryImage(saved.photo);check(signal);
    const canvas=document.createElement('canvas');canvas.width=result.analysisDimensions.width;canvas.height=result.analysisDimensions.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const mask=new Uint8Array(canvas.width*canvas.height);
    for(let y=0;y<canvas.height;y++){for(let x=0;x<canvas.width;x++){const u=(x+.5)/canvas.width,v=(y+.5)/canvas.height;mask[y*canvas.width+x]=inside(saved.polys[0],u,v)&&!saved.polys.slice(1).some(p=>inside(p,u,v))?1:0}}
    if(requested.contrast)record('localContrast',()=>core.labLocalContrast(pixels.data,mask,canvas.width,canvas.height));
    if(requested.direction)record('localDirection',()=>core.labLocalDirection(pixels.data,mask,canvas.width,canvas.height));
    if(requested.multiscale)record('multiscaleTexture',()=>core.labMultiscaleTexture(pixels.data,mask,canvas.width,canvas.height));
    if(requested.rhythm)record('repetitionSpacing',()=>core.labRepetitionSpacing(pixels.data,mask,canvas.width,canvas.height,axis));
    if(requested.features){
      record('featureCandidates',()=>core.labFeatureCandidates(pixels.data,mask,canvas.width,canvas.height));
      if(records.featureCandidates.status==='completed')record('featureGraph',()=>core.labFeatureGraph(records.featureCandidates.data.features));
    }
  }catch(error){check(signal);for(const [flag,key] of [['contrast','localContrast'],['direction','localDirection'],['multiscale','multiscaleTexture'],['rhythm','repetitionSpacing'],['features','featureCandidates']])if(requested[flag]&&!records[key])records[key]={status:'failed',source:'image-derived',error:error.message}}
  result.textureAdvancedProvenance={version:core.LAB_TEXTURE_FEATURES_VERSION,settings:requested,method:'automatic',reviewState:'candidate',source:'image-derived',interpretation:'Image-derived texture and candidate features; not physical roughness or confirmed anatomy'};
  return result;
};
function labTextureAdvancedCsvRows(){const rows=[];for(const job of labSelectedExportJobs())for(const [key,value] of Object.entries(job.extractions||{}))if(['localContrast','localDirection','multiscaleTexture','repetitionSpacing','featureCandidates','featureGraph'].includes(key))rows.push([run.id,run.sourceRevision,job.id,job.name,job.species,job.side,job.status,job.error||'','extraction',key,JSON.stringify({result:value,provenance:job.textureAdvancedProvenance}),'structured JSON']);return rows}
