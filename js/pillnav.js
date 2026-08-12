/* PillNav interactions — vanilla JS + GSAP (desktop hover + full mobile menu) */
(function () {
  const ease = 'power2.out';
  const pills = document.querySelectorAll('.pill');
  const circleRefs = [];
  const tlRefs = [];
  const activeTweenRefs = [];

  function layout() {
    pills.forEach((pill, i) => {
      const circle = pill.querySelector('.hover-circle');
      if (!circle) return;
      circleRefs[i] = circle;

      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height || 38;
      if (w < 1) return;

      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = D + 'px';
      circle.style.height = D + 'px';
      circle.style.bottom = -delta + 'px';

      if (typeof gsap === 'undefined') return;

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: '50% ' + originY + 'px'
      });

      const label = pill.querySelector('.pill-label');
      const white = pill.querySelector('.pill-label-hover');
      if (label) gsap.set(label, { y: 0 });
      if (white) gsap.set(white, { y: h + 12, opacity: 0 });

      if (tlRefs[i]) tlRefs[i].kill();
      const tl = gsap.timeline({ paused: true });
      tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.35, ease, overwrite: 'auto' }, 0);
      if (label) {
        tl.to(label, { y: -(h + 8), duration: 0.35, ease, overwrite: 'auto' }, 0);
      }
      if (white) {
        gsap.set(white, { y: Math.ceil(h + 40), opacity: 0 });
        tl.to(white, { y: 0, opacity: 1, duration: 0.35, ease, overwrite: 'auto' }, 0);
      }
      tlRefs[i] = tl;
    });
  }

  function handleEnter(i) {
    if (typeof gsap === 'undefined') return;
    const tl = tlRefs[i];
    if (!tl) return;
    if (activeTweenRefs[i]) activeTweenRefs[i].kill();
    activeTweenRefs[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
  }

  function handleLeave(i) {
    if (typeof gsap === 'undefined') return;
    const tl = tlRefs[i];
    if (!tl) return;
    if (activeTweenRefs[i]) activeTweenRefs[i].kill();
    activeTweenRefs[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
  }

  pills.forEach((pill, i) => {
    if (pill.classList.contains('is-active')) return;
    pill.addEventListener('mouseenter', () => handleEnter(i));
    pill.addEventListener('mouseleave', () => handleLeave(i));
  });

  // Logo spin
  const logo = document.querySelector('.pill-logo');
  if (logo && typeof gsap !== 'undefined') {
    logo.addEventListener('mouseenter', function () {
      gsap.to(logo, { rotation: '+=360', duration: 0.7, ease: 'power2.inOut' });
    });
  }

  // ========== MOBILE MENU ==========
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navContainer = document.getElementById('navContainer') || document.querySelector('.pill-nav-container');
  let menuOpen = false;

  // Create backdrop if missing
  let backdrop = document.querySelector('.mobile-menu-backdrop');
  if (!backdrop && navContainer) {
    backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);
  }

  function openMenu() {
    if (!hamburger || !mobileMenu) return;
    menuOpen = true;
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    if (navContainer) navContainer.classList.add('menu-open');
    document.body.classList.add('nav-menu-open');
    if (backdrop) backdrop.classList.add('is-open');

    const lines = hamburger.querySelectorAll('.hamburger-line');
    if (typeof gsap !== 'undefined') {
      if (lines[0]) gsap.to(lines[0], { rotation: 45, y: 3.5, duration: 0.3, ease });
      if (lines[1]) gsap.to(lines[1], { rotation: -45, y: -3.5, duration: 0.3, ease });
      gsap.set(mobileMenu, { visibility: 'visible' });
      gsap.fromTo(
        mobileMenu,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease }
      );
    } else {
      mobileMenu.style.visibility = 'visible';
      mobileMenu.style.opacity = '1';
    }
  }

  function closeMenu() {
    if (!hamburger || !mobileMenu || !menuOpen) return;
    menuOpen = false;
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (navContainer) navContainer.classList.remove('menu-open');
    document.body.classList.remove('nav-menu-open');
    if (backdrop) backdrop.classList.remove('is-open');

    const lines = hamburger.querySelectorAll('.hamburger-line');
    if (typeof gsap !== 'undefined') {
      if (lines[0]) gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.28, ease });
      if (lines[1]) gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.28, ease });
      gsap.to(mobileMenu, {
        opacity: 0,
        y: -6,
        scale: 0.97,
        duration: 0.22,
        ease,
        onComplete: function () {
          gsap.set(mobileMenu, { visibility: 'hidden' });
        }
      });
    } else {
      mobileMenu.style.opacity = '0';
      mobileMenu.style.visibility = 'hidden';
    }
  }

  function toggleMenu() {
    if (menuOpen) closeMenu();
    else openMenu();
  }

  if (hamburger && mobileMenu) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'mobileMenu');

    if (typeof gsap !== 'undefined') {
      gsap.set(mobileMenu, { visibility: 'hidden', opacity: 0, y: -8 });
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close when a mobile link is tapped
    mobileMenu.querySelectorAll('.mobile-menu-link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    });

    // Close on resize to desktop
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 768 && menuOpen) closeMenu();
      }, 120);
    });
  }

  // Initial layout + resize
  layout();
  var layoutTimer;
  window.addEventListener('resize', function () {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layout, 100);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layout).catch(function () {});
  }

  // Initial load animation — wait for preloader so handoff is smooth
  const navItems = document.getElementById('navItems');
  const logoEl = document.querySelector('.pill-logo');

  if (typeof gsap !== 'undefined') {
    if (logoEl) gsap.set(logoEl, { scale: 0 });
    if (navItems) gsap.set(navItems, { width: 0, overflow: 'hidden', opacity: 0 });
  }

  function playNavIntro() {
    if (typeof gsap === 'undefined') {
      if (logoEl) logoEl.style.transform = 'scale(1)';
      if (navItems) {
        navItems.style.width = 'auto';
        navItems.style.opacity = '1';
      }
      return;
    }
    if (logoEl) {
      gsap.to(logoEl, { scale: 1, duration: 0.55, ease, delay: 0.05 });
    }
    if (navItems) {
      gsap.to(navItems, { width: 'auto', opacity: 1, duration: 0.6, ease, delay: 0.12 });
    }
  }

  if (document.getElementById('preloader')) {
    window.addEventListener('preloaderDone', playNavIntro, { once: true });
  } else {
    playNavIntro();
  }

  // Hide navbar on scroll down, show on scroll up (skip while menu open)
  // Tuned for GSAP smooth-scroll: rAF-batched, direction-thresholded, no layout thrash
  (function setupNavScroll() {
    const nav = document.getElementById('navContainer') || document.querySelector('.pill-nav-container');
    if (!nav) return;

    let lastY = window.scrollY || window.pageYOffset || 0;
    let hidden = false;
    let ticking = false;
    const delta = 8;
    const topShow = 48;

    function setHidden(next) {
      if (next === hidden) return;
      hidden = next;
      if (next) nav.classList.add('nav-hidden');
      else nav.classList.remove('nav-hidden');
    }

    function update() {
      ticking = false;
      if (menuOpen) {
        setHidden(false);
        lastY = window.scrollY || window.pageYOffset || 0;
        return;
      }
      const y = window.scrollY || window.pageYOffset || 0;
      if (y <= topShow) {
        setHidden(false);
      } else if (y > lastY + delta) {
        setHidden(true);
      } else if (y < lastY - delta) {
        setHidden(false);
      }
      lastY = y;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  })();
})();
