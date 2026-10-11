/**
 * CYBER-OSINT v9 add-on (загружается ПОСЛЕ main.js).
 * Категории заказов, мини-игра BRUTE-FORCE, расширенный магазин, SOCMINT/GEOINT заказы,
 * ранги, системный лог, boot-экран. Все данные вымышленные.
 */
const P = CyberSimulator.prototype;
const CATS = ['ALL', 'NETWORK', 'SOCMINT', 'GEOINT', 'CRYPTO'];
const RANKS = [[0, 'SCRIPT KIDDIE'], [25, 'NETRUNNER'], [60, 'BLACK HAT'], [120, 'GHOST'], [200, 'LEGEND']];
const rankOf = rep => RANKS.filter(r => rep >= r[0]).pop()[1];
const REP_BY_DIFF = { easy: 4, medium: 6, hard: 10 };

Object.assign(SOC_DB, {
    'mila_k_dev': 'ChirpNet @mila_k_dev\nLast post: "Sunrise on the river embankment"\nGeotag: Dnipro\nFollowers: 212',
    'recruit_hr_77': 'ChirpNet @recruit_hr_77\nAccount created: 3 days ago\nContact: hr77@talent-pro.example\nPhoto: stock image',
    'hr77@talent-pro.example': 'Breach index: 2 leaks\nDomain talent-pro.example registered 3 days ago\nLinked handle: scam_factory_x'
});
const SOC_PREMIUM = { 'darkfox_0x': 'DEEPNET profile darkfox_0x\nReal name: Viktor Hale\nEmployer: Black Mesa Ltd\nForum rep: 4.2k' };

const SHOP = [
    { id: 'vpn', name: 'VPN Tunnel', desc: 'viruses deal 1 dmg instead of 2', cost: 500, once: true },
    { id: 'gpu', name: 'GPU Cluster', desc: '+3 attempts in brute-force', cost: 700, once: true },
    { id: 'premiumDB', name: 'Premium SOCMINT DB', desc: 'deep profiles + premium orders', cost: 450, once: true },
    { id: 'emp', name: 'EMP Charge', desc: 'wipes all viruses on the grid', cost: 150 },
    { id: 'keylog', name: 'Keylogger', desc: 'reveals 1 digit in brute-force', cost: 120 },
    { id: 'hint', name: 'Pathfinder x3', desc: '3 free route hints', cost: 120, give: 3 }
];

const O = (id, kind, cat, title, client, reward, diff, briefing, extra) => ({ id, kind, cat, title, client, reward, diff, briefing, intel: '', ...extra });
const GEO = [
    [48.8584, 2.2945, ['Wrought-iron lattice tower beside a river', 'Signs in French', 'Drives on the RIGHT', 'Temperate oceanic climate']],
    [35.6586, 139.7454, ['Red-and-white lattice tower in a dense megacity', 'Signs in Japanese', 'Drives on the LEFT', 'City on a large bay']],
    [41.8902, 12.4922, ['Ancient oval amphitheatre in view', 'Signs in Italian', 'Drives on the RIGHT', 'Mediterranean climate']],
    [30.0131, 31.2089, ['Pyramids on the horizon', 'Signs in Arabic', 'Great river nearby, desert climate', 'Drives on the RIGHT']],
    [40.6892, -74.0445, ['Tall green statue on a harbor island', 'Signs in English', 'Yellow taxis', 'Drives on the RIGHT']],
    [-33.8568, 151.2153, ['Shell-roofed opera house by a harbor', 'Signs in English', 'Southern Hemisphere, drives on the LEFT', 'Large steel arch bridge nearby']],
    [-22.9519, -43.2105, ['Giant statue with outstretched arms on a hilltop', 'Signs in Portuguese', 'Southern Hemisphere beaches', 'Drives on the RIGHT']],
    [41.0082, 28.9784, ['City split across two continents by a strait', 'Signs in Turkish', 'Domed mosques with slender minarets', 'Drives on the RIGHT']],
    [52.5163, 13.3777, ['Neoclassical gate topped with a chariot statue', 'Signs in German', 'Former divided city', 'Drives on the RIGHT']]
];
const geoOrder = (id, g, title, client, reward, diff) => O(id, 'geo', 'GEOINT', title, client, reward, diff,
    'Geolocate the scene: read the clues and drop a pin on the map. Closer than the win radius wins.',
    { lat: g[0], lon: g[1], clues: g[2], radius: { easy: 1200, medium: 700, hard: 350 }[diff] });
