export function addLabSpatialColour(source){
function replace(text,a,b){if(text.split(a).length!==2)throw Error('Lab spatial colour source mismatch: '+a);return text.replace(a,b)}
let batch=replace(source.batch,"const labFoundationPromise=import('./src/lab-foundation.mjs');","const labFoundationPromise=import('./src/lab-foundation.mjs');const labSpatialPromise=import('./src/lab-spatial-colour.mjs');");
batch=replace(batch,"['transect','Base-tip colour transect']","['transect','Base-tip colour transect'],['gradients','Colour gradients'],['patches','Colour patches + adjacency']");
batch=replace(batch,'if(settings.foundation.colour||settings.foundation.transect||settings.foundation.texture)','if(settings.foundation.colour||settings.foundation.transect||settings.foundation.texture||settings.foundation.gradients||settings.foundation.patches)');
batch=replace(batch,"Object.assign(presetNames,{hue:'Hue map'});","Object.assign(presetNames,{hue:'Hue map',gradients:'Colour gradients',patches:'Colour patches'});");
batch=replace(batch,"el('bbView').add(new Option('HUE MAP','hue'));","el('bbView').add(new Option('HUE MAP','hue'));el('bbView').add(new Option('COLOUR GRADIENTS','gradients'));el('bbView').add(new Option('COLOUR PATCHES','patches'));");
const anchor="if(settings.foundation.texture)record('glcm',()=>core.labGlcm(pixels.data,mask,canvas.width,canvas.height));";
batch=replace(batch,anchor,anchor+`\nif(settings.foundation.gradients||settings.foundation.patches){const spatial=await labSpatialPromise;for(const [flag,key,fn] of [['gradients','colourGradients','labColourGradients'],['patches','colourPatches','labColourPatches']])if(settings.foundation[flag]){check(signal);let analysis;record(key,()=>{analysis=spatial[fn](pixels.data,mask,canvas.width,canvas.height);return analysis.data});if(analysis&&records[key].status==='completed'){ctx.putImageData(new ImageData(analysis.rgba,canvas.width,canvas.height),0,0);result.previews[flag]=canvas.toDataURL('image/png')}await pause();check(signal)}}\n`);
batch=replace(batch,"['texture','glcm']])if(settings.foundation[flag]","['texture','glcm'],['gradients','colourGradients'],['patches','colourPatches']])if(settings.foundation[flag]");
batch=replace(batch,'\ncontrols();\n})();',`\nel('bbView').hidden=true;const spatialStyle=document.createElement('style');spatialStyle.textContent='#shell-tool-data #dlControls #bbView{display:none!important}#shell-tool-data #dlControls #bbColourFoundationControls{margin-top:20px;padding-top:0}';document.head.append(spatialStyle);\ncontrols();\n})();`);
return {...source,batch};
}
