class LabExtractionViewer {
  constructor(host,get){
    host.innerHTML='<div class="labPaneHeading"><h2 id="labExtractionTitle">DATA EXTRACTION</h2><span id="labExtractionContext">LIBRARY RESULTS</span></div><div id="labLibraryResults" class="labResultsBody"></div><div id="labStudioResults" class="labResultsBody" hidden></div>';
    host.setAttribute('aria-labelledby','labExtractionTitle');this.library=get('labLibraryResults');this.studio=get('labStudioResults');
    this.library.append(get('bbProgress'),get('dlBatchMessage'),get('bbSort').closest('.bbRow'),get('dlBatchTableWrap'),get('dlBatchInspector'));
    this.studio.append(get('dlView'));
    get('bbRows').addEventListener('click',event=>{if(event.target.closest('button'))requestAnimationFrame(()=>get('dlBatchInspector').scrollIntoView({block:'nearest',behavior:'auto'}))});
  }
  setMode(mode){this.library.hidden=mode!=='library';this.studio.hidden=mode!=='studio';document.getElementById('labExtractionContext').textContent=mode==='library'?'LIBRARY RESULTS':'STUDIO SNAPSHOT'}
}
(() => {
  const get=id=>document.getElementById(id),layout=get('dlLayout'),dialog=get('dlBatchDialog');if(!layout||!dialog||get('labWorkspace'))return;
  const controls=get('dlControls'),sections=[...controls.querySelectorAll('section')];
  const workspace=document.createElement('div');workspace.id='labWorkspace';
  const stockHost=document.createElement('section'),resultHost=document.createElement('section');stockHost.id='labStockPane';resultHost.id='labExtractionPane';stockHost.className=resultHost.className='labPane';workspace.append(stockHost,resultHost);layout.append(workspace);
  const stock=new LabStockSelector(stockHost,get),viewer=new LabExtractionViewer(resultHost,get);
  const batchSource=document.createElement('div');batchSource.className='labBatchSource';
  batchSource.append(get('bbSide').closest('label'),get('bbRun'),get('bbCancel'));sections[0].append(batchSource);
  const batchColour=document.createElement('div');batchColour.append(get('bbColour').closest('label'),get('bbView'));sections[1].append(batchColour);get('bbView').setAttribute('aria-label','Batch extraction image view');
  const batchShape=document.createElement('div');batchShape.append(get('bbShape').closest('label'));sections[2].append(batchShape);
  const batchExports=document.createElement('div');batchExports.append(get('bbJson'),get('bbCsv'),get('bbPng'));sections[4].append(batchExports);
  const studioButton=document.createElement('button');studioButton.type='button';studioButton.textContent='STUDIO PHOTO';get('dlBatchOpen').textContent='LIBRARY STOCK';get('dlBatchOpen').after(studioButton);
  const studioOnly=[get('dlRun'),get('dlMode').closest('label'),get('dlPalette'),get('dlColourInfo'),get('dlMetrics'),get('dlJson'),get('dlCsv'),get('dlPng'),sections[3]];
  const batchOnly=[batchSource,batchColour,batchShape,batchExports];
  function activate(mode){layout.dataset.labMode=mode;stock.setMode(mode);viewer.setMode(mode);for(const node of studioOnly)node.hidden=mode!=='studio';for(const node of batchOnly)node.hidden=mode!=='library';get('dlBatchOpen').setAttribute('aria-pressed',String(mode==='library'));studioButton.setAttribute('aria-pressed',String(mode==='studio'));const annotationNav=get('dlNav')?.querySelectorAll('button')[3];if(annotationNav)annotationNav.hidden=mode!=='studio'}
  get('dlBatchOpen').onclick=()=>activate('library');studioButton.onclick=()=>activate('studio');
  // The batch controller still resolves legacy controls by document ID.
  // Retain its non-presentational nodes while visible controls live in the panes.
  dialog.hidden=true;
  dialog.style.display='none';
  dialog.setAttribute('aria-hidden','true');
  const style=document.createElement('style');style.textContent=`
#dlLayout #labWorkspace{display:grid;grid-template-rows:minmax(0,1fr) minmax(0,1fr);gap:14px;min-width:0;min-height:0;height:100%}
#labWorkspace .labPane{display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;padding:0;border:1px solid var(--l);border-radius:17px;background:var(--panel)}
#labWorkspace .labPaneHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;border-bottom:1px solid var(--l);flex-shrink:0}
#labWorkspace h2{margin:0;font-size:11px;letter-spacing:1px}
#labWorkspace .labPaneHeading span{font-size:9px;letter-spacing:.7px;opacity:.65}
#labWorkspace .labStockBody,#labWorkspace .labResultsBody{min-height:0;overflow:auto;padding:12px 18px;flex:1}
#labWorkspace [hidden],#dlControls [hidden],#dlNav button[hidden]{display:none!important}
#labWorkspace .bbRow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#labWorkspace button{padding:9px 12px!important;border:1px solid var(--b)!important;border-radius:9px!important;color:var(--text)!important;background:var(--panel)!important;font-style:normal!important;min-height:34px;margin:3px}
#labWorkspace button:hover{background:var(--soft)!important}
#labWorkspace button:focus-visible{outline:2px solid var(--b)!important;outline-offset:2px!important}
#labWorkspace button:disabled{opacity:.4}
#labWorkspace input,#labWorkspace select{padding:8px;max-width:100%;border:1px solid var(--l);border-radius:7px;background:var(--panel);color:var(--text)}
#labWorkspace #dlBatchRecords{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-height:none;overflow:visible;margin:12px 0;padding:0;border:0}
#labWorkspace #dlBatchRecords label{display:flex;align-items:flex-start;gap:9px;margin:0;padding:15px 10px;min-height:85px;border:1px solid var(--l);border-radius:11px;overflow-wrap:anywhere;cursor:pointer;font-size:10px;line-height:1.6}
#labWorkspace #dlBatchRecords label:has(input:checked){border-color:var(--b);background:var(--soft)}
#labWorkspace #dlBatchRecords input{width:auto;flex-shrink:0;margin-top:2px}
#labWorkspace .labPaneNote{font-size:10px;opacity:.7;margin:8px 0}
#labWorkspace #dlView{border:0;padding:0;border-radius:0;overflow:visible}
#labWorkspace #dlCanvas{max-height:40vh}
#labWorkspace #dlProfile{height:85px}
#labWorkspace #dlBatchTableWrap{overflow:auto}
#labWorkspace table{width:100%;border-collapse:collapse;font-size:10px}
#labWorkspace td,#labWorkspace th{text-align:left;padding:10px;border-bottom:1px solid var(--l);vertical-align:top;overflow-wrap:anywhere}
#labWorkspace .bbSwatch{display:inline-block;width:18px;height:18px;margin:2px;border:1px solid var(--l)}
#labWorkspace #dlBatchImage{display:block;max-width:100%;max-height:35vh;margin:12px auto}
#labWorkspace #dlBatchMessage{white-space:pre-wrap;overflow-wrap:anywhere}
#labWorkspace progress{width:100%;height:7px}
#labStudioStock{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start}
#labStudioStock label{margin:0}
#labStudioStock label select,#labStudioStock label input{display:block;width:100%;margin-top:5px}
#labStudioStock #dlSourceInfo{grid-column:1/-1}
@media(max-width:800px){#dlLayout #labWorkspace{height:auto;grid-template-rows:360px minmax(400px,auto)}#labWorkspace #labExtractionPane{max-height:80vh}#labStudioStock{grid-template-columns:1fr}}
`;document.head.append(style);activate('library');
})();