const ORDERS = [
    O(401, 'osint', 'SOCMINT', 'Missing Intern', 'Agency K', 380, 'easy', 'Locate a missing intern using her public profile only.',
        { data: 'NOTE FROM INTERN:\n"Gone to see the place from my last post. Back soon."\nKnown handle: mila_k_dev', q: 'Which city is she in?', check: eq('dnipro') }),
    O(402, 'osint', 'SOCMINT', 'Lost Developer', 'Dr. Light', 420, 'easy', 'Contractor went silent. Find his timezone to schedule a call.',
        { data: 'Handle: ghost_proto\nTask: determine timezone from public profile.', q: 'Timezone (UTC offset)?', check: eq('utc+2', '+2', 'utc +2') }),
    O(403, 'osint', 'SOCMINT', 'Fake Recruiter', 'HR Watch', 600, 'medium', 'A fake job-offer account is scamming people. Chain: handle -> email -> operator.',
        { data: 'Suspicious account: recruit_hr_77\nGoal: find the operator handle behind it.', q: 'Operator handle?', check: eq('scam_factory_x') }),
    O(404, 'osint', 'SOCMINT', 'Insider Leak', 'Overseer', 1100, 'hard', 'A leaked document was posted by a deep-net user. Needs Premium SOCMINT DB.',
        { data: 'Leak posted by: darkfox_0x', q: 'His real employer?', check: eq('black mesa ltd', 'black mesa'), premium: true }),
    geoOrder(411, GEO[0], 'Tourist Photo', 'Travel Desk', 400, 'easy'),
    geoOrder(412, GEO[1], 'Harbor Footage', 'NewsNet', 520, 'medium'),
    geoOrder(413, GEO[5], 'Press Leak Photo', 'Ghost', 900, 'hard'),
    O(421, 'brute', 'CRYPTO', 'Vault Keypad', 'Locksmith', 420, 'easy', 'Crack the 4-digit keypad. Digits never repeat. ● = right digit & place, ○ = right digit, wrong place.', { len: 4, att: 10 }),
    O(422, 'brute', 'CRYPTO', 'Safe Combination', 'Ghost', 700, 'medium', 'Crack a 5-digit combination (no repeats).', { len: 5, att: 10 }),
    O(423, 'brute', 'CRYPTO', 'Master Key', 'Cipher', 1300, 'hard', 'Crack a 6-digit master key (no repeats).', { len: 6, att: 12 })
];
const $id = id => document.getElementById(id);

/* ---------- init ---------- */
const _initEvents = P.initEvents;
P.initEvents = function () { _initEvents.call(this); this.initExtras(); };

