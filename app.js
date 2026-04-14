// DOM Elements
const views = {
    'view-simulator': document.getElementById('view-simulator'),
    'view-comparison': document.getElementById('view-comparison'),
    'view-history': document.getElementById('view-history')
};
const navBtns = document.querySelectorAll('.nav-btn');

// State
let state = {
    edgesStr: '',
    edges: [],
    nodes: [],
    algorithm: 'Kruskal',
    stepIdx: 0,
    cost: 0,
    mstEdgesFound: 0,
    isPlaying: false,
    speed: 1200,
    timer: null,
    historyLog: [],
    compiledSteps: [],
    nodePositions: {}
};

const els = {
    refInput: document.getElementById('ref-input'),
    applyBtn: document.getElementById('apply-ref-btn'),
    refContainer: document.getElementById('reference-string-container'),
    canvasContainer: document.getElementById('canvas-container'),
    framesWrapper: document.getElementById('frames-wrapper'),
    edgesSvg: document.getElementById('edges-svg'),
    algoBtns: document.querySelectorAll('.algo-btn'),
    playBtn: document.getElementById('play-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    stepBtn: document.getElementById('step-btn'),
    resetBtn: document.getElementById('reset-btn'),
    speedSlider: document.getElementById('speed-slider'),
    statusInd: document.getElementById('status-indicator'),
    stepCounter: document.getElementById('step-counter'),
    costCounter: document.getElementById('cost-counter'),
    edgesCounter: document.getElementById('edges-counter'),
    kruskalOptions: document.getElementById('kruskal-options'),
    primOptions: document.getElementById('prim-options'),
    kruskalSort: document.getElementById('kruskal-sort'),
    primStart: document.getElementById('prim-start'),
    helpBtn: document.getElementById('help-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebar: document.getElementById('sidebar'),
    helpModal: document.getElementById('help-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    gotItBtn: document.getElementById('got-it-btn')
};

// --- Initialization ---

// ==============================
// PREMISE MODES CONFIG
// ==============================
const PREMISE_MODES = {
    abstract: {
        nodeLabel: 'Node', weightLabel: 'Cost', unit: '',
        desc: 'Nodes = Variables, Weights = Cost',
        preset: 'A-B:4,A-C:8,B-C:2,B-D:5,C-D:5,C-E:9,D-E:4'
    },
    cities: {
        nodeLabel: 'City', weightLabel: 'Distance', unit: 'km',
        desc: 'Nodes = Cities, Weights = Road distance in km. MST = cheapest road network.',
        preset: 'Mumbai-Pune:149,Mumbai-Surat:284,Pune-Nashik:211,Surat-Vadodara:130,Nashik-Vadodara:310,Pune-Hyderabad:560'
    },
    router: {
        nodeLabel: 'Router', weightLabel: 'Latency', unit: 'ms',
        desc: 'Nodes = Network Routers, Weights = Latency in ms. MST = lowest-latency backbone.',
        preset: 'R1-R2:12,R1-R3:25,R2-R3:8,R2-R4:16,R3-R4:20,R4-R5:5'
    },
    power: {
        nodeLabel: 'Station', weightLabel: 'Cable Cost', unit: 'kW',
        desc: 'Nodes = Power Stations, Weights = Cable cost. MST = cheapest power grid layout.',
        preset: 'PS1-PS2:45,PS1-PS3:70,PS2-PS3:30,PS2-PS4:35,PS3-PS4:60,PS4-PS5:20'
    }
};

let currentPremise = 'abstract';
let perfChartInstance = null;

function init() {
    setupNavigation();
    setupEventListeners();
    setupPremiseMode();
    parseInput();
}

function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            navBtns.forEach(b => {
                b.classList.remove('bg-white/10', 'text-white', 'border-cyber-blue/50', 'shadow-[0_0_15px_rgba(0,242,254,0.2)]');
                b.classList.add('text-white/50', 'border-transparent');
            });
            e.currentTarget.classList.add('bg-white/10', 'text-white', 'border-cyber-blue/50', 'shadow-[0_0_15px_rgba(0,242,254,0.2)]');
            e.currentTarget.classList.remove('text-white/50', 'border-transparent');

            Object.values(views).forEach(v => v.classList.remove('view-active'));
            views[target].classList.add('view-active');

            if (target === 'view-comparison') runBenchmarks();
            if (target === 'view-history') renderHistoryTrace();

            if (window.innerWidth < 768 && els.sidebar) {
                els.sidebar.classList.add('-translate-x-full');
            }
        });
    });
}

