import fs from 'node:fs';
export function addLabAnatomyCondition(source,runtime=fs.readFileSync('lab-anatomy-condition-runtime.js','utf8')){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab anatomy condition source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,'rows.push(...labTextureAdvancedCsvRows());','rows.push(...labTextureAdvancedCsvRows());rows.push(...labAnatomyConditionCsvRows());');
batch=replace(batch,'\ncontrols();\n})();','\n'+runtime+'\ncontrols();\n})();');
let viewer=replace(source.viewer,"batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'),get('bbTextureAdvancedControls'));","batchShape.append(get('bbShape').closest('label'),get('bbMorphFoundationControls'),get('bbTextureFoundationControls'),get('bbShapeAdvancedControls'),get('bbTextureAdvancedControls'),get('bbAnatomyConditionControls'));");
return {batch,viewer};
}
