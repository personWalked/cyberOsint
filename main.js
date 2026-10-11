/**
 * CYBER-OSINT SIMULATOR v8.0
 * Fixes: syntax error in chat template, hidden chat, unsolvable grids, fake hints, virus AI.
 * New: OSINT cases, decoder, SOCMINT lookup, rep gating, save/load, real pathfinder hint.
 */
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rot13 = s => s.replace(/[a-z]/gi, ch => { const b = ch <= 'Z' ? 65 : 97; return String.fromCharCode((ch.charCodeAt(0) - b + 13) % 26 + b); });
const eq = (...answers) => v => answers.includes(v.toLowerCase().trim());
const MIN_REP = { easy: 0, medium: 15, hard: 30 };
const SIZE = { easy: 6, medium: 8, hard: 10 };
const SAVE_KEY = 'cyberosint_save_v8';

const C = (id, title, client, reward, ip, diff, briefing, intel) => ({ id, title, client, reward, ip, diff, size: SIZE[diff], briefing, intel });
const CONTRACTS = [
    C(1, 'Apex Database Leak', 'Mr. Smith', 300, '192.168.1.50', 'easy', 'We need you to breach Apex Corp sub-node. Low security clearance required.', 'Subnet gateway uses legacy ports.'),
    C(2, 'Stellar Net Gateway', 'Anonymous', 450, '10.0.0.15', 'easy', 'Stellar Net holds unauthorized surveillance data. Infiltrate their relay node.', 'Low virus density in sector 2.'),
    C(3, 'Omega Node Infiltration', 'Zero_Cool', 750, '172.16.0.4', 'medium', 'Omega node is guarded by automated threat countermeasures. Scan and plan path.', 'Active roaming processes detected.'),
    C(4, 'Cyberdyne Subnet Recon', 'Ghost', 650, '192.168.4.22', 'medium', 'Extract experimental research logs from Cyberdyne restricted internal server.', 'Heavy wall placement on northern perimeter.'),
    C(5, 'Black Mesa Mainframe', 'Freeman', 1200, '10.55.12.9', 'hard', 'High-security government mainframe penetration. Extreme caution advised.', 'Multiple aggressive threat vectors.'),
    C(6, 'Vault-Tec Secure Hub', 'Overseer', 900, '192.168.10.3', 'medium', 'Recover classified vault experimental logs from localized storage core.', 'Server located in bottom-right sector.'),
    C(7, 'Syndicate Dark Relay', 'Cipher', 1400, '172.30.1.99', 'hard', 'Disable hostile Syndicate command relay before they trace our proxy nodes.', 'Encrypted multi-layer defenses.'),
    C(8, 'Neo-Tokyo Bank Core', 'Morpheus', 1100, '10.88.4.12', 'hard', 'Bypass encrypted financial vault. Every second counts before countermeasures.', 'Strict turn limits enforced.'),
    C(9, 'Helix Lab Database', 'Dr. Light', 350, '192.168.2.88', 'easy', 'Retrieve genetic blueprint files from an unpatched lab subnet.', 'Direct vector available via Column 2.'),
    C(10, 'Overdrive Router Proxy', 'Sonic', 500, '10.10.10.5', 'medium', 'Reroute encrypted traffic across hostile proxy clusters.', 'Dynamic node routing required.'),
    C(11, 'Zeta Corp Mail Gateway', 'HackerX', 400, '192.168.5.12', 'easy', 'Dump executive mail server logs for blackmail leverage.', 'Low security clearance required.'),
    C(12, 'Titan Orbital Relay', 'Ares', 1500, '172.50.9.1', 'hard', 'Compromise satellite link uplink node. Maximum security protocols online.', 'Maximum threat density.')
];

