function labExportTargetId(mode,format){const targets=mode==='library'?{json:'bbJson',csv:'bbCsv',png:'bbPng'}:{json:'dlJson',csv:'dlCsv',png:'dlPng'};return Object.hasOwn(targets,format)?targets[format]:null}
(() => {
const get=id=>document.getElementById(id),layout=get('dlLayout');if(!layout||get('labFinalExport'))return;
const shapeInput=get('bbShape'),shapeLabel=shapeInput.closest('label');shapeLabel.append(shapeInput);shapeLabel.classList.add('labOutlineToggle');
for(const paragraph of shapeLabel.closest('section').querySelectorAll(':scope > p'))if(paragraph.textContent.trim()==='Width profile: image-vertical, not an anatomical axis.')paragraph.remove();
const section=get('dlJson').closest('section');section.querySelector('h2').textContent='05 / INSPECTING AND EXPORTING';
for(const id of ['bbJson','bbCsv','bbPng','dlJson','dlCsv','dlPng'])get(id).classList.add('labExportBackend');
const label=document.createElement('label');label.htmlFor='labFinalExportFormat';label.textContent='EXPORT FORMAT';const format=document.createElement('select');format.id='labFinalExportFormat';for(const [value,name] of [['json','ANALYSIS JSON'],['csv','MEASUREMENTS CSV'],['png','INSPECTED VIEW PNG']])format.add(new Option(name,value));label.append(format);
const note=document.createElement('p');note.id='labFinalExportScope';note.setAttribute('role','status');const button=document.createElement('button');button.type='button';button.id='labFinalExport';button.textContent='EXPORT';button.setAttribute('aria-describedby',note.id);section.append(label,note,button);
function mode(){return layout.dataset.labMode==='library'?'library':'studio'}
function target(){const id=labExportTargetId(mode(),format.value);return id?get(id):null}
function update(){const library=mode()==='library';let available=0;for(const option of format.options){const backend=get(labExportTargetId(mode(),option.value)),disabled=!backend||backend.disabled;if(option.disabled!==disabled)option.disabled=disabled;if(!disabled)available++;const name=option.value==='png'?(library?'INSPECTED VIEW PNG':'ANNOTATED PNG'):option.value==='json'?(library?'SELECTED GROUPS JSON':'ANALYSIS JSON'):(library?'SELECTED GROUPS CSV':'MEASUREMENTS CSV');if(option.textContent!==name)option.textContent=name}const disabled=!target()||target().disabled;if(button.disabled!==disabled)button.disabled=disabled;const noFormats=available===0;if(format.disabled!==noFormats)format.disabled=noFormats;const text=library?'JSON/CSV: checked Download groups only. PNG: one inspected view from a checked specimen.':'Exports the current Studio-photo Lab snapshot and analysis. PNG includes its annotations.';if(note.textContent!==text)note.textContent=text}
button.onclick=()=>{const backend=target();if(backend&&!backend.disabled)backend.click()};format.onchange=update;
new MutationObserver(update).observe(layout,{subtree:true,attributes:true,attributeFilter:['disabled','data-lab-mode']});update();
const style=document.createElement('style');style.textContent=`
#shell-tool-data #dlControls .labOutlineToggle{display:flex;align-items:center;justify-content:flex-start;gap:8px;margin:2px 0 10px!important}
#shell-tool-data #dlControls .labOutlineToggle input{display:inline-block;width:auto!important;flex:0 0 auto;margin:0;padding:0}
#shell-tool-data #dlControls button,#shell-tool-data #labWorkspace button,#bbAppearanceDialog button{border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text)!important;font:italic 9.5px/1.5 Arial,sans-serif!important;letter-spacing:.2px!important;text-transform:uppercase;padding:6px 8px!important;min-height:28px!important;transform:none!important}
#shell-tool-data #dlControls button:hover,#shell-tool-data #labWorkspace button:hover,#bbAppearanceDialog button:hover{background:transparent!important;text-decoration:underline;text-underline-offset:4px}
#shell-tool-data #dlControls button:focus-visible,#shell-tool-data #labWorkspace button:focus-visible,#bbAppearanceDialog button:focus-visible{outline:2px solid var(--b)!important;outline-offset:3px!important}
#shell-tool-data #dlControls button:disabled,#shell-tool-data #labWorkspace button:disabled{opacity:.35;cursor:default;text-decoration:none}
#shell-tool-data #dlControls button[aria-pressed=true]{text-decoration:underline!important;text-underline-offset:4px!important}
#shell-tool-data .labExportBackend{display:none!important}
#shell-tool-data #dlControls #labFinalExport{display:block!important;width:100%;font:italic 12.5px/1.6 Arial,sans-serif!important;letter-spacing:.6px!important;padding:15px 8px!important;min-height:46px!important;margin:16px 0 0!important;text-align:center}
#labFinalExportScope{font-size:10px;line-height:1.6}#labFinalExportFormat{margin-top:6px}
`;document.head.append(style);
})();
