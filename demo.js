/* Fidelina — démo interactive de la page d'accueil.
   Parcours complet, 100 % dans le navigateur, avec des données fictives (rien n'est envoyé) :
   1 carte du commerce → 2 inscription du client par QR → 3 carte dans le téléphone
   → 4 comptoir : scan + points → 5 récompense → 6 tableau de bord.
   Ne montre que ce qui existe dans l'application (pas de Wallet, pas de notifications).
   CSP : aucun style inline dans le HTML, les couleurs passent par element.style (CSSOM). */
(() => {
  const root = document.getElementById('demo-app');
  if (!root) return;

  /* ---------- Outils ---------- */
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shade = (hex, a) => {
    const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const out = ch.map((c) => Math.max(0, Math.min(255, Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a))));
    return '#' + out.map((c) => c.toString(16).padStart(2, '0')).join('');
  };
  const readableOn = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1F2421' : '#FFFFFF';
  };
  const initials = (s) => (s || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'FI';

  /* ---------- Son (synthétisé, aucun fichier) ---------- */
  let ac = null, bus = null;
  const audio = () => {
    if (!S.sound) return null;
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
        ac = new C();
        const comp = ac.createDynamicsCompressor(); bus = ac.createGain(); bus.gain.value = 0.9;
        bus.connect(comp).connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch { return null; }
  };
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const tone = (f, d, o = {}) => {
    const c = audio(); if (!c) return;
    const t = c.currentTime + (o.at || 0), osc = c.createOscillator(), v = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d * 0.8);
    v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(o.g || 0.12, t + (o.attack || 0.006));
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(v).connect(bus); osc.start(t); osc.stop(t + d + 0.05);
  };
  const noise = (d, o = {}) => {
    const c = audio(); if (!c) return;
    const t = c.currentTime + (o.at || 0), n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), v = c.createGain();
    src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = o.q || 0.9;
    bp.frequency.setValueAtTime(o.f0 || 500, t); bp.frequency.exponentialRampToValueAtTime(o.f1 || 3000, t + d);
    v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(o.g || 0.06, t + d * 0.35); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(bp).connect(v).connect(bus); src.start(t); src.stop(t + d + 0.05);
  };
  const SFX = {
    click: () => tone(1500, 0.05, { type: 'triangle', g: 0.05 }),
    key: () => tone(2300 + Math.random() * 500, 0.025, { type: 'square', g: 0.012 }),
    whoosh: () => noise(0.38, { g: 0.045, f0: 350, f1: 2800 }),
    scan: () => noise(1.1, { g: 0.012, f0: 2300, f1: 2500, q: 6 }),
    beep: () => { tone(1850, 0.11, { type: 'square', g: 0.05 }); tone(2480, 0.09, { type: 'square', g: 0.035, at: 0.11 }); },
    pop: (k = 0) => tone(mtof(76 + k), 0.2, { g: 0.13, f2: mtof(83 + k) }),
    coin: (k = 0) => { tone(mtof(84 + k), 0.12, { type: 'triangle', g: 0.08 }); tone(mtof(91 + k), 0.35, { type: 'triangle', g: 0.07, at: 0.07 }); },
    card: () => { noise(0.35, { g: 0.05, f0: 500, f1: 4200 }); [79, 84, 88, 91].forEach((n, i) => tone(mtof(n), 1.1, { g: 0.07, at: 0.18 + i * 0.07 })); },
    ready: () => [72, 76, 79, 84].forEach((n, i) => tone(mtof(n), 0.9, { g: 0.08, at: i * 0.09 })),
    gift: () => { [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(mtof(n), 1.4, { type: 'triangle', g: 0.07, at: i * 0.065 })); noise(1, { g: 0.025, f0: 5000, f1: 9000, at: 0.35 }); },
    error: () => tone(230, 0.25, { type: 'sawtooth', g: 0.04, f2: 160 }),
  };

  /* ---------- Données (fictives) ---------- */
  const PRESETS = [
    { key: 'cafe', primary: '#4A2F22', accent: '#E2B97F' }, { key: 'restaurant', primary: '#6E1F1A', accent: '#F2C078' },
    { key: 'barber', primary: '#1F3350', accent: '#E0473F' }, { key: 'gym', primary: '#16181B', accent: '#B7F34A' },
    { key: 'beauty', primary: '#8A4B62', accent: '#F4C6D3' }, { key: 'gift', primary: '#5B2A86', accent: '#F7B731' },
    { key: 'clothing', primary: '#2F3A40', accent: '#D8C3A5' }, { key: 'electronics', primary: '#0F2A4A', accent: '#38BDF8' },
    { key: 'generic', primary: '#1C5841', accent: '#D9B77E' },
  ];
  const ACTS = {
    cafe: { label: 'قهوة', icon: '☕', preset: 'cafe', biz: 'Mon Commerce', title: 'Carte café', mode: 'stamps', visit: 1, welcome: 0, steps: 10, style: 'stamps',
      rewards: [{ name: 'قهوة فابور', pts: 10 }, { name: 'فطور فابور', pts: 20 }] },
    snack: { label: 'سناك', icon: '🥪', preset: 'restaurant', biz: 'Mon Commerce', title: 'Carte fidélité', mode: 'points', unit: 10, ppu: 1, welcome: 5, steps: 10, style: 'circles', amounts: [45, 60, 85],
      rewards: [{ name: 'ساندويتش فابور', pts: 30 }, { name: 'منيو كامل فابور', pts: 60 }] },
    barber: { label: 'حلاق', icon: '💈', preset: 'barber', biz: 'Mon Commerce', title: 'Carte fidélité', mode: 'stamps', visit: 1, welcome: 0, steps: 8, style: 'circles',
      rewards: [{ name: 'حسانة فابور', pts: 8 }, { name: 'حسانة ولحية فابور', pts: 14 }] },
    patisserie: { label: 'حلويات', icon: '🧁', preset: 'beauty', biz: 'Mon Commerce', title: 'Carte gourmande', mode: 'points', unit: 10, ppu: 1, welcome: 5, steps: 10, style: 'bar', amounts: [40, 75, 120],
      rewards: [{ name: 'طارطة صغيرة فابور', pts: 40 }, { name: 'كيكة صغيرة فابور', pts: 100 }] },
  };
  const STAFF = [{ name: 'Salma', role: 'كاشير' }, { name: 'Karim', role: 'كاشير' }, { name: 'Yassine', role: 'مسؤول' }];
  const FAKE = [
    { name: 'فاطمة الزهراء الإدريسي', bal: 0.7, when: 'اليوم' }, { name: 'أمين برادة', bal: 0.4, when: 'البارح' },
    { name: 'خديجة التازي', bal: 0.9, when: 'قبل 2 أيام' }, { name: 'عمر بنجلون', bal: 0.2, when: 'قبل 3 أيام' }, { name: 'نادية العلوي', bal: 0.55, when: 'قبل 5 أيام' },
  ];
  const BASE = { clients: 128, newClients: 23, visits: 412, points: 3960, rewards: 37 };
  const SAMPLE = { name: 'ياسين العلوي', phone: '06 61 23 45 67' };
  const STEPS = [
    { key: 'design', label: 'الكارطة', who: 'مول المحل' },
    { key: 'join', label: 'التسجيل', who: 'الكليان' },
    { key: 'card', label: 'فالتيليفون', who: 'الكليان' },
    { key: 'counter', label: 'الكونتوار', who: 'الخدام' },
    { key: 'reward', label: 'الهدية', who: 'الخدام + الكليان' },
    { key: 'dash', label: 'الداشبورد', who: 'مول المحل' },
  ];

  const S = {
    step: 0, max: 0, sound: true, act: 'cafe', primary: '', accent: '', preset: '', style: '', biz: '',
    cust: { name: '', phone: '', email: '' }, number: 'FID-' + (4000 + Math.floor(Math.random() * 5000)) + '-' + String(1000 + Math.floor(Math.random() * 8999)),
    joined: false, recognized: false, balance: 0, tx: [], redeemed: null, earned: 0, visits: 0, day: 0, busy: false, amount: null,
  };
  const A = () => ACTS[S.act];
  const unitWord = (n) => (A().mode === 'stamps' ? (n === 1 ? 'طابع' : 'طوابع') : n === 1 ? 'نقطة' : 'نقط');
  const ruleText = () => (A().mode === 'stamps' ? `طابع فكل زيارة` : `${A().ppu === 1 ? 'نقطة' : A().ppu + ' نقط'} على كل ${A().unit} دراهم`);
  const nextReward = () => A().rewards.find((r) => r.pts > S.balance) || A().rewards[A().rewards.length - 1];
  const available = () => A().rewards.filter((r) => S.balance >= r.pts);
  const firstName = () => (S.cust.name || SAMPLE.name).trim().split(/\s+/)[0];
  const ptsFor = (amount) => (A().mode === 'stamps' ? A().visit : Math.floor(amount / A().unit) * A().ppu);

  function applyAct(key, keepColors = false) {
    S.act = key;
    const a = ACTS[key], p = PRESETS.find((x) => x.key === a.preset);
    S.preset = a.preset; S.style = a.style; S.biz = a.biz;
    if (!keepColors) { S.primary = p.primary; S.accent = p.accent; }
  }
  applyAct('cafe');

  /* ---------- Fond de carte (même rendu que l'application) ---------- */
  const MOTIFS = {
    cafe: (c) => `<g fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><ellipse cx="26" cy="28" rx="11" ry="16" transform="rotate(35 26 28)"/><path d="M16 38c8-3 12-9 20-20"/><ellipse cx="74" cy="72" rx="11" ry="16" transform="rotate(-30 74 72)"/><path d="M82 62c-8 3-12 9-20 20"/><circle cx="76" cy="22" r="2.4"/><circle cx="22" cy="78" r="2.4"/></g>`,
    restaurant: (c) => `<g fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><circle cx="28" cy="30" r="17"/><circle cx="28" cy="30" r="10"/><path d="M68 56v36M63 56v12a5 5 0 0 0 10 0V56M85 56c-5 6-5 16 0 20v16"/></g>`,
    clothing: (c) => `<g fill="none" stroke="${c}" stroke-width="1.6"><path d="M-10 60L60-10M10 110L110 10M-10 110L110-10" stroke-dasharray="1 5"/><path d="M-10 30L30-10M70 110L110 70"/></g>`,
    barber: (c) => `<g fill="${c}"><path d="M0 20L20 0H44L0 44zM0 76L76 0H100L0 100zM56 100L100 56V80L80 100z"/></g>`,
    beauty: (c) => `<g fill="${c}"><circle cx="22" cy="24" r="14" opacity=".55"/><circle cx="78" cy="70" r="20" opacity=".4"/><circle cx="70" cy="18" r="5"/><path d="M26 74l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></g>`,
    gift: (c) => `<g fill="${c}"><rect x="14" y="16" width="9" height="4" rx="1" transform="rotate(30 18 18)"/><rect x="70" y="14" width="9" height="4" rx="1" transform="rotate(-40 74 16)"/><circle cx="48" cy="40" r="3"/><path d="M80 52l5 9h-10z"/><rect x="24" y="64" width="9" height="4" rx="1" transform="rotate(-20 28 66)"/><circle cx="62" cy="84" r="3.4"/><path d="M12 46l4 7H8z"/><circle cx="90" cy="88" r="2"/></g>`,
    gym: (c) => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M0 34l50-22 50 22"/><path d="M0 62l50-22 50 22"/><path d="M0 90l50-22 50 22"/></g>`,
    electronics: (c) => `<g fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><path d="M8 22h28v26h24M60 48v22h30M36 22V8M8 78h26v16M60 70H44"/><circle cx="8" cy="22" r="3.2"/><circle cx="90" cy="70" r="3.2"/><circle cx="60" cy="48" r="2.6" fill="${c}"/><circle cx="34" cy="94" r="3.2"/></g>`,
  };
  const TILE = { cafe: 30, restaurant: 34, clothing: 28, barber: 36, beauty: 38, gift: 32, gym: 30, electronics: 34 };
  function paintBg(el, preset, primary) {
    const dark = readableOn(primary) === '#FFFFFF';
    const base = dark ? `linear-gradient(135deg, ${shade(primary, 0.14)} 0%, ${primary} 48%, ${shade(primary, -0.42)} 100%)` : `linear-gradient(135deg, ${shade(primary, 0.93)} 0%, ${shade(primary, 0.84)} 100%)`;
    const glow = dark ? 'radial-gradient(circle at 88% 8%, rgba(255,255,255,0.16), transparent 46%)' : 'radial-gradient(circle at 88% 8%, rgba(255,255,255,0.7), transparent 50%)';
    el.style.backgroundColor = primary;
    if (!MOTIFS[preset]) {
      el.style.backgroundImage = [glow, 'radial-gradient(circle at 6% 104%, rgba(0,0,0,0.28), transparent 44%)', base].join(', ');
      el.style.backgroundSize = 'cover'; el.style.backgroundRepeat = 'no-repeat';
      return;
    }
    const op = preset === 'barber' ? 0.07 : 0.13;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g opacity='${op}'>${MOTIFS[preset](dark ? '#FFFFFF' : primary)}</g></svg>`;
    el.style.backgroundImage = [glow, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, base].join(', ');
    el.style.backgroundSize = ['cover', `${TILE[preset]}cqw ${TILE[preset]}cqw`, 'cover'].join(', ');
    el.style.backgroundRepeat = 'no-repeat, repeat, no-repeat';
    el.style.backgroundPosition = 'center, right -4cqw top -2cqw, center';
  }

  /* ---------- Carte de fidélité ---------- */
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';
  function cardHTML() {
    return `<div class="dc"><div class="dc-bg"></div><div class="dc-in">
      <div class="dc-head"><span class="dc-biz"></span></div>
      <div class="dc-body"><div class="dc-txt"><p class="dc-title"></p><p class="dc-name"></p><p class="dc-num"></p></div>
        <div class="dc-qr"><img src="assets/img/qr_illustrative.svg" alt=""><i class="dc-laser"></i></div></div>
      <div class="dc-foot"><div class="dc-track"></div><div class="dc-meta"><span class="dc-count"></span><span class="dc-reward"></span></div></div>
    </div></div>`;
  }
  function renderCard(wrap, { name, number, balance }) {
    const a = A(), ink = readableOn(S.primary) === '#FFFFFF' ? '#FFFFFF' : '#1F2421', dim = ink + '59';
    const card = $('.dc', wrap);
    card.style.color = ink;
    paintBg($('.dc-bg', wrap), S.preset, S.primary);
    $('.dc-biz', wrap).textContent = S.biz || a.biz;
    $('.dc-title', wrap).textContent = a.title;
    $('.dc-name', wrap).textContent = name;
    $('.dc-num', wrap).textContent = number;
    const reached = a.rewards.filter((r) => balance >= r.pts);
    const complete = reached.length > 0;
    const goal = complete ? reached[reached.length - 1] : a.rewards[0];
    const doneR = reached[reached.length - 1];
    const steps = a.steps, filled = complete ? steps : Math.floor(Math.min(1, balance / goal.pts) * steps);
    // piste
    const tr = $('.dc-track', wrap); tr.innerHTML = ''; tr.className = 'dc-track ' + S.style; tr.style.setProperty('--n', String(steps + 1));
    const onAcc = readableOn(S.accent);
    const gift = h('span', 'dc-gift', ICON_GIFT);
    Object.assign(gift.style, { borderColor: S.accent, background: complete ? S.accent : 'transparent', color: complete ? onAcc : S.accent });
    if (S.style === 'bar') {
      const bar = h('div', 'dc-bar'); bar.style.background = ink + '2E';
      const fill = h('i'); fill.style.background = S.accent; fill.style.width = (filled / steps) * 100 + '%'; bar.appendChild(fill);
      for (let i = 1; i < steps; i++) { const s = h('b'); s.style.insetInlineStart = (i / steps) * 100 + '%'; s.style.background = ink + '40'; bar.appendChild(s); }
      tr.append(bar, gift);
    } else {
      for (let i = 0; i < steps; i++) {
        const done = i < filled;
        if (i > 0) { const c = h('span', 'dc-con'); c.style.background = done ? S.accent : dim; tr.appendChild(c); }
        const n = h('span', 'dc-dot' + (done ? ' on' : ''), done ? ICON_CHECK : String(i + 1));
        Object.assign(n.style, { background: done ? S.accent : 'transparent', color: done ? onAcc : ink, borderColor: done ? S.accent : dim, borderStyle: S.style === 'stamps' && !done ? 'dashed' : 'solid' });
        if (S.style === 'stamps' && done) n.style.transform = `rotate(${i % 2 ? 5 : -5}deg)`;
        tr.appendChild(n);
      }
      const c = h('span', 'dc-con'); c.style.background = complete ? S.accent : dim; tr.append(c, gift);
    }
    $('.dc-count', wrap).textContent = a.mode === 'stamps' ? `${Math.min(balance, steps)} / ${steps}` : `${fmt(balance)} / ${fmt(goal.pts)} pts`;
    $('.dc-reward', wrap).innerHTML = complete && doneR ? `🎁 <bdi>${esc(doneR.name)}</bdi> واجدة` : `الهدية: <bdi>${esc(goal.name)}</bdi>`;
    $('.dc-meta', wrap).style.color = ink + 'B3'; $('.dc-count', wrap).style.color = ink;
  }

  /* ---------- Squelette ---------- */
  root.innerHTML = `
  <div class="dm-top">
    <ol class="dm-steps" aria-label="المراحل ديال الديمو"></ol>
    <button type="button" class="dm-sound" aria-pressed="true" title="الصوت"><span class="on">🔊</span><span class="off">🔇</span><span class="sr">الصوت</span></button>
  </div>
  <div class="dm-body">
    <div class="dm-panel" aria-live="polite"></div>
    <div class="dm-stage">
      <div class="dm-poster"><div class="pst-head"><span class="pst-logo"></span><b class="pst-biz lat"></b><small>برنامج الوفاء</small></div>
        <p class="pst-h">الكارطة ديال الوفاء ديالك ف<span class="lat">30</span> ثانية</p>
        <div class="pst-qr"><img src="assets/img/qr_illustrative.svg" alt="QR"></div>
        <ol class="pst-steps"><li><i class="lat">1</i>سكاني</li><li><i class="lat">2</i>السمية والتيليفون</li><li><i class="lat">3</i>خود الكارطة</li></ol>
        <p class="pst-rule"></p></div>
      <div class="dm-phone" data-view="card"><div class="ph-notch"></div><div class="ph-screen">
        <div class="ph-view v-camera"><div class="cam-bg"><div class="cam-poster"><img src="assets/img/qr_illustrative.svg" alt=""></div></div>
          <div class="cam-frame"><i></i><i></i><i></i><i></i><b></b></div><p class="cam-hint">وجّه الكاميرا على QR</p><div class="cam-flash"></div></div>
        <div class="ph-view v-join"></div>
        <div class="ph-view v-card"></div>
      </div></div>
      <div class="dm-pos" data-view="scan">
        <div class="pos-bar"><span class="pos-logo"></span><b class="pos-biz lat"></b>
          <nav class="pos-tabs"><span data-t="scan">سكانير</span><span data-t="dash">الإحصائيات</span></nav>
          <span class="pos-user"></span></div>
        <div class="pos-view pv-scan">
          <div class="pos-find"><div class="pos-cam"><i></i><i></i><i></i><i></i><b></b><span class="pos-cam-txt">الكاميرا ديال التيليفون ولا التابليت</span></div>
          <button type="button" class="dbtn dbtn-main pos-scan-btn">📷 سكاني الكارطة ديال الكليان</button>
          <button type="button" class="dbtn dbtn-soft pos-phone-btn">ولا قلّب بالتيليفون</button>
          <div class="pos-search"><span class="pos-search-in"></span></div></div></div>
        <div class="pos-view pv-cust"></div>
        <div class="pos-view pv-dash"></div>
        <div class="pos-modal" hidden></div>
      </div>
      <div class="dm-toast" hidden></div>
    </div>
  </div>
  <button type="button" class="dm-pip" aria-label="شوف التيليفون ديال الكليان" tabindex="-1"><span class="pip-tag">● مباشر فالتيليفون</span><div class="pip-card">${cardHTML()}</div><span class="pip-txt"></span></button>`;

  const panel = $('.dm-panel'), stage = $('.dm-stage'), phone = $('.dm-phone'), pos = $('.dm-pos'), poster = $('.dm-poster');

  /* ---------- Aperçu flottant (écrans étroits) ----------
     Sur téléphone, la scène passe sous le panneau : quand le téléphone de la démo n'est pas à l'écran,
     une petite carte reste visible en haut et rebondit à chaque changement. Un appui ramène au téléphone. */
  const pip = $('.dm-pip');
  const vis = { root: false, phone: false };
  const narrow = () => innerWidth <= 1020;
  function syncPip() {
    const on = narrow() && vis.root && !vis.phone && S.step <= 4 && phone.dataset.view !== 'camera' && phone.dataset.view !== 'camera-idle';
    pip.classList.toggle('show', on);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { vis.root = es[0].isIntersecting; syncPip(); }).observe(root);
    new IntersectionObserver((es) => { vis.phone = es[0].intersectionRatio > 0.35; syncPip(); }, { threshold: [0, 0.35, 0.6] }).observe(phone);
  }
  addEventListener('resize', syncPip, { passive: true });
  pip.addEventListener('click', () => { SFX.click(); phone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); });
  function updatePip(args, txt, changed) {
    renderCard($('.pip-card', pip), args);
    $('.pip-txt', pip).innerHTML = txt;
    if (changed && pip.classList.contains('show') && !reduced) {
      pip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)' });
    }
    syncPip();
  }

  // étapes
  const ol = $('.dm-steps');
  STEPS.forEach((s, i) => {
    const li = h('li'); const b = h('button', 'dm-step', `<span class="n lat">${i + 1}</span><span class="l">${s.label}</span>`);
    b.type = 'button'; b.addEventListener('click', () => { if (i <= S.max && !S.busy) { SFX.click(); go(i); } });
    li.appendChild(b); ol.appendChild(li);
  });
  $('.dm-sound').addEventListener('click', (e) => {
    S.sound = !S.sound; e.currentTarget.setAttribute('aria-pressed', String(S.sound)); e.currentTarget.classList.toggle('muted', !S.sound);
    if (S.sound) SFX.click();
  });

  /* ---------- Petits effets ---------- */
  function flyer(target, text, cls = '') {
    const r = target.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const f = h('span', 'dm-fly ' + cls, text);
    f.style.left = r.left - sr.left + r.width / 2 + 'px'; f.style.top = r.top - sr.top + r.height / 2 + 'px';
    stage.appendChild(f);
    const an = f.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-230%) scale(1)', opacity: 0 }], { duration: reduced ? 600 : 1300, easing: 'cubic-bezier(.2,.7,.2,1)' });
    an.onfinish = () => f.remove();
  }
  function confetti(target, n = 46) {
    const r = target.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const cols = [S.accent, '#59C083', '#A8EFC6', '#E9A23B', '#FFFFFF', S.primary];
    for (let i = 0; i < n; i++) {
      const c = h('i', 'dm-conf');
      c.style.left = r.left - sr.left + r.width / 2 + 'px'; c.style.top = r.top - sr.top + r.height * 0.35 + 'px';
      c.style.background = cols[i % cols.length]; if (i % 3 === 0) c.style.borderRadius = '50%';
      stage.appendChild(c);
      const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 170, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60;
      const an = c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.55 }, { transform: `translate(${dx * 1.1}px,${dy + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1400 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.3,1)' });
      an.onfinish = () => c.remove();
    }
  }
  let toastT;
  function toast(html, tone = '') {
    const t = $('.dm-toast'); t.className = 'dm-toast ' + tone; t.innerHTML = html; t.hidden = false;
    t.animate([{ opacity: 0, transform: 'translate(-50%,10px)' }, { opacity: 1, transform: 'translate(-50%,0)' }], { duration: 250, easing: 'ease-out' });
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600);
  }
  function countUp(el, to, dur = 900) {
    const from = Number(el.dataset.v || 0); el.dataset.v = to;
    if (reduced || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  // Sur un écran étroit, la scène est sous le panneau : on la ramène à l'écran avant une animation
  const showStage = (el = stage) => { if (innerWidth <= 1020) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); };
  const bump = (el) => el && el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
  async function typeInto(input, text, ms = 55) {
    input.value = ''; input.focus({ preventScroll: true });
    for (const ch of text) { input.value += ch; if (ch !== ' ') SFX.key(); await wait(reduced ? 5 : ms); }
    input.dispatchEvent(new Event('input'));
  }

  /* ---------- Chrome commun (logo, couleurs) ---------- */
  function paintBrand() {
    const ini = initials(S.biz);
    [$('.pst-logo'), $('.pos-logo')].forEach((e) => { e.textContent = ini; e.style.background = S.primary; e.style.color = readableOn(S.primary); });
    $('.pst-biz').textContent = S.biz; $('.pos-biz').textContent = S.biz;
    $('.pst-head').style.background = S.primary; $('.pst-head').style.color = readableOn(S.primary);
    $('.pst-rule').textContent = `${ruleText()} · ${A().rewards[0].pts} ${unitWord(A().rewards[0].pts)} = ${A().rewards[0].name}`;
    root.style.setProperty('--brand', S.primary); root.style.setProperty('--brand-acc', S.accent);
  }

  /* ---------- Téléphone : inscription ---------- */
  function buildJoin() {
    const a = A(), v = $('.v-join');
    v.innerHTML = `<div class="pj-head"><span class="pj-logo"></span><div><b class="lat">${esc(S.biz)}</b><small>برنامج الوفاء</small></div></div>
      <h4>دخل لبرنامج الوفاء</h4>
      <div class="pj-perks"></div>
      <label class="pj-f"><span>السمية الكاملة</span><input type="text" class="pj-name" autocomplete="off" placeholder="السمية والنسب" maxlength="40"></label>
      <label class="pj-f"><span>التيليفون</span><input type="tel" class="pj-phone lat" autocomplete="off" placeholder="06 61 23 45 67" maxlength="14" inputmode="tel"></label>
      <label class="pj-f"><span>الإيميل <small>(اختياري)</small></span><input type="email" class="pj-mail lat" autocomplete="off" placeholder="email@exemple.ma" maxlength="40"></label>
      <p class="pj-err" hidden></p>
      <label class="pj-ok"><input type="checkbox" class="pj-consent"><span>كنقبل سياسة الخصوصية والشروط ديال البرنامج.</span></label>
      <button type="button" class="dbtn dbtn-brand pj-go">خود الكارطة ديالي</button>
      <p class="pj-foot">بلا كلمة سر · بلا خلاص · بلا أبليكاسيون</p>`;
    const logo = $('.pj-logo', v); logo.textContent = initials(S.biz); logo.style.background = S.primary; logo.style.color = readableOn(S.primary);
    const perks = $('.pj-perks', v);
    if (a.welcome) perks.appendChild(h('span', null, `🎉 <b class="lat">${a.welcome}</b> ${unitWord(a.welcome)} هدية فالتسجيل`));
    perks.appendChild(h('span', null, `⭐ ${ruleText()}`));
    perks.appendChild(h('span', null, `🎁 من <b class="lat">${a.rewards[0].pts}</b> ${unitWord(a.rewards[0].pts)}: ${esc(a.rewards[0].name)}`));
    const btn = $('.pj-go', v); btn.style.background = S.primary; btn.style.color = readableOn(S.primary);
    $('.pj-name', v).value = S.cust.name; $('.pj-phone', v).value = S.cust.phone; $('.pj-mail', v).value = S.cust.email;
    btn.addEventListener('click', submitJoin);
  }
  async function fillSample() {
    if (S.busy) return; S.busy = true; SFX.click();
    const v = $('.v-join'); showStage(phone);
    await typeInto($('.pj-name', v), S.cust.name.trim() || SAMPLE.name);
    await wait(150); await typeInto($('.pj-phone', v), SAMPLE.phone, 45);
    await wait(150); const c = $('.pj-consent', v); c.checked = true; SFX.click();
    S.busy = false;
  }
  async function submitJoin() {
    if (S.busy) return;
    const v = $('.v-join'), err = $('.pj-err', v);
    const name = $('.pj-name', v).value.trim(), phoneRaw = $('.pj-phone', v).value.trim(), digits = phoneRaw.replace(/[\s.-]/g, '');
    let msg = '';
    if (name.length < 3) msg = 'كتب السمية والنسب.';
    else if (!/^0[5-7]\d{8}$/.test(digits)) msg = 'الرقم ماشي صحيح. مثال: 06 61 23 45 67';
    else if (!$('.pj-consent', v).checked) msg = 'خاصك تقبل الشروط باش تدخل للبرنامج.';
    if (msg) { err.textContent = msg; err.hidden = false; SFX.error(); bump(err); return; }
    err.hidden = true; S.busy = true; SFX.click();
    S.cust = { name, phone: digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim(), email: $('.pj-mail', v).value.trim() };
    const btn = $('.pj-go', v); btn.classList.add('loading'); btn.textContent = 'كنصاوبو الكارطة…';
    await wait(reduced ? 100 : 900);
    S.joined = true; S.balance = 0; S.tx = [];
    if (A().welcome) { S.balance = A().welcome; S.earned += A().welcome; addTx('welcome', A().welcome, { staff: '—' }); }
    S.busy = false; SFX.card();
    S.max = Math.max(S.max, 2); go(2, { celebrate: true });
  }

  /* ---------- Téléphone : la carte du client ---------- */
  function buildCardView() {
    const v = $('.v-card'), preview = !S.joined;
    v.innerHTML = `<div class="pc-head"><span class="pc-logo"></span><b class="lat">${esc(S.biz)}</b></div>
      <div class="pc-card">${cardHTML()}</div>
      <div class="pc-hello"></div>
      <div class="pc-bal"><span>الرصيد ديالك</span><b><span class="pc-bal-n lat">0</span> <small class="pc-bal-u"></small></b></div>
      <div class="pc-next"><p class="pc-next-t"></p><div class="pc-prog"><i></i></div></div>
      <p class="pc-sec">الهدايا</p><ul class="pc-rew"></ul>
      <p class="pc-sec">آخر العمليات</p><ul class="pc-ops"></ul>
      <p class="pc-foot">Propulsé par <b>Fidelina</b></p>`;
    const logo = $('.pc-logo', v); logo.textContent = initials(S.biz); logo.style.background = S.primary; logo.style.color = readableOn(S.primary);
    v.classList.toggle('preview', preview);
    updateCardView(true);
  }
  function updateCardView(instant = false) {
    const v = $('.v-card'); if (!$('.pc-card', v)) return;
    const preview = !S.joined;
    const bal = preview ? Math.round(A().rewards[0].pts * 0.6) : S.balance;
    const cardArgs = { name: preview ? 'Salma B.' : S.cust.name, number: preview ? 'FID-1234-5678' : S.number, balance: bal };
    renderCard($('.pc-card', v), cardArgs);
    updatePip(cardArgs, preview ? 'هكا غادي تبان عند الكليان' : `الرصيد: <b class="lat">${fmt(bal)}</b> ${unitWord(bal)}`, !instant || preview);
    $('.pc-hello', v).innerHTML = preview ? 'هكا غادي تبان الكارطة عند الكليان' : `مرحبا <bdi>${esc(firstName())}</bdi> 👋 هادي الكارطة ديالك ف<bdi class="lat">${esc(S.biz)}</bdi>`;
    const n = $('.pc-bal-n', v); instant ? ((n.textContent = fmt(bal)), (n.dataset.v = bal)) : countUp(n, bal, 700);
    $('.pc-bal-u', v).textContent = unitWord(bal);
    const goal = A().rewards.find((r) => r.pts > bal), av = A().rewards.filter((r) => bal >= r.pts);
    const nt = $('.pc-next-t', v), pr = $('.pc-prog i', v);
    if (av.length && !preview) { nt.innerHTML = `🎁 <b>${esc(av[av.length - 1].name)}</b> واجدة! طلبها فالكونتوار.`; pr.style.width = '100%'; }
    else { const g = goal || A().rewards[0]; nt.innerHTML = `باقي ليك <b class="lat">${fmt(g.pts - bal)}</b> ${unitWord(g.pts - bal)} على <b>${esc(g.name)}</b>`; pr.style.width = Math.min(100, (bal / g.pts) * 100) + '%'; }
    pr.style.background = S.accent;
    const ul = $('.pc-rew', v); ul.innerHTML = '';
    A().rewards.forEach((r) => {
      const ok = bal >= r.pts;
      ul.appendChild(h('li', ok ? 'ok' : '', `<span>🎁 ${esc(r.name)}</span><b class="lat">${fmt(r.pts)}</b><em>${ok ? 'واجدة' : 'باقي ' + fmt(r.pts - bal)}</em>`));
    });
    const ops = $('.pc-ops', v); ops.innerHTML = '';
    const list = preview ? [] : S.tx.slice(-4).reverse();
    if (!list.length) ops.appendChild(h('li', 'empty', preview ? 'العمليات ديال الكليان كيبانو هنا.' : 'حتى عملية مازال.'));
    list.forEach((t) => ops.appendChild(h('li', t.pts < 0 ? 'neg' : '', `<span>${esc(t.label)}</span><b class="lat">${t.pts > 0 ? '+' : ''}${fmt(t.pts)}</b><small>${esc(t.when)}</small>`)));
  }

  /* ---------- Comptoir (application du commerçant) ---------- */
  function addTx(kind, pts, o = {}) {
    const a = A();
    const label = kind === 'welcome' ? 'نقط الترحيب' : kind === 'redeem' ? 'هدية: ' + o.reward : a.mode === 'stamps' ? 'زيارة' : `شرا ${fmt(o.amount)} DH`;
    const when = S.day === 0 ? 'دابا' : `بعد ${S.day} يوم`;
    S.tx.push({ kind, pts, amount: o.amount || 0, staff: o.staff || 'Salma', when, label });
  }
  function buildCust() {
    const a = A(), v = $('.pv-cust');
    v.innerHTML = `<div class="pcu-top"><span class="pcu-av"></span><div class="pcu-id"><b><bdi class="pcu-name"></bdi></b><small class="lat pcu-num"></small></div><span class="pcu-st">● الكارطة خدامة</span></div>
      <div class="pcu-grid">
        <div class="pcu-bal"><small>الرصيد</small><b><span class="pcu-bal-n lat">0</span> <em class="pcu-bal-u"></em></b><div class="pcu-prog"><i></i></div><p class="pcu-next"></p></div>
        <div class="pcu-earn"></div>
      </div>
      <button type="button" class="dbtn dbtn-gift pcu-gift" disabled>🎁 استعمل هدية</button>
      <p class="pcu-sec">آخر العمليات</p><ul class="pcu-ops"></ul>`;
    const av = $('.pcu-av', v); av.textContent = initials(S.cust.name); av.style.background = S.accent; av.style.color = readableOn(S.accent);
    $('.pcu-name', v).textContent = S.cust.name; $('.pcu-num', v).textContent = `${S.number} · ${S.cust.phone}`;
    const e = $('.pcu-earn', v);
    if (a.mode === 'stamps') {
      e.innerHTML = `<small>${ruleText()}</small><button type="button" class="dbtn dbtn-main pcu-go">✓ سجّل زيارة · <span class="lat">+${a.visit}</span> ${unitWord(a.visit)}</button>`;
    } else {
      e.innerHTML = `<small>مبلغ الشرا (درهم) · ${ruleText()}</small>
        <div class="pcu-amt"><input type="text" inputmode="numeric" class="pcu-in lat" placeholder="مثلا 85" maxlength="5"><span class="lat">DH</span></div>
        <div class="pcu-chips">${a.amounts.map((x) => `<button type="button" class="chip lat" data-a="${x}">${x}</button>`).join('')}</div>
        <button type="button" class="dbtn dbtn-main pcu-go" disabled>كتب المبلغ</button>`;
      const inp = $('.pcu-in', e), go_ = $('.pcu-go', e);
      const sync = () => {
        const amt = Number(inp.value.replace(/\D/g, '')); inp.value = amt ? String(amt) : '';
        const p = ptsFor(amt); go_.disabled = !(p > 0);
        go_.innerHTML = p > 0 ? `✓ أكّد الشرا · <span class="lat">+${p}</span> ${unitWord(p)}` : amt ? `أقل من ${a.unit} DH = 0 ${unitWord(0)}` : 'كتب المبلغ';
        $$('.chip', e).forEach((c) => c.classList.toggle('on', Number(c.dataset.a) === amt));
      };
      inp.addEventListener('input', sync);
      $$('.chip', e).forEach((c) => c.addEventListener('click', () => { SFX.key(); inp.value = c.dataset.a; sync(); }));
    }
    $('.pcu-go', e).addEventListener('click', () => earn());
    $('.pcu-gift', v).addEventListener('click', openReward);
    updateCust(true);
  }
  function updateCust(instant = false) {
    const v = $('.pv-cust'); if (!$('.pcu-bal', v)) return;
    const n = $('.pcu-bal-n', v); instant ? ((n.textContent = fmt(S.balance)), (n.dataset.v = S.balance)) : countUp(n, S.balance, 600);
    $('.pcu-bal-u', v).textContent = unitWord(S.balance);
    const av = available(), g = nextReward(), p = $('.pcu-prog i', v);
    if (av.length) { $('.pcu-next', v).innerHTML = `🎁 <b>${esc(av[av.length - 1].name)}</b> واجدة`; p.style.width = '100%'; }
    else { $('.pcu-next', v).innerHTML = `باقي <b class="lat">${fmt(g.pts - S.balance)}</b> على ${esc(g.name)}`; p.style.width = Math.min(100, (S.balance / g.pts) * 100) + '%'; }
    p.style.background = S.accent;
    const gb = $('.pcu-gift', v); gb.disabled = !av.length || S.step !== 4; gb.classList.toggle('pulse', !!av.length && S.step === 4 && !S.redeemed);
    $('.pcu-go', v).toggleAttribute('hidden', S.step === 4);
    const ops = $('.pcu-ops', v); ops.innerHTML = '';
    S.tx.slice(-3).reverse().forEach((t) => ops.appendChild(h('li', t.pts < 0 ? 'neg' : '', `<span>${esc(t.label)}</span><small>${esc(t.staff)} · ${esc(t.when)}</small><b class="lat">${t.pts > 0 ? '+' : ''}${fmt(t.pts)}</b>`)));
    if (!S.tx.length) ops.appendChild(h('li', 'empty', 'حتى عملية مازال.'));
  }
  async function scanCard(byPhone = false) {
    if (S.busy || S.recognized) return; S.busy = true; SFX.click(); showStage(pos);
    if (byPhone) {
      const box = $('.pos-search-in'); $('.pos-search').classList.add('on'); box.textContent = '';
      for (const ch of S.cust.phone) { box.textContent += ch; if (ch !== ' ') SFX.key(); await wait(reduced ? 5 : 60); }
      await wait(250);
    } else {
      pos.classList.add('scanning'); phone.classList.add('show-qr'); SFX.scan();
      await wait(reduced ? 200 : 1400);
      pos.classList.remove('scanning'); phone.classList.remove('show-qr');
    }
    SFX.beep(); S.recognized = true; S.busy = false;
    toast('✓ الكارطة تعرّفات', 'ok');
    buildCust(); setPos('cust'); renderPanel();
  }
  async function earn(auto = null) {
    if (S.busy && !auto) return;
    const a = A(), v = $('.pv-cust');
    let amount = 0;
    if (a.mode === 'points') {
      amount = auto ? auto.amount : Number(($('.pcu-in', v) || {}).value || 0);
      if (!(ptsFor(amount) > 0)) return;
    }
    const pts = ptsFor(amount), had = available().length;
    S.balance += pts; S.earned += pts; S.visits++;
    addTx('earn', pts, { amount, staff: auto ? STAFF[S.visits % 2].name : 'Salma' });
    SFX.coin(Math.min(7, S.visits % 8));
    flyer($('.pcu-bal', v), `+${pts}`);
    if (!phone.hidden) flyer($('.pc-bal', $('.v-card')) || phone, `+${pts}`);
    updateCust(); updateCardView(); bump($('.pc-card .dc'));
    if (a.mode === 'points' && !auto) { const inp = $('.pcu-in', v); inp.value = ''; inp.dispatchEvent(new Event('input')); }
    if (!had && available().length) {
      await wait(350); SFX.ready(); toast(`🎁 <b>${esc(available()[0].name)}</b> ولات واجدة لـ <bdi>${esc(firstName())}</bdi>!`, 'gift');
      S.max = Math.max(S.max, 4); renderSteps(); renderPanel();
    }
  }
  async function fastForward() {
    if (S.busy || !S.recognized) return; S.busy = true; renderPanel(); showStage(pos);
    const a = A(), goal = a.rewards[0];
    let guard = 0;
    while (S.balance < goal.pts && guard++ < 40) {
      S.day += 2 + Math.floor(Math.random() * 4);
      await earn({ amount: a.mode === 'points' ? a.amounts[Math.floor(Math.random() * a.amounts.length)] : 0 });
      await wait(reduced ? 40 : 420);
    }
    S.busy = false; renderPanel();
  }
  function openReward() {
    if (!available().length || S.redeemed) return; SFX.click(); showStage(pos);
    const m = $('.pos-modal');
    m.innerHTML = `<div class="pm-box"><h5>ختار الهدية</h5><p class="pm-sub">الرصيد: <b class="lat">${fmt(S.balance)}</b> ${unitWord(S.balance)}</p><div class="pm-list"></div>
      <div class="pm-act"><button type="button" class="dbtn dbtn-soft pm-no">رجوع</button><button type="button" class="dbtn dbtn-main pm-yes" disabled>أكّد الهدية</button></div></div>`;
    const list = $('.pm-list', m); let pick = null;
    A().rewards.forEach((r) => {
      const ok = S.balance >= r.pts;
      const b = h('button', 'pm-r' + (ok ? '' : ' off'), `<span>🎁 ${esc(r.name)}</span><b class="lat">${fmt(r.pts)}</b><em>${ok ? 'واجدة' : 'باقي ' + fmt(r.pts - S.balance)}</em>`);
      b.type = 'button'; b.disabled = !ok;
      b.addEventListener('click', () => { SFX.key(); pick = r; $$('.pm-r', m).forEach((x) => x.classList.remove('on')); b.classList.add('on'); const y = $('.pm-yes', m); y.disabled = false; y.innerHTML = `أكّد · <span class="lat">-${fmt(r.pts)}</span> ${unitWord(r.pts)}`; });
      list.appendChild(b);
    });
    $('.pm-no', m).addEventListener('click', () => { SFX.click(); m.hidden = true; });
    $('.pm-yes', m).addEventListener('click', () => pick && redeem(pick));
    m.hidden = false; m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    $('.pm-box', m).animate([{ transform: 'translateY(18px) scale(.97)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  async function redeem(r) {
    if (S.busy) return; S.busy = true;
    const m = $('.pos-modal');
    S.balance -= r.pts; S.redeemed = r; S.day = S.day || 0;
    addTx('redeem', -r.pts, { reward: r.name });
    SFX.gift();
    $('.pm-box', m).innerHTML = `<div class="pm-done"><span class="pm-ok">✓</span><h5>الهدية تسجّلات</h5><p><bdi>${esc(firstName())}</bdi> خدا <b>${esc(r.name)}</b>.<br>العملية مسجّلة بسمية <b class="lat">Salma</b>، وما كتتمسحش.</p><button type="button" class="dbtn dbtn-main pm-close">مزيان</button></div>`;
    $('.pm-close', m).addEventListener('click', () => { SFX.click(); m.hidden = true; });
    confetti(phone.hidden ? pos : phone); setTimeout(() => confetti(pos, 24), 250);
    updateCust(); updateCardView(); bump($('.pc-card .dc'));
    toast(`🎉 <bdi>${esc(firstName())}</bdi> خدا ${esc(r.name)}`, 'gift');
    S.max = Math.max(S.max, 5); S.busy = false; renderSteps(); renderPanel();
  }

  /* ---------- Tableau de bord ---------- */
  function buildDash() {
    const v = $('.pv-dash'), a = A();
    const myVisits = S.tx.filter((t) => t.kind === 'earn').length, myRewards = S.tx.filter((t) => t.kind === 'redeem').length;
    const pts = S.tx.filter((t) => t.pts > 0).reduce((s, t) => s + t.pts, 0);
    const scale = a.mode === 'stamps' ? 0.25 : 1;
    v.innerHTML = `<div class="pd-head"><div><h5>مرحبا <span class="lat">Yassine</span> 👋</h5><small>هادشي اللي وقع فالمحل ديالك</small></div><div class="pd-per"><span>7 أيام</span><span class="on">30 يوم</span><span class="lat">12 m</span></div></div>
      <div class="pd-kpis">
        <div class="kpi hl"><small>الكليان الجداد</small><b class="lat" data-to="${BASE.newClients + 1}">0</b><em>+1 دابا: <bdi>${esc(firstName())}</bdi></em></div>
        <div class="kpi"><small>الزيارات</small><b class="lat" data-to="${BASE.visits + myVisits}">0</b><em>+${myVisits} فالديمو</em></div>
        <div class="kpi"><small>${a.mode === 'stamps' ? 'الطوابع اللي تعطاو' : 'النقط اللي تعطاو'}</small><b class="lat" data-to="${Math.round(BASE.points * scale) + pts}">0</b><em>+${fmt(pts)}</em></div>
        <div class="kpi"><small>الهدايا المستعملة</small><b class="lat" data-to="${BASE.rewards + myRewards}">0</b><em>+${myRewards}</em></div>
      </div>
      <div class="pd-chart"><p>الزيارات حسب النهار</p><div class="pd-bars"></div></div>
      <div class="pd-cols">
        <div class="pd-box"><p>حسب الخدام</p><table class="pd-staff"><thead><tr><th>الخدام</th><th>زيارات</th><th>كليان جداد</th></tr></thead><tbody></tbody></table></div>
        <div class="pd-box"><p>آخر الكليان</p><ul class="pd-cl"></ul></div>
      </div>
      <div class="pd-box"><p>السجل: كل عملية مسجّلة</p><ul class="pd-hist"></ul></div>`;
    // barres
    const bars = $('.pd-bars', v), rnd = ((s) => () => ((s = (s * 16807) % 2147483647) / 2147483647))(7);
    const vals = Array.from({ length: 14 }, (_, i) => Math.round(18 + rnd() * 22 + (i % 7 >= 5 ? 10 : 0)));
    vals[13] += myVisits;
    const mx = Math.max(...vals);
    vals.forEach((x, i) => {
      const b = h('i', i === 13 ? 'today' : ''); b.style.height = '0%'; b.title = x + ' زيارة'; bars.appendChild(b);
      setTimeout(() => { b.style.height = (x / mx) * 100 + '%'; }, 60 + i * 40);
    });
    // équipe
    const tb = $('.pd-staff tbody', v), myBy = (n) => S.tx.filter((t) => t.kind === 'earn' && t.staff === n).length;
    [[STAFF[0], 168, 9], [STAFF[1], 151, 8], [STAFF[2], 93, 6]].forEach(([s, vis, nc]) => {
      const tr = h('tr', null, `<td><span class="av"></span><b class="lat">${s.name}</b><small>${s.role}</small></td><td class="lat">${fmt(vis + myBy(s.name))}</td><td class="lat">${nc + (s.name === 'Salma' ? 1 : 0)}</td>`);
      const avEl = $('.av', tr); avEl.textContent = s.name[0]; avEl.style.background = S.primary; avEl.style.color = readableOn(S.primary);
      tb.appendChild(tr);
    });
    // clients
    const cl = $('.pd-cl', v), goal = a.rewards[0].pts;
    const rows = [{ name: S.cust.name, bal: S.balance, when: 'دابا', me: true }, ...FAKE.map((f) => ({ name: f.name, bal: Math.round(f.bal * goal), when: f.when }))];
    rows.forEach((r) => {
      const li = h('li', r.me ? 'me' : '', `<span class="av"></span><span class="nm"><bdi>${esc(r.name)}</bdi>${r.me ? '<em>جديد</em>' : ''}</span><b class="lat">${fmt(r.bal)}</b><small>${r.when}</small>`);
      const avEl = $('.av', li); avEl.textContent = initials(r.name); avEl.style.background = r.me ? S.accent : '#E7F5ED'; avEl.style.color = r.me ? readableOn(S.accent) : '#1B6142';
      cl.appendChild(li);
    });
    // historique
    const hi = $('.pd-hist', v);
    [...S.tx].reverse().slice(0, 7).forEach((t) => hi.appendChild(h('li', t.pts < 0 ? 'neg' : '', `<span class="ic">${t.kind === 'redeem' ? '🎁' : t.kind === 'welcome' ? '🎉' : '＋'}</span><span><bdi>${esc(S.cust.name)}</bdi> · ${esc(t.label)}</span><small>${esc(t.staff)} · ${esc(t.when)}</small><b class="lat">${t.pts > 0 ? '+' : ''}${fmt(t.pts)}</b>`)));
    $$('.kpi b', v).forEach((b, i) => setTimeout(() => countUp(b, Number(b.dataset.to), 1100), 150 + i * 120));
  }

  /* ---------- Navigation ---------- */
  function setPos(view) {
    pos.dataset.view = view;
    $$('.pos-tabs span').forEach((s) => s.classList.toggle('on', s.dataset.t === (view === 'dash' ? 'dash' : 'scan')));
    $('.pos-user').innerHTML = view === 'dash' ? '<b class="lat">Yassine</b> · مسؤول' : '<b class="lat">Salma</b> · كاشير';
  }
  function setPhone(view) { phone.dataset.view = view; syncPip(); }
  function renderSteps() {
    $$('.dm-step').forEach((b, i) => {
      b.classList.toggle('on', i === S.step); b.classList.toggle('done', i < S.step || (i <= S.max && i !== S.step));
      b.disabled = i > S.max; b.setAttribute('aria-current', i === S.step ? 'step' : 'false');
    });
  }

  const P = {}; // contenu du panneau par étape
  P.design = () => {
    const wrap = h('div');
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">1</span> من <span class="lat">6</span> · مول المحل</p>
      <h3>صاوب الكارطة ديال المحل ديالك</h3>
      <p class="dp-txt">ختار النشاط ديالك: البرنامج والهدية كيتوجدو بوحدهم. ومن بعد بدّل الاسم، اللون والشكل، وشوف النتيجة مباشرة فالتيليفون.</p>
      <div class="dp-f"><span>النشاط</span><div class="dp-acts"></div></div>
      <label class="dp-f"><span>سمية المحل</span><input type="text" class="dp-biz lat" maxlength="22" placeholder="كتب سمية المحل ديالك"></label>
      <div class="dp-f"><span>اللون</span><div class="dp-sw"></div></div>
      <div class="dp-f"><span>شكل التقدم</span><div class="dp-seg"><button type="button" data-s="circles">دوائر</button><button type="button" data-s="stamps">طوابع</button><button type="button" data-s="bar">خط</button></div></div>
      <div class="dp-rule"></div>
      <p class="dp-note">فالتطبيق الحقيقي كتزيد اللوغو ديالك، صورة الخلفية، عدد الخانات، والهدايا اللي بغيتي.</p>`;
    const acts = $('.dp-acts', wrap);
    Object.entries(ACTS).forEach(([k, a]) => {
      const b = h('button', 'dp-act' + (k === S.act ? ' on' : ''), `<span>${a.icon}</span>${a.label}`); b.type = 'button';
      b.addEventListener('click', () => {
        if (k === S.act) return;
        SFX.pop(2); applyAct(k); resetJourney(); refreshDesign(wrap);
        $$('.dp-act', wrap).forEach((x) => x.classList.toggle('on', x === b));
      });
      acts.appendChild(b);
    });
    const biz = $('.dp-biz', wrap); biz.value = S.biz;
    biz.addEventListener('input', () => { S.biz = biz.value.trim() || A().biz; refreshDesign(wrap, true); });
    const sw = $('.dp-sw', wrap);
    PRESETS.forEach((p) => {
      const b = h('button', 'dp-c'); b.type = 'button'; b.title = p.key; b.setAttribute('aria-label', 'لون ' + p.key);
      b.style.background = `linear-gradient(135deg, ${p.primary} 55%, ${p.accent} 55%)`;
      b.addEventListener('click', () => { SFX.pop(4); S.primary = p.primary; S.accent = p.accent; S.preset = p.key; refreshDesign(wrap); });
      b.dataset.k = p.key; sw.appendChild(b);
    });
    $$('.dp-seg button', wrap).forEach((b) => b.addEventListener('click', () => { SFX.pop(7); S.style = b.dataset.s; refreshDesign(wrap); }));
    refreshDesign(wrap, true);
    return [wrap, [{ label: 'التالي: الكليان كيتسجّل ←', main: true, fn: () => { S.max = Math.max(S.max, 1); go(1); } }]];
  };
  function refreshDesign(wrap, quiet) {
    $$('.dp-c', wrap).forEach((b) => b.classList.toggle('on', b.dataset.k === S.preset && PRESETS.find((p) => p.key === b.dataset.k).primary === S.primary));
    $$('.dp-seg button', wrap).forEach((b) => b.classList.toggle('on', b.dataset.s === S.style));
    const a = A();
    $('.dp-rule', wrap).innerHTML = `<b>البرنامج:</b> ${ruleText()}${a.welcome ? ` · <span class="lat">${a.welcome}</span> ${unitWord(a.welcome)} ترحيب` : ''}<br><b>الهدايا:</b> ${a.rewards.map((r) => `<span class="lat">${r.pts}</span> ${unitWord(r.pts)} = ${esc(r.name)}`).join(' · ')}`;
    paintBrand(); buildCardView();
    if (!quiet) bump($('.pc-card .dc'));
  }
  function resetJourney() {
    S.joined = false; S.recognized = false; S.balance = 0; S.tx = []; S.redeemed = null; S.earned = 0; S.visits = 0; S.day = 0; S.max = Math.min(S.max, 1);
    renderSteps();
  }
  P.join = () => {
    const wrap = h('div');
    const scanned = phone.dataset.view === 'join';
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">2</span> من <span class="lat">6</span> · الكليان</p>
      <h3>الكليان كيسكاني QR فالكونتوار</h3>
      <p class="dp-txt">${scanned ? 'الصفحة ديال التسجيل تحلّات فالتيليفون ديالو، بلا أبليكاسيون. عمّر السمية والتيليفون (ولا خلّيها تتعمّر بوحدها) وضغط على «خود الكارطة ديالي».' : 'فالكونتوار كاينة أفيش فيها QR ديال المحل ديالك. الكليان كيحل الكاميرا ديال التيليفون وكيسكاني. جرّب!'}</p>
      <ul class="dp-list"><li>غير السمية والتيليفون، والإيميل اختياري</li><li>بلا كلمة سر وبلا أبليكاسيون</li><li>المعلومات ديالو ما كتتشاركش مع حتى محل آخر</li></ul>`;
    const acts = scanned
      ? [{ label: '✍️ عمّر بمثال', fn: fillSample }, { label: 'خود الكارطة ←', main: true, fn: submitJoin }]
      : [{ label: '📷 سكاني QR', main: true, fn: scanPoster }];
    return [wrap, acts];
  };
  async function scanPoster() {
    if (S.busy) return; S.busy = true; SFX.click(); showStage(phone);
    setPhone('camera'); phone.classList.add('scan-anim'); SFX.scan();
    poster.classList.add('target');
    await wait(reduced ? 200 : 1500);
    SFX.beep(); phone.classList.remove('scan-anim'); phone.classList.add('flash');
    await wait(250); phone.classList.remove('flash'); poster.classList.remove('target');
    buildJoin(); setPhone('join'); SFX.whoosh(); S.busy = false; renderPanel();
    $('.v-join').scrollTop = 0;
  }
  P.card = () => {
    const wrap = h('div');
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">3</span> من <span class="lat">6</span> · الكليان</p>
      <h3>الكارطة ولات فالتيليفون ديال <bdi>${esc(firstName())}</bdi></h3>
      <p class="dp-txt">لينك خاص بيه، كيحلّو فأي وقت. فيه الـ QR ديال الكارطة، الرصيد، الهدايا والعمليات ديالو.${A().welcome ? ` وتزادو ليه <b class="lat">${A().welcome}</b> ${unitWord(A().welcome)} ديال الترحيب.` : ''}</p>
      <ul class="dp-list"><li>الرقم ديال الكارطة: <b class="lat">${S.number}</b></li><li>كيشوف شحال باقي ليه على الهدية</li><li>إلى ما عندوش التيليفون، الخدام كيلقاه بالرقم ديالو</li></ul>`;
    return [wrap, [{ label: 'التالي: الزيارة الجاية فالكونتوار ←', main: true, fn: () => { S.max = Math.max(S.max, 3); go(3); } }]];
  };
  P.counter = () => {
    const wrap = h('div'), a = A(), av = available().length;
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">4</span> من <span class="lat">6</span> · الخدام فالكونتوار</p>
      <h3>${S.recognized ? (a.mode === 'stamps' ? 'سجّل الزيارة، والطابع كيتزاد بوحدو' : 'كتب الثمن، والسيستيم كيحسب النقط') : 'الكليان رجع: الخدام كيسكاني الكارطة'}</h3>
      <p class="dp-txt">${S.recognized ? (av ? `🎁 <b>${esc(available()[0].name)}</b> ولات واجدة! دوز للهدية.` : `${a.mode === 'stamps' ? 'ضغط على «سجّل زيارة»' : 'ختار مبلغ ولا كتبو وأكّد'}، وشوف التيليفون ديال الكليان كيتحدّث فنفس الوقت. باش توصل للهدية دغيا، دوّز الوقت.`) : 'بالكاميرا ديال التيليفون ولا التابليت، ولا بالبحث بالسمية ولا التيليفون. ما كاين حتى ماكينة خاصها تشريها.'}</p>
      <ul class="dp-list"><li>كل عملية مسجّلة بسمية الخدام اللي دارها</li><li>ما يمكنش تتزاد النقط جوج مرات بالغلط</li></ul>`;
    const acts = [];
    if (!S.recognized) acts.push({ label: '📷 سكاني الكارطة', main: true, fn: () => scanCard(false) });
    else if (!av) acts.push({ label: S.busy ? '⏩ كيدوز الوقت…' : '⏩ دوّز الوقت حتى للهدية', fn: fastForward, disabled: S.busy });
    else acts.push({ label: 'التالي: الهدية 🎁 ←', main: true, fn: () => go(4) });
    return [wrap, acts];
  };
  P.reward = () => {
    const wrap = h('div'), r = S.redeemed;
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">5</span> من <span class="lat">6</span> · الهدية</p>
      <h3>${r ? `<bdi>${esc(firstName())}</bdi> خدا الهدية ديالو 🎉` : 'الكليان وصل للهدية'}</h3>
      <p class="dp-txt">${r ? `تنقصو <b class="lat">${fmt(r.pts)}</b> ${unitWord(r.pts)} من الرصيد، والعملية تسجّلات. الكليان كيرجع يجمع من جديد، وهادا هو الهدف: يرجع.` : 'الخدام كيضغط على «استعمل هدية»، كيختار الهدية وكيأكّد. ساهلة، وبلا ورق.'}</p>
      <ul class="dp-list"><li>الهدايا كتختارها نتا وكتبدّلها فأي وقت</li><li>النقط ديال الكليان ما كتمسّش ملي كتبدّل القواعد</li></ul>`;
    const acts = r ? [{ label: 'التالي: الداشبورد ديالك ←', main: true, fn: () => go(5) }] : [{ label: '🎁 استعمل هدية', main: true, fn: openReward }];
    return [wrap, acts];
  };
  P.dash = () => {
    const wrap = h('div'), wa = (window.FIDELINA && window.FIDELINA.whatsapp) || '';
    wrap.innerHTML = `<p class="dp-kick">مرحلة <span class="lat">6</span> من <span class="lat">6</span> · مول المحل</p>
      <h3>ونتا، كتتبّع كلشي</h3>
      <p class="dp-txt">الكليان الجداد، الزيارات، الهدايا، وشنو دار كل خدام. حسب الفترة والفرع، وتصدير <span class="lat">Excel</span>. هادشي اللي درتي دابا راه تزاد فالأرقام.</p>
      <div class="dp-end"><p>عجباتك؟ نوجّدوها ليك فالمحل ديالك.</p>
        <a class="btn btn-primary dp-wa" rel="noopener" target="_blank" href="#">هضر معانا فالواتساب</a>
        <a class="btn btn-outline dp-plans" href="#plans">شوف الباقات</a></div>
      <p class="dp-note">الديمو كامل فالبراوزر ديالك: الكليان والأرقام وهميين، وما كيتصيفط والو.</p>`;
    const msg = `السلام، جربت الديمو ديال Fidelina (نشاط: ${A().label}، محل: ${S.biz}) وبغيت نديرها فالمحل ديالي.`;
    if (wa) $('.dp-wa', wrap).href = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
    return [wrap, [{ label: '↺ عاود من الأول', fn: restart }]];
  };
  function restart() {
    SFX.whoosh(); S.cust = { name: '', phone: '', email: '' }; resetJourney(); S.max = 0; applyAct(S.act, true); go(0);
  }

  function renderPanel() {
    const key = STEPS[S.step].key, [content, acts] = P[key]();
    panel.innerHTML = ''; panel.appendChild(content);
    const nav = h('div', 'dp-nav');
    if (S.step > 0) { const b = h('button', 'dbtn dbtn-ghost', '→ رجوع'); b.type = 'button'; b.addEventListener('click', () => { if (!S.busy) { SFX.click(); go(S.step - 1); } }); nav.appendChild(b); }
    acts.forEach((x) => { const b = h('button', 'dbtn ' + (x.main ? 'dbtn-main' : 'dbtn-soft'), x.label); b.type = 'button'; b.disabled = !!x.disabled; b.addEventListener('click', () => x.fn()); nav.appendChild(b); });
    panel.appendChild(nav);
  }

  function go(i, o = {}) {
    const prev = S.step; S.step = i; S.max = Math.max(S.max, i);
    const key = STEPS[i].key;
    root.dataset.step = key;
    paintBrand();
    $('.pos-modal').hidden = true;
    if (key === 'design') { setPhone('card'); buildCardView(); }
    if (key === 'join') { if (!S.joined) setPhone('camera-idle'); else { buildJoin(); setPhone('join'); } }
    if (key === 'card' || key === 'counter' || key === 'reward') { buildCardView(); setPhone('card'); }
    if (key === 'counter' || key === 'reward') { if (S.recognized) { buildCust(); setPos('cust'); } else setPos('scan'); }
    if (key === 'reward' && !S.recognized) { S.recognized = true; buildCust(); setPos('cust'); }
    if (key === 'dash') { setPos('dash'); buildDash(); }
    if (key === 'counter') $('.pos-search').classList.remove('on');
    renderSteps(); renderPanel(); syncPip();
    if (prev !== i && !o.silent) SFX.whoosh();
    if (!reduced && prev !== i) {
      [panel, ...$$('.dm-stage > :not(.dm-toast)')].forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: k * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    }
    if (o.celebrate) setTimeout(() => { confetti(phone, 36); bump($('.pc-card .dc')); if (A().welcome) flyer($('.pc-bal'), `+${A().welcome}`); }, 350);
    if (o.scroll !== false && prev !== i) {
      const top = root.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.4) root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  $('.pos-scan-btn').addEventListener('click', () => scanCard(false));
  $('.pos-phone-btn').addEventListener('click', () => scanCard(true));
  $('.v-camera').addEventListener('click', () => { if (S.step === 1 && phone.dataset.view === 'camera-idle') scanPoster(); });
  poster.addEventListener('click', () => { if (S.step === 1 && phone.dataset.view === 'camera-idle') scanPoster(); });

  go(0, { silent: true, scroll: false });
  root.classList.add('ready');
})();
