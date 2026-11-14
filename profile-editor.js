const largeProfileStyle=document.createElement('style');
largeProfileStyle.textContent=`#largeProfileDialog{box-sizing:border-box;width:96vw;max-width:1600px;height:94dvh;padding:0;border:1px solid var(--b);border-radius:18px;background:var(--page,white);color:var(--b)}#largeProfileDialog::backdrop{background:rgba(0,12,45,.65)}.large-profile-layout{display:flex;flex-direction:column;height:100%;min-height:0}.large-profile-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 20px;border-bottom:1px solid var(--l)}.large-profile-header h2{margin:0}.large-profile-body{flex:1;min-height:0;overflow:auto;padding:12px 20px 24px}#largeProfileDialog #profileCanvas{height:56dvh!important;min-height:260px;width:100%!important;cursor:crosshair}#largeProfileDialog button{min-height:38px}`;
document.head.append(largeProfileStyle);
const enlargeProfileButton=document.createElement('button');
enlargeProfileButton.id='enlargeProfileEditor';enlargeProfileButton.type='button';enlargeProfileButton.textContent='SIDE PROFILES';enlargeProfileButton.className='primary';enlargeProfileButton.style.width='100%';enlargeProfileButton.setAttribute('aria-haspopup','dialog');
$('profileFiles').closest('label').before(enlargeProfileButton);
const largeProfileDialog=document.createElement('dialog');largeProfileDialog.id='largeProfileDialog';largeProfileDialog.setAttribute('aria-labelledby','largeProfileHeading');
largeProfileDialog.innerHTML=`<div class="large-profile-layout"><div class="large-profile-header"><h2 id="largeProfileHeading">SIDE PROFILES</h2><button id="closeLargeProfile" type="button">CLOSE</button></div><div id="largeProfileBody" class="large-profile-body"></div></div>`;document.body.append(largeProfileDialog);
for(const node of [$('profileFiles').closest('label'),$('profileChoice'),$('profileCanvas'),$('profileLeft').parentElement,$('profileMeasure'),$('profileStatus'),profilePanel])$('largeProfileBody').append(node);
let largeProfileSlots=[],largeProfileReturnFocus=null,largeProfilePreviousOverflow='';
const largeProfileNote=document.createElement('p');
function openLargeProfileEditor(){if(largeProfileDialog.open)return true;largeProfileReturnFocus=document.activeElement;largeProfilePreviousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';largeProfileDialog.showModal();requestAnimationFrame(()=>{drawProfile();$('closeLargeProfile').focus()});return true}
function restoreSmallProfileEditor(){profileEditMode='';profilePicking=false;document.body.style.overflow=largeProfilePreviousOverflow;largeProfileReturnFocus?.focus({preventScroll:true})}
enlargeProfileButton.onclick=()=>openLargeProfileEditor();$('closeLargeProfile').onclick=()=>largeProfileDialog.close();largeProfileDialog.addEventListener('close',restoreSmallProfileEditor);
for(const id of ['editProfileRim','editProfileBowl','spanProfile']){const handler=$(id).onclick;$(id).onclick=e=>{openLargeProfileEditor();handler?.(e);requestAnimationFrame(drawProfile)}}
// Run after interface modules to retain the dedicated side-profile labels.
queueMicrotask(()=>{enlargeProfileButton.textContent='SIDE PROFILES';$('largeProfileHeading').textContent='SIDE PROFILES'});