function setupEventListeners() {
    els.applyBtn.addEventListener('click', parseInput);

    els.algoBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.algoBtns.forEach(b => b.classList.remove('algo-active'));
            e.currentTarget.classList.add('algo-active');
            state.algorithm = e.currentTarget.dataset.algo;
            
            if(state.algorithm === 'Kruskal') {
                if(els.kruskalOptions) els.kruskalOptions.classList.replace('hidden', 'flex');
                if(els.primOptions) els.primOptions.classList.replace('flex', 'hidden');
                if(els.primOptions && !els.primOptions.classList.contains('hidden')) els.primOptions.classList.add('hidden');
            } else {
                if(els.primOptions) els.primOptions.classList.replace('hidden', 'flex');
                if(els.kruskalOptions) els.kruskalOptions.classList.replace('flex', 'hidden');
                if(els.kruskalOptions && !els.kruskalOptions.classList.contains('hidden')) els.kruskalOptions.classList.add('hidden');
            }
            resetSimulation();
        });
    });

    els.speedSlider.addEventListener('input', (e) => {
        state.speed = 2900 - parseInt(e.target.value);
        if(state.isPlaying) {
            clearInterval(state.timer);
            state.timer = setInterval(nextStep, state.speed);
        }
    });
    state.speed = 2900 - parseInt(els.speedSlider.value);

    window.addEventListener('resize', () => {
        if (state.compiledSteps.length > 0) {
            build3DGraph();
            reDrawMSTState();
        }
    });

    els.stepBtn.addEventListener('click', nextStep);
    els.resetBtn.addEventListener('click', resetSimulation);
    els.playBtn.addEventListener('click', startAutoplay);
    els.pauseBtn.addEventListener('click', pauseAutoplay);

    if (els.mobileMenuBtn && els.sidebar) els.mobileMenuBtn.addEventListener('click', () => els.sidebar.classList.toggle('-translate-x-full'));

    // Error modal close
    const errCloseBtn = document.getElementById('error-close-btn');
    if (errCloseBtn) errCloseBtn.addEventListener('click', closeErrorModal);
    const errModal = document.getElementById('error-modal');
    if (errModal) errModal.addEventListener('click', (e) => { if (e.target === errModal) closeErrorModal(); });

    if (els.helpBtn) {
        els.helpBtn.addEventListener('click', () => {
            els.helpModal.classList.remove('hidden');
            setTimeout(() => {
                els.helpModal.classList.remove('opacity-0');
                document.getElementById('help-modal-content').classList.remove('scale-95');
            }, 10);
        });
        const closeModal = () => {
            els.helpModal.classList.add('opacity-0');
            document.getElementById('help-modal-content').classList.add('scale-95');
            setTimeout(() => els.helpModal.classList.add('hidden'), 300);
        };
        els.closeModalBtn.addEventListener('click', closeModal);
        els.gotItBtn.addEventListener('click', closeModal);
        els.helpModal.addEventListener('click', (e) => { if (e.target === els.helpModal) closeModal(); });
    }
}

function setupPremiseMode() {
    const sel = document.getElementById('premise-mode');
    if (!sel) return;
    sel.addEventListener('change', () => {
        currentPremise = sel.value;
        const cfg = PREMISE_MODES[currentPremise];
        document.getElementById('premise-desc').innerText = cfg.desc;
        // Load the preset graph for this mode
        document.getElementById('ref-input').value = cfg.preset;
        parseInput();
    });
}

