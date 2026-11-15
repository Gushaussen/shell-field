import fs from 'node:fs';
export function addLabGeometryAnalysis(source,runtime=fs.readFileSync('lab-geometry-analysis-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab geometry source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'rows.push(...labAnatomyConditionCsvRows());','rows.push(...labAnatomyConditionCsvRows());rows.push(...labGeometryCsvRows());');
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'),get('bbTextureAdvancedControls'),get('bbAnatomyConditionControls'));","batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'),get('bbTextureAdvancedControls'),get('bbAnatomyConditionControls'),get('bbGeometryControls'));");
return {batch,viewer};
}
