const labAnatomyConditionPromise=import('./src/lab-anatomy-condition.mjs');
const anatomyConditionState={};
const anatomyBox=document.createElement('fieldset');
anatomyBox.id='bbAnatomyConditionControls';
anatomyBox.append(Object.assign(document.createElement('legend'),{textContent:'ANATOMY & CONDITION REVIEW'}));
const shellTypeSelect=document.createElement('select');
shellTypeSelect.id='bbAnatomyShellType';
for(const [value,label] of [['unidentified','Unidentified'],['ostrea_edulis','Ostrea edulis'],['magallana_gigas','Magallana gigas'],['mytilus_edulis','Mytilus edulis'],['cerastoderma_edule','Cerastoderma edule'],['cerastoderma_glaucum','Cerastoderma glaucum'],['unidentified_razor_clam','Unidentified razor clam'],['other','Other']])shellTypeSelect.add(new Option(label,value));
const landmarkName=document.createElement('input');landmarkName.id='bbAnatomyLandmarkName';landmarkName.placeholder='Landmark name';
const landmarkX=document.createElement('input');landmarkX.id='bbAnatomyLandmarkX';landmarkX.type='number';landmarkX.min='0';landmarkX.max='1';landmarkX.step='0.01';landmarkX.placeholder='X 0–1';
const landmarkY=document.createElement('input');landmarkY.id='bbAnatomyLandmarkY';landmarkY.type='number';landmarkY.min='0';landmarkY.max='1';landmarkY.step='0.01';landmarkY.placeholder='Y 0–1';
const conditionSelect=document.createElement('select');conditionSelect.id='bbAnatomyConditionType';
for(const value of ['edge_loss_or_fragmentation','abrasion_or_erosion_candidate','encrustation_candidate','boring_like_opening_candidate','boring_like_channel_candidate','deposit_candidate','repaired_damage_candidate','preserved_region','obscured_region'])conditionSelect.add(new Option(value.replace(/_/g,' '),value));
const conditionNote=document.createElement('input');conditionNote.id='bbAnatomyConditionNote';conditionNote.placeholder='Observation note';
const anatomyMessage=document.createElement('p');anatomyMessage.id='bbAnatomyMessage';
const addLandmarkButton=document.createElement('button');addLandmarkButton.type='button';addLandmarkButton.textContent='ADD LANDMARK';
const addConditionButton=document.createElement('button');addConditionButton.type='button';addConditionButton.textContent='ADD CONDITION';
const attachReviewButton=document.createElement('button');attachReviewButton.type='button';attachReviewButton.textContent='ATTACH REVIEW TO SELECTED RESULTS';
anatomyBox.append(shellTypeSelect,landmarkName,landmarkX,landmarkY,addLandmarkButton,conditionSelect,conditionNote,addConditionButton,attachReviewButton,anatomyMessage);
dialog.append(anatomyBox);
async function labCurrentAnatomyReview(){
  const core=await labAnatomyConditionPromise;
  const key=`${shellTypeSelect.value}`;
  if(!anatomyConditionState[key])anatomyConditionState[key]=core.labCreateAnatomyReview('current-selection',shellTypeSelect.value);
  return {core,review:anatomyConditionState[key]};
}
addLandmarkButton.onclick=async()=>{
  const {core,review}=await labCurrentAnatomyReview();
  const result=core.labAddLandmark(review,landmarkName.value,Number(landmarkX.value),Number(landmarkY.value));
  anatomyMessage.textContent=result.status==='completed'?`Landmark added (${result.landmarkCount}).`:`Landmark unavailable: ${result.reason}`;
};
addConditionButton.onclick=async()=>{
  const {core,review}=await labCurrentAnatomyReview();
  const result=core.labAddCondition(review,conditionSelect.value,conditionNote.value);
  anatomyMessage.textContent=result.status==='completed'?`Condition observation added (${result.conditionCount}).`:`Condition unavailable: ${result.reason}`;
};
attachReviewButton.onclick=async()=>{
  const {core,review}=await labCurrentAnatomyReview();
  const validation=core.labValidateAnatomyReview(review);
  if(!validation.valid){anatomyMessage.textContent=`Review incomplete: ${validation.errors.join('; ')}`;return}
  const jobs=labSelectedExportJobs();
  if(!jobs.length){anatomyMessage.textContent='Select at least one specimen group for export first.';return}
  for(const job of jobs)job.anatomyReview=JSON.parse(JSON.stringify(review));
  anatomyMessage.textContent=`Review attached to ${jobs.length} selected result group(s).`;
};
function labAnatomyConditionCsvRows(){
  const rows=[];
  for(const job of labSelectedExportJobs()){
    if(!job.anatomyReview)continue;
    rows.push([run.id,run.sourceRevision,job.id,job.name,job.species,job.side,job.status,job.error||'','manual_review','anatomyCondition',JSON.stringify({result:job.anatomyReview}),'structured JSON']);
  }
  return rows;
}