// --- PARSING ---
function parseInput() {
    const val = els.refInput.value.trim();
    if(!val) return;

    state.edgesStr = val;
    let parsedEdges = [];
    let standaloneNodes = [];

    // Supports mixed format: "F, A-B:4, B-C:2"
    // Tokens with no ':' and no '-' are treated as standalone (isolated) nodes
    const tokens = val.split(',');
    for(let t of tokens) {
        t = t.trim();
        if(!t) continue;

        if(t.includes(':')) {
            let p = t.split(':');
            if(p.length < 2) continue;

            let nodeParts = p[0].split('-');

            if(nodeParts.length === 2) {
                // Edge token: A-B:4
                let weight = parseFloat(p[1]);
                if(isNaN(weight)) continue;

                let u = nodeParts[0].trim();
                let v = nodeParts[1].trim();
                if(!u || !v) continue;

                let idu = u < v ? u : v;
                let idv = u < v ? v : u;
                parsedEdges.push({ u, v, w: weight, id: `${idu}-${idv}` });

            } else if(nodeParts.length === 1 && nodeParts[0].trim()) {
                // Standalone node with optional value: F:9  →  just register node F
                standaloneNodes.push(nodeParts[0].trim().toUpperCase());
            }

        } else if(!t.includes('-')) {
            // Plain standalone node: F
            standaloneNodes.push(t.toUpperCase());
        }
    }

    state.edges = parsedEdges;
    // Merge edge-derived nodes + explicitly declared standalone nodes, preserving order & uniqueness
    const edgeNodes = parsedEdges.flatMap(e => [e.u, e.v]);
    state.nodes = Array.from(new Set([...standaloneNodes, ...edgeNodes]));

    resetSimulation();
}

// --- 3D ENGINE BUILDER ---
function build3DGraph() {
    els.framesWrapper.innerHTML = '';
    els.edgesSvg.innerHTML = '';
    
    // Safety check if canvas has no size yet
    const cw = els.canvasContainer.clientWidth;
    const ch = els.canvasContainer.clientHeight;
    
    if (cw < 100 || ch < 100) return; // Will redraw on resize anyway

    // Circular layout math
    const margin = 50;
    const radius = Math.min(cw, ch) / 2.2 - margin;
    const cx = cw / 2;
    const cy = ch / 2;

    state.nodePositions = {};
    const angleStep = (2 * Math.PI) / state.nodes.length;
    
    state.nodes.forEach((n, i) => {
        let x = cx + radius * Math.cos(i * angleStep);
        let y = cy + radius * Math.sin(i * angleStep);
        state.nodePositions[n] = { x, y };

        // Node Container -> we place a 3D generic cube structure
        let div = document.createElement('div');
        div.className = 'absolute z-10';
        div.style.left = (x - 20) + 'px'; 
        div.style.top = (y - 20) + 'px';
        
        // Cube CSS elements
        div.innerHTML = `
            <div class="scene" style="transform: scale(0.6);">
                <div class="cube" id="node-${n}">
                    <div class="cube__face cube__face--front flex items-center justify-center font-black text-2xl text-cyber-blue bg-black/80 border border-cyber-blue">${n}</div>
                    <div class="cube__face cube__face--right bg-black/80 border border-cyber-blue/50"></div>
                    <div class="cube__face cube__face--back bg-black/80 border border-cyber-blue/50"></div>
                    <div class="cube__face cube__face--left bg-black/80 border border-cyber-blue/50"></div>
                    <div class="cube__face cube__face--top bg-black/80 border border-cyber-blue/50"></div>
                    <div class="cube__face cube__face--bottom bg-black/80 border border-cyber-blue/50"></div>
                </div>
            </div>
        `;
        els.framesWrapper.appendChild(div);
    });

    // Render Edges (SVG lines)
    state.edges.forEach(e => {
        let p1 = state.nodePositions[e.u];
        let p2 = state.nodePositions[e.v];
        
        let path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        path.setAttribute('x1', p1.x);
        path.setAttribute('y1', p1.y);
        path.setAttribute('x2', p2.x);
        path.setAttribute('y2', p2.y);
        path.setAttribute('id', `edge-line-${e.id}`);
        path.setAttribute('stroke', 'rgba(255,255,255,0.08)');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('stroke-linecap', 'round');
        path.style.transition = 'all 0.4s ease';
        els.edgesSvg.appendChild(path);

        // Weight text
        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;
        
        let bgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', midX - 10);
        rect.setAttribute('y', midY - 10);
        rect.setAttribute('width', '20');
        rect.setAttribute('height', '20');
        rect.setAttribute('fill', '#0b0f19');
        rect.setAttribute('rx', '4');
        bgGroup.appendChild(rect);

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', midX);
        text.setAttribute('y', midY + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'rgba(255,255,255,0.5)');
        text.setAttribute('font-size', '12px');
        text.setAttribute('font-family', 'monospace');
        text.setAttribute('font-weight', 'bold');
        text.textContent = e.w;
        bgGroup.appendChild(text);

        els.edgesSvg.appendChild(bgGroup);
    });
}

