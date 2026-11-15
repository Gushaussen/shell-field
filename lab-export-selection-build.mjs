import fs from 'node:fs';
export function addLabExportSelection(source,runtime=fs.readFileSync('lab-export-selection.js','utf8')){
  function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab export selection source mismatch: '+a);return text.replace(a,b)}
  let batch=replace(source.batch,'details.append(title);','labAttachExportToggle(title,group);details.append(title);');
  batch=replace(batch,'specimens:labGroupExtractionJobs(jobs).map(group=>','specimens:labGroupExtractionJobs(labSelectedExportJobs()).map(group=>');
  batch=replace(batch,'for(const job of jobs){const base=','for(const job of labSelectedExportJobs()){const base=');
  batch=replace(batch,"el('bbView').value=mode;preview(job);controls();","el('bbView').value=mode;showView();el('dlBatchInspector').hidden=true;controls();");
  batch=replace(batch,"button.textContent='INSPECT SIDE';button.disabled=working;button.onclick=()=>{preview(job);controls()};","button.textContent='OPEN APPEARANCE';button.disabled=working||!Object.keys(job.previews||{}).length;button.onclick=()=>{const mode=Object.keys(job.previews||{})[0];if(mode)enlargeAppearance(job,mode)};");
  runtime=replace(runtime,"document.createTextNode(' Export')","document.createTextNode(' Download')");
  runtime=replace(runtime,"'Include '+group.name+' and its sides in export'","'Download extracted data for '+group.name+' and its processed sides'");
  runtime=replace(runtime,'#shell-tool-data .bbSpecimenGroup>summary .bbExportGroupToggle{','#shell-tool-data #dlBatchInspector{display:none!important}#shell-tool-data .bbSpecimenGroup>summary .bbExportGroupToggle{');
  batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
  const viewer=replace(source.viewer,"batchExports.append(get('bbJson'),get('bbCsv'),get('bbPng'));","batchExports.append(get('bbSelectionExportControls'));");
  return {batch,viewer};
}
