const labGeometryPromise=import('./src/lab-geometry-analysis.mjs');
const geometryResults=[];
const geometryBox=document.createElement('fieldset');
geometryBox.id='bbGeometryControls';
geometryBox.append(Object.assign(document.createElement('legend'),{textContent:'GEOMETRY ANALYSIS'}));
const geometryInput=document.createElement('textarea');
geometryInput.id='bbGeometryInput';
geometryInput.rows='6';
geometryInput.placeholder='{ "units": "mm", "positions": [[x,y,z]], "indices": [[a,b,c]] }';
const geometryMessage=document.createElement('p');geometryMessage.id='bbGeometryMessage';
const geometryRun=document.createElement('button');geometryRun.type='button';geometryRun.textContent='ANALYSE GEOMETRY SNAPSHOT';
const geometryClear=document.createElement('button');geometryClear.type='button';geometryClear.textContent='CLEAR GEOMETRY RESULTS';
geometryBox.append(geometryInput,geometryRun,geometryClear,geometryMessage);
dialog.append(geometryBox);
geometryRun.onclick=async()=>{
  try{
    const core=await labGeometryPromise;
    const snapshot=JSON.parse(geometryInput.value);
    const positions=snapshot.positions;
    const indices=snapshot.indices;
    const validity=core.labMeshValidity(positions,indices);
    const area=core.labMeshArea(positions,indices);
    const volume=core.labMeshVolume(positions,indices);
    const normals=core.labMeshNormalsAndSlope(positions,indices);
    const curvature=core.labMeshCurvature(positions,indices);
    const crossSection=core.labMeshCrossSection(positions,indices,snapshot.crossSectionAxis||'y',Number(snapshot.crossSectionPosition||0));
    const record={
      status:'completed',
      source:'model_derived',
      methodVersion:core.LAB_GEOMETRY_ANALYSIS_VERSION,
      reviewState:'candidate',
      units:snapshot.units||'unspecified',
      geometrySnapshot:{positionCount:positions.length,triangleCount:indices.length},
      results:{validity,area,volume,normals,curvature,crossSection}
    };
    geometryResults.push(record);
    geometryMessage.textContent=`Geometry analysis completed (${geometryResults.length} snapshot result(s)).`;
  }catch(error){
    geometryMessage.textContent=`Geometry analysis failed: ${error.message}`;
  }
};
geometryClear.onclick=()=>{geometryResults.length=0;geometryMessage.textContent='Geometry results cleared.'};
function labGeometryCsvRows(){
  return geometryResults.map((record,index)=>[
    run.id,run.sourceRevision,'geometry-snapshot', 'Geometry snapshot', '', 'model', 'completed', '', 'geometry_analysis', `snapshot-${index+1}`, JSON.stringify(record), 'structured JSON'
  ]);
}
