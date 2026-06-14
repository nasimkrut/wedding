/* ===========================================================================
   site.js — Свадебное приглашение (vanilla)
   Частицы-лепестки, scroll-reveal, parallax, обратный отсчёт, RSVP
   =========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme application (called by tweaks) ---------------- */
  var state = {
    theme: 'registan',
    petals: true,
    nameFont: 'serif'
  };

  window.applyWeddingTweaks = function (t) {
    if (!t) return;
    if (t.theme) { state.theme = t.theme; document.documentElement.setAttribute('data-theme', t.theme); }
    if (typeof t.petals === 'boolean') state.petals = t.petals;
    if (t.nameFont) {
      state.nameFont = t.nameFont;
      document.documentElement.style.setProperty(
        '--f-script',
        t.nameFont === 'script' ? "'Marck Script', cursive" : "'Cormorant Garamond', serif"
      );
    }
    refreshPetalColors();
    var cv = document.getElementById('petals');
    if (cv) cv.style.display = state.petals ? 'block' : 'none';
  };

  /* ---------------- Petals canvas ---------------- */
  var canvas, ctx, petals = [], petalColors = ['#d8b15a', '#cd5560', '#42a0b0'], W = 0, H = 0, raf = null;

  function readVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function refreshPetalColors() {
    petalColors = [
      readVar('--petal-a', '#d8b15a'),
      readVar('--petal-b', '#cd5560'),
      readVar('--petal-c', '#42a0b0')
    ];
  }

  function Petal(initial) {
    this.reset(initial);
  }
  Petal.prototype.reset = function (initial) {
    this.x = Math.random() * W;
    this.y = initial ? Math.random() * H : -20;
    this.size = 5 + Math.random() * 9;
    this.speedY = 0.5 + Math.random() * 1.2;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.05;
    this.sway = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.01 + Math.random() * 0.02;
    this.color = petalColors[(Math.random() * petalColors.length) | 0];
    this.opacity = 0.35 + Math.random() * 0.45;
  };
  Petal.prototype.step = function () {
    this.sway += this.swaySpeed;
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.sway) * 0.6;
    this.angle += this.spin;
    if (this.y > H + 30) this.reset(false);
  };
  Petal.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    // petal = ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  function resizePetals() {
    if (!canvas) return;
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function initPetals() {
    canvas = document.getElementById('petals');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizePetals();
    refreshPetalColors();
    var count = window.innerWidth < 560 ? 16 : 28;
    petals = [];
    for (var i = 0; i < count; i++) petals.push(new Petal(true));
    if (!prefersReduced) loop();
    window.addEventListener('resize', resizePetals);
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!state.petals) { ctx.clearRect(0, 0, W, H); return; }
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < petals.length; i++) { petals[i].step(); petals[i].draw(); }
  }

  /* Burst of petals at a point (for RSVP success) */
  function petalBurst(cx, cy) {
    if (prefersReduced || !canvas) return;
    var burst = [];
    for (var i = 0; i < 40; i++) {
      var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      burst.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        size: 5 + Math.random() * 8, angle: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.3,
        color: petalColors[(Math.random() * petalColors.length) | 0],
        life: 1
      });
    }
    var start = performance.now();
    function anim(now) {
      var dt = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < petals.length; i++) { petals[i].step(); petals[i].draw(); }
      var alive = false;
      for (var j = 0; j < burst.length; j++) {
        var p = burst[j];
        p.vy += 0.12; p.x += p.vx; p.y += p.vy; p.angle += p.spin;
        p.life = Math.max(0, 1 - dt / 2.4);
        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.angle);
          ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.restore();
        }
      }
      if (alive) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  /* ---------------- Scroll reveal (timer tween — rAF is frozen in capture) ---------------- */
  function tweenIn(el, scale) {
    var dur = 700;
    var delay = el.classList.contains('d4') ? 320 :
                el.classList.contains('d3') ? 240 :
                el.classList.contains('d2') ? 160 :
                el.classList.contains('d1') ? 80 : 0;
    var startAt = Date.now() + delay;
    function step() {
      var p = (Date.now() - startAt) / dur;
      if (p < 0) { setTimeout(step, 16); return; }
      if (p > 1) p = 1;
      var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.style.opacity = e;
      el.style.transform = scale
        ? 'scale(' + (0.92 + 0.08 * e) + ')'
        : 'translateY(' + (26 * (1 - e)) + 'px)';
      if (p < 1) setTimeout(step, 16);
      else { el.style.opacity = ''; el.style.transform = ''; el.style.willChange = ''; }
    }
    step();
  }

  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.reveal, .reveal-scale'));
    if (prefersReduced) return; // base CSS keeps everything visible
    // hide initially now that JS is confirmed running
    els.forEach(function (e) {
      e.style.opacity = '0';
      e.style.transform = e.classList.contains('reveal-scale') ? 'scale(.92)' : 'translateY(26px)';
    });
    var pending = els.slice();
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > -40) {
          tweenIn(pending[i], pending[i].classList.contains('reveal-scale'));
          pending.splice(i, 1);
        }
      }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    // safety net: never leave content stuck hidden
    setTimeout(function () {
      pending.forEach(function (e) { tweenIn(e, e.classList.contains('reveal-scale')); });
      pending.length = 0;
    }, 2500);
  }

  /* ---------------- Parallax on cover ---------------- */
  function initParallax() {
    if (prefersReduced) return;
    var orn = document.querySelector('.bg-ornament');
    var star = document.querySelector('.cover .star-top');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (orn) orn.style.transform = 'translateY(' + (y * 0.18) + 'px)';
        if (star && y < 900) star.style.transform = 'translateY(' + (y * 0.25) + 'px) rotate(' + (y * 0.04) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------- Countdown ---------------- */
  function initCountdown() {
    var target = new Date('2026-09-03T17:00:00+05:00').getTime(); // Ташкент / по местному
    var elD = document.getElementById('cd-d'),
        elH = document.getElementById('cd-h'),
        elM = document.getElementById('cd-m'),
        elS = document.getElementById('cd-s');
    if (!elD) return;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      elD.textContent = d;
      elH.textContent = pad(h);
      elM.textContent = pad(m);
      elS.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- RSVP form ---------------- */
  function initRsvp() {
    var form = document.getElementById('rsvp-form');
    if (!form) return;
    var guestsField = form.querySelector('.guests-field');
    var attendOpts = form.querySelectorAll('input[name="attend"]');
    var valEl = document.getElementById('guest-val');
    var minus = document.getElementById('g-minus');
    var plus = document.getElementById('g-plus');
    var count = 1;

    function syncGuestState() {
      var yes = form.querySelector('input[name="attend"]:checked');
      var attending = yes && yes.value === 'yes';
      guestsField.classList.toggle('dim', !attending);
    }
    function paintSeg() {
      form.querySelectorAll('.seg .opt').forEach(function (o) {
        var inp = o.querySelector('input');
        o.classList.toggle('on', inp.checked);
      });
    }
    attendOpts.forEach(function (i) {
      i.addEventListener('change', function () { paintSeg(); syncGuestState(); });
    });
    if (minus) minus.addEventListener('click', function () { count = Math.max(1, count - 1); valEl.textContent = count; });
    if (plus) plus.addEventListener('click', function () { count = Math.min(6, count + 1); valEl.textContent = count; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInp = form.querySelector('input[name="guestname"]');
      var name = (nameInp.value || '').trim();
      if (!name) {
        nameInp.focus();
        nameInp.style.borderColor = 'var(--pom)';
        setTimeout(function () { nameInp.style.borderColor = ''; }, 1400);
        return;
      }
      var yes = form.querySelector('input[name="attend"]:checked');
      var attending = yes && yes.value === 'yes';
      var done = document.getElementById('rsvp-done');
      var msg = document.getElementById('rsvp-done-msg');
      if (msg) {
        if (attending) {
          msg.textContent = name + ', мы будем счастливы видеть вас' +
            (count > 1 ? ' (гостей: ' + count + ')' : '') + ' на нашем празднике!';
        } else {
          msg.textContent = name + ', спасибо, что дали знать. Нам будет вас не хватать ❤';
        }
      }
      done.classList.add('show');
      var r = done.getBoundingClientRect();
      petalBurst(r.left + r.width / 2, r.top + r.height * 0.35);
    });

    paintSeg();
    syncGuestState();
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    initPetals();
    initReveal();
    initParallax();
    initCountdown();
    initRsvp();
    // apply any persisted tweak defaults already on <html>
    refreshPetalColors();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
