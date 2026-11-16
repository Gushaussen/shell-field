const CHARTS = new Set(['bar','strip','box','violin','hist','kde','scatter','line','heatmap','correlation']);
const METRICS = new Set(['area','boundary','width','height','aspect','holes']);
function finite(value){return typeof value==='number'&&Number.isFinite(value)}
function text(value){return String(value??'').slice(0,200)}
export function parseBatchJson(input){
  if(!input||typeof input!=='object')throw Error('Diagram source must be a Library Batch JSON object');
  if(input.schemaVersion!==1)throw Error('Unsupported Library Batch schema');
  if(!Array.isArray(input.results))throw Error('Library Batch results are missing');
  return input;
}
export function buildDiagramRows(batch){
  const parsed=parseBatchJson(batch);
  const rows=[];
  for(const job of parsed.results){
    if(!job||typeof job!=='object')continue;
    const base={batchId:text(parsed.id),libraryRevision:text(parsed.sourceRevision),specimenId:text(job.id),name:text(job.name||job.id),species:text(job.species||'unidentified'),side:text(job.side),status:text(job.status),error:text(job.error||'')};
    if(job.metrics&&typeof job.metrics==='object'){
      for(const key of METRICS){
        const value=job.metrics[key];
        if(!finite(value))continue;
        rows.push({...base,recordType:'metric',quantity:key,value,unit:key==='area'?text(job.metrics.unit||'')+'2':['boundary','width','height'].includes(key)?text(job.metrics.unit||''):'dimensionless'});
      }
    }
    if(Array.isArray(job.palette?.colors)){
      for(const colour of job.palette.colors){
        if(!colour||!finite(colour.coverage))continue;
        rows.push({...base,recordType:'palette',quantity:text(colour.hex||'unknown'),value:100*colour.coverage,unit:'% of masked analysis pixels'});
      }
    }
    if(Array.isArray(job.widthProfile)){
      for(const point of job.widthProfile){
        if(!point||!finite(point.fraction)||!finite(point.width))continue;
        rows.push({...base,recordType:'image_vertical_width',quantity:'width',value:point.width,unit:text(point.unit||''),fraction:point.fraction});
      }
    }
  }
  if(!rows.length)throw Error('No diagram-ready metric, palette, or width-profile records were found');
  return rows;
}
export function numericQuantities(rows,recordType){
  const values=new Set();
  for(const row of rows)if(row.recordType===recordType&&finite(row.value))values.add(row.quantity);
  return [...values].sort();
}
export function buildChartSpec(settings){
  const chart=String(settings.chart||'');
  if(!CHARTS.has(chart))throw Error('Unsupported diagram type');
  const rows=settings.rows;
  if(!Array.isArray(rows)||!rows.length)throw Error('Select at least one diagram-ready record');
  if(rows.length>20000)throw Error('Diagram input exceeds the 20,000-record limit');
  const sourceType=String(settings.sourceType||'');
  if(!['metric','palette','image_vertical_width'].includes(sourceType))throw Error('Choose a diagram data source');
  const filtered=rows.filter(row=>row.recordType===sourceType);
  if(!filtered.length)throw Error('No records available for the selected data source');
  let x=settings.x||'',y=settings.y||'',hue=settings.hue||'';
  if(sourceType==='metric'){
    if(!METRICS.has(y))throw Error('Choose a numeric library metric');
    if(!['species','side','name','specimenId'].includes(x))throw Error('Choose a grouping field');
    if(hue&&!['species','side','name','specimenId'].includes(hue))throw Error('Choose a valid colour field');
  }else if(sourceType==='palette'){
    y='value';x=x||'quantity';
    if(!['quantity','side','species','name','specimenId'].includes(x))throw Error('Choose a valid palette grouping field');
    if(hue&&!['quantity','side','species','name','specimenId'].includes(hue))throw Error('Choose a valid palette colour field');
  }else{
    x='fraction';y='value';
    if(!['name','species','side','specimenId'].includes(hue))throw Error('Choose a width-profile grouping field');
  }
  if(['scatter','line','heatmap','correlation'].includes(chart)&&sourceType==='metric'&&!settings.secondMetric)throw Error('Choose a second metric for this diagram type');
  return {chart,sourceType,x,y,hue,title:String(settings.title||'Shell Field library diagram').slice(0,180),xLabel:String(settings.xLabel||x).slice(0,120),yLabel:String(settings.yLabel||y).slice(0,120),palette:String(settings.palette||'cobalt').slice(0,40),format:settings.format==='svg'?'svg':'png',secondMetric:sourceType==='metric'?String(settings.secondMetric||''):''};
}
export function diagramProvenance(batch){
  const parsed=parseBatchJson(batch);
  return `Library-derived visual artifact — batch ${text(parsed.id||'unknown').slice(0,36)} at library revision ${text(parsed.sourceRevision||'unknown').slice(0,12)}; image-derived analysis; uncalibrated photographic colour; no perspective correction.`;
}
