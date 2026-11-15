// Explicit runtime integration; does not rewrite a height-function source fragment.
const {createShellForm:makeStudioForm,longitudinalPosition:studioAxisPosition}=await import('./src/shell-form.mjs');
const formKeys=['dome','rimround','deeppos','tiplean','crossround','profile'];
const readStudioForm=()=>Object.fromEntries(formKeys.map(key=>[key,Number($(key).value)]));
let studioFormHeight=makeStudioForm(readStudioForm());
for(const key of formKeys)$(key).oninput=()=>{$(key+'val').textContent=$(key).value+'%';studioFormHeight=makeStudioForm(readStudioForm());mark()};
function roundedBowlHeight(depth,amplitude){if(!Number.isFinite(depth)||!Number.isFinite(amplitude)||amplitude<0)throw new RangeError('Invalid rounded bowl input');const d=Math.max(0,Math.min(1,depth));return d===0?0:-amplitude*d*(2-d)}
let studioBowlAmplitude=Number($('depth').value)/100;
const buildBeforeRoundedBowl=$('build').onclick;
$('build').onclick=async function(...args){
  studioBowlAmplitude=Number($('depth').value)/100;
  dep=studioBowlAmplitude;th=Number($('thick').value)/100;
  studioFormHeight=makeStudioForm(readStudioForm());
  return await buildBeforeRoundedBowl.apply(this,args);
};
const reviewedSurfaceHeight=profileSurfaceHeight;
profileSurfaceHeight=function(x,y,fallback,thickness){
  const img=sides[0].img;
  const u=studioAxisPosition(x*img.width,y*img.height,[ends[0][0]*img.width,ends[0][1]*img.height],[ends[1][0]*img.width,ends[1][1]*img.height]);
  const depth=outlineDepth(x,y);
  const roundedFallback=roundedBowlHeight(depth,studioBowlAmplitude);
  const reviewed=profileConstraints?reviewedSurfaceHeight(x,y,roundedFallback,thickness):null;
  return studioFormHeight({depth,u,estimatedHeight:roundedFallback,profileHeight:reviewed,rimHeight:profileConstraints?profileRimHeight(x,y):0});
};
const formSection=$('dome').closest('section');
formSection.id='studio-shell-form';formSection.querySelector('h2').textContent='04 / SHELL FORM';
const inspectSection=$('export').closest('section');
inspectSection.querySelector('h2').textContent='05 / INSPECTING AND EXPORTING';
inspectSection.before(formSection);
const inspectTarget=navTargets.find(target=>target.label==='Inspect & Export');
if(inspectTarget){
  const previousKey=inspectTarget.key;inspectTarget.key='05 / INSPECTING AND EXPORTING';
  const button=[...nav.querySelectorAll('button')].find(button=>button.dataset.key===previousKey);
  if(button){button.dataset.key=inspectTarget.key;button.onclick=()=>aside.scrollTo({top:sectionScrollTop(inspectSection),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
}
const formTarget={key:'04 / SHELL FORM',icon:'shell',label:'Shell Form'};
navTargets.splice(navTargets.length-1,0,formTarget);
const formButton=document.createElement('button');
formButton.type='button';formButton.className='section-nav-button';formButton.dataset.key=formTarget.key;
formButton.title=formTarget.label;formButton.setAttribute('aria-label',formTarget.label);
formButton.innerHTML=navIcons.shell;
const formTip=document.createElement('span');formTip.className='nav-tip';formTip.textContent=formTarget.label;formButton.append(formTip);
formButton.onclick=()=>aside.scrollTo({top:sectionScrollTop(formSection),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
nav.insertBefore(formButton,nav.lastElementChild);updateSectionNav();
const saveSettingsBeforeForm=$('settings').onclick;
$('settings').onclick=()=>{
  const previousDownload=download;
  download=function(blob,name){
    if(name==='shell-field-settings.json'){
      blob.text().then(text=>{const settings=JSON.parse(text);settings.shellForm={version:2,fallback:'quadratic-distance-rounding',parameters:readStudioForm()};previousDownload(new Blob([JSON.stringify(settings,null,2)],{type:'application/json'}),name)}).catch(error=>say('Settings export failed: '+error.message));
    }else previousDownload(blob,name);
  };
  try{saveSettingsBeforeForm()}finally{download=previousDownload}
};
