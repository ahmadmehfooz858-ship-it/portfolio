/* Page transition (curtain wipe) + hover-prefetch — production safe.
   No dependencies. Never blocks navigation if something goes wrong. */
(function () {
  'use strict';

  try {
    var reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var overlay = document.getElementById('pageTransition');
    var panel = overlay && overlay.querySelector('.pt-panel');
    var mark = overlay && overlay.querySelector('.pt-mark');
    var DUR = 620; /* ms — keep in sync with feel of cubic-bezier below */
    var EASE = 'cubic-bezier(.76,0,.24,1)';
    var skipEntry = overlay && overlay.getAttribute('data-skip-entry') === 'true';
    var navigating = false;

    function hideOverlay() {
      if (!overlay) return;
      overlay.style.visibility = 'hidden';
      overlay.style.pointerEvents = 'none';
    }

    function revealOnEntry() {
      if (!overlay || !panel) return;

      if (reduced) {
        panel.style.transition = 'none';
        panel.style.transform = 'scaleY(0)';
        hideOverlay();
        return;
      }

      /* Lock current (covering) state with no transition first */
      panel.style.transition = 'none';
      panel.style.transformOrigin = 'bottom';
      panel.style.transform = 'scaleY(1)';
      if (mark) {
        mark.style.transition = 'none';
        mark.style.opacity = '1';
        mark.style.transform = 'scale(1)';
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.style.transformOrigin = 'top';
          panel.style.transition = 'transform ' + DUR + 'ms ' + EASE;
          panel.style.transform = 'scaleY(0)';
          if (mark) {
            mark.style.transition = 'opacity .35s ease, transform .4s ease';
            mark.style.opacity = '0';
            mark.style.transform = 'scale(.4)';
          }
          setTimeout(hideOverlay, DUR + 60);
        });
      });
    }

    function coverAndGo(href) {
      if (navigating) return;
      navigating = true;

      if (reduced || !overlay || !panel) {
        window.location.href = href;
        return;
      }

      overlay.style.visibility = 'visible';
      overlay.style.pointerEvents = 'all';
      panel.style.transformOrigin = 'bottom';
      panel.style.transition = 'transform ' + (DUR - 80) + 'ms ' + EASE;
      panel.style.transform = 'scaleY(1)';
      if (mark) {
        mark.style.transition = 'opacity .3s ease .12s, transform .35s ease .12s';
        mark.style.opacity = '1';
        mark.style.transform = 'scale(1)';
      }

      var done = false;
      var go = function () {
        if (done) return;
        done = true;
        window.location.href = href;
      };
      setTimeout(go, DUR - 80);
    }

    /* ---- Entry ---- */
    if (skipEntry) {
      /* index.html: the dedicated name preloader already covers/reveals */
      hideOverlay();
      if (panel) panel.style.transform = 'scaleY(0)';
    } else {
      revealOnEntry();
    }

    /* ---- Exit intercept: internal link clicks get the wipe ---- */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target && a.target !== '' && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;

      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.origin && a.origin !== window.location.origin) return;
      if (a.href === window.location.href) return;

      e.preventDefault();
      coverAndGo(a.href);
    });

    /* Restore overlay to a hidden state on bfcache restore (back/forward) */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      navigating = false;
      if (panel) {
        panel.style.transition = 'none';
        panel.style.transform = 'scaleY(0)';
      }
      hideOverlay();
    });

    /* ---- Hover / touch prefetch: warm the cache before the click happens ---- */
    var prefetched = {};
    function prefetch(href) {
      if (!href || prefetched[href]) return;
      prefetched[href] = true;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
    document.addEventListener(
      'mouseover',
      function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
        if (a.origin && a.origin !== window.location.origin) return;
        prefetch(a.href);
      },
      { passive: true }
    );
    document.addEventListener(
      'touchstart',
      function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        if (a.origin && a.origin !== window.location.origin) return;
        prefetch(a.href);
      },
      { passive: true }
    );
  } catch (err) {
    /* Never let a transition bug trap someone on a page */
    console.warn('transitions.js:', err);
    var el = document.getElementById('pageTransition');
    if (el) el.style.display = 'none';
  }
})();
