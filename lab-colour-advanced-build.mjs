import fs from 'node:fs';
export function addLabColourAdvanced(source,runtime=fs.readFileSync('lab-colour-advanced-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab advanced colour source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'const settings=Object.freeze({foundation:labFoundationSettings(),shapeAdvanced:labShapeAdvancedSettings(),','const settings=Object.freeze({foundation:labFoundationSettings(),shapeAdvanced:labShapeAdvancedSettings(),colourAdvanced:labColourAdvancedSettings(),');
batch=replace(batch,'&&!settings.shapeAdvanced.outline)','&&!settings.shapeAdvanced.outline&&!Object.values(settings.colourAdvanced).some(Boolean))');
batch=replace(batch,'rows.push(...labShapeAdvancedCsvRows());','rows.push(...labShapeAdvancedCsvRows());rows.push(...labColourAdvancedCsvRows());');
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchColour.append(get('bbPresetControls'),get('bbView'),get('bbColourFoundationControls'));","batchColour.append(get('bbPresetControls'),get('bbView'),get('bbColourFoundationControls'),get('bbColourAdvancedControls'));");
return {batch,viewer};
}
