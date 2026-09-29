(function () {
  const slider = document.querySelector('.building-slider');
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll('.building-slide'));
  const dots = Array.from(slider.querySelectorAll('[data-slide]'));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer;
  function show(next) {
    if (!slides[next].complete || !slides[next].naturalWidth) return;
    index = next;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
      dots[i].setAttribute('aria-pressed', String(i === index));
    });
  }
  function schedule() {
    clearInterval(timer);
    if (motion.matches || document.hidden) return;
    timer = setInterval(() => {
      if (!slider.getClientRects().length) return;
      for (let offset = 1; offset < slides.length; offset++) {
        const next = (index + offset) % slides.length;
        if (slides[next].complete && slides[next].naturalWidth) { show(next); break; }
      }
    }, 5000);
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); schedule(); }));
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  schedule();
})();
