/* ==========================================================
   San Carlo Acutis · script.js
   Animaciones e interacciones (sin dependencias)
   ========================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const t = (key, values) => window.siteI18n ? window.siteI18n.t(key, values) : key;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const root = document.documentElement;
  const body = document.body;

  /* ---------- Tema claro / oscuro ---------- */
  const themeBtn = $('#themeBtn');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('acutis-theme', t); } catch (e) { /* ignorar */ }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0e0e13' : '#faf8f3');
  };
  (() => {
    let saved = null;
    try { saved = localStorage.getItem('acutis-theme'); } catch (e) { /* ignorar */ }
    if (saved) setTheme(saved);
    else if (matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  })();
  themeBtn.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Texto del título dividido en letras ---------- */
  const heroTitle = $('#heroTitle');
  (() => {
    const text = heroTitle.textContent.trim();
    let index = 0;
    heroTitle.innerHTML = text.split(' ').map((word) => {
      const letters = [...word].map((ch) => `<span class="ch" style="--i:${index++}" aria-hidden="true">${ch}</span>`).join('');
      return `<span class="word">${letters}</span>`;
    }).join(' ');
  })();

  /* ---------- Efecto de escritura ---------- */
  const typedEl = $('#typed');
  const phraseKeys = [
    'El ciberapóstol de la Eucaristía',
    'El primer santo millennial',
    'El patrono de internet para muchos',
    'Un joven que miraba al Cielo'
  ];
  let typingStarted = false;
  let typingTimer = null;
  function startTyping() {
    if (typingStarted) return;
    typingStarted = true;
    if (reduce) { typedEl.textContent = t(phraseKeys[0]); return; }
    let p = 0, c = 0, deleting = false;
    const tick = () => {
      const current = t(phraseKeys[p]);
      typedEl.textContent = current.slice(0, c);
      let delay = deleting ? 28 : 65;
      if (!deleting && c === current.length) { deleting = true; delay = 2200; }
      else if (deleting && c === 0) { deleting = false; p = (p + 1) % phraseKeys.length; delay = 450; }
      c += deleting ? -1 : 1;
      typingTimer = setTimeout(tick, delay);
    };
    tick();
  }
  document.addEventListener('languagechange', () => {
    clearTimeout(typingTimer);
    if (typingStarted) { typingStarted = false; startTyping(); }
  });

  /* ---------- Preloader ---------- */
  const pre = $('#preloader');
  const preNum = $('#preNum');
  const preBar = $('#preBar');
  let finished = false;
  function finishLoading() {
    if (finished) return;
    finished = true;
    preNum.textContent = '100';
    preBar.style.width = '100%';
    setTimeout(() => {
      pre.classList.add('done');
      body.classList.remove('loading');
      body.classList.add('loaded');
      setTimeout(startTyping, 1200);
    }, reduce ? 0 : 450);
  }
  (() => {
    if (reduce) { finishLoading(); return; }
    let n = 0;
    const timer = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 8));
      preNum.textContent = n;
      preBar.style.width = n + '%';
      if (n >= 100) { clearInterval(timer); finishLoading(); }
    }, 55);
    // Red de seguridad por si algo falla
    setTimeout(finishLoading, 5000);
  })();

  /* ---------- Años desde su partida ---------- */
  (() => {
    const el = $('#sinceYears');
    if (!el) return;
    const death = new Date(2006, 9, 12);
    const now = new Date();
    let years = now.getFullYear() - death.getFullYear();
    const hadAnniversary = now.getMonth() > death.getMonth() || (now.getMonth() === death.getMonth() && now.getDate() >= death.getDate());
    if (!hadAnniversary) years -= 1;
    el.textContent = years;
  })();

  /* ---------- Barra de progreso, navegación y volver arriba ---------- */
  const progress = $('#progress');
  const nav = $('#nav');
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 40);
    if (!body.classList.contains('menu-open')) {
      nav.classList.toggle('hidden', y > lastY && y > 400);
    }
    lastY = y;
    updateTimeline($('#tl1'));
    updatePath();
    updateStatement();
    updateParallax();
  }

  /* ---------- Menú móvil ---------- */
  const burger = $('#burger');
  const links = $('#links');
  const toggleMenu = (open) => {
    burger.classList.toggle('open', open);
    links.classList.toggle('open', open);
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', t(open ? 'Cerrar menú' : 'Abrir menú'));
  };
  document.addEventListener('languagechange', () => toggleMenu(links.classList.contains('open')));
  burger.addEventListener('click', () => toggleMenu(!links.classList.contains('open')));
  $$('a', links).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- Enlace activo según la sección ---------- */
  (() => {
    const map = new Map();
    $$('a', links).forEach((a) => map.set(a.getAttribute('href').slice(1), a));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          map.forEach((a) => a.classList.remove('active'));
          const a = map.get(en.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  })();

  /* ---------- Revelar elementos al hacer scroll ---------- */
  (() => {
    // Retardo escalonado para hijos dentro de [data-stagger]
    $$('[data-stagger]').forEach((group) => {
      $$('[data-reveal]', group).forEach((el, i) => {
        if (!el.dataset.delay) el.style.setProperty('--d', `${i * 110}ms`);
      });
    });
    $$('[data-reveal][data-delay]').forEach((el) => el.style.setProperty('--d', `${el.dataset.delay}ms`));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          el.classList.add('in');
          io.unobserve(el);
          // Una vez revelado, se quita el atributo para que no interfiera con las transiciones de hover
          const wait = 2000 + (parseInt(el.dataset.delay, 10) || 0) + (parseFloat(el.style.getPropertyValue('--d')) || 0);
          setTimeout(() => { el.removeAttribute('data-reveal'); el.style.removeProperty('--d'); }, wait);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  })();

  /* ---------- Contadores ---------- */
  (() => {
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);
    const run = (el) => {
      const target = parseInt(el.dataset.count, 10);
      if (reduce) { el.textContent = target; return; }
      const dur = 2200;
      const t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(easeOut(p) * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => io.observe(el));
  })();

  /* ---------- Frase que se ilumina con el scroll ---------- */
  const statement = $('#statement');
  let stmtWords = [];
  function rebuildStatement() {
    if (!statement) return;
    const text = statement.textContent.trim();
    const parts = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(root.lang, { granularity: 'word' }).segment(text)].map(part => part.segment)
      : text.match(/\s+|[^\s]+/g) || [];
    statement.replaceChildren(...parts.map(word => {
      if (/^\s+$/.test(word)) return document.createTextNode(word);
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      return span;
    }));
    stmtWords = $$('.w', statement);
  }
  rebuildStatement();
  document.addEventListener('languagechange', () => { rebuildStatement(); updateStatement(); });
  function updateStatement() {
    if (!stmtWords.length) return;
    const r = statement.getBoundingClientRect();
    const start = innerHeight * 0.85;
    const end = innerHeight * 0.35;
    const p = clamp((start - r.top) / (start - end + r.height * 0.6), 0, 1);
    const lit = Math.round(p * stmtWords.length);
    stmtWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }

  /* ---------- Línea de tiempo vertical ---------- */
  function updateTimeline(tl) {
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    const p = clamp((innerHeight * 0.6 - r.top) / r.height, 0, 1);
    tl.style.setProperty('--p', p.toFixed(4));
    $$('.tl-item', tl).forEach((item) => {
      const ir = item.getBoundingClientRect();
      item.classList.toggle('active', ir.top < innerHeight * 0.6);
    });
  }

  /* ---------- Línea del camino a los altares ---------- */
  function updatePath() {
    const path = $('#path');
    if (!path) return;
    const r = path.getBoundingClientRect();
    const p = clamp((innerHeight * 0.7 - r.top) / (r.height * 0.9), 0, 1);
    path.style.setProperty('--p', p.toFixed(4));
  }

  /* ---------- Parallax suave ---------- */
  function updateParallax() {
    if (reduce) return;
    const y = window.scrollY;
    const blobs = $$('.blob');
    blobs.forEach((b, i) => { b.style.translate = `0 ${y * (0.08 + i * 0.05)}px`; });
    const visual = $('.hero-visual');
    if (visual && y < innerHeight * 1.2) visual.style.translate = `0 ${y * -0.06}px`;
  }

  /* ---------- Cursor personalizado ---------- */
  (() => {
    if (!finePointer || reduce) return;
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    const loop = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    const hoverables = 'a, button, [data-tilt], .flip, .q';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(hoverables)) ring.classList.add('hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(hoverables)) ring.classList.remove('hover'); });
    document.addEventListener('mouseleave', () => { ring.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { ring.style.opacity = 1; dot.style.opacity = 1; });
  })();

  /* ---------- Luz que sigue al ratón en el hero ---------- */
  (() => {
    const hero = $('.hero');
    if (!hero || !finePointer) return;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
      hero.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  })();

  /* ---------- Inclinación 3D en tarjetas ---------- */
  (() => {
    if (!finePointer || reduce) return;
    $$('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 8;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform .1s linear, border-color .4s, box-shadow .5s';
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
        el.style.setProperty('--gx', `${e.clientX - r.left - 110}px`);
        el.style.setProperty('--gy', `${e.clientY - r.top - 110}px`);
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform .8s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .5s';
        el.style.transform = '';
      });
    });
  })();

  /* ---------- Botones magnéticos y efecto onda ---------- */
  (() => {
    if (finePointer && !reduce) {
      $$('.magnetic').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          el.style.transition = 'transform .15s ease-out';
          el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1)';
          el.style.transform = '';
        });
      });
    }
    $$('.btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = span.style.height = `${size}px`;
        span.style.left = `${e.clientX - r.left - size / 2}px`;
        span.style.top = `${e.clientY - r.top - size / 2}px`;
        btn.appendChild(span);
        setTimeout(() => span.remove(), 800);
      });
    });
  })();

  /* ---------- Tarjetas de milagros (giran al tocar) ---------- */
  $$('.flip').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });

  /* ---------- Carrusel de citas ---------- */
  (() => {
    const slider = $('#slider');
    if (!slider) return;
    const slides = $$('.slide', slider);
    const dotsWrap = $('#dots');
    let i = 0, timer = null;
    const dots = slides.map((_, n) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', t('Cita {n}', { n: n + 1 }));
      b.addEventListener('click', () => { go(n); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });
    document.addEventListener('languagechange', () => {
      dots.forEach((dot, n) => dot.setAttribute('aria-label', t('Cita {n}', { n: n + 1 })));
    });
    function go(n) {
      slides[i].classList.remove('on');
      dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('on');
      dots[i].classList.add('on');
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 6500); }
    dots[0].classList.add('on');
    restart();
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', restart);
  })();

  /* ---------- Preguntas frecuentes (acordeón) ---------- */
  $$('.qa').forEach((qa) => {
    const btn = $('.q', qa);
    const panel = $('.a', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      $$('.qa.open').forEach((other) => {
        if (other !== qa) {
          other.classList.remove('open');
          $('.a', other).style.maxHeight = '0px';
          $('.q', other).setAttribute('aria-expanded', 'false');
        }
      });
      qa.classList.toggle('open', open);
      panel.style.maxHeight = open ? `${panel.scrollHeight}px` : '0px';
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Red de partículas en el hero ---------- */
  (() => {
    const canvas = $('#net');
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, pts = [];
    const mouse = { x: -9999, y: -9999 };
    let running = true;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = clamp(Math.floor((w * h) / 16000), 24, 90);
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      }));
    }
    resize();
    addEventListener('resize', resize);

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });

    // Pausar cuando el hero no es visible
    new IntersectionObserver((en) => { running = en[0].isIntersecting; if (running) draw(); }).observe(canvas);

    const gold = () => (root.getAttribute('data-theme') === 'dark' ? '217,180,106' : '179,138,67');
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const c = gold();
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c},.8)`;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(${c},${(1 - d / 130) * 0.35})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // Conectar con el ratón
        const m = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
        if (m < 160) {
          ctx.strokeStyle = `rgba(${c},${(1 - m / 160) * 0.6})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ---------- Carrusel de fotografías ---------- */
  (() => {
    const track = $('#photoTrack');
    if (!track) return;
    const carousel = track.closest('.photo-carousel');
    const slides = $$('.photo-slide', track);
    $('#photoTotal').textContent = String(slides.length).padStart(2, '0');
    const play = $('#photoPlay');
    let current = 0, paused = reduce, visible = false, hovering = false, focused = false;
    let timer = null, frame = null;
    const dots = slides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', t('Ver imagen {n}: {caption}', { n: index + 1, caption: $('figcaption', slide).textContent }));
      dot.addEventListener('click', () => go(index, true));
      $('#photoDots').appendChild(dot);
      return dot;
    });
    function schedule() {
      clearTimeout(timer);
      if (!paused && visible && !hovering && !focused && !document.hidden) {
        timer = setTimeout(() => go(current + 1), 5500);
      }
    }
    function update(index) {
      current = index;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      $('#photoCurrent').textContent = String(index + 1).padStart(2, '0');
    }
    function go(index, announce = false) {
      index = (index + slides.length) % slides.length;
      const slide = slides[index];
      const left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left - (track.clientWidth - slide.clientWidth) / 2;
      track.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
      if (announce) $('#photoStatus').textContent = t('{n} de {total}: {caption}', { n: index + 1, total: slides.length, caption: $('figcaption', slide).textContent });
      schedule();
    }
    $('#photoPrev').addEventListener('click', () => go(current - 1, true));
    $('#photoNext').addEventListener('click', () => go(current + 1, true));
    function updatePlay() {
      play.setAttribute('aria-pressed', String(paused));
      play.setAttribute('aria-label', t(paused ? 'Reproducir carrusel' : 'Pausar carrusel'));
      $('span', play).textContent = paused ? '▶' : 'Ⅱ';
    }
    play.addEventListener('click', () => { paused = !paused; updatePlay(); schedule(); });
    document.addEventListener('languagechange', () => {
      dots.forEach((dot, index) => {
        dot.setAttribute('aria-label', t('Ver imagen {n}: {caption}', { n: index + 1, caption: $('figcaption', slides[index]).textContent }));
      });
      updatePlay();
      $('#photoStatus').textContent = '';
    });
    track.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      go(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1), true);
    });
    track.addEventListener('scroll', () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const center = track.getBoundingClientRect().left + track.clientWidth / 2;
        const distances = slides.map(slide => Math.abs(slide.getBoundingClientRect().left + slide.clientWidth / 2 - center));
        update(distances.indexOf(Math.min(...distances)));
        schedule();
      });
    }, { passive: true });
    carousel.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    carousel.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    carousel.addEventListener('focusin', () => { focused = true; schedule(); });
    carousel.addEventListener('focusout', event => { focused = carousel.contains(event.relatedTarget); schedule(); });
    track.addEventListener('pointerdown', () => { clearTimeout(timer); });
    track.addEventListener('pointerup', schedule);
    track.addEventListener('pointercancel', schedule);
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: .3 }).observe(track);
    addEventListener('resize', () => go(current));
    update(0);
    updatePlay();
  })();

  /* ---------- Volver arriba suave ---------- */
  const toTop = $('#toTop');
  if (toTop) {
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Scroll con rAF ---------- */
  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
