/* Pure GSAP smooth scroll (no Lenis) + custom cursor — production safe */
(function () {
  'use strict';

  try {
    var prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initSmoothScroll() {
      if (prefersReduced) return;
      if (typeof gsap === 'undefined') return;

      var isTouch =
        window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
      if (isTouch) {
        if (typeof ScrollTrigger !== 'undefined') {
          try {
            gsap.registerPlugin(ScrollTrigger);
            window.addEventListener('load', function () {
              try { ScrollTrigger.refresh(); } catch (e) {}
            });
          } catch (e) {}
        }
        return;
      }

      var current = window.scrollY || window.pageYOffset || 0;
      var target = current;
      var ease = 0.14;
      var active = false;
      var maxScroll = 0;

      function updateMax() {
        maxScroll = Math.max(
          0,
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          ) - window.innerHeight
        );
      }
      updateMax();

      window.addEventListener(
        'wheel',
        function (e) {
          var node = e.target;
          while (node && node !== document.body && node !== document.documentElement) {
            var style = window.getComputedStyle(node);
            var oy = style.overflowY;
            if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
              var atTop = node.scrollTop <= 0 && e.deltaY < 0;
              var atBot =
                node.scrollTop + node.clientHeight >= node.scrollHeight - 2 && e.deltaY > 0;
              if (!atTop && !atBot) return;
            }
            node = node.parentElement;
          }
          e.preventDefault();
          updateMax();
          target += e.deltaY;
          if (target < 0) target = 0;
          if (target > maxScroll) target = maxScroll;
          active = true;
        },
        { passive: false }
      );

      window.addEventListener(
        'keydown',
        function (e) {
          var tag = (e.target && e.target.tagName) || '';
          if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

          var map = {
            ArrowDown: 72,
            ArrowUp: -72,
            PageDown: window.innerHeight * 0.85,
            PageUp: -window.innerHeight * 0.85,
            Home: 'home',
            End: 'end',
            ' ': window.innerHeight * 0.8
          };
          if (!(e.key in map)) return;
          e.preventDefault();
          updateMax();
          if (e.key === 'Home') target = 0;
          else if (e.key === 'End') target = maxScroll;
          else {
            var d = map[e.key];
            if (e.key === ' ' && e.shiftKey) d = -d;
            target = Math.min(maxScroll, Math.max(0, target + d));
          }
          active = true;
        },
        { passive: false }
      );

      window.addEventListener(
        'scroll',
        function () {
          if (!active) {
            current = window.scrollY || window.pageYOffset || 0;
            target = current;
          }
        },
        { passive: true }
      );

      window.addEventListener('resize', function () {
        updateMax();
        target = Math.min(maxScroll, Math.max(0, target));
      });

      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var dest = document.querySelector(id);
        if (!dest) return;
        e.preventDefault();
        updateMax();
        var top = dest.getBoundingClientRect().top + (window.scrollY || 0) - 80;
        target = Math.min(maxScroll, Math.max(0, top));
        active = true;
      });

      if (typeof ScrollTrigger !== 'undefined') {
        try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}
      }

      gsap.ticker.lagSmoothing(500, 33);

      gsap.ticker.add(function () {
        if (!active && Math.abs(target - current) < 0.1) return;
        current += (target - current) * ease;
        if (Math.abs(target - current) < 0.4) {
          current = target;
          active = false;
        }
        window.scrollTo(0, current);
        if (typeof ScrollTrigger !== 'undefined') {
          try { ScrollTrigger.update(); } catch (e) {}
        }
      });

      window.addEventListener('load', function () {
        updateMax();
        current = window.scrollY || 0;
        target = current;
        if (typeof ScrollTrigger !== 'undefined') {
          try { ScrollTrigger.refresh(); } catch (e) {}
        }
      });
    }

    function initCursor() {
      if (prefersReduced) return;
      var isFine =
        window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!isFine) return;

      var dot = document.createElement('div');
      var ring = document.createElement('div');
      dot.className = 'cursor-dot';
      ring.className = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);
      document.documentElement.classList.add('has-custom-cursor');

      var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, running = false;

      function onMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform =
          'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';
        if (!running) {
          running = true;
          loop();
        }
      }

      function loop() {
        ringX += (mouseX - ringX) * 0.22;
        ringY += (mouseY - ringY) * 0.22;
        ring.style.transform =
          'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
        var dx = mouseX - ringX, dy = mouseY - ringY;
        if (dx * dx + dy * dy > 0.15) requestAnimationFrame(loop);
        else running = false;
      }

      document.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mousedown', function () { ring.classList.add('is-click'); }, { passive: true });
      document.addEventListener('mouseup', function () { ring.classList.remove('is-click'); }, { passive: true });
      document.addEventListener('mouseleave', function () {
        document.documentElement.classList.remove('has-custom-cursor');
      }, { passive: true });
      document.addEventListener('mouseenter', function () {
        document.documentElement.classList.add('has-custom-cursor');
      }, { passive: true });
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest('a, button, .btn, .social-btn, .pill, .contact-row, .skill-card, input, textarea, [role="button"]'))
          ring.classList.add('is-hover');
      }, { passive: true });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest('a, button, .btn, .social-btn, .pill, .contact-row, .skill-card, input, textarea, [role="button"]'))
          ring.classList.remove('is-hover');
      }, { passive: true });
    }

    function boot() {
      initSmoothScroll();
      initCursor();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  } catch (err) {
    // Never break the page
    console.warn('smooth.js:', err);
  }
})();
