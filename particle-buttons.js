(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = [...document.querySelectorAll('button, .button')];
  const instances = [];

  const style = document.createElement('style');
  style.textContent = `
    .particle-button{position:relative;isolation:isolate}
    .particle-button canvas{position:absolute;inset:-16px;width:calc(100% + 32px);height:calc(100% + 32px);pointer-events:none;z-index:-1}
    .particle-button{transition:transform .18s cubic-bezier(.22,1.2,.36,1)}
    .particle-button:hover{transform:scale(1.035)}
    .particle-button:active{transform:scale(.965)}
    @media (prefers-reduced-motion: reduce){.particle-button{transition:none}.particle-button:hover,.particle-button:active{transform:none}}
  `;
  document.head.appendChild(style);

  const makeParticles = (button) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    button.classList.add('particle-button');
    button.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, particles = [], pulse = 0, hover = 0;
    const count = 18;

    const resize = () => {
      const rect = button.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = rect.width + 32;
      height = rect.height + 32;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({length: count}, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.006,
        radius: 4 + Math.random() * 5,
        offset: Math.random() * 3,
        alpha: 0.25 + Math.random() * 0.35
      }));
    };

    const color = () => getComputedStyle(button).color || '#0648ff';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const rx = width / 2 - 6, ry = height / 2 - 6;
      const paint = color();
      for (const p of particles) {
        p.angle += p.speed * (1 + hover * 1.6);
        const wobble = Math.sin(p.angle * 2.4 + p.offset) * 2.2;
        const x = cx + Math.cos(p.angle) * (rx + p.offset + wobble);
        const y = cy + Math.sin(p.angle) * (ry + p.offset + wobble);
        ctx.beginPath();
        ctx.arc(x, y, p.radius * (1 + pulse * .8), 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha * (0.55 + hover * .45);
        ctx.fillStyle = paint;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      hover += ((button.matches(':hover') ? 1 : 0) - hover) * .08;
      pulse *= .88;
      draw();
      if (!reduced) requestAnimationFrame(animate);
    };

    button.addEventListener('pointerdown', () => pulse = 1);
    new ResizeObserver(resize).observe(button);
    resize();
    if (reduced) draw(); else requestAnimationFrame(animate);

    return {resize, draw};
  };

  buttons.forEach(button => {
    if (button.closest('.particle-button')) return;
    instances.push(makeParticles(button));
  });

  addEventListener('resize', () => instances.forEach(i => i.resize()));
})();
