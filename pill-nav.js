/**
 * PillNav — Vanilla JS + GSAP Implementation of React Bits <PillNav />
 */
(function (window) {
  function initPillNav(options = {}) {
    const ease = options.ease || 'power3.easeOut';
    const container = document.querySelector('.pill-nav-container');
    if (!container) return;

    const nav = container.querySelector('.pill-nav');
    const logo = container.querySelector('.pill-logo');
    const logoImg = logo ? logo.querySelector('img, .logo-text') : null;
    const navItems = container.querySelector('.pill-nav-items');
    const pills = container.querySelectorAll('.pill');
    const hamburger = container.querySelector('.mobile-menu-button');
    const mobileMenu = container.querySelector('.mobile-menu-popover');
    const mobileLinks = container.querySelectorAll('.mobile-menu-link');

    let isMobileOpen = false;
    const tlRefs = [];
    const activeTweenRefs = [];

    // Layout function to calculate GSAP hover circle parameters
    const layout = () => {
      pills.forEach((pill, i) => {
        const circle = pill.querySelector('.hover-circle');
        if (!circle) return;

        const rect = pill.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w === 0 || h === 0) return;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        if (tlRefs[i]) tlRefs[i].kill();

        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs[i] = tl;
      });
    };

    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    // Hover listeners for pills
    pills.forEach((pill, i) => {
      pill.addEventListener('mouseenter', () => {
        const tl = tlRefs[i];
        if (!tl) return;
        if (activeTweenRefs[i]) activeTweenRefs[i].kill();
        activeTweenRefs[i] = tl.tweenTo(tl.duration(), {
          duration: 0.3,
          ease,
          overwrite: 'auto'
        });
      });

      pill.addEventListener('mouseleave', () => {
        const tl = tlRefs[i];
        if (!tl) return;
        if (activeTweenRefs[i]) activeTweenRefs[i].kill();
        activeTweenRefs[i] = tl.tweenTo(0, {
          duration: 0.2,
          ease,
          overwrite: 'auto'
        });
      });
    });

    // Logo spin on hover
    if (logo && logoImg) {
      let logoTween = null;
      logo.addEventListener('mouseenter', () => {
        if (logoTween) logoTween.kill();
        gsap.set(logoImg, { rotate: 0 });
        logoTween = gsap.to(logoImg, {
          rotate: 360,
          duration: 0.4,
          ease,
          overwrite: 'auto'
        });
      });
    }

    // Mobile menu state & GSAP toggle
    if (mobileMenu) {
      gsap.set(mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        isMobileOpen = !isMobileOpen;
        const lines = hamburger.querySelectorAll('.hamburger-line');

        if (isMobileOpen) {
          if (lines.length >= 2) {
            gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
            gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
          }
          if (mobileMenu) {
            gsap.set(mobileMenu, { visibility: 'visible' });
            gsap.fromTo(
              mobileMenu,
              { opacity: 0, y: 10, scaleY: 1 },
              {
                opacity: 1,
                y: 0,
                scaleY: 1,
                duration: 0.3,
                ease,
                transformOrigin: 'top center'
              }
            );
          }
        } else {
          if (lines.length >= 2) {
            gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
            gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
          }
          if (mobileMenu) {
            gsap.to(mobileMenu, {
              opacity: 0,
              y: 10,
              scaleY: 1,
              duration: 0.2,
              ease,
              transformOrigin: 'top center',
              onComplete: () => {
                gsap.set(mobileMenu, { visibility: 'hidden' });
              }
            });
          }
        }
      });
    }

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (isMobileOpen && hamburger) {
          hamburger.click();
        }
      });
    });

    // Initial Load Animation
    if (options.initialLoadAnimation !== false) {
      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, { scale: 1, duration: 0.6, ease });
      }
      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, { width: 'auto', duration: 0.6, ease });
      }
    }

    // Scroll active tracking
    const sections = document.querySelectorAll('section[id]');
    const updateActive = () => {
      const scrollPos = window.scrollY + 150;
      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          pills.forEach(p => {
            if (p.getAttribute('href') === `#${id}`) {
              p.classList.add('is-active');
            } else {
              p.classList.remove('is-active');
            }
          });
          mobileLinks.forEach(l => {
            if (l.getAttribute('href') === `#${id}`) {
              l.classList.add('is-active');
            } else {
              l.classList.remove('is-active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', updateActive, { passive: true });
  }

  window.initPillNav = initPillNav;
})(window);
