(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = [...document.querySelectorAll('button, .button')];
  const instances = [];

  const style = document.createElement('style');
  style.textContent = `
    :root {
      --button-bg: white;
      --button-hover: #edf2ff;
      --button-border: var(--b);
      --button-text: var(--b);
      --primary-bg: var(--b);
      --primary-text: white;
      --primary-hover: #0540d9;
      --field-bg: white;
      --field-border: var(--l);
      --field-text: var(--b);
      --surface-bg: white;
      --surface-border: var(--l);
      --surface-text: var(--b);
    }

    [data-theme="dark"], body[data-theme="dark"] {
      --button-bg: #0b1530;
      --button-hover: #132247;
      --button-border: #3d5cff;
      --button-text: #dce5ff;
      --primary-bg: #0540d9;
      --primary-text: #f4f7ff;
      --primary-hover: #0648ff;
      --field-bg: #0b1530;
      --field-border: #33447a;
      --field-text: #dce5ff;
      --surface-bg: #081026;
      --surface-border: #33447a;
      --surface-text: #dce5ff;
    }

    [data-theme="white-cobalt"], body[data-theme="white-cobalt"] {
      --button-bg: white;
      --button-hover: #eef3ff;
      --button-border: #0648ff;
      --button-text: #0648ff;
      --primary-bg: #0648ff;
      --primary-text: white;
      --primary-hover: #0540d9;
      --field-bg: white;
      --field-border: #c9d6ff;
      --field-text: #0648ff;
      --surface-bg: white;
      --surface-border: #c9d6ff;
      --surface-text: #0648ff;
    }

    button, .button {
      background: var(--button-bg) !important;
      border: 1px solid var(--button-border) !important;
      box-shadow: none !important;
      outline: none !important;
      padding: 0 !important;
      color: var(--button-text) !important;
      font-style: italic !important;
    }

    button:hover, .button:hover {
      background: var(--button-hover) !important;
      color: var(--button-text) !important;
    }

    button.primary, .button.primary,
    button.selected, .button.selected {
      background: var(--primary-bg) !important;
      color: var(--primary-text) !important;
      border-color: var(--primary-bg) !important;
    }

    button.primary:hover, .button.primary:hover,
    button.selected:hover, .button.selected:hover {
      background: var(--primary-hover) !important;
      color: var(--primary-text) !important;
    }

    input[type="number"], select {
      background: var(--field-bg) !important;
      color: var(--field-text) !important;
      border-color: var(--field-border) !important;
    }

    aside, .card, .card-title, .badge {
      background: var(--surface-bg) !important;
      color: var(--surface-text) !important;
      border-color: var(--surface-border) !important;
    }

    .section-nav-button {
      background: var(--button-bg) !important;
      color: var(--button-text) !important;
      border-color: var(--button-border) !important;
    }

    .section-nav-button:hover {
      background: var(--button-hover) !important;
      color: var(--button-text) !important;
    }

    .section-nav-button.active {
      background: var(--primary-bg) !important;
      color: var(--primary-text) !important;
      border-color: var(--primary-bg) !important;
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
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      transition: opacity 180ms ease;
    }

    .grain-button:hover canvas {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .grain-button canvas {
        transition: none;
      }
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
    let animationId = null;
    const count = 36;

    const resize = () => {
      const rect = button.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grains = Array.from({length: count}, () => ({
        angle: Math.random() * Math.PI * 2,
        speed: 0.0025 + Math.random() * 0.003,
        distance: -(2 + Math.random() * 3),
        wobble: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 0.7,
        alpha: 0.18 + Math.random() * 0.22
      }));
    };

    const color = () => getComputedStyle(button).color || '#0648ff';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      const rx = width / 2, ry = height / 2;
      const paint = color();
      for (const g of grains) {
        g.angle += g.speed;
        const wobble = Math.sin(g.angle * 5 + g.wobble) * 1.2;
        const x = cx + Math.cos(g.angle) * (rx + g.distance + wobble);
        const y = cy + Math.sin(g.angle) * (ry + g.distance + wobble);
        ctx.globalAlpha = g.alpha;
        ctx.fillStyle = paint;
        ctx.fillRect(x, y, g.size, g.size);
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (animationId || reduced) return;
      const animate = () => {
        draw();
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      ctx.clearRect(0, 0, width, height);
    };

    button.addEventListener('mouseenter', start);
    button.addEventListener('mouseleave', stop);
    button.addEventListener('focus', start);
    button.addEventListener('blur', stop);

    new ResizeObserver(resize).observe(button);
    resize();

    return {resize, stop};
  };

  buttons.forEach(button => {
    if (button.closest('.grain-button')) return;
    instances.push(makeGrain(button));
  });

  addEventListener('resize', () => instances.forEach(i => i.resize()));
})();