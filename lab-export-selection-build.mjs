import fs from 'node:fs';
export function addLabExportSelection(source,runtime=fs.readFileSync('lab-export-selection.js','utf8')){
  function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab export selection source mismatch: '+a);return text.replace(a,b)}
  let batch=replace(source.batch,'details.append(title);','labAttachExportToggle(title,group);details.append(title);');
  batch=replace(batch,'specimens:labGroupExtractionJobs(jobs).map(group=>','specimens:labGroupExtractionJobs(labSelectedExportJobs()).map(group=>');
  batch=replace(batch,'for(const job of jobs){const base=','for(const job of labSelectedExportJobs()){const base=');
  batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
  const viewer=replace(source.viewer,"batchExports.append(get('bbJson'),get('bbCsv'),get('bbPng'));","batchExports.append(get('bbSelectionExportControls'));");
  return {batch,viewer};
}
