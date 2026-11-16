import fs from 'node:fs';
export function addLabTextureFeatures(source,runtime=fs.readFileSync('lab-texture-features-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab texture features source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'const settings=Object.freeze({foundation:labFoundationSettings(),shapeAdvanced:labShapeAdvancedSettings(),colourAdvanced:labColourAdvancedSettings(),','const settings=Object.freeze({foundation:labFoundationSettings(),shapeAdvanced:labShapeAdvancedSettings(),colourAdvanced:labColourAdvancedSettings(),textureAdvanced:labTextureAdvancedSettings(),');
batch=replace(batch,'&&!Object.values(settings.colourAdvanced).some(Boolean))','&&!Object.values(settings.colourAdvanced).some(Boolean)&&!Object.values(settings.textureAdvanced).some(Boolean))');
batch=replace(batch,'rows.push(...labColourAdvancedCsvRows());','rows.push(...labColourAdvancedCsvRows());rows.push(...labTextureAdvancedCsvRows());');
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'));","batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'),get('bbTextureAdvancedControls'));");
return {batch,viewer};
}
