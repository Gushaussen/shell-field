class LabStockSelector {
  constructor(host, get) {
    this.host=host;
    host.innerHTML='<div class="labPaneHeading"><h2 id="labStockTitle">STOCK SELECTION</h2><span>LAB STOCK SELECTOR</span></div><div id="labLibraryStock" class="labStockBody"></div><div id="labStudioStock" class="labStockBody" hidden></div>';
    host.setAttribute('aria-labelledby','labStockTitle');
    this.library=get('labLibraryStock');this.studio=get('labStudioStock');
    this.library.append(get('bbKey').closest('.bbRow'),get('dlBatchRecords'));
    for(const node of [get('dlSide').closest('label'),get('dlCopy'),get('dlName').closest('label'),get('dlSpecies').closest('label'),get('dlSourceInfo')])this.studio.append(node);
    const note=document.createElement('p');note.className='labPaneNote';note.textContent='Read-only saved stock. Select specimens above, then run extraction using the left controls. Cards show saved metadata; photographs appear after analysis.';this.library.append(note);
  }
  setMode(mode){this.library.hidden=mode!=='library';this.studio.hidden=mode!=='studio'}
}