// Fictional SOCMINT database (usernames / emails)
const SOC_DB = {
    'n1ghtowl_88': 'ChirpNet @n1ghtowl_88\nBio: "sysadmin by day, coffee addict"\nEmployer tag: Zeta Corp\nEmail: n1ght@zeta-mail.example\nLast check-in: Lviv',
    'ghost_proto': 'DevHub ghost_proto\nRepos: 3 (port-scanner, dotfiles, notes)\nCommit email: ghost@cyberdyne.example\nTimezone: UTC+2',
    'n1ght@zeta-mail.example': 'Breach index: found in 1 leak (2024)\nLinked handle: n1ghtowl_88',
    'zero_cool': 'ChirpNet @zero_cool\nBio: "I only post at 3am"\nLinked: ghost_proto (follows)'
};

// OSINT cases. Data is generated at runtime so encodings are always correct.
const buildCases = () => [
    { id: 'c1', title: 'Photo metadata (EXIF)', reward: 150, rep: 3, hint: 'Look at the GPS coordinates. Which city is at ~50.45 N, 30.52 E?',
      intro: 'A client sent a photo of a "secret meeting place". Find where it was taken.',
      data: 'File: IMG_4471.jpg\nCamera: Canon EOS 80D\nDateTime: 2026:03:14 21:07:11\nGPSLatitude: 50.4501 N\nGPSLongitude: 30.5234 E\nSoftware: none',
      q: 'City where the photo was taken?', check: eq('kyiv', 'kiev', 'київ', 'киев') },
    { id: 'c2', title: 'Encoded message (Base64)', reward: 200, rep: 4, hint: 'Use the DECODER tab -> base64.',
      intro: 'An intercepted message looks like random text. Decode it.',
      data: 'MSG: ' + btoa('ACCESS_CODE=GHOST-7731'), q: 'Enter the access code:', check: eq('ghost-7731') },
    { id: 'c3', title: 'Dead drop (ROT13)', reward: 200, rep: 4, hint: 'Classic Caesar shift by 13. DECODER -> rot13.',
      intro: 'A forum post hides a meeting location.',
      data: 'POST: ' + rot13('meet at the old pier at midnight'), q: 'Where is the meeting?', check: eq('old pier', 'pier', 'the old pier') },
    { id: 'c4', title: 'Username trace (SOCMINT)', reward: 300, rep: 5, hint: 'Search the handle in the SOCMINT tab and look at the employer tag.',
      intro: 'The handle n1ghtowl_88 appeared in a leaked chat. Who does he work for?',
      data: 'CHAT LOG:\n<n1ghtowl_88> admin panel is still on default creds lol\n<zero_cool> dont say that here', q: 'Employer company?', check: eq('zeta corp', 'zeta', 'zeta corp.') },
    { id: 'c5', title: 'Email header analysis', reward: 350, rep: 6, hint: 'Received headers are stacked: the BOTTOM one is the first hop.',
      intro: 'A phishing mail hit a client. Find the real origin of the message.',
      data: 'From: "HR Dept" <hr@zeta-mail.example>\nReceived: from mx1.zeta-mail.example (192.168.5.12) by inbox.local; 09:12:44\nReceived: from relay.proxy.example (10.10.10.5) by mx1.zeta-mail.example; 09:12:41\nReceived: from [172.30.1.99] (unknown) by relay.proxy.example; 09:12:39\nSubject: Urgent payroll update',
      q: 'Original sender IP (earliest hop)?', check: eq('172.30.1.99') },
    { id: 'c6', title: 'Google dorking', reward: 250, rep: 5, hint: 'Operators: site:domain and filetype:ext. Combine them.',
      intro: 'Find public PDF documents indexed on a company domain (passive recon only).',
      data: 'Target domain: apex-corp.example\nGoal: PDF files on that domain only.', q: 'Type the search query (dork):',
      check: v => /site:apex-corp\.example/i.test(v) && /filetype:pdf/i.test(v) }
];