function reDrawMSTState() {
    // Used when resizing resets svg elements to re-apply any MST styles
    for(let i=0; i<state.stepIdx; i++){
        let log = state.compiledSteps[i];
        let el = document.getElementById(`edge-line-${log.edgeIds[0]}`); // simplify to use first edge
        if(!el) return;
        if(log.action === 'SUCCESS') {
            el.setAttribute('stroke', '#00ff88'); // cyber-green
            el.setAttribute('filter', 'drop-shadow(0 0 5px rgba(0,255,136,0.8))');
        } else if (log.action === 'CYCLE') {
            el.setAttribute('stroke', 'rgba(255,255,255,0.05)');
        }
    }
}


// --- LOGIC EXECUTION ---
async function resetSimulation() {
    pauseAutoplay();
    state.stepIdx = 0;
    state.cost = 0;
    state.mstEdgesFound = 0;
    state.historyLog = [];
    
    // Fetch steps from Python backend
    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edges: state.edges,
                nodes: state.nodes,
                algorithm: state.algorithm,
                kruskalSort: els.kruskalSort ? els.kruskalSort.value : 'asc',
                primStart: els.primStart ? els.primStart.value : ''
            })
        });
        const data = await response.json();
        state.compiledSteps = data.steps || [];
    } catch (e) {
        console.error("Backend connection failed", e);
        state.compiledSteps = [];
    }

    // DOM resets
    els.statusInd.style.opacity = 0;
    els.refContainer.innerHTML = '';
    els.costCounter.innerText = '0';
    els.edgesCounter.innerText = '0';
    
    build3DGraph(); // Recalculate 3D Graph layout from scratch
    updateHUDStatus();
}

function updateHUDStatus() {
    if(state.compiledSteps.length === 0) {
        els.stepCounter.innerText = "Empty Graph";
        return;
    }
    if(state.stepIdx < state.compiledSteps.length) {
        els.stepCounter.innerText = `Step ${state.stepIdx + 1} / ${state.compiledSteps.length}`;
        els.stepCounter.className = "text-xs font-black uppercase tracking-widest text-cyber-blue bg-cyber-blue/10 px-4 py-1.5 rounded-full border border-cyber-blue/30";
    } else {
        els.stepCounter.innerText = `MST Complete`;
        els.stepCounter.className = "text-xs font-black uppercase tracking-widest text-cyber-green bg-cyber-green/10 px-4 py-1.5 rounded-full border border-cyber-green/30";
    }
}

