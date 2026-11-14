(() => {
  const studio = document.querySelector('main');
  if (!studio || document.getElementById('shellToolBar')) return;
  const tools = [
    {id:'studio', number:'01', label:'Photo-based Point Cloud Studio'},
    {id:'mesh', number:'02', label:'Mesh Translator'},
    {id:'data', number:'03', label:'Data Extraction Lab'},
    {id:'diagrams', number:'04', label:'Complex Diagram Creator'}
  ];
  const style = document.createElement('style');
  style.textContent = `
    :root{--shell-toolbar-height:110px}
    #shellToolBar{position:relative;z-index:1300;background:var(--panel,#fff);color:var(--text,#0648ff);border-bottom:1px solid var(--l,#dce5ff);padding:12px 16px 0}
    #shellToolBar .shell-tool-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}
    #shellToolBar .shell-tool-brand{font-size:13px;letter-spacing:3px;font-weight:700;text-decoration:none;color:var(--text,#0648ff)}
    #shellToolBar .shell-tool-links{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;scrollbar-width:thin}
    #shellToolBar .shell-tool-link{display:flex;align-items:center;gap:9px;flex:1 0 auto;padding:11px 13px;border:1px solid var(--l,#dce5ff);border-radius:12px;background:var(--panel,#fff);color:var(--text,#0648ff);text-decoration:none;font-size:10px;letter-spacing:.5px;transition:background .16s ease,transform .16s ease}
    #shellToolBar .shell-tool-number{font-size:11px;font-weight:700}
    #shellToolBar .shell-tool-link:hover{background:var(--soft,#edf2ff);transform:translateY(-1px)}
    #shellToolBar .shell-tool-link[aria-current=page]{background:var(--b,#0648ff);color:var(--on-accent,#fff);border-color:var(--b,#0648ff)}
    #shellToolBar .shell-tool-link:active{transform:scale(.98)}
    #shellToolBar a:focus-visible{outline:2px solid var(--b,#0648ff);outline-offset:2px}
    #shellToolBar label{margin:0}
    #shellToolBar select{max-width:230px}
    body[data-shell-tool] main{height:calc(100vh - var(--shell-toolbar-height));height:calc(100dvh - var(--shell-toolbar-height))}
    body[data-shell-tool] #sectionNav{top:calc(var(--shell-toolbar-height) + 12px)}
    body[data-shell-tool]:not([data-shell-tool=studio]) #sectionNav{display:none!important}
    body[data-shell-tool] main[hidden],.shell-tool-page[hidden]{display:none!important}
    .shell-tool-page{margin:0;padding:clamp(24px,6vw,80px);min-height:calc(100vh - var(--shell-toolbar-height));background:var(--page,#fff);color:var(--text,#0648ff);border:0}
    .shell-tool-page .shell-tool-placeholder{max-width:760px;padding:clamp(24px,5vw,56px);border:1px solid var(--l,#dce5ff);border-radius:20px;background:var(--panel,#fff)}
    .shell-tool-page .shell-tool-kicker{font-size:10px;letter-spacing:2px;margin:0 0 20px}
    .shell-tool-page h1{font-size:clamp(24px,4vw,44px);letter-spacing:0;line-height:1.15;margin:0 0 20px}
    .shell-tool-page p{max-width:520px;font-size:13px;line-height:1.7}
    .shell-tool-page .shell-tool-status{display:inline-block;border:1px solid var(--l,#dce5ff);border-radius:20px;padding:7px 11px;font-size:10px;letter-spacing:1px}
    @media(max-width:650px){body[data-shell-tool] main{height:auto}#shellToolBar{padding:10px 12px 0}#shellToolBar .shell-tool-brand{font-size:11px}#shellToolBar select{max-width:180px}#shellToolBar .shell-tool-link{flex:0 0 auto;font-size:9px;padding:10px}.shell-tool-page{padding:20px 12px}}
    @media(prefers-reduced-motion:reduce){#shellToolBar .shell-tool-link{transition:none;transform:none!important}}
  `;
  document.head.append(style);
  const bar = document.createElement('header');
  bar.id = 'shellToolBar';
  const heading = document.createElement('div');
  heading.className = 'shell-tool-heading';
  const brand = document.createElement('a');
  brand.className = 'shell-tool-brand';
  brand.href = '#studio';
  brand.textContent = 'SHELL FIELD';
  heading.append(brand);
  const theme = document.getElementById('themeChoice')?.closest('label');
  if (theme) heading.append(theme);
  const navigation = document.createElement('nav');
  navigation.className = 'shell-tool-links';
  navigation.setAttribute('aria-label','Shell Field tools');
  bar.append(heading,navigation);
  document.body.prepend(bar);
  const pages = new Map([['studio',studio]]);
  const links = new Map();
  for (const tool of tools) {
    const link = document.createElement('a');
    link.className = 'shell-tool-link';
    link.href = '#'+tool.id;
    const number = document.createElement('span');
    number.className = 'shell-tool-number';
    number.textContent = tool.number;
    const label = document.createElement('span');
    label.textContent = tool.label;
    link.append(number,label);
    navigation.append(link);
    links.set(tool.id,link);
    if (tool.id === 'studio') continue;
    const page = document.createElement('main');
    page.className = 'shell-tool-page';
    page.hidden = true;
    page.id = 'shell-tool-'+tool.id;
    const card = document.createElement('div');
    card.className = 'shell-tool-placeholder';
    const kicker = document.createElement('p');
    kicker.className = 'shell-tool-kicker';
    kicker.textContent = 'SHELL FIELD / TOOL '+tool.number;
    const title = document.createElement('h1');
    title.id = 'shell-tool-title-'+tool.id;
    title.textContent = tool.label;
    page.setAttribute('aria-labelledby',title.id);
    const status = document.createElement('span');
    status.className = 'shell-tool-status';
    status.textContent = 'COMING NEXT';
    const description = document.createElement('p');
    description.textContent = 'This workspace is reserved for the '+tool.label+'. Its tools are not implemented yet. You can return to the Point Cloud Studio without clearing your current workspace.';
    card.append(kicker,title,status,description);
    page.append(card);
    studio.after(page);
    pages.set(tool.id,page);
  }
  function measureBar(){document.documentElement.style.setProperty('--shell-toolbar-height',bar.getBoundingClientRect().height+'px')}
  new ResizeObserver(measureBar).observe(bar);
  measureBar();
  function activate(){
    const requested = location.hash.slice(1);
    const id = pages.has(requested) ? requested : 'studio';
    document.body.dataset.shellTool = id;
    for (const [key,page] of pages) page.hidden = key !== id;
    for (const [key,link] of links) {
      if (key === id) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    document.title = 'Shell Field / '+tools.find(tool=>tool.id===id).label;
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  window.addEventListener('hashchange',activate);
  activate();
})();
