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
  const style = document.createElement('style');
  style.textContent = `
    #studioWorkspaceTitle{font-size:13px;font-weight:700;line-height:1.45;letter-spacing:1px;margin:0 0 18px;color:var(--text,var(--b))}
    .work > header .studio-geometry-tagline{max-width:100%;white-space:normal;overflow-wrap:break-word;line-height:1.5;letter-spacing:.35px}
    @media(max-width:650px){#studioWorkspaceTitle{font-size:13px}}
  `;
  document.head.append(style);
})();
