const labColourAdvancedPromise=import('./src/lab-colour-advanced.mjs');
const colourAdvancedInputs={};
const colourAdvancedBox=document.createElement('fieldset');
colourAdvancedBox.id='bbColourAdvancedControls';
colourAdvancedBox.append(Object.assign(document.createElement('legend'),{textContent:'COLOUR ORGANISATION'}));
for(const [key,name] of [['segmentation','Colour regions & masks'],['comparison','Centre / margin comparison'],['bands','Repeating band candidates']]){
  const label=document.createElement('label');
  const input=document.createElement('input');
  input.type='checkbox';
  input.dataset.colourAdvanced=key;
  colourAdvancedInputs[key]=input;
  label.append(input,document.createTextNode(name));
  colourAdvancedBox.append(label);
}
dialog.append(colourAdvancedBox);
function labColourAdvancedSettings(){return Object.freeze(Object.fromEntries(Object.entries(colourAdvancedInputs).map(([key,input])=>[key,input.checked])))}
const controlsBeforeColourAdvanced=controls;controls=function(){controlsBeforeColourAdvanced();for(const input of Object.values(colourAdvancedInputs))input.disabled=working};
const analyseBeforeColourAdvanced=analyseSide;analyseSide=async function(data,index,settings,signal){
  const result=await analyseBeforeColourAdvanced(data,index,settings,signal);
  const requested=settings.colourAdvanced||{};
  if(result.status!=='success'||!Object.values(requested).some(Boolean))return result;
  check(signal);
  const core=await labColourAdvancedPromise;
  const saved=data.interior[index];
  const axis=index===0?data.ends:null;
  const records=result.extractions||(result.extractions={});
  const record=(key,fn)=>{try{const value=fn();records[key]={status:value.status==='unavailable'?'unavailable':'completed',source:'image-derived',methodVersion:core.LAB_COLOUR_ADVANCED_VERSION,method:'automatic',reviewState:'candidate',data:value}}catch(error){records[key]={status:'failed',source:'image-derived',error:error.message}}};
  try{
    const image=await decodeLibraryImage(saved.photo);check(signal);
    const canvas=document.createElement('canvas');canvas.width=result.analysisDimensions.width;canvas.height=result.analysisDimensions.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const mask=new Uint8Array(canvas.width*canvas.height);
    for(let y=0;y<canvas.height;y++){for(let x=0;x<canvas.width;x++){const u=(x+.5)/canvas.width,v=(y+.5)/canvas.height;mask[y*canvas.width+x]=inside(saved.polys[0],u,v)&&!saved.polys.slice(1).some(p=>inside(p,u,v))?1:0}}
    if(requested.segmentation)record('colourSegmentation',()=>core.labColourSegmentation(pixels.data,mask,canvas.width,canvas.height));
    if(requested.comparison)record('centreMarginComparison',()=>core.labCentreMarginComparison(pixels.data,mask,canvas.width,canvas.height));
    if(requested.bands)record('repeatingBands',()=>core.labRepeatingBands(pixels.data,mask,canvas.width,canvas.height,axis));
  }catch(error){check(signal);for(const [flag,key] of [['segmentation','colourSegmentation'],['comparison','centreMarginComparison'],['bands','repeatingBands']])if(requested[flag]&&!records[key])records[key]={status:'failed',source:'image-derived',error:error.message}}
  result.colourAdvancedProvenance={version:core.LAB_COLOUR_ADVANCED_VERSION,settings:requested,method:'automatic',reviewState:'candidate',source:'image-derived',colourCalibration:'uncalibrated',perspectiveCorrected:false};
  return result;
};
function labColourAdvancedCsvRows(){const rows=[];for(const job of labSelectedExportJobs())for(const [key,value] of Object.entries(job.extractions||{}))if(['colourSegmentation','centreMarginComparison','repeatingBands'].includes(key))rows.push([run.id,run.sourceRevision,job.id,job.name,job.species,job.side,job.status,job.error||'','extraction',key,JSON.stringify({result:value,provenance:job.colourAdvancedProvenance}),'structured JSON']);return rows}
