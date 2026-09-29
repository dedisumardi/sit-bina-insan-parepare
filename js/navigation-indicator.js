(function () {
  'use strict';
  const menu = document.querySelector('.nav-menu');
  if (!menu) return;
  const links = Array.from(menu.querySelectorAll('.nav-link'));
  let frame;
  function update() {
    const active = menu.querySelector('.nav-link.active');
    if (!active || !menu.getClientRects().length) return;
    const bounds = menu.getBoundingClientRect();
    const target = active.getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(active).paddingLeft);
    menu.style.setProperty('--nav-line-x', `${target.left - bounds.left + inset}px`);
    menu.style.setProperty('--nav-line-y', `${target.bottom - bounds.top - 3}px`);
    menu.style.setProperty('--nav-line-width', `${Math.max(0, target.width - inset * 2)}px`);
    menu.classList.add('nav-indicator-ready');
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }
  const observer = new MutationObserver(schedule);
  links.forEach(link => observer.observe(link, { attributes: true, attributeFilter: ['class'] }));
  new ResizeObserver(schedule).observe(menu);
  window.addEventListener('resize', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  update();
})();
