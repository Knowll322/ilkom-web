/**
 * BubbleMenu — Vanilla JS + GSAP Implementation of React Bits <BubbleMenu />
 */
(function (window) {
  function initBubbleMenu(options = {}) {
    const animationEase = options.animationEase || 'back.out(1.5)';
    const animationDuration = options.animationDuration || 0.5;
    const staggerDelay = options.staggerDelay || 0.12;

    const toggleBtn = document.getElementById('bubbleMenuToggle');
    const overlay = document.getElementById('bubbleMenuItems');
    const backdrop = document.getElementById('bubbleMenuBackdrop');
    if (!toggleBtn || !overlay) return;

    const pillLinks = overlay.querySelectorAll('.pill-link');
    const pillLabels = overlay.querySelectorAll('.pill-label');

    let isMenuOpen = false;

    const openMenu = () => {
      isMenuOpen = true;
      toggleBtn.classList.add('open');
      toggleBtn.setAttribute('aria-pressed', 'true');

      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      const bubbles = Array.from(pillLinks);
      const labels = Array.from(pillLabels);

      gsap.killTweensOf([...bubbles, ...labels]);
      if (backdrop) {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      }

      gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { y: 24, autoAlpha: 0 });

      bubbles.forEach((bubble, i) => {
        const randomVar = (Math.random() - 0.5) * 0.1;
        const delay = i * staggerDelay + randomVar;
        const tl = gsap.timeline({ delay });

        tl.to(bubble, {
          scale: 1,
          duration: animationDuration,
          ease: animationEase
        });

        if (labels[i]) {
          tl.to(
            labels[i],
            {
              y: 0,
              autoAlpha: 1,
              duration: animationDuration,
              ease: 'power3.out'
            },
            `-=${animationDuration * 0.9}`
          );
        }
      });
    };

    const closeMenu = () => {
      isMenuOpen = false;
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-pressed', 'false');

      const bubbles = Array.from(pillLinks);
      const labels = Array.from(pillLabels);

      gsap.killTweensOf([...bubbles, ...labels]);
      if (backdrop) {
        gsap.to(backdrop, { opacity: 0, duration: 0.2 });
      }

      gsap.to(labels, {
        y: 24,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power3.in'
      });

      gsap.to(bubbles, {
        scale: 0,
        duration: 0.2,
        ease: 'power3.in',
        onComplete: () => {
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
        }
      });
    };

    const toggleMenu = () => {
      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    toggleBtn.addEventListener('click', toggleMenu);
    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    // Close on ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    });

    // Close when clicking any link inside
    pillLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Responsive rotation adjustment on resize
    const handleResize = () => {
      if (isMenuOpen) {
        const isDesktop = window.innerWidth >= 900;
        pillLinks.forEach(bubble => {
          const rotVal = bubble.style.getPropertyValue('--item-rot') || '0deg';
          const rotation = isDesktop ? parseFloat(rotVal) : 0;
          gsap.set(bubble, { rotation });
        });
      }
    };

    window.addEventListener('resize', handleResize);
  }

  window.initBubbleMenu = initBubbleMenu;
})(window);
