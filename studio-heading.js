(() => {
  const studio = document.querySelector('main:not(.shell-tool-page)');
  if (!studio) return;
  const sidebar = studio.querySelector('aside');
  const label = sidebar && [...sidebar.children].find(node => node.textContent.trim().toUpperCase().includes('PHOTO-BASED POINT CLOUD STUDIO') && !node.querySelector('section'));
  if (label) {
    const heading = document.createElement('h1');
    heading.id = 'studioWorkspaceTitle';
    heading.textContent = 'PHOTO-BASED POINT CLOUD STUDIO / 01';
    label.replaceWith(heading);
    studio.setAttribute('aria-labelledby', heading.id);
  }
  const badge = studio.querySelector('.work > header .badge');
  if (badge) {
    badge.textContent = 'ML-Based Simplified Photogrammetry / Approximate Geometry';
    badge.classList.add('studio-geometry-tagline');
  }
  const primaryColor = studio.querySelector('#cobalt');
  if (primaryColor) {
    const textNodes = [...primaryColor.childNodes].filter(node => node.nodeType === 3);
    if (textNodes.length) textNodes.forEach((node,index) => {node.textContent = index === 0 ? 'PRIMARY COLOR' : ''});
    else primaryColor.append(document.createTextNode('PRIMARY COLOR'));
    primaryColor.setAttribute('aria-label','Primary Color');
  }
  const formLabels = [
    ['dome','BOWL DEPTH SCALE','Scales estimated bowl depth together with Bowl Depth. 40% is the neutral scale; higher values deepen the bowl rather than broaden its bottom.'],
    ['rimround','BOWL BOTTOM FULLNESS','Higher values broaden the region near maximum estimated depth and steepen its rise toward the boundary. Does not increase maximum fallback depth.'],
    ['deeppos','DEPTH EMPHASIS POSITION','Biases the depth-generating influence along the selected base-tip axis. Negative favours the base; positive favours the tip. The outline also affects the deepest location.'],
    ['tiplean','BASE–TIP DEPTH BIAS','Adds a lengthwise depth bias. Negative favours the base; positive favours the tip. Does not physically rotate the shell or move its outline.'],
    ['crossround','CROSSWISE DEPTH SPREAD','Higher values spread the depth-generating influence more broadly across the base-tip axis. Final widthwise curvature also depends on the traced outline.'],
    ['profile','REVIEWED PROFILE BLEND','With an active reviewed profile: 0% uses the estimated bowl surface; 100% uses the reviewed profile surface. Has no effect without an active reviewed profile.']
  ];
  for (const [id,name,description] of formLabels) {
    const input = studio.querySelector('#'+id);
    const controlLabel = input?.closest('label');
    if (!input || !controlLabel) continue;
    const textNodes = [...controlLabel.childNodes].filter(node => node.nodeType === 3);
    if (textNodes.length) textNodes.forEach((node,index) => {node.textContent = index === 0 ? name+' / %' : ''});
    else controlLabel.prepend(document.createTextNode(name+' / %'));
    controlLabel.title = description;
    input.title = description;
    input.setAttribute('aria-label',name);
    input.setAttribute('aria-description',description);
  }
  const style = document.createElement('style');
  style.textContent = `
    #studioWorkspaceTitle{font-size:13px;font-weight:700;line-height:1.45;letter-spacing:1px;margin:0 0 18px;color:var(--text,var(--b))}
    .work > header .studio-geometry-tagline{max-width:100%;white-space:normal;overflow-wrap:break-word;line-height:1.5;letter-spacing:.35px}
    main:not(.shell-tool-page) aside button:is(.selected,.active,[aria-pressed="true"],[aria-selected="true"]){text-decoration-line:underline!important;text-decoration-color:currentColor!important;text-decoration-thickness:2px!important;text-underline-offset:5px!important;text-decoration-skip-ink:auto}
    @media(max-width:650px){#studioWorkspaceTitle{font-size:13px}}
  `;
  document.head.append(style);
})();
