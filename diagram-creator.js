import{buildChartSpec,buildDiagramRows,diagramProvenance,numericQuantities,parseBatchJson}from'./src/diagram-data.mjs';
const $=id=>document.getElementById(id);
const aside=document.querySelector('aside');
if(!aside)throw Error('Shell Field sidebar not found');
const section=document.createElement('section');
section.id='diagramCreator';
section.innerHTML=`
<h2>06 / DIAGRAM CREATOR</h2>
<label class="upload">LIBRARY BATCH JSON<input id="dcBatch" type="file" accept="application/json,.json"></label>
<label>DATA SOURCE<select id="dcSource"><option value="metric">SHELL METRICS</option><option value="palette">COLOUR COVERAGE</option><option value="image_vertical_width">WIDTH PROFILE</option></select></label>
<label>DIAGRAM TYPE<select id="dcChart"><option value="bar">BAR</option><option value="strip">STRIP</option><option value="box">BOX</option><option value="violin">VIOLIN</option><option value="hist">HISTOGRAM</option><option value="kde">KDE</option><option value="scatter">SCATTER</option><option value="line">LINE</option><option value="heatmap">HEATMAP</option><option value="correlation">CORRELATION</option></select></label>
<label>X / GROUP<select id="dcX"></select></label>
<label>Y / VALUE<select id="dcY"></select></label>
<label>COLOUR / SERIES<select id="dcHue"><option value="">NONE</option></select></label>
<label>SECOND METRIC<select id="dcSecond"><option value="">NONE</option></select></label>
<label>TITLE<input id="dcTitle" maxlength="180" value="Shell Field library diagram"></label>
<div class="row"><button id="dcGenerate" class="primary" disabled>GENERATE DIAGRAM</button><button id="dcDownload" disabled>DOWNLOAD</button></div>
<img id="dcImage" alt="Generated Shell Field library diagram" hidden>
<p id="dcMessage" class="note">Load a completed Library Batch JSON to create a library-derived visual artifact.</p>
`;
aside.append(section);
let batch=null,rows=[],objectUrl='';
function message(text){$('dcMessage').textContent=text}
function options(select,values,current){select.replaceChildren(new Option('NONE',''));for(const value of values)select.add(new Option(String(value).toUpperCase(),value));if(current&&values.includes(current))select.value=current}
function refreshControls(){
  const source=$('dcSource').value,chart=$('dcChart').value;
  if(source==='metric'){
    options($('dcX'),['species','side','name','specimenId'],'species');
    options($('dcY'),numericQuantities(rows,'metric'),'area');
    options($('dcHue'),['species','side','name','specimenId'],'');
    options($('dcSecond'),numericQuantities(rows,'metric'),'');
  }else if(source==='palette'){
    options($('dcX'),['quantity','side','species','name','specimenId'],'quantity');
    options($('dcY'),['value'],'value');
    options($('dcHue'),['quantity','side','species','name','specimenId'],'');
    options($('dcSecond'),[],'');
  }else{
    options($('dcX'),['fraction'],'fraction');
    options($('dcY'),['value'],'value');
    options($('dcHue'),['name','species','side','specimenId'],'name');
    options($('dcSecond'),[],'');
  }
  $('dcSecond').closest('label').hidden=source!=='metric'||!['scatter','line','heatmap','correlation'].includes(chart);
  $('dcGenerate').disabled=!batch;
}
$('dcBatch').onchange=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  try{
    const parsed=parseBatchJson(JSON.parse(await file.text()));
    batch=parsed;rows=buildDiagramRows(parsed);
    message(`Loaded ${rows.length} library-derived records from ${parsed.results.length} analysed result(s).\n\n${diagramProvenance(parsed)}`);
    refreshControls();
  }catch(error){batch=null;rows=[];$('dcGenerate').disabled=true;message('Could not load diagram source: '+error.message)}
};
['dcSource','dcChart'].forEach(id=>$(id).onchange=refreshControls);
$('dcGenerate').onclick=async()=>{
  if(!batch)return;
  try{
    const spec=buildChartSpec({rows,sourceType:$('dcSource').value,chart:$('dcChart').value,x:$('dcX').value,y:$('dcY').value,hue:$('dcHue').value,secondMetric:$('dcSecond').value,title:$('dcTitle').value,format:'png',palette:'cobalt'});
    $('dcGenerate').disabled=true;message('Generating seaborn diagram…');
    const response=await fetch('/api/diagram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({spec,data:rows,provenance:diagramProvenance(batch)})});
    if(!response.ok){let detail='Diagram generation failed';try{detail=(await response.json()).error||detail}catch{}throw Error(detail)}
    const blob=await response.blob();
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    objectUrl=URL.createObjectURL(blob);
    $('dcImage').src=objectUrl;$('dcImage').hidden=false;
    $('dcDownload').disabled=false;
    message('Diagram generated. It is a library-derived visual artifact, not a physical or biological measurement.');
  }catch(error){message(error.message)}
  finally{$('dcGenerate').disabled=!batch}
};
$('dcDownload').onclick=()=>{if(!objectUrl)return;const link=document.createElement('a');link.href=objectUrl;link.download='shell-field-library-diagram.png';link.click()};
