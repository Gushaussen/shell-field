export function analyseTopology(points, triangles){
  const edges=new Map(),boundary=[],adj=new Map();
  let degenerate=0,nonFinite=0,inconsistent=0,nonManifold=0;
  let extent=0;for(let axis=0;axis<3;axis++){let lo=Infinity,hi=-Infinity;for(let i=axis;i<points.length;i+=3){if(!Number.isFinite(points[i]))nonFinite++;lo=Math.min(lo,points[i]);hi=Math.max(hi,points[i]);}extent=Math.max(extent,hi-lo);}
  const tolerance=Math.max(extent**4*1e-20,1e-30);
  for(let f=0;f<triangles.length;f+=3){
    const a=triangles[f],b=triangles[f+1],c=triangles[f+2];
    if(![a,b,c].every(i=>Number.isInteger(i)&&i>=0&&i<points.length/3))throw Error('Invalid triangle indices.');
    const u=[0,1,2].map(k=>points[b*3+k]-points[a*3+k]),v=[0,1,2].map(k=>points[c*3+k]-points[a*3+k]);
    const area=(u[1]*v[2]-u[2]*v[1])**2+(u[2]*v[0]-u[0]*v[2])**2+(u[0]*v[1]-u[1]*v[0])**2;
    if(a===b||b===c||a===c||!Number.isFinite(area)||area<=tolerance)degenerate++;
    for(const [x,y] of [[a,b],[b,c],[c,a]]){const key=Math.min(x,y)+','+Math.max(x,y);if(!edges.has(key))edges.set(key,[]);edges.get(key).push([x,y]);}
  }
  for(const uses of edges.values()){
    if(uses.length===1){const e=uses[0];boundary.push(e);for(const [a,b] of [e,[e[1],e[0]]]){if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}}
    else if(uses.length>2)nonManifold++;
    else if(uses[0][0]===uses[1][0])inconsistent++;
  }
  let loops=0;const seen=new Set();let branched=false;
  for(const [start,neighbours] of adj){if(neighbours.length!==2)branched=true;if(seen.has(start))continue;loops++;const stack=[start];while(stack.length){const n=stack.pop();if(seen.has(n))continue;seen.add(n);for(const next of adj.get(n)||[])if(!seen.has(next))stack.push(next);}}
  return{boundary,loops:branched?null:loops,degenerate,nonFinite,inconsistent,nonManifold,branched};
}
export function planClosure(points,triangles,pairs,upper){
  const report=analyseTopology(points,triangles);
  if(report.nonFinite||report.degenerate||report.nonManifold||report.inconsistent||report.branched)throw Error('Repair refused: existing degeneracy, winding, non-manifold edges, or branched boundaries need attention.');
  if(!report.boundary.length)throw Error('No open boundary edges to close.');
  if(!pairs||!upper||pairs.length!==points.length/3||upper.length!==pairs.length)throw Error('Known generated surface correspondence is required.');
  const directed=new Set(report.boundary.map(([a,b])=>a+','+b)),covered=new Set(),added=[];
  for(const [a,b] of report.boundary){
    const pa=pairs[a],pb=pairs[b];
    if(!Number.isInteger(pa)||!Number.isInteger(pb)||pa<0||pb<0||pairs[pa]!==a||pairs[pb]!==b||upper[pa]===upper[a]||upper[pb]===upper[b]||upper[a]!==upper[b])throw Error('Boundary correspondence is incomplete; closure refused.');
    if(!upper[a])continue;
    if(!directed.has(pb+','+pa))throw Error('Interior/exterior boundary winding does not correspond.');
    added.push(b,a,pa,b,pa,pb);covered.add(a+','+b);covered.add(pb+','+pa);
  }
  if(covered.size!==report.boundary.length)throw Error('Not all boundary edges could be paired.');
  const after=analyseTopology(points,[...triangles,...added]);
  if(after.boundary.length||after.degenerate||after.nonManifold||after.inconsistent||after.nonFinite)throw Error('Proposed closure failed topology checks; nothing was applied.');
  return added;
}
function installRepair(){
  let repairBackup=null,repairPreview=null,repairLines=null,repairPlan=null;
  const repairReport=el('mtRepairReport');
  function repairButtons(){for(const id of ['mtAnalyse','mtPreview','mtRecheck'])el(id).disabled=!mesh||stale||working;el('mtApplyClosure').disabled=!mesh||stale||working||!repairPlan;el('mtUndoClosure').disabled=!repairBackup||working;}
  function removeRepairObject(object){if(!object)return;object.removeFromParent();object.geometry.dispose();object.material.dispose();}
  function clearRepairPreview(){removeRepairObject(repairPreview);removeRepairObject(repairLines);repairPreview=null;repairLines=null;repairPlan=null;}
  function clearRepair(){clearRepairPreview();repairBackup?.dispose();repairBackup=null;repairReport.textContent='Generate a mesh, then analyse its boundaries.';}
  function repairData(){if(!mesh||working||stale)throw Error('Generate an up-to-date mesh first.');return{g:mesh.geometry,p:mesh.geometry.attributes.position.array,i:Array.from(mesh.geometry.index.array)};}
  function showRepairReport(report){repairReport.textContent=report.boundary.length.toLocaleString()+' open edges / '+(report.loops===null?'branched boundary graph':report.loops+' boundary loops')+' / '+report.nonManifold+' non-manifold edges / '+report.inconsistent+' winding conflicts / '+report.degenerate+' degenerate faces / '+report.nonFinite+' non-finite coordinates.\nChecks use indexed connectivity; coincident vertices are not welded. Vertex-manifoldness, self-intersections, thickness and printability are not certified.';}
  function analyseRepair(highlight=true){const {p,i}=repairData(),report=analyseTopology(p,i);showRepairReport(report);if(highlight){removeRepairObject(repairLines);const coords=[];for(const edge of report.boundary)for(const vertex of edge)coords.push(p[vertex*3],p[vertex*3+1],p[vertex*3+2]);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(coords,3));repairLines=new T.LineSegments(g,new T.LineBasicMaterial({color:0xff9500,depthTest:false}));repairLines.renderOrder=20;mesh.add(repairLines);}return report;}
  function repairAction(fn){try{fn();}catch(e){say(e.message);}finally{buttons();}}
  el('mtAnalyse').onclick=()=>repairAction(()=>{clearRepairPreview();analyseRepair();say('Open edges highlighted in orange. No mesh geometry changed.');});
  el('mtRecheck').onclick=()=>repairAction(()=>{analyseRepair();say('Topology rechecked. This is not a print-readiness certification.');});
  el('mtPreview').onclick=()=>repairAction(()=>{
    clearRepairPreview();const {g,p,i}=repairData(),added=planClosure(p,i,g.userData.mtPairs,g.userData.mtUpper);
    const preview=g.clone();preview.setIndex(added);preview.computeVertexNormals();repairPreview=new T.Mesh(preview,new T.MeshBasicMaterial({color:0xff9500,side:T.DoubleSide,transparent:true,opacity:.8,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.add(repairPreview);repairPlan={geometry:g,added};analyseRepair();say('Orange faces preview perimeter bridges, including walls around sampled holes. Preview is not exported. Apply to include closure in exports.');
  });
  el('mtApplyClosure').onclick=()=>repairAction(()=>{
    const {g,p,i}=repairData();if(!repairPlan||repairPlan.geometry!==g)throw Error('Preview closure first.');
    const added=planClosure(p,i,g.userData.mtPairs,g.userData.mtUpper),next=g.clone();next.setIndex([...i,...added]);next.computeVertexNormals();
    clearRepairPreview();repairBackup?.dispose();repairBackup=g;mesh.geometry=next;analyseRepair();summary();say('Shell-edge bridges applied and included in exports. Studio data is unchanged. Undo closure restores the previous mesh; pose is preserved.');
  });
  el('mtUndoClosure').onclick=()=>repairAction(()=>{if(!repairBackup)return;clearRepairPreview();const current=mesh.geometry;mesh.geometry=repairBackup;repairBackup=null;current.dispose();if(!stale)analyseRepair();else repairReport.textContent='Closure undone. Recompute required for current settings.';summary();say('Closure undone. Current pose preserved.');});
}
export function addMeshRepair(source){
  function patch(a,b){if(!source.includes(a))throw Error('Mesh repair build anchor missing: '+a);source=source.replace(a,b);}
  patch('<section><h2>03 / INSPECT</h2>',`<section><h2>03 / MESH REPAIR &amp; CLOSURE</h2><div class="mtRow"><button id="mtAnalyse">ANALYSE BOUNDARIES</button><button id="mtPreview">PREVIEW EDGE CLOSURE</button><button id="mtApplyClosure" disabled>APPLY CLOSURE</button><button id="mtUndoClosure" disabled>UNDO CLOSURE</button><button id="mtRecheck">RECHECK MESH</button></div><p class="mtNote">Connect corresponding interior/exterior edges with triangle walls. No bowl cap, smoothing, or arbitrary hole filling. Sampled hole boundaries get walls, not caps. Preview is orange and excluded from exports until applied. Recomputing discards closure.</p><p id="mtRepairReport" class="mtNote" role="status">Generate a mesh, then analyse its boundaries.</p></section><section><h2>04 / INSPECT</h2>`);
  patch('04 / ORIENTATION','05 / ORIENTATION');patch('05 / EXPORT','06 / EXPORT');
  patch('Interior and exterior remain separate. No rim wall or automatic hole filling. Quads, diamonds, closed shells and imported unstructured clouds are not included in this prototype.','Generated surfaces start open. Optional edge closure is available below. No adaptive remeshing, quads, diamonds, or unstructured-cloud import.');
  patch('GENERATE MESH</button>','RECOMPUTE MESH</button>');
  patch('Open surfaces are not print-ready solids.','Neither open nor edge-closed meshes are certified print-ready.');
  patch("el('mtUndo').disabled=!mesh||!poses.length||working}","el('mtUndo').disabled=!mesh||!poses.length||working;repairButtons()}");
  patch("'OPEN SURFACES · NOT VALIDATED FOR PRINTING'","(repairBackup?'EDGE CLOSURE APPLIED · NOT PRINT-CERTIFIED':'OPEN SURFACES · NOT PRINT-CERTIFIED')");
  patch('geometry.setIndex(faces);geometry.computeVertexNormals();if(mesh)', 'geometry.setIndex(faces);geometry.userData.mtPairs=Array.from(remap.keys(),i=>remap.get(i^1)??-1);geometry.userData.mtUpper=Array.from(remap.keys(),i=>i%2===0);geometry.computeVertexNormals();clearRepair();if(mesh)');
  patch("el('mtBudget').oninput=()=>{","el('mtBudget').oninput=()=>{clearRepairPreview();");
  patch('source=positions;stale=true;','source=positions;stale=true;clearRepairPreview();');
  patch('Open surfaces, not a print-ready solid.','Not certified print-ready; inspect exported geometry.');
  patch('millimetre coordinates | open surfaces','millimetre coordinates | not print-certified');
  const core=analyseTopology.toString()+'\n'+planClosure.toString();
  const ui=installRepair.toString();
  patch('\nbuttons();\n})();','\n'+core+'\n'+ui.slice(ui.indexOf('{')+1,ui.lastIndexOf('}'))+'\nbuttons();\n})();');
  return source;
}
