(() => {
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

    .grain-button, .particle-button {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    .grain-button canvas,
    .particle-button canvas {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();
