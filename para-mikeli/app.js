/* ============================================================
   Para Mikeli — Sandro · interações (vanilla)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     >>> EDITE AQUI <<<  (datas, música)
     ============================================================ */
  const CONFIG = window.__PARA_MIKELI = window.__PARA_MIKELI || {
    startDate: '2024-12-15T00:00:00',   // dia em que começaram a namorar
    songName:  'Amo ao Senhor de Todo o Meu Coração',
    songArtist:'Estevão Ewald',
  };

  /* ---- Datas: formatar ---- */
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();

  /* ---- Contador ao vivo ---- */
  function tickCounter() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    const start = new Date(CONFIG.startDate).getTime();
    const now = Date.now();
    let diff = Math.max(0, Math.floor((now - start) / 1000));
    const days = Math.floor(diff / 86400); diff -= days * 86400;
    const hrs = Math.floor(diff / 3600); diff -= hrs * 3600;
    const mins = Math.floor(diff / 60); const secs = diff - mins * 60;
    const set = (k, v) => { const n = el.querySelector('[data-' + k + ']'); if (n) n.textContent = v; };
    set('days', days);
    set('hrs', pad(hrs));
    set('mins', pad(mins));
    set('secs', pad(secs));
  }

  /* ---- Reveal ao rolar ---- */
  function initReveal() {
    const items = [].slice.call(document.querySelectorAll('.rise'));
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < (window.innerHeight || 800) * 0.92 && r.bottom > 0;
    };
    items.forEach((el) => { if (!inView(el)) el.classList.add('anim'); });
    const check = () => {
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (el.classList.contains('anim') && !el.classList.contains('in') && inView(el)) {
          el.classList.add('in');
        }
      }
    };
    check();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { check(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---- Player / vinil ---- */
  function initPlayer() {
    const disc = document.querySelector('.disc');
    const btn = document.querySelector('.ctrls .play');
    const now = document.querySelector('.player .now span');
    const audio = document.querySelector('[data-audio]');
    const barFill = document.querySelector('.bar i');
    const times = document.querySelectorAll('.times span');
    if (!disc || !btn) return;

    const fmt = (s) => {
      if (!isFinite(s) || s < 0) return '0:00';
      return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60));
    };
    const setPlaying = (p) => {
      disc.classList.toggle('spin', p);
      btn.innerHTML = p ? '❚❚' : '►';
      btn.setAttribute('aria-label', p ? 'pausar' : 'tocar');
      if (now) now.textContent = p ? 'tocando agora' : 'nossa música';
    };

    const hasAudio = audio && audio.getAttribute('src');
    let autoStarting = false; // evita que o gesto que iniciou o autoplay pause logo em seguida

    btn.addEventListener('click', () => {
      if (autoStarting) { autoStarting = false; return; }
      if (hasAudio) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
      } else {
        // Sem arquivo de áudio: mantém só a animação do vinil
        setPlaying(!disc.classList.contains('spin'));
      }
    });

    if (hasAudio) {
      audio.addEventListener('play', () => setPlaying(true));
      audio.addEventListener('pause', () => setPlaying(false));
      audio.addEventListener('ended', () => setPlaying(false));
      const initPosition = () => { if (times[1]) times[1].textContent = fmt(audio.duration); };
      audio.addEventListener('loadedmetadata', initPosition);
      if (audio.readyState >= 1) initPosition();
      audio.addEventListener('timeupdate', () => {
        if (audio.duration && barFill) barFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
        if (times[0]) times[0].textContent = fmt(audio.currentTime);
      });
      const bar = document.querySelector('.bar');
      if (bar) {
        const seekFromEvent = (clientX) => {
          if (!audio.duration) return;
          const rect = bar.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
          audio.currentTime = ratio * audio.duration;
        };
        let dragging = false;
        bar.addEventListener('pointerdown', (e) => { dragging = true; bar.setPointerCapture(e.pointerId); seekFromEvent(e.clientX); });
        bar.addEventListener('pointermove', (e) => { if (dragging) seekFromEvent(e.clientX); });
        bar.addEventListener('pointerup', () => { dragging = false; });
      }
      document.querySelectorAll('.ctrls button:not(.play)').forEach((b) => {
        b.addEventListener('click', () => { audio.currentTime = 0; });
      });

      /* ---- Autoplay: já abre tocando ---- */
      audio.loop = true; // música de fundo, em loop

      // 1) Tenta tocar direto (funciona se já houve interação antes — PWA, retorno, etc.)
      const tryAutoplay = () => { audio.play().catch(() => {}); };
      if (audio.readyState >= 1) tryAutoplay();
      else audio.addEventListener('loadedmetadata', tryAutoplay, { once: true });

      // 2) Se o navegador bloquear, começa no PRIMEIRO gesto do usuário.
      //    O toque em "toque para abrir" já serve. O play() precisa ser SÍNCRONO
      //    no handler do gesto para o iOS Safari aceitar o som.
      const evs = ['pointerdown', 'touchstart', 'click', 'keydown', 'wheel', 'scroll'];
      const onFirst = () => {
        if (!audio.paused) { evs.forEach((ev) => window.removeEventListener(ev, onFirst)); return; }
        autoStarting = true;
        const p = audio.play();
        if (p && p.then) p.then(() => {
          evs.forEach((ev) => window.removeEventListener(ev, onFirst));
        }).catch(() => { autoStarting = false; });
        setTimeout(() => { autoStarting = false; }, 500);
      };
      evs.forEach((ev) => window.addEventListener(ev, onFirst, { passive: true }));
    }
  }

  /* ---- Intro / abertura em carta ---- */
  function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;
    document.body.classList.add('intro-lock');

    const heroRise = [].slice.call(document.querySelectorAll('.hero .rise'));
    heroRise.forEach((el) => { el.classList.add('anim'); el.classList.remove('in'); });

    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      intro.classList.add('opening');
      document.body.classList.remove('intro-lock');
      setTimeout(() => { heroRise.forEach((el) => el.classList.add('in')); }, 450);
      setTimeout(() => { intro.classList.add('done'); }, 1750);
      setTimeout(() => { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 2200);
    };

    intro.addEventListener('click', open);
    intro.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); open(); }
    });
  }

  /* ============================================================
     MOTIVOS — edite o símbolo, o rótulo e a frase de cada carta ↓
     símbolos: #i-cross #i-dove #i-rings #i-bible #i-flame #i-heartcross
     ============================================================ */
  const MOTIVOS = [
    { sym: '#i-heartcross', label: 'amor', motivo: 'do seu amor, que me aproxima mais de Deus' },
    { sym: '#i-flame',      label: 'fé',   motivo: 'da sua fé, que me inspira a buscar a Cristo' },
    { sym: '#i-dove',       label: 'paz',  motivo: 'da paz que você traz pra minha vida' },
    { sym: '#i-bible',      label: 'palavra', motivo: 'de cada oração e palavra que você compartilha comigo' },
    { sym: '#i-rings',      label: 'aliança', motivo: 'do sonho de construir uma família com você, debaixo da bênção de Deus' },
    { sym: '#i-cross',      label: 'graça', motivo: 'de Deus ter me dado você — graça que eu não merecia' }
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---- Carrossel de cartas (viram ao tocar) ---- */
  function initDeck() {
    const rail = document.querySelector('[data-deck]');
    if (!rail) return;
    rail.innerHTML = MOTIVOS.map((c) =>
      '<button class="tcard" type="button" aria-label="virar carta">' +
        '<span class="tcard-inner">' +
          '<span class="tcard-face tcard-front">' +
            '<svg class="tcard-sym" viewBox="0 0 24 24"><use href="' + esc(c.sym) + '"/></svg>' +
            '<span class="tcard-label">' + esc(c.label) + '</span>' +
            '<span class="tcard-hint">toque para virar</span>' +
          '</span>' +
          '<span class="tcard-face tcard-back">' +
            '<span class="b-eyebrow">agradeço a Deus</span>' +
            '<span class="b-reason">' + esc(c.motivo) + '</span>' +
          '</span>' +
        '</span></button>').join('');

    rail.querySelectorAll('.tcard').forEach((c) => {
      c.addEventListener('click', () => c.classList.toggle('flipped'));
    });

    const stage = rail.closest('.lovers-stage');
    if (stage) {
      const step = () => {
        const card = rail.querySelector('.tcard');
        return card ? card.offsetWidth + 18 : 260;
      };
      const prev = stage.querySelector('.lv-nav.prev');
      const next = stage.querySelector('.lv-nav.next');
      if (prev) prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    }
  }

  /* ---- Cruz/coração que explode ---- */
  function initTapHeart() {
    const tap = document.querySelector('.tapheart');
    if (!tap) return;
    const glyphs = ['✝', '♥', '✟', '❤', '✞'];
    tap.addEventListener('click', () => {
      const rect = tap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 12; i++) {
        const h = document.createElement('div');
        h.className = 'burst';
        h.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        h.style.left = cx + 'px';
        h.style.top = cy + 'px';
        h.style.setProperty('--dx', (Math.random() * 180 - 90).toFixed(0) + 'px');
        h.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
        h.style.animationDelay = (Math.random() * 0.25).toFixed(2) + 's';
        h.style.fontSize = (18 + Math.random() * 20).toFixed(0) + 'px';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 1700);
      }
    });
  }

  /* ---- Aplicar config ---- */
  function applyConfig() {
    document.querySelectorAll('[data-song-name]').forEach((n) => n.textContent = CONFIG.songName);
    document.querySelectorAll('[data-song-artist]').forEach((n) => n.textContent = CONFIG.songArtist);
    const link = document.querySelector('[data-spotify]');
    if (link) link.href = 'https://open.spotify.com/search/' +
      encodeURIComponent(CONFIG.songName + ' ' + CONFIG.songArtist);
    const startD = new Date(CONFIG.startDate);
    if (!isNaN(startD)) document.querySelectorAll('[data-since-date]').forEach((n) => n.textContent = fmtDate(startD));
    tickCounter();
  }

  /* ---- Boot ---- */
  function boot() {
    initDeck();
    initReveal();
    initIntro();
    initPlayer();
    initTapHeart();
    applyConfig();
    tickCounter();
    setInterval(tickCounter, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
