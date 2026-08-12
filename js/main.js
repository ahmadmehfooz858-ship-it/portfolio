/* Preloader (Tajmirul-style) + reveal animations — smooth load */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader || typeof gsap === 'undefined') {
    document.documentElement.classList.add('is-ready', 'no-gsap');
    window.dispatchEvent(new CustomEvent('preloaderDone'));
    runReveals();
    return;
  }

  document.body.style.overflow = 'hidden';
  document.documentElement.classList.add('is-loading');

  function startPreloader() {
    // Ensure letters start below (CSS already does this; reinforce for consistency)
    gsap.set('.name-text span', { y: '110%', opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: finishPreloader
    });

    // 1) Letters rise in (stagger) — matches Tajmirul
    tl.to('.name-text span', {
      y: 0,
      stagger: 0.02,
      duration: 0.25
    });

    // Hold so total experience ~5s
    tl.to({}, { duration: 1.1 });

    // Columns slide down + fade, name fades up, whole screen fades away smoothly
    tl.to('.preloader-item', {
      y: '100%',
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.03,
      ease: 'power2.inOut'
    }, 'exit')
    .to('.name-text span', {
      autoAlpha: 0,
      y: -20,
      duration: 0.35,
      ease: 'power2.inOut'
    }, 'exit')
    .to(preloader, {
      autoAlpha: 0,
      duration: 0.45,
      ease: 'power2.inOut'
    }, 'exit+=0.12');
  }

  function finishPreloader() {
    preloader.style.pointerEvents = 'none';
    preloader.style.visibility = 'hidden';
    document.body.style.overflow = '';
    document.documentElement.classList.remove('is-loading');
    document.documentElement.classList.add('is-ready');

    const lanyard = document.querySelector('.lanyard-container');
    if (lanyard) lanyard.classList.add('animate');

    // Signal nav + other listeners after preloader (smooth handoff)
    window.dispatchEvent(new CustomEvent('preloaderDone'));

    // Small delay so homepage content fades in after curtain lifts
    requestAnimationFrame(() => {
      setTimeout(runReveals, 40);
    });
  }


  // Hard failsafe — never leave the site locked on slow CDN
  var preloaderFailsafe = setTimeout(function () {
    if (document.documentElement.classList.contains('is-loading') || 
        (preloader && preloader.style.visibility !== 'hidden')) {
      finishPreloader();
    }
  }, 5000);
  var _finish = finishPreloader;
  finishPreloader = function () {
    clearTimeout(preloaderFailsafe);
    _finish();
  };

  // Start after fonts are ready (fallback timeout so we never hang)
  const fontsReady = (document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();

  Promise.race([
    fontsReady,
    new Promise((r) => setTimeout(r, 800))
  ]).then(() => {
    // Double rAF so first paint is clean before animating
    requestAnimationFrame(() => requestAnimationFrame(startPreloader));
  });

  function runReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Prefer GSAP ScrollTrigger when available (smooth both directions)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      els.forEach((el, i) => {
        // Skip elements already driven by page-specific GSAP
        if (el.closest('.home-stats') || el.classList.contains('home-stats') || el.closest('.timeline-item') || el.classList.contains('skill-primary') ||
            el.classList.contains('skill-card') || el.classList.contains('skills-split') ||
            el.classList.contains('skills-sublabel-row')) {
          return;
        }
        gsap.fromTo(el,
          { opacity: 0, y: 28, force3D: true },
          {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', force3D: true,
            overwrite: 'auto',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              end: 'bottom top',
              toggleActions: 'play reverse play reverse',
              fastScrollEnd: true
            }
          }
        );
      });
      return;
    }

    // Fallback: IntersectionObserver with reverse on leave
    document.documentElement.classList.add('no-gsap');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          } else {
            e.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => observer.observe(el));
  }
})();