P.initExtras = function () {
    const sv = this.loadSave();
    this.inv = Object.assign({ vpn: 0, gpu: 0, premiumDB: 0, emp: 0, keylog: 0, hint: 0 }, sv.inv || {});
    this.doneOrders = new Set(sv.done || []);
    this.contractsPool = this.contractsPool.filter(c => !this.doneOrders.has(c.id));
    this.catFilter = 'ALL'; this.mode = null;
    this.contractsPool.push(...ORDERS.filter(o => !this.doneOrders.has(o.id)).map(o => ({ ...o })));

    const bar = $id('cat-filter');
    bar.innerHTML = CATS.map(c => `<button class="cat-btn${c === 'ALL' ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('');
    bar.addEventListener('click', e => {
        const b = e.target.closest('[data-cat]'); if (!b) return;
        this.catFilter = b.dataset.cat;
        bar.querySelectorAll('.cat-btn').forEach(x => x.classList.toggle('active', x === b));
        this.renderContracts();
    });

    const body = document.querySelector('.shop-body');
    SHOP.forEach(it => {
        const d = document.createElement('div'); d.className = 'shop-item';
        d.innerHTML = `<span>${esc(it.name)} - ${esc(it.desc)} [$${it.cost}] <em id="own-${it.id}"></em></span><button class="cyber-btn" id="shop-${it.id}">BUY</button>`;
        d.querySelector('button').addEventListener('click', () => this.buyItem(it));
        body.appendChild(d);
    });
    this.refreshShop();

    // SOCMINT lookup with Premium DB
    const swap = id => { const o = $id(id), n = o.cloneNode(true); o.replaceWith(n); return n; };
    swap('btn-soc').addEventListener('click', () => {
        const q = $id('soc-input').value.trim().toLowerCase(), out = $id('soc-output');
        if (!q) { out.innerText = 'Enter a username or email.'; return; }
        if (SOC_DB[q]) out.innerText = SOC_DB[q];
        else if (SOC_PREMIUM[q]) out.innerText = this.inv.premiumDB ? SOC_PREMIUM[q] : 'Record exists in the deep-net index. Premium SOCMINT DB required (shop).';
        else out.innerText = `No public profiles found for "${q}".`;
    });
    // AI route hint with free charges
    swap('btn-get-hint').addEventListener('click', () => {
        const out = $id('hints-output');
        if (!this.active || this.mode !== 'grid') { out.innerText = '[AI HINT] Start a network infiltration first.'; return; }
        if (!this.inv.hint && this.credits < 50) { out.innerText = '[AI HINT] Need $50 or a Pathfinder charge.'; return; }
        const path = this.findPath(); if (!path) { out.innerText = '[AI HINT] No route found.'; return; }
        if (this.inv.hint) this.inv.hint--; else this.credits -= 50;
        this.hintPath = path.slice(0, 4);
        out.innerText = `[AI PATHFINDER] ${path.length} steps to server. Next 4 highlighted. Free charges: ${this.inv.hint}`;
        this.updateStats(); this.save(); this.renderGrid(); this.refreshShop();
    });

    $id('btn-emp').addEventListener('click', () => {
        if (!this.active || this.mode !== 'grid') return;
        if (!this.inv.emp) { this.log('No EMP charges. Buy one in the shop.'); return; }
        this.inv.emp--;
        this.grid.forEach(row => row.forEach((t, c) => { if (t === 'VIRUS') row[c] = 'EMPTY'; }));
        this.log('EMP detonated: all viruses wiped.'); this.save(); this.renderGrid(); this.refreshShop();
    });
    $id('btn-brute').addEventListener('click', () => this.bruteGuess());
    $id('brute-input').addEventListener('keydown', e => { if (e.key === 'Enter') this.bruteGuess(); });
    $id('btn-keylog').addEventListener('click', () => {
        if (this.mode !== 'brute') return;
        if (!this.inv.keylog) { this.log('No keylogger. Buy one in the shop.'); return; }
        this.inv.keylog--;
        const i = Math.floor(Math.random() * this.secret.length);
        this.bruteLog.push(`KEYLOGGER: position ${i + 1} = ${this.secret[i]}`);
        this.save(); this.renderBrute(); this.refreshShop();
    });
    this.log('Terminal online. Welcome, operator.');
};

/* ---------- shop / log / stats ---------- */
P.buyItem = function (it) {
    if (it.once && this.inv[it.id]) return;
    if (this.credits < it.cost) return this.showModal('SHOP', `Not enough credits. ${it.name} costs $${it.cost}.`);
    this.credits -= it.cost; this.inv[it.id] += it.give || 1;
    this.log(`Purchased: ${it.name}`); this.updateStats(); this.save(); this.refreshShop();
};
P.refreshShop = function () {
    SHOP.forEach(it => {
        const n = this.inv[it.id], b = $id(`shop-${it.id}`);
        $id(`own-${it.id}`).innerText = it.once ? '' : `(owned: ${n})`;
        if (it.once && n) { b.innerText = 'INSTALLED'; b.disabled = true; }
    });
    $id('btn-emp').innerText = `EMP (${this.inv.emp})`;
    $id('btn-keylog').innerText = `KEYLOGGER (${this.inv.keylog})`;
};
P.log = function (msg) {
    const el = $id('sys-log'); if (!el) return;
    el.textContent = `[${new Date().toTimeString().slice(0, 8)}] ${msg}\n` + el.textContent.split('\n').slice(0, 30).join('\n');
};
const _updateStats = P.updateStats;
P.updateStats = function () { _updateStats.call(this); const e = $id('stat-rank'); if (e) e.innerText = rankOf(this.rep); };
P.save = function () {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            credits: this.credits, rep: this.rep, hasSecondMonitor: this.hasSecondMonitor,
            bonusMoves: this.bonusMoves, intelMoves: this.intelMoves, solved: [...this.solved], inv: this.inv, done: [...(this.doneOrders || [])], ending: this.ending
        }));
    } catch { /* storage unavailable */ }
};

/* ---------- procedural orders ---------- */
const _gen = P.generateRandomContract;
P.generateRandomContract = function () {
    _gen.call(this);
    if (this.contractsPool.length >= 18 || Math.random() < 0.4) return;
    const id = Date.now() + Math.random();
    if (Math.random() < 0.5) {
        this.contractsPool.push(geoOrder(id, GEO[Math.floor(Math.random() * GEO.length)], 'Photo Verification', 'NewsNet', 450, 'easy'));
    } else {
        const hard = Math.random() < 0.4;
        this.contractsPool.push(O(id, 'brute', 'CRYPTO', hard ? 'Encrypted Archive' : 'Door Lock', 'Nexus', hard ? 800 : 480, hard ? 'medium' : 'easy', 'Crack the code. Digits never repeat.', { len: hard ? 5 : 4, att: 10 }));
    }
    this.log('New order posted on the board.'); this.updateStats(); this.renderContracts();
};

/* ---------- board with categories ---------- */
P.renderContracts = function () {
    if (this.currentContract) return;
    this.elChatBox.classList.add('hidden'); this.elContractsList.innerHTML = ''; this.updateStats();
    const f = this.catFilter || 'ALL';
    for (const c of this.contractsPool) {
        const cat = c.cat || 'NETWORK'; if (f !== 'ALL' && cat !== f) continue;
        const locked = this.rep < MIN_REP[c.diff];
        const card = document.createElement('div');
        card.className = `contract-card tier-${c.diff}${locked ? ' locked' : ''}`;
        card.innerHTML = `<div><strong>[${cat}] ${esc(c.title)}</strong><br><small>${c.ip ? `IP: ${esc(c.ip)} | ` : ''}Client: ${esc(c.client)} | <strong>$${c.reward}</strong> (${c.diff.toUpperCase()})${locked ? ` | LOCKED: REP ${MIN_REP[c.diff]}` : ''}</small></div>
            <div class="contract-actions"><button class="cyber-btn accept-btn" ${locked ? 'disabled' : ''}>ACCEPT</button><button class="cyber-btn warning decline-btn">X</button></div>`;
        card.querySelector('.accept-btn').addEventListener('click', () => this.startChat(c));
        card.querySelector('.decline-btn').addEventListener('click', () => { this.contractsPool = this.contractsPool.filter(x => x.id !== c.id); this.renderContracts(); });
        this.elContractsList.appendChild(card);
    }
    if (!this.elContractsList.children.length) this.elContractsList.innerHTML = '<small>No orders in this category. Wait for new postings...</small>';
};

const _startChat = P.startChat;
P.startChat = function (c) {
    if (!c.kind) return _startChat.call(this, c);
    this.currentContract = c; this.elContractsList.innerHTML = ''; this.elChatBox.classList.remove('hidden');
    const need = c.premium && !this.inv.premiumDB;
    this.elChatMessages.innerHTML = `<p><strong>[Client: ${esc(c.client)}]</strong>: "${esc(c.briefing)}"</p>
        <p><strong>[${c.cat}]</strong> Reward: $${c.reward} | ${c.diff.toUpperCase()}</p>${need ? '<p style="color:var(--red)">REQUIRES Premium SOCMINT DB (shop)</p>' : ''}`;
    this.elChatActions.innerHTML = `<button class="cyber-btn primary" id="btn-proceed" ${need ? 'disabled' : ''}>Start Job</button><button class="cyber-btn warning" id="btn-reject">Decline / Back</button>`;
    $id('btn-reject').addEventListener('click', () => { this.currentContract = null; this.renderContracts(); });
    $id('btn-proceed').addEventListener('click', () => {
        if (c.kind === 'osint') return this.openOrder(c);
        if (!this.hasSecondMonitor) return this.showModal('ERROR', 'This job needs the Second Monitor ($1000 in the shop).');
        this.elChatBox.classList.add('hidden');
        if (c.kind === 'geo') this.startGeo(c); else this.startBrute(c);
    });
};

/* ---------- OSINT orders (SOCMINT / GEOINT) ---------- */
P.openOrder = function (c) {
    c.tries = c.tries ?? 3;
    this.elChatMessages.innerHTML = `<p><strong>[DOSSIER]</strong></p><pre class="dossier">${esc(c.data)}</pre>
        <p>Q: ${esc(c.q)} <span style="color:var(--yellow)">(tries left: ${c.tries})</span><br><small>Tip: use SOCMINT / DECODER tabs below.</small></p>`;
    this.elChatActions.innerHTML = `<input id="order-answer" class="cyber-input" placeholder="answer..."><button class="cyber-btn primary" id="btn-order">SUBMIT</button><button class="cyber-btn warning" id="btn-reject">Back</button>`;
    const submit = () => {
        const v = $id('order-answer').value; if (!v.trim()) return;
        if (c.check(v)) return this.completeOrder(c);
        if (--c.tries <= 0) {
            this.rep = Math.max(0, this.rep - 3); this.contractsPool = this.contractsPool.filter(x => x.id !== c.id);
            this.currentContract = null; this.log(`Order failed: ${c.title}`); this.save(); this.renderContracts();
            return this.showModal('ORDER FAILED', 'Too many wrong answers. Client left. -3 REP.');
        }
        this.openOrder(c);
    };
    $id('btn-order').addEventListener('click', submit);
    $id('order-answer').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    $id('btn-reject').addEventListener('click', () => { this.currentContract = null; this.renderContracts(); });
};
P.completeOrder = function (c) {
    const rep = REP_BY_DIFF[c.diff];
    this.credits += c.reward; this.rep += rep; this.doneOrders.add(c.id);
    this.contractsPool = this.contractsPool.filter(x => x.id !== c.id); this.currentContract = null;
    this.log(`Order complete: ${c.title} (+$${c.reward})`); this.save(); this.renderContracts();
    this.showModal('ORDER COMPLETE', `${c.title}\n+$${c.reward}  +${rep} REP`);
};

/* ---------- mini-game 2: BRUTE-FORCE (Mastermind) ---------- */
P.startBrute = function (c) {
    this.mode = 'brute'; this.active = true; this.hintPath = null;
    this.elSecondMonitor.classList.remove('hidden'); this.elGridBoard.classList.add('hidden');
    $id('brute-panel').classList.remove('hidden'); $id('btn-emp').classList.add('hidden');
    this.elGridTargetName.innerText = c.title;
    this.secret = [...'0123456789'].sort(() => Math.random() - 0.5).slice(0, c.len).join('');
    this.moves = c.att + (this.inv.gpu ? 3 : 0);
    this.bruteLog = [`TARGET: ${c.len} digits, no repeats. Attempts: ${this.moves}`];
    $id('brute-input').value = ''; $id('brute-input').maxLength = c.len;
    this.renderBrute(); $id('brute-input').focus();
};
P.renderBrute = function () {
    this.elGridMoves.innerText = this.moves;
    const el = $id('brute-log'); el.textContent = this.bruteLog.join('\n'); el.scrollTop = el.scrollHeight;
};
P.bruteGuess = function () {
    if (!this.active || this.mode !== 'brute') return;
    const len = this.secret.length, g = $id('brute-input').value.trim();
    if (!new RegExp(`^\\d{${len}}$`).test(g) || new Set(g).size !== len) { this.bruteLog.push(`INVALID: ${len} distinct digits required`); return this.renderBrute(); }
    let exact = 0, miss = 0;
    [...g].forEach((d, i) => { if (d === this.secret[i]) exact++; else if (this.secret.includes(d)) miss++; });
    this.moves--; $id('brute-input').value = '';
    this.bruteLog.push(`${g}  ${'●'.repeat(exact)}${'○'.repeat(miss)}${exact + miss === 0 ? '-' : ''}`);
    if (exact === len) return this.endHack(true);
    if (this.moves <= 0) { this.log(`Brute-force failed. Code was ${this.secret}`); return this.endHack(false); }
    this.renderBrute();
};

/* ---------- grid overrides ---------- */
const _endHack = P.endHack;
P.endHack = function (s) {
    const c = this.currentContract; if (c) this.log(s === true ? `Hacked: ${c.title}` : s === false ? `Failed: ${c.title}` : `Aborted: ${c.title}`);
    $id('brute-panel').classList.add('hidden'); $id('geo-panel').classList.add('hidden'); this.elGridBoard.classList.remove('hidden'); $id('btn-emp').classList.remove('hidden');
    if (s === true && c && c.id < 1000) this.doneOrders.add(c.id);
    this.mode = null; _endHack.call(this, s);
};
const _startHack = P.startHack;
P.startHack = function (c) { _startHack.call(this, c); this.mode = 'grid'; };
P.renderGrid = function () {
    const icons = { PLAYER: '▣', VIRUS: '☣', SERVER: '$', WALL: '▓', EMPTY: '·' };
    this.elGridMoves.innerText = this.moves;
    this.elGridBoard.innerHTML = this.grid.map((row, r) => row.map((t, c) => {
        const hint = this.hintPath?.some(p => p.r === r && p.c === c) ? ' hint' : '';
        return `<div class="cell ${t.toLowerCase()}${hint}" data-r="${r}" data-c="${c}">${icons[t]}</div>`;
    }).join('')).join('');
};
P.processViruses = function () {
    const dmg = this.inv.vpn ? 1 : 2, viruses = [];
    this.grid.forEach((row, r) => row.forEach((t, c) => { if (t === 'VIRUS') viruses.push({ r, c }); }));
    const dist = (r, c) => Math.abs(r - this.player.r) + Math.abs(c - this.player.c);
    for (const v of viruses) {
        if (Math.random() >= 0.4) continue;
        if (dist(v.r, v.c) === 1) { this.moves -= dmg; continue; }
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => ({ r: v.r + a, c: v.c + b }))
            .filter(p => p.r >= 0 && p.c >= 0 && p.r < this.gridSize && p.c < this.gridSize && this.grid[p.r][p.c] === 'EMPTY')
            .sort((a, b) => dist(a.r, a.c) - dist(b.r, b.c) || Math.random() - 0.5);
        if (opts.length) { this.grid[v.r][v.c] = 'EMPTY'; this.grid[opts[0].r][opts[0].c] = 'VIRUS'; }
    }
};

/* ---------- boot screen ---------- */
window.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div'); b.id = 'boot'; document.body.appendChild(b);
    const L = ['BIOS v7.31 ........ OK', 'Mounting /dev/darknet ... OK', 'Spoofing MAC address ... OK', 'Loading OSINT modules ... OK', 'Welcome, operator.'];
    L.forEach((t, i) => setTimeout(() => { b.textContent += t + '\n'; }, i * 300));
    setTimeout(() => b.classList.add('off'), L.length * 300 + 300);
    setTimeout(() => b.remove(), L.length * 300 + 1000);
    b.addEventListener('click', () => b.remove());
});