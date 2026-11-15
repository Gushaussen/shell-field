const labShapeAdvancedPromise=import('./src/lab-shape-advanced.mjs');
const shapeAdvancedInputs={};
const shapeAdvancedBox=document.createElement('fieldset');
shapeAdvancedBox.id='bbShapeAdvancedControls';
shapeAdvancedBox.append(Object.assign(document.createElement('legend'),{textContent:'OUTLINE ADVANCED'}));
for(const [key,name] of [['outline','Curvature, symmetry & Fourier outline']]){
  const label=document.createElement('label');
  const input=document.createElement('input');
  input.type='checkbox';
  input.dataset.shapeAdvanced=key;
  shapeAdvancedInputs[key]=input;
  label.append(input,document.createTextNode(name));
  shapeAdvancedBox.append(label);
}
dialog.append(shapeAdvancedBox);
function labShapeAdvancedSettings(){return Object.freeze(Object.fromEntries(Object.entries(shapeAdvancedInputs).map(([key,input])=>[key,input.checked])))}
const controlsBeforeAdvanced=controls;controls=function(){controlsBeforeAdvanced();for(const input of Object.values(shapeAdvancedInputs))input.disabled=working};
const analyseBeforeAdvanced=analyseSide;analyseSide=async function(data,index,settings,signal){
  const result=await analyseBeforeAdvanced(data,index,settings,signal);
  if(result.status!=='success'||!settings.shapeAdvanced?.outline)return result;
  check(signal);
  const core=await labShapeAdvancedPromise;
  const saved=data.interior[index];
  const axis=index===0?data.ends:null;
  const records=result.extractions||(result.extractions={});
  const record=(key,fn)=>{try{const value=fn();records[key]={status:value.status==='unavailable'?'unavailable':'completed',source:'image-derived',methodVersion:core.LAB_SHAPE_ADVANCED_VERSION,method:'automatic',reviewState:'candidate',data:value}}catch(error){records[key]={status:'failed',source:'image-derived',error:error.message}}};
  if(axis){
    record('boundaryCurvature',()=>core.labBoundaryCurvature(saved.polys[0],64,0.6));
    record('reflectionSymmetry',()=>core.labReflectionSymmetry(saved.polys[0],64));
    record('ellipticFourier',()=>core.labEllipticFourier(saved.polys[0],12));
    record('landmarks',()=>core.labLandmarkMeasurements(saved.polys[0],axis,result.mmPerPixel));
  }else{
    records.shapeAdvanced={status:'unavailable',source:'image-derived',reason:'Base-tip axis is only saved for the interior side; exterior analysis does not reuse interior calibration or axis'};
  }
  result.shapeAdvancedProvenance={version:core.LAB_SHAPE_ADVANCED_VERSION,settings:settings.shapeAdvanced,method:'automatic',reviewState:'candidate',source:'image-derived',axisSource:index===0?'saved interior base-tip endpoints':'unavailable'};
  return result;
};
function labShapeAdvancedCsvRows(){const rows=[];for(const job of labSelectedExportJobs())for(const [key,value] of Object.entries(job.extractions||{}))if(['boundaryCurvature','reflectionSymmetry','ellipticFourier','landmarks','shapeAdvanced'].includes(key))rows.push([run.id,run.sourceRevision,job.id,job.name,job.species,job.side,job.status,job.error||'','extraction',key,JSON.stringify({result:value,provenance:job.shapeAdvancedProvenance}),'structured JSON']);return rows}
