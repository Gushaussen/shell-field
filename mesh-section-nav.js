(() => {
  const page=document.getElementById('shell-tool-mesh'),panel=document.getElementById('mtControls');
  if(!page||!panel||document.getElementById('meshSectionNav'))return;
  const icons={
    source:'<circle cx="5" cy="7" r="1"/><circle cx="10" cy="5" r="1"/><circle cx="5" cy="13" r="1"/><circle cx="10" cy="11" r="1"/><circle cx="7" cy="19" r="1"/><path d="M14 12h7m-3-3 3 3-3 3"/>',
    mesh:'<path d="M3 18 8 4l13 14H3ZM8 4l4 14m-9 0 12-7m-3 7 3-7"/>',
    repair:'<path d="M14 5a5 5 0 0 0-6 6L3 16a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-3-3 3-3Z"/>',
    inspect:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',
    orientation:'<path d="M20 8a8 8 0 0 0-13-3L4 8m0-5v5h5M4 16a8 8 0 0 0 13 3l3-3m0 5v-5h-5"/><path d="m12 8 3 5-6 1 3-6Z"/>',
    export:'<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>'
  };
  const targets=[['01 / SOURCE','Source','source'],['02 / TRIANGLE MESH','Triangle Mesh','mesh'],['03 / MESH REPAIR & CLOSURE','Mesh Repair & Closure','repair'],['04 / INSPECT','Inspect','inspect'],['05 / ORIENTATION','Orientation','orientation'],['06 / EXPORT','Export','export']];
  const sections=[...panel.querySelectorAll('section')];
  const normalize=text=>text.replace(/\s+/g,' ').trim().toUpperCase();
  const rail=document.createElement('nav');rail.id='meshSectionNav';rail.setAttribute('aria-label','Mesh Translator sections');
  const entries=[];
  function targetTop(section){return Math.max(0,section.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-12)}
  for(const [key,name,icon] of targets){
    const section=sections.find(item=>normalize(item.querySelector('h2')?.textContent||'')===key);
    if(!section)continue;
    const button=document.createElement('button');button.type='button';button.className='mesh-section-nav-button';button.title=name;button.setAttribute('aria-label',name);
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[icon]+'</svg>';
    const tip=document.createElement('span');tip.className='mesh-nav-tip';tip.textContent=name;button.append(tip);
    button.onclick=()=>panel.scrollTo({top:targetTop(section),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    rail.append(button);entries.push({section,button});
  }
  if(!entries.length)return;
  const style=document.createElement('style');style.textContent=`
#meshSectionNav{position:fixed;left:8px;top:calc(var(--shell-toolbar-height,60px) + 12px);bottom:12px;z-index:1200;display:none;flex-direction:column;justify-content:center;gap:10px;width:44px;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;pointer-events:none}
body[data-shell-tool=mesh] #meshSectionNav{display:flex}
#meshSectionNav[hidden]{display:none!important}
#meshSectionNav .mesh-section-nav-button{position:relative;display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;margin:0!important;border:1px solid var(--b)!important;border-radius:10px!important;background:var(--panel,#fff)!important;color:var(--b)!important;cursor:pointer!important;pointer-events:auto!important;font-style:normal!important;transform:none!important;box-shadow:none!important;transition:transform .16s ease,background .16s ease,color .16s ease!important}
#meshSectionNav .mesh-section-nav-button::before,#meshSectionNav .mesh-section-nav-button::after{display:none!important}
#meshSectionNav .mesh-section-nav-button svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.7!important;stroke-linecap:round!important;stroke-linejoin:round!important}
#meshSectionNav .mesh-section-nav-button:hover{transform:scale(1.08)!important;background:var(--soft,#edf2ff)!important}
#meshSectionNav .mesh-section-nav-button.active{background:var(--b)!important;color:var(--on-accent,#fff)!important;border-color:var(--b)!important;transform:scale(1.06)!important}
#meshSectionNav .mesh-section-nav-button:active{transform:scale(.92)!important}
#meshSectionNav .mesh-section-nav-button:focus-visible{outline:2px solid var(--b)!important;outline-offset:2px!important}
#meshSectionNav .mesh-nav-tip{position:absolute;left:calc(100% + 8px);top:50%;translate:0 -50%;padding:4px 8px;border-radius:7px;background:var(--b);color:var(--on-accent,#fff);font:700 11px/1.4 Arial,sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .16s ease}
#meshSectionNav .mesh-section-nav-button:hover .mesh-nav-tip,#meshSectionNav .mesh-section-nav-button:focus-visible .mesh-nav-tip{opacity:1}
@media(max-width:800px){#meshSectionNav{display:none!important}}
@media(prefers-reduced-motion:reduce){#meshSectionNav .mesh-section-nav-button,#meshSectionNav .mesh-nav-tip{transition:none!important}}
`;
  document.head.append(style);document.body.prepend(rail);
  function update(){
    rail.hidden=page.hidden||document.body.dataset.shellTool!=='mesh';
    if(rail.hidden)return;
    const maxScroll=Math.max(0,panel.scrollHeight-panel.clientHeight);
    let active=entries[0];
    if(maxScroll>4&&panel.scrollTop>=maxScroll-4)active=entries[entries.length-1];
    else{const line=panel.getBoundingClientRect().top+Math.min(140,panel.clientHeight*.28);for(const entry of entries)if(entry.section.getBoundingClientRect().top<=line)active=entry;}
    for(const entry of entries){const current=entry===active;entry.button.classList.toggle('active',current);if(current)entry.button.setAttribute('aria-current','location');else entry.button.removeAttribute('aria-current');}
  }
  let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})}
  panel.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('hashchange',schedule);
  new MutationObserver(schedule).observe(page,{attributes:true,attributeFilter:['hidden']});
  new ResizeObserver(schedule).observe(panel);update();
})();