class CyberSimulator {
    constructor() {
        const s = this.loadSave();
        this.credits = s.credits ?? 1300;
        this.rep = s.rep ?? 10;
        this.hasSecondMonitor = !!s.hasSecondMonitor;
        this.bonusMoves = s.bonusMoves ?? 0;
        this.intelMoves = s.intelMoves ?? 0; // one-time bonus from solved OSINT cases
        this.solved = new Set(s.solved || []);

        this.scannedIPs = new Set();
        this.contractsPool = CONTRACTS.map(c => ({ ...c }));
        this.cases = buildCases();
        this.currentContract = null;
        this.active = false;
        this.grid = [];
        this.player = { r: 0, c: 0 };
        this.moves = 0;
        this.gridSize = 6;
        this.hintPath = null;

        this.initDOM();
        this.initEvents();
        if (this.hasSecondMonitor) this.markMonitorBought();
        this.renderContracts();
        this.renderCases();
        this.updateStats();
        setInterval(() => this.generateRandomContract(), 25000);
    }

    /* ---------- persistence ---------- */
    loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                credits: this.credits, rep: this.rep, hasSecondMonitor: this.hasSecondMonitor,
                bonusMoves: this.bonusMoves, intelMoves: this.intelMoves, solved: [...this.solved]
            }));
        } catch { /* storage unavailable */ }
    }

    initDOM() {
        const $ = id => document.getElementById(id);
        Object.assign(this, {
            elCredits: $('stat-credits'), elRep: $('stat-rep'), elContractsList: $('contracts-list'),
            elContractCount: $('contract-count'), elChatBox: $('chat-box'), elChatMessages: $('chat-messages'),
            elChatActions: $('chat-actions'), elSecondMonitor: $('second-monitor'), elGridBoard: $('grid-board'),
            elGridMoves: $('grid-moves'), elGridTargetName: $('grid-target-name'), elModal: $('modal'),
            elModalTitle: $('modal-title'), elModalMsg: $('modal-msg'), elModalBtn: $('modal-btn'),
            elCaseSelect: $('case-select'), elCaseInfo: $('case-info'), elCaseAnswer: $('case-answer'),
            elCaseFeedback: $('case-feedback')
        });
    }

    initEvents() {
        const $ = id => document.getElementById(id);
        const findContract = ip => this.contractsPool.find(c => c.ip === ip) || (this.currentContract?.ip === ip ? this.currentContract : null);

        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');
            $(`tab-${e.currentTarget.dataset.tab}`).classList.add('active');
        }));

        $('btn-whois').addEventListener('click', () => {
            const q = $('whois-input').value.trim(), f = findContract(q), out = $('whois-output');
            out.innerText = f ? `[WHOIS REGISTRY]\nIP: ${f.ip}\nRegistrant: ${f.client} Syndicate\nTarget: ${f.title}\nIntel: ${f.intel}`
                : q ? `[WHOIS] IP ${q} registered under cloud infrastructure. No direct flags.` : '[WHOIS ERROR] Enter a valid target IP address.';
        });

        $('btn-nmap').addEventListener('click', () => {
            const ip = $('nmap-input').value.trim(), out = $('nmap-output');
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { out.innerText = '[NMAP ERROR] Specify a valid IPv4 address.'; return; }
            const f = findContract(ip);
            if (!f) { out.innerText = `Nmap scan report for [${ip}]:\nHost seems down. No contract on this address.`; return; }
            this.scannedIPs.add(ip);
            const services = f.diff === 'hard' ? 'PORT 21/tcp   OPEN  ftp\nPORT 22/tcp   OPEN  ssh\nPORT 443/tcp  OPEN  https\nPORT 3306/tcp OPEN  mysql'
                : f.diff === 'medium' ? 'PORT 22/tcp   OPEN  ssh\nPORT 80/tcp   OPEN  http\nPORT 443/tcp  OPEN  https'
                : 'PORT 80/tcp   OPEN  http\nPORT 25/tcp   OPEN  smtp';
            out.innerText = `Nmap scan report for [${ip}]:\n${services}\nStatus: Target verified. Infiltration authorized.`;
            if (this.currentContract?.ip === ip) this.updateChatMessages();
        });

        $('btn-get-hint').addEventListener('click', () => {
            const out = $('hints-output');
            if (!this.active) { out.innerText = '[AI HINT] Start an infiltration first.'; return; }
            if (this.credits < 50) { out.innerText = '[AI HINT] Not enough credits. Need $50.'; return; }
            const path = this.findPath();
            if (!path) { out.innerText = '[AI HINT] No route found.'; return; }
            this.credits -= 50; this.hintPath = path.slice(0, 4);
            out.innerText = `[AI PATHFINDER] Shortest wall-free route: ${path.length} steps. Next 4 cells highlighted.`;
            this.updateStats(); this.renderGrid();
        });

        // SOCMINT + decoder
        $('btn-soc').addEventListener('click', () => {
            const q = $('soc-input').value.trim().toLowerCase();
            $('soc-output').innerText = !q ? 'Enter a username or email.' : SOC_DB[q] || `No public profiles found for "${q}".`;
        });
        const ops = {
            base64: s => atob(s.trim()), rot13,
            hex: s => s.replace(/\s/g, '').match(/../g).map(h => String.fromCharCode(parseInt(h, 16))).join(''),
            reverse: s => [...s].reverse().join('')
        };
        $('btn-decode').addEventListener('click', () => {
            try { $('dec-output').innerText = ops[$('dec-op').value]($('dec-input').value); }
            catch { $('dec-output').innerText = 'Invalid input for this decoder.'; }
        });

        // OSINT cases
        this.elCaseSelect.addEventListener('change', () => this.renderCases(false));
        $('btn-case-submit').addEventListener('click', () => this.submitCase());
        this.elCaseAnswer.addEventListener('keydown', e => { if (e.key === 'Enter') this.submitCase(); });
        $('btn-case-hint').addEventListener('click', () => {
            const cs = this.currentCase();
            if (this.solved.has(cs.id)) return;
            if (this.credits < 50) { this.elCaseFeedback.innerText = 'Need $50 for a hint.'; return; }
            this.credits -= 50; this.updateStats(); this.save();
            this.elCaseFeedback.innerText = `[HINT] ${cs.hint}`;
        });

        // Shop
        $('buy-monitor').addEventListener('click', () => {
            if (this.hasSecondMonitor) return;
            if (this.credits < 1000) return this.showModal('SHOP', 'Not enough credits! Dual Monitor Setup costs $1000.');
            this.credits -= 1000; this.hasSecondMonitor = true; this.markMonitorBought(); this.updateStats(); this.save();
        });
        $('buy-cpu').addEventListener('click', () => {
            if (this.credits < 300) return this.showModal('SHOP', 'Not enough credits! CPU Overclock costs $300.');
            this.credits -= 300; this.bonusMoves += 5; this.updateStats(); this.save();
            this.showModal('SHOP', `CPU overclocked! Permanent bonus moves: +${this.bonusMoves}.`);
        });

        // Grid
        this.elGridBoard.addEventListener('click', e => {
            const cell = e.target.closest('.cell');
            if (cell) this.handleCellClick(+cell.dataset.r, +cell.dataset.c);
        });
        $('btn-abort-hack').addEventListener('click', () => this.endHack(null));
        this.elModalBtn.addEventListener('click', () => this.elModal.classList.add('hidden'));
    }

    markMonitorBought() {
        const b = document.getElementById('buy-monitor');
        b.innerText = 'INSTALLED'; b.disabled = true;
    }

    updateStats() {
        this.elCredits.innerText = `$${this.credits}`;
        this.elRep.innerText = this.rep;
        this.elContractCount.innerText = this.contractsPool.length;
    }

    /* ---------- OSINT cases ---------- */
    currentCase() { return this.cases[this.elCaseSelect.selectedIndex] || this.cases[0]; }

    renderCases(rebuild = true) {
        if (rebuild) {
            const idx = Math.max(0, this.elCaseSelect.selectedIndex);
            this.elCaseSelect.innerHTML = this.cases.map(c =>
                `<option>${this.solved.has(c.id) ? '✔ ' : ''}${esc(c.title)} ($${c.reward})</option>`).join('');
            this.elCaseSelect.selectedIndex = idx;
        }
        const cs = this.currentCase();
        this.elCaseInfo.innerText = `${cs.intro}\n\n${cs.data}\n\nQ: ${cs.q}`;
        this.elCaseFeedback.innerText = this.solved.has(cs.id) ? 'Case already solved.' : '';
        this.elCaseAnswer.value = '';
    }

    submitCase() {
        const cs = this.currentCase(), v = this.elCaseAnswer.value;
        if (this.solved.has(cs.id)) { this.elCaseFeedback.innerText = 'Case already solved.'; return; }
        if (!v.trim()) return;
        if (cs.check(v)) {
            this.solved.add(cs.id);
            this.credits += cs.reward; this.rep += cs.rep; this.intelMoves += 2;
            this.save(); this.updateStats(); this.renderCases();
            this.elCaseFeedback.innerText = `CASE CLOSED! +$${cs.reward}, +${cs.rep} REP, +2 intel moves for your next hack.`;
        } else {
            this.elCaseFeedback.innerText = 'Incorrect. Re-check the data (or buy a hint).';
        }
    }

    /* ---------- contracts ---------- */
    generateRandomContract() {
        if (this.contractsPool.length >= 15) return;
        const pick = a => a[Math.floor(Math.random() * a.length)];
        const diff = pick(['easy', 'medium', 'hard']);
        const reward = { easy: 300, medium: 650, hard: 1200 }[diff];
        let ip;
        do { ip = `192.168.${Math.floor(Math.random() * 20 + 1)}.${Math.floor(Math.random() * 200 + 10)}`; }
        while (this.contractsPool.some(c => c.ip === ip));
        this.contractsPool.push({
            id: Date.now() + Math.random(),
            title: `${pick(['SecurCore Breach', 'Neural Net Hack', 'Quantum Relay Infil', 'Firewall Bypass', 'Mainframe Override'])} #${Math.floor(Math.random() * 90 + 10)}`,
            client: pick(['Nexus', 'Viper', 'Null_Byte', 'Spectre', 'Overlord']), reward, ip, diff, size: SIZE[diff],
            briefing: 'New darknet target identified. Comprehensive port reconnaissance required before connection.',
            intel: 'Subnet routing requires careful navigation.'
        });
        this.updateStats();
        this.renderContracts();
    }

    renderContracts() {
        if (this.currentContract) return;
        this.elChatBox.classList.add('hidden');
        this.elContractsList.innerHTML = '';
        this.updateStats();
        for (const contract of this.contractsPool) {
            const locked = this.rep < MIN_REP[contract.diff];
            const card = document.createElement('div');
            card.className = `contract-card tier-${contract.diff}${locked ? ' locked' : ''}`;
            card.innerHTML = `<div><strong>${esc(contract.title)}</strong><br><small>IP: ${esc(contract.ip)} | Client: ${esc(contract.client)} | <strong>$${contract.reward}</strong> (${contract.diff.toUpperCase()})${locked ? ` | 🔒 REP ${MIN_REP[contract.diff]}` : ''}</small></div>
                <div class="contract-actions"><button class="cyber-btn accept-btn" ${locked ? 'disabled' : ''}>ACCEPT</button><button class="cyber-btn warning decline-btn">X</button></div>`;
            card.querySelector('.accept-btn').addEventListener('click', () => this.startChat(contract));
            card.querySelector('.decline-btn').addEventListener('click', () => {
                this.contractsPool = this.contractsPool.filter(x => x.id !== contract.id);
                this.renderContracts();
            });
            this.elContractsList.appendChild(card);
        }
    }

    startChat(contract) {
        this.currentContract = contract;
        this.elContractsList.innerHTML = '';
        this.elChatBox.classList.remove('hidden');
        this.updateChatMessages();
    }

    updateChatMessages() {
        const c = this.currentContract, scanned = this.scannedIPs.has(c.ip);
        this.elChatMessages.innerHTML = `
            <p><strong>[Client: ${esc(c.client)}]</strong>: "${esc(c.briefing)}"</p>
            <p><strong>[Target]</strong>: IP <code>${esc(c.ip)}</code> | Reward: $${c.reward} | ${c.diff.toUpperCase()}</p>
            <p><strong>[Nmap]</strong>: <span style="color: ${scanned ? 'var(--green)' : 'var(--red)'}">${scanned ? 'VERIFIED' : 'NOT SCANNED (MANDATORY)'}</span></p>`;
        this.elChatActions.innerHTML = `
            <button class="cyber-btn primary" id="btn-proceed" ${scanned ? '' : 'disabled title="Run Nmap scan first!"'}>Proceed to Infiltration</button>
            <button class="cyber-btn warning" id="btn-reject">Decline / Back</button>`;
        document.getElementById('btn-proceed').addEventListener('click', () => {
            if (!this.hasSecondMonitor) return this.showModal('ERROR', 'You need a Second Monitor ($1000 in the shop) to run the tactical grid terminal.');
            this.elChatBox.classList.add('hidden');
            this.startHack(c);
        });
        document.getElementById('btn-reject').addEventListener('click', () => { this.currentContract = null; this.renderContracts(); });
    }

    /* ---------- grid mini-game ---------- */
    startHack(contract) {
        this.elSecondMonitor.classList.remove('hidden');
        this.elGridTargetName.innerText = `${contract.title} (${contract.ip})`;
        this.gridSize = contract.size || 6;
        const base = { 6: 18, 8: 25, 10: 34 }[this.gridSize];
        this.moves = base + this.bonusMoves + this.intelMoves;
        this.intelMoves = 0; this.save();
        this.elGridBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.elGridBoard.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        for (let i = 0; i < 200; i++) { this.generateGrid(); if (this.findPath()) break; } // guarantee a wall-free route
        this.hintPath = null; this.active = true;
        this.renderGrid();
    }

    generateGrid() {
        const n = this.gridSize;
        this.grid = Array.from({ length: n }, () => Array(n).fill('EMPTY'));
        this.grid[0][0] = 'PLAYER'; this.player = { r: 0, c: 0 };
        const spawn = (type, count) => {
            for (let placed = 0; placed < count;) {
                const r = Math.floor(Math.random() * n), c = Math.floor(Math.random() * n);
                if (this.grid[r][c] === 'EMPTY' && r + c > 1) { this.grid[r][c] = type; placed++; } // keep spawn corner clear
            }
        };
        spawn('WALL', Math.floor(n * 1.3));
        const corner = [];
        for (let r = n - 2; r < n; r++) for (let c = n - 2; c < n; c++) corner.push([r, c]);
        const free = corner.filter(([r, c]) => this.grid[r][c] === 'EMPTY');
        const [sr, sc] = free.length ? free[Math.floor(Math.random() * free.length)] : [n - 1, n - 1];
        this.grid[sr][sc] = 'SERVER';
        spawn('VIRUS', Math.floor(n * 0.7));
    }

    // BFS over non-wall cells; returns cells from the next step to the server
    findPath() {
        const n = this.gridSize, key = (r, c) => r * n + c, prev = new Map([[key(this.player.r, this.player.c), null]]);
        const queue = [this.player];
        while (queue.length) {
            const cur = queue.shift();
            if (this.grid[cur.r][cur.c] === 'SERVER') {
                const path = [];
                for (let k = key(cur.r, cur.c); prev.get(k) !== null; k = prev.get(k)) path.unshift({ r: Math.floor(k / n), c: k % n });
                return path;
            }
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const r = cur.r + dr, c = cur.c + dc;
                if (r < 0 || c < 0 || r >= n || c >= n || this.grid[r][c] === 'WALL' || prev.has(key(r, c))) continue;
                prev.set(key(r, c), key(cur.r, cur.c));
                queue.push({ r, c });
            }
        }
        return null;
    }

    renderGrid() {
        const icons = { PLAYER: '🔷', VIRUS: '👾', SERVER: '🖥️', WALL: '⛔', EMPTY: '' };
        this.elGridMoves.innerText = this.moves;
        this.elGridBoard.innerHTML = this.grid.map((row, r) => row.map((t, c) => {
            const hint = this.hintPath?.some(p => p.r === r && p.c === c) ? ' hint' : '';
            return `<div class="cell ${t.toLowerCase()}${hint}" data-r="${r}" data-c="${c}">${icons[t]}</div>`;
        }).join('')).join('');
    }

    handleCellClick(r, c) {
        if (!this.active || !this.isAdjacent(this.player, { r, c })) return;
        const type = this.grid[r][c];
        if (type === 'WALL') return;
        this.hintPath = null;
        this.moves--;
        if (type === 'SERVER') return this.endHack(true);
        if (type === 'VIRUS') this.moves -= 3; // crashing into a virus costs extra moves
        this.grid[this.player.r][this.player.c] = 'EMPTY';
        this.grid[r][c] = 'PLAYER';
        this.player = { r, c };
        this.processViruses();
        if (this.moves <= 0) return this.endHack(false);
        this.renderGrid();
    }

    // Viruses hunt the player: attack when adjacent, otherwise step closer
    processViruses() {
        const viruses = [];
        this.grid.forEach((row, r) => row.forEach((t, c) => { if (t === 'VIRUS') viruses.push({ r, c }); }));
        const dist = (r, c) => Math.abs(r - this.player.r) + Math.abs(c - this.player.c);
        for (const v of viruses) {
            if (Math.random() >= 0.4) continue;
            if (dist(v.r, v.c) === 1) { this.moves -= 2; continue; }
            const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                .map(([dr, dc]) => ({ r: v.r + dr, c: v.c + dc }))
                .filter(p => p.r >= 0 && p.c >= 0 && p.r < this.gridSize && p.c < this.gridSize && this.grid[p.r][p.c] === 'EMPTY')
                .sort((a, b) => dist(a.r, a.c) - dist(b.r, b.c) || Math.random() - 0.5);
            if (options.length) { this.grid[v.r][v.c] = 'EMPTY'; this.grid[options[0].r][options[0].c] = 'VIRUS'; }
        }
    }

    // success: true = hacked, false = failed, null = aborted
    endHack(success) {
        const c = this.currentContract;
        if (success === true) {
            const bonus = Math.max(0, this.moves) * 5;
            this.credits += c.reward + bonus; this.rep += 8;
            this.contractsPool = this.contractsPool.filter(x => x.id !== c.id);
            this.showModal('ACCESS GRANTED', `Hacked ${c.title}!\nReward: $${c.reward} + $${bonus} speed bonus`);
        } else if (success === false) {
            this.rep = Math.max(0, this.rep - 3);
            this.showModal('MISSION FAILED', 'Out of moves. Connection traced and blocked. -3 REP.');
        }
        this.active = false; this.hintPath = null; this.currentContract = null;
        this.elSecondMonitor.classList.add('hidden');
        this.save(); this.renderContracts();
    }

    isAdjacent(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

    showModal(title, msg) {
        this.elModalTitle.innerText = title;
        this.elModalMsg.innerText = msg;
        this.elModal.classList.remove('hidden');
    }
}

window.addEventListener('DOMContentLoaded', () => { new CyberSimulator(); });