function isGraphConnected() {
    if (state.nodes.length === 0) return { connected: false, reason: 'No nodes found in the graph.', detail: '' };
    if (state.edges.length === 0) return { connected: false, reason: 'No edges defined. Add edges in format: A-B:4, B-C:2', detail: '' };

    // Build adjacency list
    const adj = {};
    state.nodes.forEach(n => adj[n] = []);
    state.edges.forEach(e => {
        adj[e.u].push(e.v);
        adj[e.v].push(e.u);
    });

    // Start BFS from first node that actually HAS edges (not a standalone isolate like F)
    const startNode = state.nodes.find(n => (adj[n] || []).length > 0) || state.nodes[0];

    const visited = new Set();
    const queue = [startNode];
    while (queue.length) {
        const curr = queue.shift();
        if (!visited.has(curr)) {
            visited.add(curr);
            (adj[curr] || []).forEach(n => { if (!visited.has(n)) queue.push(n); });
        }
    }

    // Isolated = anything NOT reachable from the main connected component
    const isolated = state.nodes.filter(n => !visited.has(n));

    if (isolated.length > 0) {
        return {
            connected: false,
            reason: `Graph is disconnected — <b>${isolated.length} node${isolated.length > 1 ? 's are' : ' is'}</b> not connected to the main graph.`,
            detail: `<div class="space-y-2">
                <div>&#10060; <b class="text-cyber-red">Isolated node${isolated.length > 1 ? 's' : ''}:</b> <span class="text-white font-black">${isolated.join(', ')}</span></div>
                <div>&#9989; <b class="text-cyber-green">Connected nodes:</b> <span class="text-white">${[...visited].join(', ')}</span></div>
                <div class="mt-3 pt-3 border-t border-white/10">&#128161; <b>Fix:</b> Link the isolated node(s), e.g. <code class="text-cyber-blue bg-black/40 px-1 rounded">${startNode}-${isolated[0]}:1</code></div>
            </div>`
        };
    }
    return { connected: true };
}

function showErrorModal(msg, detail = '') {
    const modal = document.getElementById('error-modal');
    document.getElementById('error-modal-msg').innerHTML = msg;
    document.getElementById('error-modal-detail').innerHTML = detail;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('error-modal-content').classList.remove('scale-95');
    }, 10);
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    modal.classList.add('opacity-0');
    document.getElementById('error-modal-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function startAutoplay() {
    // Connectivity guard
    const check = isGraphConnected();
    if (!check.connected) {
        showErrorModal(check.reason, check.detail || '');
        return;
    }
    if(state.stepIdx >= state.compiledSteps.length) resetSimulation();
    if(state.timer) clearInterval(state.timer);
    state.isPlaying = true;
    els.playBtn.disabled = true;
    els.pauseBtn.disabled = false;
    els.stepBtn.disabled = true;
    state.timer = setInterval(nextStep, state.speed);
}
function pauseAutoplay() {
    state.isPlaying = false;
    clearInterval(state.timer);
    els.playBtn.disabled = false;
    els.pauseBtn.disabled = true;
    els.stepBtn.disabled = false;
}

function nextStep() {
    // Connectivity guard on Step too
    if (state.stepIdx === 0) {
        const check = isGraphConnected();
        if (!check.connected) {
            showErrorModal(check.reason, check.detail || '');
            return;
        }
    }
    if(state.stepIdx >= state.compiledSteps.length) {
        pauseAutoplay();
        return;
    }
    
    const stepData = state.compiledSteps[state.stepIdx];
    
    // Add to history log table
    state.historyLog.push(stepData);

    // Update Top Tracker Stream
    let block = document.createElement('div');
    block.className = `shrink-0 px-4 py-2 rounded-lg border flex gap-4 ${stepData.action === 'SUCCESS' ? 'border-cyber-green/30 bg-cyber-green/10' : 'border-cyber-red/30 bg-cyber-red/10'}`;
    block.innerHTML = `
        <span class="w-16 font-bold text-${stepData.action==='SUCCESS'?'cyber-green':'cyber-red'}">${stepData.action}</span> 
        <span class="text-white">Edge: ${stepData.edgeLabel} (${stepData.weight})</span>
    `;
    els.refContainer.appendChild(block);
    els.refContainer.scrollTo({ top: els.refContainer.scrollHeight, behavior: 'smooth' });

    // Animate Visuals
    animateEdge(stepData);

    // Update states
    if(stepData.action === 'SUCCESS') {
        state.cost = stepData.cost;
        state.mstEdgesFound++;
    }
    
    els.costCounter.innerText = state.cost;
    els.edgesCounter.innerText = state.mstEdgesFound;
    
    state.stepIdx++;
    updateHUDStatus();
}

