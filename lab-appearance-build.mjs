import fs from 'node:fs';
export function addLabAppearances(batch,viewer,runtime=fs.readFileSync('lab-appearance-runtime.js','utf8')){
  function replace(source,a,b){if(source.split(a).length!==2)throw Error('Lab appearance integration source mismatch: '+a);return source.replace(a,b)}
  const old="const settings={maxDimension:640,previewMaxDimension:256,colour:el('bbColour').checked,shape:el('bbShape').checked,side:el('bbSide').value};";
  batch=replace(batch,old,"const views=Array.from(el('bbPresetControls').querySelectorAll('input[data-preset]:checked'),input=>input.dataset.preset);const settings=Object.freeze({maxDimension:640,previewMaxDimension:640,views:Object.freeze(views),colour:views.length>0,shape:el('bbShape').checked,side:el('bbSide').value});");
  batch=replace(batch,"const palette=settings.colour?labQuantizedPalette(pixels.data,mask):null;","const palette=settings.views.includes('palette')?labQuantizedPalette(pixels.data,mask):null;");
  batch=replace(batch,"const previews={},mapping=","const previews={},appearances={},mapping=");
  batch=replace(batch,"for(const mode of settings.colour?['photo','palette','lightness','saturation']:['photo'])","for(const mode of settings.views)");
  batch=replace(batch,"256/Math.max(canvas.width,canvas.height)","settings.previewMaxDimension/Math.max(canvas.width,canvas.height)");
  batch=replace(batch,"previews[mode]=thumb.toDataURL('image/png');","previews[mode]=thumb.toDataURL('image/png');appearances[mode]=labAppearanceSummary(out.data,mask);");
  batch=replace(batch,":null,previews}}",":null,previews,appearances}}");
  batch=replace(batch,"Preview max dimension 256 px; analysis max dimension 640 px.","Preview and analysis max dimension 640 px.");
  batch=replace(batch,"schemaVersion:1,algorithmVersion:'library-image-batch-v1'","schemaVersion:2,algorithmVersion:'library-image-batch-v2'");
  batch=replace(batch,"};controls();\n})();","};\n"+runtime+"\ncontrols();\n})();");
  viewer=replace(viewer,"get('bbColour').closest('label')","get('bbPresetControls')");
  return {batch,viewer};
}
