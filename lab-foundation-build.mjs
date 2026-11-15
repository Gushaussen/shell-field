import fs from 'node:fs';
export function addLabFoundation(source,runtime=fs.readFileSync('lab-foundation-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab foundation source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'const settings=Object.freeze({','const settings=Object.freeze({foundation:labFoundationSettings(),');
batch=replace(batch,'if(!settings.colour&&!settings.shape)','if(!settings.colour&&!settings.shape&&!Object.values(settings.foundation).some(Boolean))');
batch=replace(batch,"side.append(info);if(job.status==='success')","side.append(info);labRenderFoundationResults(side,job);if(job.status==='success')");
batch=replace(batch,'download(new Blob([rows.map(row=>row.map(labBatchCsvCell)',"rows.push(...labFoundationCsvRows());download(new Blob([rows.map(row=>row.map(labBatchCsvCell)");
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchColour.append(get('bbPresetControls'),get('bbView'));","batchColour.append(get('bbPresetControls'),get('bbView'),get('bbColourFoundationControls'));");
viewer=replace(viewer,"batchShape.append(get('bbShape').closest('label'));","batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'));");
return {batch,viewer};
}
