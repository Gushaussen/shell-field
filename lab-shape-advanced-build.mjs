import fs from 'node:fs';
export function addLabShapeAdvanced(source,runtime=fs.readFileSync('lab-shape-advanced-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab advanced shape source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'const settings=Object.freeze({foundation:labFoundationSettings(),','const settings=Object.freeze({foundation:labFoundationSettings(),shapeAdvanced:labShapeAdvancedSettings(),');
batch=replace(batch,'if(!settings.colour&&!settings.shape&&!Object.values(settings.foundation).some(Boolean))','if(!settings.colour&&!settings.shape&&!Object.values(settings.foundation).some(Boolean)&&!settings.shapeAdvanced.outline)');
batch=replace(batch,'rows.push(...labFoundationCsvRows());','rows.push(...labFoundationCsvRows());rows.push(...labShapeAdvancedCsvRows());');
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'));","batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'));");
return {batch,viewer};
}