function animateEdge(stepData) {
    // 3D Canvas SVGs
    stepData.edgeIds.forEach(eid => {
        let lineEl = document.getElementById(`edge-line-${eid}`);
        if(lineEl) {
            if(stepData.action === 'SUCCESS') {
                lineEl.setAttribute('stroke', '#00ff88'); // cyber-green
                lineEl.setAttribute('stroke-width', '5');
                lineEl.setAttribute('filter', 'drop-shadow(0 0 10px rgba(0,255,136,1))');
                showStatus(`ADDED ${stepData.edgeLabel}`, "#00ff88", "text-black");
            } else {
                lineEl.setAttribute('stroke', '#ff3366'); // cyber-red
                lineEl.setAttribute('stroke-width', '2');
                setTimeout(() => {
                    if(lineEl) {
                        lineEl.setAttribute('stroke', 'rgba(255,255,255,0.05)'); // fade out
                    }
                }, state.speed - 100);
                showStatus(`CYCLE DETECTED`, "#ff3366", "text-white");
            }
        }
    });
}

function showStatus(text, bg, textColor) {
    els.statusInd.innerText = text;
    els.statusInd.style.backgroundColor = bg;
    els.statusInd.className = `absolute top-10 px-8 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transform transition-all duration-300 shadow-lg ${textColor} z-50`;
    
    // animate in
    els.statusInd.style.opacity = 1;
    els.statusInd.style.transform = "translateY(0) scale(1.1)";
    
    setTimeout(() => {
        els.statusInd.style.opacity = 0;
        els.statusInd.style.transform = "translateY(-15px) scale(1)";
    }, Math.max(400, state.speed - 300));
}

