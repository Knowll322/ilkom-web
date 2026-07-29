window.addEventListener('load', () => {
  // Check touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Register GSAP plugins
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
  } else {
    console.warn("GSAP not loaded. Animations will not work properly.");
    return;
  }

  // 1. Loader + Hero Intro
  const loaderProgress = document.querySelector('.loader-progress');
  const loader = document.getElementById('loader');

  if (loaderProgress && loader && typeof anime !== 'undefined') {
    anime({
      targets: '.loader-progress',
      width: '100%',
      duration: 1400,
      easing: 'easeInOutQuart',
      complete: () => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            revealHero();
          }
        });
      }
    });
  } else {
    if (loader) loader.style.display = 'none';
    revealHero();
  }

  function revealHero() {
    const heroTl = gsap.timeline();
    
    gsap.set('.hero-line', { yPercent: 110, opacity: 0 });
    gsap.set('.hero-tag', { opacity: 0, y: 20 });
    gsap.set('.hero-bottom', { opacity: 0, y: 30 });
    gsap.set('.hero-ticker', { opacity: 0 });
    gsap.set('.scroll-indicator', { opacity: 0 });
    gsap.set('.sticker', { opacity: 0, scale: 0.6, rotation: -10 });
    gsap.set('.nav-links li, .nav-cta', { opacity: 0, y: -12 });
    
    heroTl
      .to('.hero-tag', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .to('.hero-line', {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: 'expo.out'
      }, '-=0.2')
      .to('.hero-bottom', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
      .to('.hero-ticker', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.scroll-indicator', { opacity: 1, duration: 0.5 }, '-=0.2')
      .to('.sticker', {
        opacity: 1, scale: 1, rotation: 0,
        duration: 0.6, stagger: 0.1,
        ease: 'back.out(1.7)'
      }, '-=0.5')
      .to('.nav-links li, .nav-cta', {
        opacity: 1, y: 0,
        duration: 0.5, stagger: 0.07,
        ease: 'power2.out'
      }, 0.3);
  }

  // 2. Custom Cursor (Anime.js lerp)
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (cursor && cursorDot && !isTouchDevice) {
    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set(cursorDot, { x: mouseX, y: mouseY });
    });
    
    gsap.ticker.add(() => {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      gsap.set(cursor, { x: curX, y: curY });
    });
    
    const hoverTargets = document.querySelectorAll('a, button, .karya-item, .bento-card, .peminatan-mega, .activity-tile, .chip');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        gsap.to(cursor, { scale: 1.5, duration: 0.3, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
      });
    });
  }

  // 3. Scroll Progress Bar
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);

  ScrollTrigger.create({
    onUpdate: self => {
      gsap.set(progressBar, { width: (self.progress * 100) + '%' });
    }
  });

  // 4. Navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    ScrollTrigger.create({
      start: 'top top-=80',
      onEnter: () => navbar.classList.add('scrolled'),
      onLeaveBack: () => navbar.classList.remove('scrolled')
    });
  }

  // 5. Mobile Hamburger Menu
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      
      if (isOpen && typeof anime !== 'undefined') {
        anime({
          targets: '#navLinks li',
          translateX: [40, 0],
          opacity: [0, 1],
          delay: anime.stagger(80, {start: 200}),
          duration: 500,
          easing: 'easeOutExpo'
        });
      }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // 6 & 23. Smooth Anchor Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // 7. ScrollTrigger-based Scroll Reveal
  gsap.utils.toArray('.scroll-reveal').forEach((el) => {
    const delay = el.dataset.delay ? parseFloat(el.dataset.delay) * 0.1 : 0;
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0,
        duration: 0.9,
        delay: delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      }
    );
  });

  // 8. Anime.js Canvas Mesh Gradient (Hero Background)
  const canvas = document.getElementById('heroCanvas');
  if (canvas && typeof anime !== 'undefined') {
    const ctx = canvas.getContext('2d');
    let W, H;
    
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const blobs = [
      { x: 0.2, y: 0.3, r: 0.4, color: '#003DA5', ax: 0, ay: 0 },
      { x: 0.8, y: 0.2, r: 0.35, color: '#FFB800', ax: 0, ay: 0 },
      { x: 0.5, y: 0.7, r: 0.4, color: '#1976D2', ax: 0, ay: 0 },
      { x: 0.1, y: 0.8, r: 0.3, color: '#0052CC', ax: 0, ay: 0 },
      { x: 0.9, y: 0.6, r: 0.35, color: '#003DA5', ax: 0, ay: 0 },
    ];
    
    blobs.forEach((blob, i) => {
      anime({
        targets: blob,
        x: [{ value: anime.random(0.1, 0.9) }, { value: anime.random(0.1, 0.9) }, { value: blob.x }],
        y: [{ value: anime.random(0.1, 0.9) }, { value: anime.random(0.1, 0.9) }, { value: blob.y }],
        duration: 8000 + i * 1500,
        loop: true,
        easing: 'easeInOutSine',
        delay: i * 500,
        direction: 'alternate'
      });
    });
    
    const drawCanvas = () => {
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(blob => {
        const grad = ctx.createRadialGradient(
          blob.x * W, blob.y * H, 0,
          blob.x * W, blob.y * H, blob.r * Math.max(W, H)
        );
        grad.addColorStop(0, blob.color + 'AA');
        grad.addColorStop(1, blob.color + '00');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });
      requestAnimationFrame(drawCanvas);
    };
    drawCanvas();
  }

  // 10. Sticker Parallax (GSAP + mousemove)
  const stickers = document.querySelectorAll('.sticker[data-speed]');
  if (!isTouchDevice && stickers.length) {
    const hero = document.getElementById('hero');
    if (hero) {
      let heroRect = hero.getBoundingClientRect();
      window.addEventListener('resize', () => { heroRect = hero.getBoundingClientRect(); });
      
      hero.addEventListener('mousemove', (e) => {
        const cx = heroRect.left + heroRect.width / 2;
        const cy = heroRect.top + heroRect.height / 2;
        const dx = (e.clientX - cx) / heroRect.width;
        const dy = (e.clientY - cy) / heroRect.height;
        
        stickers.forEach(sticker => {
          const speed = parseFloat(sticker.dataset.speed) || 1;
          gsap.to(sticker, {
            x: dx * speed * 60,
            y: dy * speed * 60,
            duration: 1.2,
            ease: 'power2.out'
          });
        });
      });
    }
  }

  // 11. Number Counters (GSAP ScrollTrigger + anime.js)
  if (typeof anime !== 'undefined') {
    document.querySelectorAll('.stat-big-num[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target);
      const start = target > 100 ? target - 20 : 0;
      const obj = { val: start };
      
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          anime({
            targets: obj,
            val: target,
            duration: 2000,
            easing: 'easeOutExpo',
            round: 1,
            update: () => { el.textContent = obj.val; }
          });
        }
      });
    });
  }

  // 12. Fun Fact Rotator (Anime.js fade cycle)
  const facts = [
    'Rata-rata orang menghabiskan 2.5 jam per hari di media sosial. Bayangkan dampak konten yang kamu buat!',
    '93% komunikasi adalah non-verbal — itulah kenapa visual storytelling sangat powerful.',
    'Industri kreatif Indonesia tumbuh 7.4% per tahun. Peluangmu ada di sini!',
    'Public Relations termasuk 10 profesi dengan pertumbuhan tercepat di era digital.',
    '1 menit video bernilai setara 1.8 juta kata dalam menyampaikan pesan.',
  ];
  const funFactEl = document.getElementById('funFactText');
  if (funFactEl && typeof anime !== 'undefined') {
    let idx = 0;
    setInterval(() => {
      anime({
        targets: funFactEl,
        opacity: [1, 0],
        translateY: [0, -10],
        duration: 400,
        easing: 'easeInQuad',
        complete: () => {
          idx = (idx + 1) % facts.length;
          funFactEl.textContent = facts[idx];
          anime({
            targets: funFactEl,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 500,
            easing: 'easeOutQuad'
          });
        }
      });
    }, 5000);
  }

  // 13. Semester Tabs (GSAP show/hide)
  const semTabs = document.querySelectorAll('.sem-tab');
  const accGroups = document.querySelectorAll('.acc-group');

  semTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      semTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sem = tab.dataset.semester;
      
      accGroups.forEach(group => {
        if (group.dataset.semester === sem) {
          group.style.display = 'block';
          gsap.fromTo(group,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
          // Close all acc-body in this group
          group.querySelectorAll('.acc-body').forEach(b => {
            b.classList.remove('open');
            b.style.maxHeight = null;
          });
          group.querySelectorAll('.acc-header').forEach(h => h.classList.remove('active'));
          // Open first acc-header
          const firstHeader = group.querySelector('.acc-header');
          const firstBody = group.querySelector('.acc-body');
          if (firstHeader && firstBody) {
            firstHeader.classList.add('active');
            firstBody.classList.add('open');
            firstBody.style.maxHeight = firstBody.scrollHeight + 'px';
          }
        } else {
          group.style.display = 'none';
        }
      });
    });
  });
  // Init: show first semester
  if (semTabs[0]) semTabs[0].click();

  // 14. Accordion (GSAP height animation)
  document.querySelectorAll('.acc-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      if (!body) return;
      
      const isOpen = body.classList.contains('open');
      
      // Close siblings in same group
      const group = header.closest('.acc-group');
      if (group) {
        group.querySelectorAll('.acc-body.open').forEach(openBody => {
          openBody.classList.remove('open');
          gsap.to(openBody, { maxHeight: 0, duration: 0.35, ease: 'power2.inOut' });
          if(openBody.previousElementSibling) openBody.previousElementSibling.classList.remove('active');
        });
      }
      
      if (!isOpen) {
        body.classList.add('open');
        header.classList.add('active');
        const fullHeight = body.scrollHeight;
        gsap.fromTo(body,
          { maxHeight: 0 },
          { maxHeight: fullHeight + 'px', duration: 0.5, ease: 'power2.out' }
        );
      }
    });
  });

  // 15. Horizontal Drag Scroll (Karya) + momentum
  const dragContainer = document.querySelector('.karya-scroll-container');
  if (dragContainer) {
    let isDragging = false, startX, scrollLeft, velocity = 0, lastX, rafId;
    
    const stopMomentum = () => {
      cancelAnimationFrame(rafId);
      velocity = 0;
    };
    
    dragContainer.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.pageX - dragContainer.offsetLeft;
      scrollLeft = dragContainer.scrollLeft;
      lastX = e.pageX;
      stopMomentum();
      dragContainer.classList.add('dragging');
    });
    
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const x = e.pageX - dragContainer.offsetLeft;
      velocity = e.pageX - lastX;
      lastX = e.pageX;
      dragContainer.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
    
    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      dragContainer.classList.remove('dragging');
      // Momentum
      const applyMomentum = () => {
        if (Math.abs(velocity) < 0.5) return;
        dragContainer.scrollLeft -= velocity * 1.5;
        velocity *= 0.92;
        rafId = requestAnimationFrame(applyMomentum);
      };
      applyMomentum();
    };
    
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);
    
    // Touch support
    let touchStartX = 0, touchScrollLeft = 0;
    dragContainer.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = dragContainer.scrollLeft;
    }, { passive: true });
    dragContainer.addEventListener('touchmove', e => {
      const dx = touchStartX - e.touches[0].pageX;
      dragContainer.scrollLeft = touchScrollLeft + dx;
    }, { passive: true });
  }

  // 16. Karya Filter (Anime.js)
  if (typeof anime !== 'undefined') {
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        const items = document.querySelectorAll('.karya-item');
        
        // Animate out all
        anime({
          targets: items,
          opacity: 0,
          scale: 0.95,
          duration: 200,
          easing: 'easeInQuad',
          complete: () => {
            items.forEach(item => {
              item.style.display = (filter === 'all' || item.dataset.category === filter) ? 'block' : 'none';
            });
            // Animate in matching
            const visible = [...items].filter(i => i.style.display !== 'none');
            anime({
              targets: visible,
              opacity: [0, 1],
              scale: [0.95, 1],
              delay: anime.stagger(60),
              duration: 350,
              easing: 'easeOutBack'
            });
          }
        });
      });
    });
  }

  // 17. Calendar
  const calGrid = document.getElementById('calendarGrid');
  const calMonthEl = document.getElementById('calendarMonth');
  const calPrev = document.getElementById('calendarPrev');
  const calNext = document.getElementById('calendarNext');

  if (calGrid && typeof anime !== 'undefined') {
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const eventDates = ['2026-07-15','2026-07-22','2026-08-05'];
    let current = new Date();
    
    const renderCal = () => {
      calGrid.innerHTML = '';
      if(calMonthEl) calMonthEl.textContent = monthNames[current.getMonth()] + ' ' + current.getFullYear();
      const year = current.getFullYear();
      const month = current.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      let startDow = firstDay.getDay();
      startDow = startDow === 0 ? 6 : startDow - 1;
      
      for (let i = 0; i < startDow; i++) {
        const empty = document.createElement('div');
        calGrid.appendChild(empty);
      }
      
      const today = new Date();
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const el = document.createElement('div');
        el.className = 'cal-day';
        el.textContent = d;
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (eventDates.includes(ds)) el.classList.add('has-event');
        if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
          el.classList.add('today');
          el.style.backgroundColor = '#003DA5';
          el.style.color = '#fff';
          el.style.fontWeight = '700';
          el.style.borderRadius = '8px';
        }
        calGrid.appendChild(el);
      }
      
      // Animate in with anime.js
      anime({
        targets: calGrid.querySelectorAll('.cal-day'),
        opacity: [0, 1],
        scale: [0.7, 1],
        delay: anime.stagger(15),
        duration: 300,
        easing: 'easeOutBack'
      });
    };
    
    calPrev?.addEventListener('click', () => {
      current.setMonth(current.getMonth() - 1);
      renderCal();
    });
    calNext?.addEventListener('click', () => {
      current.setMonth(current.getMonth() + 1);
      renderCal();
    });
    renderCal();
  }

  // 18. Contact Form
  const form = document.getElementById('contactForm');
  if (form && typeof anime !== 'undefined') {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const inputs = form.querySelectorAll('.form-input');
      let valid = true;
      
      inputs.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          // Shake with anime.js
          anime({
            targets: input,
            translateX: [0, -8, 8, -6, 6, -3, 3, 0],
            borderColor: ['#E2E8F0', '#EF4444', '#E2E8F0'],
            duration: 500,
            easing: 'linear'
          });
        }
      });
      
      if (valid) {
        const btn = document.getElementById('formSubmit');
        if(btn) {
          btn.textContent = 'Mengirim...';
          btn.disabled = true;
          gsap.to(btn, { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });
        }
        
        setTimeout(() => {
          const success = document.getElementById('formSuccess');
          form.reset();
          if(btn) {
            btn.textContent = 'Kirim Pesan →';
            btn.disabled = false;
          }
          if(success) {
            success.style.display = 'block';
            anime({
              targets: success,
              opacity: [0, 1],
              translateY: [-10, 0],
              duration: 400,
              easing: 'easeOutQuad'
            });
            gsap.delayedCall(4, () => {
              anime({ targets: success, opacity: 0, duration: 300, complete: () => success.style.display = 'none' });
            });
          }
        }, 1500);
      }
    });
  }

  // 19. Floating CTA (GSAP ScrollTrigger)
  const floatingCta = document.getElementById('floatingCta');
  if (floatingCta) {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'bottom top',
      onEnter: () => {
        floatingCta.classList.add('visible');
        gsap.fromTo(floatingCta, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
      },
      onLeaveBack: () => {
        gsap.to(floatingCta, { y: 20, opacity: 0, duration: 0.3, onComplete: () => floatingCta.classList.remove('visible') });
      }
    });
  }

  // 20. Back to Top
  document.querySelector('.back-top')?.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 21. Magnetic Buttons (GSAP)
  if (!isTouchDevice) {
    document.querySelectorAll('.float-btn, .nav-cta, .btn-hero-primary, .form-submit').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80) {
          gsap.to(btn, {
            x: dx * 0.35,
            y: dy * 0.35,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  // 22. Active Nav Link (ScrollTrigger)
  document.querySelectorAll('section[id]').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveLink(section.id),
      onEnterBack: () => setActiveLink(section.id)
    });
  });

  function setActiveLink(id) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  // 24. 3D Tilt Cards (GSAP)
  if (!isTouchDevice) {
    document.querySelectorAll('.bento-card, .peminatan-mega').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rx = ((e.clientY - cy) / rect.height) * -6;
        const ry = ((e.clientX - cx) / rect.width) * 6;
        gsap.to(card, {
          rotateX: rx, rotateY: ry,
          transformPerspective: 1000,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  // 25. Konami Code Easter Egg (Anime.js confetti)
  if (typeof anime !== 'undefined') {
    const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let ki = 0;
    const confettiColors = ['#003DA5','#FFB800','#1976D2','#FFD700','#0052CC','#ffffff'];

    window.addEventListener('keydown', e => {
      if (e.key === konamiCode[ki]) { ki++; } else { ki = 0; }
      if (ki === konamiCode.length) {
        ki = 0;
        // Burst 80 confetti pieces
        for (let i = 0; i < 80; i++) {
          const piece = document.createElement('div');
          piece.style.cssText = `
            position:fixed; width:${anime.random(8,14)}px; height:${anime.random(8,14)}px;
            background:${confettiColors[Math.floor(Math.random()*confettiColors.length)]};
            border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
            left:${anime.random(10,90)}vw; top:-20px;
            pointer-events:none; z-index:99999;
          `;
          document.body.appendChild(piece);
          anime({
            targets: piece,
            top: ['-20px', anime.random(60,110)+'vh'],
            left: '+=' + anime.random(-150,150),
            rotate: anime.random(-360, 360),
            opacity: [1, 0],
            duration: anime.random(2000,3500),
            delay: anime.random(0,500),
            easing: 'easeOutQuad',
            complete: () => piece.remove()
          });
        }
      }
    });
  }
});
