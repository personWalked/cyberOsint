/**
 * CYBER-OSINT v10 - GEOINT module (загружается ПОСЛЕ extra.js).
 * Мини-игра 3: геолокация по уликам. Читаешь подсказки, ставишь пин на карте мира.
 * Плюс звук, сброс прогресса и финальная концовка.
 */
const WORLD = [
    [[-168, 66], [-140, 70], [-95, 72], [-80, 70], [-62, 58], [-55, 48], [-67, 44], [-76, 35], [-81, 25], [-90, 29], [-97, 26], [-97, 19], [-88, 16], [-80, 8], [-84, 10], [-92, 14], [-105, 20], [-115, 30], [-125, 40], [-125, 50], [-140, 60]],
    [[-55, 60], [-20, 70], [-20, 82], [-60, 82]],
    [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-58, -38], [-65, -55], [-72, -50], [-72, -20], [-81, -5]],
    [[-10, 36], [-9, 43], [-2, 48], [5, 53], [10, 57], [20, 60], [30, 70], [40, 68], [40, 45], [28, 41], [20, 38], [12, 38], [3, 43]],
    [[-17, 21], [-6, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -12], [35, -25], [20, -35], [12, -17], [9, 4], [-8, 4], [-17, 14]],
    [[28, 41], [40, 45], [40, 68], [100, 78], [180, 68], [165, 60], [140, 50], [130, 35], [122, 30], [120, 22], [108, 10], [100, 2], [95, 15], [80, 8], [72, 20], [58, 24], [48, 30], [36, 36]],
    [[114, -22], [130, -12], [142, -11], [153, -26], [146, -39], [132, -34], [115, -34]]
];
const ENDING_REP = 200;

/* ---------- sound ---------- */
let audioCtx = null;
const beep = (freq, dur = 0.12, type = 'square') => {
    if (localStorage.getItem('cyberosint_mute') === '1') return;
    try {
        audioCtx = audioCtx || new AudioContext();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type; o.frequency.value = freq; g.gain.value = 0.04;
        o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* audio unavailable */ }
};
const _showModal = P.showModal;
P.showModal = function (t, m) {
    if (/GRANTED|COMPLETE|FINAL/.test(t)) { beep(660); setTimeout(() => beep(880), 120); }
    else if (/FAILED/.test(t)) beep(160, 0.3, 'sawtooth');
    _showModal.call(this, t, m);
};

/* ---------- init ---------- */
const _initExtras = P.initExtras;
P.initExtras = function () { _initExtras.call(this); this.initGeo(); };

P.initGeo = function () {
    this.ending = !!this.loadSave().ending;
    const cv = $id('geo-canvas');
    cv.addEventListener('click', e => {
        if (this.mode !== 'geo') return;
        const r = cv.getBoundingClientRect();
        const lon = ((e.clientX - r.left) / r.width) * 360 - 180, lat = 90 - ((e.clientY - r.top) / r.height) * 180;
        this.geo.pin = { lat, lon }; this.renderGeo(); beep(440, 0.05);
    });
    $id('btn-geo-clue').addEventListener('click', () => {
        const g = this.geo; if (this.mode !== 'geo' || g.shown >= g.c.clues.length) return;
        if (this.credits < 40) { $id('geo-status').innerText = 'Need $40 for deeper analysis.'; return; }
        this.credits -= 40; g.shown++; this.updateStats(); this.save(); this.renderGeo();
    });
    $id('btn-geo-submit').addEventListener('click', () => this.geoSubmit());
    const snd = $id('btn-sound');
    const paint = () => { snd.innerText = localStorage.getItem('cyberosint_mute') === '1' ? 'SOUND: OFF' : 'SOUND: ON'; };
    snd.addEventListener('click', () => { localStorage.setItem('cyberosint_mute', localStorage.getItem('cyberosint_mute') === '1' ? '0' : '1'); paint(); beep(500); });
    paint();
    $id('btn-reset').addEventListener('click', () => {
        if (confirm('Delete ALL progress and restart?')) { localStorage.removeItem(SAVE_KEY); location.reload(); }
    });
};