// --- Benchmarks & History ---
async function runBenchmarks() {
    const cfg = PREMISE_MODES[currentPremise];
    document.getElementById('benchmark-summary').innerHTML = `<span class="text-white/50 animate-pulse">Running Python Backend Analysis...</span>`;

    const payload = {
        edges: state.edges,
        nodes: state.nodes,
        kruskalSort: document.getElementById('kruskal-sort') ? document.getElementById('kruskal-sort').value : 'asc',
        primStart: document.getElementById('prim-start') ? document.getElementById('prim-start').value : ''
    };

    // Run both API calls in parallel
    let kSteps, pSteps, analysis;
    try {
        const [benchRes, analyzeRes] = await Promise.all([
            fetch('/api/benchmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
            fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        ]);
        const benchData = await benchRes.json();
        analysis = await analyzeRes.json();
        kSteps = benchData.kruskal || [];
        pSteps = benchData.prim || [];
    } catch (e) {
        document.getElementById('benchmark-summary').innerHTML = `<span class="text-cyber-red font-black">Connection Error: Could not reach Python Backend.</span>`;
        return;
    }

    // --- Network Intelligence Stats ---
    document.getElementById('stat-nodes').innerText = analysis.nodes;
    document.getElementById('stat-edges').innerText = analysis.edges;
    document.getElementById('stat-density').innerText = analysis.density + '%';
    const connEl = document.getElementById('stat-connected');
    const connCard = document.getElementById('stat-connectivity-card');
    connEl.innerText = analysis.connected ? 'Yes ✓' : 'No ✗';
    connEl.className = `text-2xl font-black ${analysis.connected ? 'text-cyber-green' : 'text-cyber-red'}`;
    connCard.classList.toggle('border-t-cyber-green', analysis.connected);
    connCard.classList.toggle('border-t-cyber-red', !analysis.connected);

    // Warnings
    const warnEl = document.getElementById('net-warnings');
    if (analysis.warnings && analysis.warnings.length > 0) {
        warnEl.className = 'flex flex-col gap-2';
        warnEl.innerHTML = analysis.warnings.map(w =>
            `<div class="px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono">${w}</div>`
        ).join('');
    } else {
        warnEl.className = 'hidden';
        warnEl.innerHTML = '';
    }

    // --- Bento Cards ---
    let kSucc = kSteps.filter(s => s.action==='SUCCESS');
    let kCost = kSucc.length > 0 ? kSucc[kSucc.length-1].cost : 0;
    let pSucc = pSteps.filter(s => s.action==='SUCCESS');
    let pCost = pSucc.length > 0 ? pSucc[pSucc.length-1].cost : 0;

    let matchStr = (kCost === pCost && pCost !== 0) ? "Cost Matched" : "Diverged!";
    document.getElementById('winner-name').innerText = matchStr;

    let res = [
        {name: "Kruskal's", evalOps: kSteps.length, cost: kCost, edgesAdded: kSucc.length, bBorder: 'border-t-cyber-blue', timeUs: analysis.kruskalTimeUs},
        {name: "Prim's", evalOps: pSteps.length, cost: pCost, edgesAdded: pSucc.length, bBorder: 'border-t-cyber-green', timeUs: analysis.primTimeUs}
    ];

    document.getElementById('bento-container').innerHTML = res.map(r => `
        <div class="glass-box p-3 md:p-4 border-t-4 ${r.bBorder}">
            <h2 class="text-lg md:text-xl font-black text-white mb-3 uppercase">${r.name}</h2>
            <div class="space-y-3">
                <div class="flex justify-between border-b border-white/10 pb-2">
                    <span class="text-xs uppercase font-black text-white/50">Total Edges Evaluated</span>
                    <span class="text-lg font-black">${r.evalOps}</span>
                </div>
                <div class="flex justify-between border-b border-white/10 pb-2">
                    <span class="text-xs uppercase font-black text-white/50">Edges Added to MST</span>
                    <span class="text-lg font-black">${r.edgesAdded}</span>
                </div>
                <div class="flex justify-between border-b border-white/10 pb-2">
                    <span class="text-xs uppercase font-black text-white/50">Python Exec Time</span>
                    <span class="text-lg font-black text-yellow-400">${r.timeUs} μs</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-xs uppercase font-black text-white/50">MST ${cfg.weightLabel} (${cfg.unit || 'units'})</span>
                    <span class="text-lg font-black">${r.cost}</span>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('compare-tbody').innerHTML = `
        <tr><td class="py-3 px-4 text-white/80">MST Total ${cfg.weightLabel}</td>
            <td class="py-3 px-4 text-center font-black text-cyber-blue drop-shadow">${res[0].cost} ${cfg.unit}</td>
            <td class="py-3 px-4 text-center font-black text-cyber-green drop-shadow">${res[1].cost} ${cfg.unit}</td>
        </tr>
        <tr><td class="py-3 px-4 text-white/80">Python Exec Time</td>
            <td class="py-3 px-4 text-center font-black text-yellow-400">${analysis.kruskalTimeUs} μs</td>
            <td class="py-3 px-4 text-center font-black text-yellow-400">${analysis.primTimeUs} μs</td>
        </tr>
    `;

    // --- Chart.js: MST Cost Progression ---
    renderPerfChart(kSteps, pSteps);

    // --- Execution Summary ---
    const summaryEl = document.getElementById('benchmark-summary');
    if (summaryEl) {
        const faster = analysis.kruskalTimeUs <= analysis.primTimeUs ? "Kruskal's" : "Prim's";
        if (kCost === pCost && pCost !== 0) {
            summaryEl.innerHTML = `Both algorithms converged on an identical MST ${cfg.weightLabel.toLowerCase()} of <span class="text-cyber-green font-black text-lg">${kCost} ${cfg.unit}</span>.
            <br><br>
            <span class="text-cyber-blue font-black">> Kruskal's</span> sorted all ${kSteps.length} edges globally and used Disjoint Sets to accept ${kSucc.length} edges. Execution: <b class="text-yellow-400">${analysis.kruskalTimeUs}μs</b>.
            <br><br>
            <span class="text-cyber-green font-black">> Prim's</span> greedy boundary expansion added ${pSucc.length} edges across ${pSteps.length} checks. Execution: <b class="text-yellow-400">${analysis.primTimeUs}μs</b>.
            <br><br>
            ⚡ <b class="text-white">${faster}</b> was faster on this graph.`;
        } else if (pCost === 0) {
            summaryEl.innerHTML = `The network yielded 0 cost — graph may be empty or disconnected.`;
        } else {
            summaryEl.innerHTML = `<span class="text-cyber-red font-black">Divergence Detected.</span> Kruskal: ${kCost} ${cfg.unit} | Prim: ${pCost} ${cfg.unit}. Graph may be disconnected or have conflicting weights.`;
        }
    }
}

function renderPerfChart(kSteps, pSteps) {
    const canvas = document.getElementById('perf-chart');
    if (!canvas) return;

    // Build cumulative cost arrays for success steps only
    const kLabels = [], kData = [];
    let kCum = 0;
    kSteps.forEach((s, i) => {
        if (s.action === 'SUCCESS') { kCum = s.cost; }
        kLabels.push(`E${i+1}`);
        kData.push(kCum);
    });

    const pData = [];
    let pCum = 0;
    pSteps.forEach((s) => {
        if (s.action === 'SUCCESS') { pCum = s.cost; }
        pData.push(pCum);
    });
    // Pad shorter array
    const maxLen = Math.max(kLabels.length, pData.length);
    while (pData.length < maxLen) pData.push(pData[pData.length - 1] || 0);
    while (kData.length < maxLen) kData.push(kData[kData.length - 1] || 0);
    while (kLabels.length < maxLen) kLabels.push(`E${kLabels.length+1}`);

    if (perfChartInstance) perfChartInstance.destroy();

    perfChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: kLabels,
            datasets: [
                {
                    label: "Kruskal's Cost",
                    data: kData,
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0,242,254,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#00f2fe'
                },
                {
                    label: "Prim's Cost",
                    data: pData,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0,255,136,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#00ff88'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', weight: '700', size: 11 } } }
            },
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
            }
        }
    });
}

function renderHistoryTrace() {
    document.getElementById('trace-algo-label').innerText = state.algorithm;
    
    document.getElementById('trace-tbody').innerHTML = state.historyLog.map((log) => {
        let resBadge = log.action === 'SUCCESS' 
                     ? `<span class="bg-cyber-green/20 border border-cyber-green text-cyber-green px-3 py-1 text-[10px] font-black rounded uppercase shadow-[0_0_10px_rgba(0,255,136,0.3)]">Added</span>` 
                     : `<span class="bg-cyber-red/20 border border-cyber-red text-cyber-red px-3 py-1 text-[10px] font-black rounded uppercase text-white/50 shadow-[0_0_10px_rgba(255,51,102,0.3)]">Cycle Rejected</span>`;
                     
        return `
            <tr class="hover:bg-white/5 transition-colors border-l-2 ${log.action==='SUCCESS' ? 'border-l-cyber-green':'border-l-cyber-red'}">
                <td class="px-8 py-4 font-mono font-black text-white/50">${state.historyLog.indexOf(log) + 1}</td>
                <td class="px-8 py-4"><span class="bg-black border border-white/20 text-white font-black px-3 py-1.5 rounded-lg font-mono text-sm shadow">${log.edgeLabel}</span></td>
                <td class="px-8 py-4 font-black font-mono text-white/80">${log.weight}</td>
                <td class="px-8 py-4">${resBadge}</td>
                <td class="px-8 py-4 text-xl font-black text-white drop-shadow">${log.cost}</td>
            </tr>
        `;
    }).join('');
}

// Ensure init runs after HTML loads
document.addEventListener("DOMContentLoaded", () => {
    // A timeout ensures UI canvas is correctly sized before drawing
    setTimeout(init, 50);
});
