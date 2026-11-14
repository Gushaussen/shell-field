(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = [...document.querySelectorAll('button, .button')];
  const instances = [];

  const style = document.createElement('style');
  style.textContent = `
    button, .button {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      outline: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      color: inherit !important;
    }

    button::before, button::after,
    .button::before, .button::after {
      display: none !important;
    }

    .grain-button {
      position: relative;
      isolation: isolate;
    }

    .grain-button canvas {
      position: absolute;
      inset: -10px;
      width: calc(100% + 20px);
      height: calc(100% + 20px);
      pointer-events: none;
      z-index: -1;
    }
  `;
  document.head.appendChild(style);

  const makeGrain = (button) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    button.classList.add('grain-button');
    button.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, grains = [];
    const count = 28;

    const resize = () => {
      const rect = button.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = rect.width + 20;
      height = rect.height + 20;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grains = Array.from({length: count}, () => ({
        angle: Math.random() * Math.PI * 2,
        speed: 0.0015 + Math.random() * 0.002,
        distance: 2 + Math.random() * 3,
        wobble: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 0.7,
        alpha: 0.18 + Math.random() * 0.22
      }));
    };

    const color = () => getComputedStyle(button).color || '#0648ff';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const rx = width / 2 - 5, ry = height / 2 - 5;
      const paint = color();
      for (const g of grains) {
        g.angle += g.speed;
        const wobble = Math.sin(g.angle * 3 + g.wobble) * 0.7;
        const x = cx + Math.cos(g.angle) * (rx + g.distance + wobble);
        const y = cy + Math.sin(g.angle) * (ry + g.distance + wobble);
        ctx.globalAlpha = g.alpha;
        ctx.fillStyle = paint;
        ctx.fillRect(x, y, g.size, g.size);
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      draw();
      if (!reduced) requestAnimationFrame(animate);
    };

    new ResizeObserver(resize).observe(button);
    resize();
    if (reduced) draw(); else requestAnimationFrame(animate);

    return {resize, draw};
  };

  buttons.forEach(button => {
    if (button.closest('.grain-button')) return;
    instances.push(makeGrain(button));
  });

  addEventListener('resize', () => instances.forEach(i => i.resize()));
})();