/* ---------- mini-game 3: GEOINT map ---------- */
P.startGeo = function (c) {
    this.mode = 'geo'; this.active = true; this.hintPath = null;
    this.geo = { c, pin: null, past: [], shown: c.diff === 'easy' ? 2 : 1 };
    this.moves = 3;
    this.elSecondMonitor.classList.remove('hidden'); this.elGridBoard.classList.add('hidden');
    $id('geo-panel').classList.remove('hidden'); $id('btn-emp').classList.add('hidden');
    this.elGridTargetName.innerText = c.title;
    $id('geo-status').innerText = `Click the map to drop a pin. Win radius: ${c.radius} km. Attempts: 3.`;
    this.renderGeo();
};

P.renderGeo = function () {
    const g = this.geo, cv = $id('geo-canvas'), x = cv.getContext('2d'), W = cv.width, H = cv.height;
    const px = lon => (lon + 180) / 360 * W, py = lat => (90 - lat) / 180 * H;
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(0,255,65,0.15)'; x.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) { x.beginPath(); x.moveTo(px(lon), 0); x.lineTo(px(lon), H); x.stroke(); }
    for (let lat = -90; lat <= 90; lat += 30) { x.beginPath(); x.moveTo(0, py(lat)); x.lineTo(W, py(lat)); x.stroke(); }
    x.fillStyle = 'rgba(0,255,65,0.14)'; x.strokeStyle = '#0c7a28';
    for (const poly of WORLD) {
        x.beginPath(); poly.forEach(([lon, lat], i) => (i ? x.lineTo(px(lon), py(lat)) : x.moveTo(px(lon), py(lat))));
        x.closePath(); x.fill(); x.stroke();
    }
    const mark = (p, color, r) => { x.strokeStyle = color; x.lineWidth = 2; x.beginPath(); x.arc(px(p.lon), py(p.lat), r, 0, 7); x.moveTo(px(p.lon) - r - 4, py(p.lat)); x.lineTo(px(p.lon) + r + 4, py(p.lat)); x.moveTo(px(p.lon), py(p.lat) - r - 4); x.lineTo(px(p.lon), py(p.lat) + r + 4); x.stroke(); };
    g.past.forEach(p => mark(p, 'rgba(255,59,59,0.5)', 4));
    if (g.pin) mark(g.pin, '#d7ff3b', 6);
    this.elGridMoves.innerText = this.moves;
    $id('geo-clues').innerHTML = g.c.clues.slice(0, g.shown).map(t => `<li>${esc(t)}</li>`).join('');
    $id('btn-geo-clue').disabled = g.shown >= g.c.clues.length;
};

const haversine = (a, b) => {
    const R = 6371, rad = d => d * Math.PI / 180, dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

P.geoSubmit = function () {
    const g = this.geo; if (this.mode !== 'geo') return;
    if (!g.pin) { $id('geo-status').innerText = 'Drop a pin first.'; return; }
    const d = Math.round(haversine(g.pin, g.c)), tries = --this.moves;
    g.past.push(g.pin); g.pin = null;
    if (d <= g.c.radius) return this.endHack(true);
    if (tries <= 0) { this.log(`Geolocation failed. Miss: ${d} km`); return this.endHack(false); }
    $id('geo-status').innerText = `MISS: ${d} km from the target (need <= ${g.c.radius} km). Attempts left: ${tries}.`;
    this.renderGeo();
};

/* ---------- ending ---------- */
const _updateStats2 = P.updateStats;
P.updateStats = function () {
    _updateStats2.call(this);
    if (this.ending === false && this.rep >= ENDING_REP) {
        this.ending = true; this.save();
        setTimeout(() => this.showModal('FINAL: LEGEND', `You are a legend of the net.\nCredits: $${this.credits}\nOSINT cases solved: ${this.solved.size}/${this.cases.length}\nKeep playing as long as you like.`), 900);
    }
};