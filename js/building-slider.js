(function () {
  const slider = document.querySelector('.building-slider');
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll('.building-slide'));
  const dots = Array.from(slider.querySelectorAll('[data-slide]'));
  const pause = slider.querySelector('.building-pause');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let paused = motion.matches;
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
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Putar pergantian gambar' : 'Jeda pergantian gambar');
    if (paused || document.hidden || slider.matches(':hover') || slider.contains(document.activeElement)) return;
    timer = setInterval(() => {
      if (!slider.getClientRects().length) return;
      for (let offset = 1; offset < slides.length; offset++) {
        const next = (index + offset) % slides.length;
        if (slides[next].complete && slides[next].naturalWidth) { show(next); break; }
      }
    }, 5000);
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); schedule(); }));
  pause.addEventListener('click', () => { paused = !paused; schedule(); });
  slider.addEventListener('mouseenter', schedule);
  slider.addEventListener('mouseleave', schedule);
  slider.addEventListener('focusin', schedule);
  slider.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; schedule(); });
  schedule();
})();
