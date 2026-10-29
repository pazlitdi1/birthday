(() => {
  'use strict';

  const c = window.BIRTHDAY_CONFIG;
  const $ = id => document.getElementById(id);
  const target = Date.parse(c.unlockAt);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  let state = 'waiting',
    interval,
    transitionTimer,
    confettiFrame,
    active = 0,
    lastCard,
    swipeStart;

  const photos = [];

  if (!Number.isFinite(target)) {
    $('opening-status').textContent =
      'Please check unlockAt in config.js.';
    return;
  }

  $('release-date').textContent =
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(target) + ' · TASHKENT';

  // Background particles
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('span');

    p.className = 'particle' + (i % 4 === 0 ? ' petal' : '');

    p.style.setProperty('--x', `${(i * 41) % 100}%`);
    p.style.setProperty('--duration', `${18 + i % 9}s`);
    p.style.setProperty('--delay', `${-i * 2.3}s`);

    $('atmosphere').append(p);
  }

  // Countdown
  function tick() {
    if (state === 'opening' || state === 'opened') return;

    const left = Math.max(0, target - Date.now());
    const total = Math.ceil(left / 1000);

    [
      Math.floor(total / 86400),
      Math.floor(total / 3600) % 24,
      Math.floor(total / 60) % 60,
      total % 60
    ].forEach((n, i) => {
      $([
        'days',
        'hours',
        'minutes',
        'seconds'
      ][i]).textContent = String(n).padStart(2, '0');
    });

    state = left > 0 ? 'waiting' : 'ready';

    $('waiting').hidden = state !== 'waiting';
    $('ready').hidden = state !== 'ready';
  }

  interval = setInterval(tick, 250);
  tick();

  // Confetti animation
  function burst(sparkles = false) {
    cancelAnimationFrame(confettiFrame);

    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const w = innerWidth;
    const h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    ctx.scale(dpr, dpr);

    if (motion.matches) {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    const colors = [
      '#e8c893',
      '#e8afbd',
      '#f7efe5',
      '#b99bcc'
    ];

    const particles = Array.from(
      {
        length: sparkles
          ? 45
          : Math.min(110, Math.floor(w / 5))
      },
      () => ({
        x: w / 2,
        y: h * 0.62,
        vx: (Math.random() - 0.5) * 12,
        vy: -5 - Math.random() * 12,
        r: 2 + Math.random() * 4,
        a: Math.random() * 6,
        color: colors[Math.floor(Math.random() * 4)]
      })
    );

    const start = performance.now();
    let last = start;

    function draw(now) {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(
        0,
        1 - (now - start) / 3500
      );

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.14 * dt;
        p.a += 0.06 * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);

        ctx.fillStyle = p.color;

        if (sparkles) {
          ctx.beginPath();
          ctx.moveTo(0, -p.r * 2);
          ctx.lineTo(p.r * 0.5, 0);
          ctx.lineTo(0, p.r * 2);
          ctx.lineTo(-p.r * 0.5, 0);
          ctx.fill();
        } else {
          ctx.fillRect(
            -p.r,
            -p.r,
            p.r * 2,
            p.r
          );
        }

        ctx.restore();
      }

      if (
        now - start < 3500 &&
        !document.hidden &&
        !motion.matches
      ) {
        confettiFrame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }

    confettiFrame = requestAnimationFrame(draw);
  }

  // Intersection observers
  const observer = new IntersectionObserver(
    entries =>
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );

  const photoObserver = new IntersectionObserver(
    entries =>
      entries.forEach(e => {
        e.target.classList.toggle(
          'in-view',
          e.isIntersecting
        );

        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      }),
    { threshold: 0.1 }
  );

  // Photo modal
  function showPhoto(index, direction = 0) {
    if (!photos.length) return;

    active = (index + photos.length) % photos.length;

    const p = photos[active];
    const img = $('large-photo');

    img.classList.remove(
      'slide-next',
      'slide-prev'
    );

    img.src = p.src;
    img.alt = p.caption;

    $('large-caption').textContent = p.caption;
    $('large-description').textContent = p.description || 'May your birthday bring you joy, peace, and beautiful new beginnings.';
    const dialog = $('photo-dialog');
    dialog.classList.remove('wish-enter');
    void dialog.offsetWidth;
    dialog.classList.add('wish-enter');

    $('photo-position').textContent =
      `${active + 1} / ${photos.length}`;

    if (direction && !motion.matches) {
      void img.offsetWidth;

      img.classList.add(
        direction > 0
          ? 'slide-next'
          : 'slide-prev'
      );
    }
  }

  // Birthday reveal
  function reveal() {
    if (state === 'opened') return;

    clearTimeout(transitionTimer);

    state = 'opened';

    $('ready').hidden = true;
    $('glow').classList.remove('bloom');

    $('recipient').textContent = c.name;

    $('signature').textContent =
      'With respect and gratitude,\n' + c.sender;

    c.message.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      $('message').append(p);
    });

    // ============================================
    // UPDATED PHOTO GALLERY
    // Automatically loads ALL photos from config.js
    // Supports PNG, JPG, JPEG, WEBP, etc.
    // ============================================

    const allPhotos = Array.isArray(c.photos)
      ? c.photos.filter(
          photo =>
            photo &&
            typeof photo.src === 'string' &&
            photo.src.trim() !== ''
        )
      : [];

    allPhotos.forEach((photo, i) => {
      photos.push(photo);
      const shell = document.createElement('div');
      shell.className = 'photo-shell';
      shell.style.setProperty('--rotation', `${i % 2 ? 3 : -3}deg`);
      const button = document.createElement('button');
      button.className = 'photo-card';
      button.setAttribute('aria-label', 'Open birthday wish ' + (i + 1));
      const wrap = document.createElement('div');
      wrap.className = 'image-wrap';
      const img = document.createElement('img');
      img.src = photo.src; img.alt = photo.caption; img.loading = 'lazy';
      wrap.append(img);
      const caption = document.createElement('p'); caption.textContent = photo.caption;
      const hint = document.createElement('span'); hint.className = 'memory-hint';
      hint.textContent = String(i + 1).padStart(2, '0') + ' / 14 · OPEN YOUR WISH ↗';
      button.append(wrap, caption, hint); shell.append(button);
      $('gallery').append(shell); photoObserver.observe(shell);
      button.addEventListener('click', () => {
        lastCard = button; showPhoto(i); $('photo-dialog').showModal();
        document.body.classList.add('modal-open');
      });
    });

    $('celebration').hidden = false;
    $('celebration').classList.add('hero-arrive');

    document
      .querySelectorAll('.reveal')
      .forEach(el => observer.observe(el));

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

    $('recipient').tabIndex = -1;

    $('recipient').focus({
      preventScroll: true
    });

    burst();
  }

  // Open birthday surprise
  $('open').addEventListener('click', () => {
    if (
      state === 'opening' ||
      state === 'opened'
    ) return;

    if (Date.now() < target) {
      tick();
      return;
    }

    state = 'opening';

    clearInterval(interval);

    $('open').disabled = true;

    $('opening-status').textContent =
      'Opening your birthday wish…';

    if (motion.matches) {
      reveal();
      return;
    }

    $('ready').classList.add('opening');

    setTimeout(() => {
      if (state !== 'opening') return;

      $('ready').classList.add('departing');
      $('glow').classList.add('bloom');
    }, 900);

    transitionTimer = setTimeout(reveal, 2400);
  });

  // Pause / play gallery
  $('toggle-gallery').addEventListener('click', () => {
    const paused = $('gallery').classList.toggle(
      'manual-pause'
    );

    $('toggle-gallery').setAttribute(
      'aria-pressed',
      String(paused)
    );

    $('toggle-gallery').textContent = paused
      ? 'Play photographs ▷'
      : 'Pause photographs Ⅱ';
  });

  // Pause gallery during touch interaction
  $('gallery-viewport').addEventListener(
    'pointerdown',
    e => {
      if (e.pointerType === 'touch') {
        $('gallery').classList.add('touch-pause');
      }
    }
  );

  document.addEventListener(
    'pointerup',
    () => $('gallery').classList.remove('touch-pause')
  );

  document.addEventListener(
    'pointercancel',
    () => $('gallery').classList.remove('touch-pause')
  );

  // Make a wish
  $('wish').addEventListener('click', () => {
    $('wish-message').textContent =
      'Wishing you a beautiful year ahead, Maryam.';

    burst(true);
  });

  // Close photo modal
  $('close-photo').addEventListener(
    'click',
    () => $('photo-dialog').close()
  );

  $('photo-dialog').addEventListener('close', () => {
    document.body.classList.remove('modal-open');

    lastCard?.focus({
      preventScroll: true
    });
  });

  // Close modal by clicking outside
  $('photo-dialog').addEventListener('click', e => {
    if (e.target !== $('photo-dialog')) return;

    const r = e.target.getBoundingClientRect();

    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    ) {
      e.target.close();
    }
  });

  // Previous / next photo
  $('previous-photo').addEventListener(
    'click',
    () => showPhoto(active - 1, -1)
  );

  $('next-photo').addEventListener(
    'click',
    () => showPhoto(active + 1, 1)
  );

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!$('photo-dialog').open) return;

    if (
      e.key === 'ArrowRight' ||
      e.key === 'ArrowLeft'
    ) {
      e.preventDefault();

      const d = e.key === 'ArrowRight' ? 1 : -1;

      showPhoto(active + d, d);
    }
  });

  // Mobile swipe navigation
  $('photo-stage').addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      swipeStart = {
        x: e.clientX,
        y: e.clientY
      };
    }
  });

  $('photo-stage').addEventListener('pointerup', e => {
    if (!swipeStart) return;

    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;

    swipeStart = null;

    if (
      Math.abs(dx) > 50 &&
      Math.abs(dx) > Math.abs(dy) * 1.5
    ) {
      const d = dx < 0 ? 1 : -1;

      showPhoto(active + d, d);
    }
  });

  $('photo-stage').addEventListener(
    'pointercancel',
    () => swipeStart = null
  );

  // Pause effects when tab is hidden
  function visibility() {
    document.body.classList.toggle(
      'paused',
      document.hidden
    );

    if (document.hidden) {
      cancelAnimationFrame(confettiFrame);

      const canvas = $('confetti');

      canvas
        .getContext('2d')
        ?.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
    }

    tick();
  }

  document.addEventListener(
    'visibilitychange',
    visibility
  );

  visibility();

  // Reduced motion accessibility
  motion.addEventListener('change', () => {
    if (
      motion.matches &&
      state === 'opening'
    ) {
      reveal();
    }

    if (motion.matches) {
      cancelAnimationFrame(confettiFrame);
    }
  });
})();
