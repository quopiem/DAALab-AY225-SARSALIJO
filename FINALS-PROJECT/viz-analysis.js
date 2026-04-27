// ============================================================
// Student 2 – feature/viz-analysis
// World GDP Ranking Dashboard – Chart & Analysis Engine
// ============================================================

const INCOME_LABELS = {
    WLD: 'World',
    HIC: 'High income',
    UMC: 'Upper middle income',
    LMC: 'Lower middle income',
    LIC: 'Low income'
};

const REGION_LABELS = {
    EAS: 'East Asia & Pacific',
    ECS: 'Europe & Central Asia',
    LCN: 'Latin America & Caribbean',
    MEA: 'Middle East & North Africa',
    NAC: 'North America',
    SAS: 'South Asia',
    SSF: 'Sub-Saharan Africa'
};

// ─── Chart Registry ─────────────────────────────────────────

const _charts = { bar: null, region: null, income: null, scatter: null, doughnut: null };

function _destroy(key) {
    if (_charts[key]) { _charts[key].destroy(); _charts[key] = null; }
}

function _showCanvas(id) {
    const c = document.getElementById(id);
    if (c) c.style.display = 'block';
    const ph = document.getElementById(id + 'Placeholder');
    if (ph) ph.style.display = 'none';
}

// ─── Statistical Helpers ────────────────────────────────────

function variance(arr) {
    const v = arr.filter(Number.isFinite);
    if (!v.length) return 0;
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    return v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length;
}

function stdDev(arr) { return Math.sqrt(variance(arr)); }

function pearsonCorr(x, y) {
    const pairs = [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if (Number.isFinite(x[i]) && Number.isFinite(y[i])) pairs.push([x[i], y[i]]);
    }
    const n = pairs.length;
    if (!n) return NaN;
    const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
    const my = pairs.reduce((s, p) => s + p[1], 0) / n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (const [xi, yi] of pairs) {
        const dx = xi - mx, dy = yi - my;
        num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    const den = Math.sqrt(dx2 * dy2);
    return den === 0 ? NaN : num / den;
}

function linearRegression(x, y) {
    const pairs = [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if (Number.isFinite(x[i]) && Number.isFinite(y[i])) pairs.push([x[i], y[i]]);
    }
    const n = pairs.length;
    if (!n) return { slope: 0, intercept: 0, r2: 0, n: 0 };
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    const slope = den === 0 ? 0 : num / den;
    const intercept = my - slope * mx;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        ssTot += (ys[i] - my) ** 2;
        ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2;
    }
    return { slope, intercept, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot, n };
}

// ─── Data Partitioning ──────────────────────────────────────

function getCountryRows() {
    return (window.DS || []).filter(r => {
        const code = String(r.Code || r.code || '').trim().toUpperCase();
        if (INCOME_GROUP_CODES.has(code) || REGION_CODES.has(code)) return false;
        const gdp = parseFloat(String(r.GDP || r.gdp || r.value || '').replace(/[^0-9.-]/g, ''));
        const rank = r.Rank ?? r.rank;
        return Number.isFinite(gdp) && gdp > 0 && (rank !== null && rank !== undefined && String(rank).trim() !== '');
    });
}

function getRegionRows() {
    return (window.DS || []).filter(r => {
        const code = String(r.Code || r.code || '').trim().toUpperCase();
        return REGION_CODES.has(code);
    });
}

function getIncomeRows() {
    return (window.DS || []).filter(r => {
        const code = String(r.Code || r.code || '').trim().toUpperCase();
        return INCOME_GROUP_CODES.has(code);
    });
}

function getGDPValue(r) {
    const raw = r.GDP ?? r.gdp ?? r.value ?? r['GDP'];
    return parseFloat(String(raw ?? '').replace(/[^0-9.-]/g, '')) || 0;
}

function getNameValue(r) {
    return String(r.CountryName ?? r.Economy ?? r.name ?? r.Country ?? r['Country Name'] ?? '').trim();
}

function getRankValue(r) {
    const raw = r.Rank ?? r.rank;
    const n = parseInt(String(raw ?? '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : Infinity;
}

// ─── Smart Y-axis formatter ──────────────────────────────────
// Picks the right unit (M / B / T) based on data magnitude

function smartAxisFormatter(values) {
    const max = Math.max(...values.filter(Number.isFinite));
    if (max >= 1_000_000) return { divisor: 1_000_000, suffix: 'T', label: 'GDP (Trillions USD)' };
    if (max >= 1_000)     return { divisor: 1_000,     suffix: 'B', label: 'GDP (Billions USD)' };
    return                       { divisor: 1,          suffix: 'M', label: 'GDP (Millions USD)' };
}

// ─── Chart: Bar (Countries by GDP) ──────────────────────────
// FIX: x-axis was showing "B" (billions) but data is in millions.
// Now uses smartAxisFormatter so labels match actual data units.

function drawBarChart(canvasId, data, mode, count) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    _destroy('bar');
    _showCanvas(canvasId);

    let rows = getCountryRows()
        .slice()
        .sort((a, b) => getGDPValue(b) - getGDPValue(a));

    if (mode === 'bottom') rows = rows.reverse();

    const n = Math.min(parseInt(count) || 10, rows.length);
    const source = rows.slice(0, n);

    if (mode === 'bottom') source.reverse();

    const gdpValues = source.map(r => getGDPValue(r));
    const { divisor, suffix, label: axisLabel } = smartAxisFormatter(gdpValues);

    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(canvas.offsetWidth || 600, 0, 0, 0);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(1, 'rgba(249,115,22,0.3)');

    _charts.bar = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: source.map(r => getNameValue(r)),
            datasets: [{
                label: 'GDP (Million USD)',
                data: gdpValues,
                backgroundColor: grad,
                borderRadius: 5,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${mode === 'bottom' ? 'Bottom' : 'Top'} ${n} Economies by GDP (2017) — values in millions USD`,
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600', family: "'Syne', sans-serif" },
                    padding: { bottom: 16 }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        // Always show raw millions in tooltip for precision
                        label: ctx => ` $${Math.round(ctx.raw).toLocaleString()} M  ($${(ctx.raw / 1000).toFixed(1)} B)`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: axisLabel,
                        color: '#64748b',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(148,163,184,0.07)' },
                    ticks: {
                        color: '#64748b',
                        // Use correct unit matching actual data magnitude
                        callback: v => '$' + (v / divisor).toFixed(divisor === 1 ? 0 : 1) + suffix
                    }
                },
                y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
            }
        }
    });
}

// ─── Chart: Region Pie ───────────────────────────────────────

function drawRegionChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    _destroy('region');
    _showCanvas(canvasId);

    const rows = getRegionRows();
    const entries = rows
        .map(r => ({ label: getNameValue(r) || REGION_LABELS[String(r.Code || r.code || '').toUpperCase()], value: getGDPValue(r) }))
        .filter(e => e.value > 0)
        .sort((a, b) => b.value - a.value);

    const palette = ['#f97316','#0ea5e9','#a3e635','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];

    _charts.region = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: entries.map(e => e.label),
            datasets: [{
                data: entries.map(e => e.value),
                backgroundColor: palette,
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'GDP Share by World Region (2017)', color: '#f1f5f9', font: { size: 14, weight: '600', family: "'Syne', sans-serif" }, padding: { bottom: 16 } },
                legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => {
                            const total = entries.reduce((s, e) => s + e.value, 0);
                            const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                            return ` $${Math.round(ctx.raw).toLocaleString()} M (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ─── Chart: Income Group Bar ─────────────────────────────────
// FIX: y-axis was labeled "T" (trillions) but data is millions USD.
// Now dynamically picks unit and adds a subtitle explaining the scale.

function drawIncomeChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    _destroy('income');
    _showCanvas(canvasId);

    const order = ['High income', 'Upper middle income', 'Lower middle income', 'Low income'];
    const rows = getIncomeRows();

    const entries = order.map(label => {
        const row = rows.find(r => getNameValue(r) === label || INCOME_LABELS[String(r.Code || r.code || '').toUpperCase()] === label);
        return { label, value: row ? getGDPValue(row) : 0 };
    }).filter(e => e.value > 0);

    const colors = ['#f97316','#0ea5e9','#a3e635','#ef4444'];

    // Determine correct scale unit
    const gdpValues = entries.map(e => e.value);
    const { divisor, suffix, label: axisLabel } = smartAxisFormatter(gdpValues);

    _charts.income = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: entries.map(e => e.label),
            datasets: [{
                label: 'GDP (Million USD)',
                data: gdpValues,
                backgroundColor: colors,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    // Subtitle clarifies the unit so there's no ambiguity
                    text: ['GDP by Income Group (2017)', `All values are in millions of USD. 1 B = 1,000 M · 1 T = 1,000,000 M`],
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600', family: "'Syne', sans-serif" },
                    padding: { bottom: 16 }
                },
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => {
                            const m = ctx.raw;
                            return [
                                ` Raw: $${Math.round(m).toLocaleString()} M (millions)`,
                                ` ≈ $${(m / 1000).toFixed(1)} B (billions)`,
                                ` ≈ $${(m / 1_000_000).toFixed(2)} T (trillions)`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: axisLabel,
                        color: '#64748b',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(148,163,184,0.07)' },
                    ticks: {
                        color: '#64748b',
                        callback: v => '$' + (v / divisor).toFixed(divisor >= 1_000_000 ? 1 : 0) + suffix
                    }
                },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
            }
        }
    });
}

// ─── Inject Scatter Controls HTML ───────────────────────────

function injectScatterControls() {
    const card = document.querySelector('#scatterPlot')?.closest('.chart-card');
    if (!card || document.getElementById('scatterControls')) return;

    const ctrl = document.createElement('div');
    ctrl.id = 'scatterControls';
    ctrl.className = 'bar-controls';
    ctrl.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 0 4px;';
    ctrl.innerHTML = `
        <label for="scatterCountInput" style="color:#94a3b8;font-size:12px;">Show:</label>
        <input  type="number" id="scatterCountInput" value="202" min="5" max="202"
                style="width:64px;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;">
        <select id="scatterOrderSelect"
                style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;">
            <option value="high">Highest GDP first</option>
            <option value="low">Lowest GDP first</option>
        </select>
        <button onclick="updateScatterPlot()"
                style="background:#f97316;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;">Update</button>
        <span style="color:#64748b;font-size:11px;margin-left:4px;">Scroll wheel or pinch to zoom · Click+drag to pan</span>
    `;
    card.insertBefore(ctrl, card.querySelector('canvas'));
}

// ─── Chart: Scatter – Rank vs GDP ────────────────────────────
// NEW: count filter, high/low order, zoom/pan via chartjs-plugin-zoom

function drawScatterPlot(canvasId, countLimit, order) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    _destroy('scatter');
    _showCanvas(canvasId);

    injectScatterControls();

    const n = Math.min(parseInt(countLimit) || 202, 202);
    const sortOrder = order || 'high';

    let rows = getCountryRows()
        .slice()
        .sort((a, b) => getGDPValue(b) - getGDPValue(a));

    if (sortOrder === 'low') rows = [...rows].reverse();
    const source = rows.slice(0, n);

    const points = source
        .map(r => ({ x: getRankValue(r), y: getGDPValue(r), name: getNameValue(r) }))
        .filter(p => Number.isFinite(p.x) && p.x !== Infinity && p.y > 0);

    if (!points.length) return;

    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const reg = linearRegression(xs, ys);
    const minX = Math.min(...xs), maxX = Math.max(...xs);

    // Reset zoom button helper
    if (!document.getElementById('scatterResetZoom')) {
        const btn = document.createElement('button');
        btn.id = 'scatterResetZoom';
        btn.textContent = '⟳ Reset Zoom';
        btn.style.cssText = 'background:#0ea5e9;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;margin-left:4px;';
        btn.onclick = () => _charts.scatter && _charts.scatter.resetZoom && _charts.scatter.resetZoom();
        const ctrl = document.getElementById('scatterControls');
        if (ctrl) ctrl.appendChild(btn);
    }

    _charts.scatter = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Countries',
                    data: points,
                    backgroundColor: 'rgba(74,222,128,0.55)',
                    borderColor: '#4ade80',
                    borderWidth: 1,
                    pointRadius: 4,
                    pointHoverRadius: 7
                },
                {
                    label: 'Trend line',
                    type: 'line',
                    data: Array.from({ length: 40 }, (_, i) => {
                        const x = minX + (maxX - minX) * i / 39;
                        return { x, y: Math.max(0, reg.slope * x + reg.intercept) };
                    }),
                    borderColor: '#f97316',
                    borderWidth: 2,
                    borderDash: [6, 3],
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: [
                        `GDP vs Rank — ${sortOrder === 'low' ? 'Lowest' : 'Highest'} ${n} economies (2017)`,
                        'Each dot = 1 country. GDP in millions USD. Scroll to zoom, drag to pan.'
                    ],
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600', family: "'Syne', sans-serif" },
                    padding: { bottom: 12 }
                },
                legend: { labels: { color: '#94a3b8', boxWidth: 12 } },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#4ade80',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => ctx.dataset.label === 'Countries'
                            ? [
                                `${ctx.raw.name}`,
                                `Rank: #${ctx.raw.x}`,
                                `GDP: $${Math.round(ctx.raw.y).toLocaleString()} M  ($${(ctx.raw.y/1000).toFixed(1)} B)`
                              ]
                            : 'Trend line'
                    }
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Rank (1 = largest economy)', color: '#64748b' },
                    grid: { color: 'rgba(148,163,184,0.07)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    title: { display: true, text: 'GDP (millions USD)', color: '#64748b' },
                    grid: { color: 'rgba(148,163,184,0.07)' },
                    ticks: {
                        color: '#64748b',
                        callback: v => v >= 1_000_000 ? '$'+(v/1_000_000).toFixed(1)+'T'
                                     : v >= 1_000     ? '$'+(v/1_000).toFixed(0)+'B'
                                     : '$'+v+'M'
                    }
                }
            }
        }
    });
}

function updateScatterPlot() {
    const n    = parseInt(document.getElementById('scatterCountInput')?.value || '202');
    const order = document.getElementById('scatterOrderSelect')?.value || 'high';
    drawScatterPlot('scatterPlot', n, order);
}

// ─── Inject Doughnut Controls HTML ──────────────────────────

function injectDoughnutControls() {
    const card = document.querySelector('#doughnutChart')?.closest('.chart-card');
    if (!card || document.getElementById('doughnutControls')) return;

    const ctrl = document.createElement('div');
    ctrl.id = 'doughnutControls';
    ctrl.className = 'bar-controls';
    ctrl.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 0 4px;';
    ctrl.innerHTML = `
        <label style="color:#94a3b8;font-size:12px;">Top tier:</label>
        <input  type="number" id="doughnutTop1Input" value="5" min="1" max="50"
                style="width:56px;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;"
                title="How many countries in Tier 1 (Top N)">
        <label style="color:#94a3b8;font-size:12px;">Mid tier up to:</label>
        <input  type="number" id="doughnutTop2Input" value="20" min="2" max="100"
                style="width:56px;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;"
                title="Mid tier = rank (Top+1) through this number">
        <button onclick="updateDoughnut()"
                style="background:#f97316;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;">Update</button>
    `;
    card.insertBefore(ctrl, card.querySelector('canvas'));
}

// ─── Chart: Doughnut – GDP Concentration ─────────────────────
// NEW: custom tier inputs + clearer labels with % and $ values in legend area

function drawDoughnut(canvasId, top1Count, top2Max) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    _destroy('doughnut');
    _showCanvas(canvasId);

    injectDoughnutControls();

    const t1 = Math.max(1, parseInt(top1Count) || 5);
    const t2end = Math.max(t1 + 1, parseInt(top2Max) || 20);

    const rows = getCountryRows().sort((a, b) => getGDPValue(b) - getGDPValue(a));
    const total = rows.reduce((s, r) => s + getGDPValue(r), 0);

    const tier1 = rows.slice(0, t1);
    const tier2 = rows.slice(t1, t2end);
    const tier3 = rows.slice(t2end);

    const tier1val = tier1.reduce((s, r) => s + getGDPValue(r), 0);
    const tier2val = tier2.reduce((s, r) => s + getGDPValue(r), 0);
    const tier3val = tier3.reduce((s, r) => s + getGDPValue(r), 0);

    const pct = v => total ? (v / total * 100).toFixed(1) : '0.0';
    const bil = v => '$' + Math.round(v / 1000).toLocaleString() + ' B';

    // Build descriptive labels so the chart is self-explanatory
    const segments = [
        {
            label: `Top ${t1} (${pct(tier1val)}% · ${bil(tier1val)})`,
            shortLabel: `Top ${t1}`,
            value: tier1val,
            pct: pct(tier1val),
            detail: tier1.slice(0, 3).map(r => getNameValue(r)).join(', ') + (t1 > 3 ? ` +${t1-3} more` : '')
        },
        {
            label: `Ranks ${t1+1}–${t2end} (${pct(tier2val)}% · ${bil(tier2val)})`,
            shortLabel: `Ranks ${t1+1}–${t2end}`,
            value: tier2val,
            pct: pct(tier2val),
            detail: `${tier2.length} countries`
        },
        {
            label: `Rest of World (${pct(tier3val)}% · ${bil(tier3val)})`,
            shortLabel: 'Rest of World',
            value: tier3val,
            pct: pct(tier3val),
            detail: `${tier3.length} countries`
        }
    ];

    _charts.doughnut = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: segments.map(s => s.label),
            datasets: [{
                data: segments.map(s => s.value),
                backgroundColor: ['#f97316', '#0ea5e9', '#475569'],
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            cutout: '62%',
            plugins: {
                title: {
                    display: true,
                    text: [
                        'GDP Concentration by Country Tier (2017)',
                        `Total country GDP = ${bil(total)}  ·  ${rows.length} ranked nations`
                    ],
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600', family: "'Syne', sans-serif" },
                    padding: { bottom: 12 }
                },
                legend: {
                    labels: {
                        color: '#94a3b8',
                        boxWidth: 14,
                        font: { size: 11 },
                        // labels already contain % and $ so no extra formatter needed
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        title: ctx => segments[ctx[0].dataIndex].shortLabel,
                        label: ctx => {
                            const s = segments[ctx.dataIndex];
                            return [
                                ` Share: ${s.pct}% of all ranked-country GDP`,
                                ` Total: ${bil(s.value)}  ($${Math.round(s.value).toLocaleString()} M)`,
                                ` Includes: ${s.detail}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

function updateDoughnut() {
    const t1  = parseInt(document.getElementById('doughnutTop1Input')?.value || '5');
    const t2  = parseInt(document.getElementById('doughnutTop2Input')?.value || '20');
    drawDoughnut('doughnutChart', t1, t2);
}

// ─── Render: Region Table ────────────────────────────────────

function renderRegionTable() {
    const tbody = document.getElementById('regionTableBody');
    const thead = document.getElementById('regionTableHead');
    if (!tbody) return;

    const rows = getRegionRows().sort((a, b) => getGDPValue(b) - getGDPValue(a));
    const worldRow = (window.DS || []).find(r => String(r.Code || r.code || '').toUpperCase() === 'WLD');
    const worldGDP = worldRow ? getGDPValue(worldRow) : 0;

    if (thead) thead.innerHTML = `<tr>
        <th>Region</th>
        <th class="num-h">GDP (Million USD)</th>
        <th class="num-h">% of World</th>
    </tr>`;

    tbody.innerHTML = '';
    rows.forEach(r => {
        const gdp = getGDPValue(r);
        const pct = worldGDP ? ((gdp / worldGDP) * 100).toFixed(2) : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${getNameValue(r)}</td>
            <td class="num">$${Math.round(gdp).toLocaleString()}</td>
            <td class="num">${pct}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Render: Income Table ────────────────────────────────────

function renderIncomeTable() {
    const tbody = document.getElementById('incomeTableBody');
    const thead = document.getElementById('incomeTableHead');
    if (!tbody) return;

    const order = ['World', 'High income', 'Upper middle income', 'Lower middle income', 'Low income'];
    const all = (window.DS || []).filter(r => {
        const code = String(r.Code || r.code || '').toUpperCase();
        return INCOME_GROUP_CODES.has(code);
    });

    const worldRow = all.find(r => String(r.Code || r.code || '').toUpperCase() === 'WLD')
        || (window.DS || []).find(r => String(r.Code || r.code || '').toUpperCase() === 'WLD');
    const worldGDP = worldRow ? getGDPValue(worldRow) : 0;

    if (thead) thead.innerHTML = `<tr>
        <th>Income Group</th>
        <th class="num-h">GDP (Million USD)</th>
        <th class="num-h">% of World</th>
    </tr>`;

    tbody.innerHTML = '';

    const incomeRows = (window.DS || []).filter(r => {
        const code = String(r.Code || r.code || '').toUpperCase();
        return INCOME_GROUP_CODES.has(code);
    });

    order.forEach(label => {
        const row = incomeRows.find(r => {
            const code = String(r.Code || r.code || '').toUpperCase();
            return INCOME_LABELS[code] === label;
        });
        if (!row) return;
        const gdp = getGDPValue(row);
        const pct = worldGDP && label !== 'World' ? ((gdp / worldGDP) * 100).toFixed(2) : '—';
        const tr = document.createElement('tr');
        const isWorld = label === 'World';
        tr.className = isWorld ? 'world-row' : '';
        tr.innerHTML = `
            <td>${label}</td>
            <td class="num">$${Math.round(gdp).toLocaleString()}</td>
            <td class="num">${pct}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Render: Statistical Analysis ───────────────────────────

function renderAnalysis() {
    const countries = getCountryRows();
    const gdpValues = countries.map(r => getGDPValue(r)).filter(v => v > 0);
    const ranks = countries.map(r => getRankValue(r)).filter(v => Number.isFinite(v) && v !== Infinity);

    if (!gdpValues.length) return;

    const n = gdpValues.length;
    const sum = gdpValues.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = (() => {
        const s = [...gdpValues].sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    })();
    const sd = stdDev(gdpValues);
    const cv = mean ? (sd / mean * 100) : 0;
    const top = countries.sort((a, b) => getGDPValue(b) - getGDPValue(a));
    const top1 = top[0];
    const top5sum = top.slice(0, 5).reduce((s, r) => s + getGDPValue(r), 0);
    const top10sum = top.slice(0, 10).reduce((s, r) => s + getGDPValue(r), 0);
    const worldGDP = sum;
    const top5pct = worldGDP ? (top5sum / worldGDP * 100).toFixed(1) : 0;
    const top10pct = worldGDP ? (top10sum / worldGDP * 100).toFixed(1) : 0;

    const reg = linearRegression(ranks, gdpValues);
    const corr = pearsonCorr(ranks, gdpValues);

    const statsEl = document.getElementById('analysisStats');
    if (statsEl) {
        const fmt = v => '$' + Math.round(v).toLocaleString() + ' M';
        statsEl.innerHTML = [
            { label: 'Countries Ranked', value: n },
            { label: 'Total Country GDP', value: '$' + Math.round(sum / 1000).toLocaleString() + ' B' },
            { label: 'Mean GDP', value: fmt(mean) },
            { label: 'Median GDP', value: fmt(median) },
            { label: 'Std Deviation', value: fmt(sd) },
            { label: 'Coeff. of Variation', value: cv.toFixed(1) + '%' },
            { label: 'Largest Economy', value: getNameValue(top1) },
            { label: 'Top 5 Share', value: top5pct + '% of total' },
            { label: 'Top 10 Share', value: top10pct + '% of total' },
        ].map(c => `<div class="stat-card"><div class="card-label">${c.label}</div><div class="card-value">${c.value}</div></div>`).join('');
    }

    const textEl = document.getElementById('analysisText');
    if (textEl) {
        const corrDesc = isNaN(corr) ? 'N/A' : Math.abs(corr).toFixed(3);
        const corrDir = corr < 0 ? 'negative — as expected, higher rank number = lower GDP' : 'positive';
        textEl.innerHTML = `
            <div class="analysis-block">
                <h3>Distribution Analysis</h3>
                <p>The mean GDP of <span class="highlight">$${Math.round(mean).toLocaleString()} M</span> is far 
                   higher than the median of <span class="highlight">$${Math.round(median).toLocaleString()} M</span>, 
                   confirming a <strong>heavily right-skewed distribution</strong> — a small number of dominant economies 
                   pull the average up significantly.</p>
                <p>The coefficient of variation is <span class="highlight">${cv.toFixed(1)}%</span>, indicating 
                   <strong>extreme dispersion</strong> in country-level GDP.</p>
            </div>
            <div class="analysis-block">
                <h3>Concentration Analysis</h3>
                <p>The top 5 economies alone control <span class="highlight">${top5pct}%</span> of total ranked-country GDP,
                   while the top 10 account for <span class="highlight">${top10pct}%</span> — a stark illustration of 
                   global economic inequality.</p>
            </div>
            <div class="analysis-block">
                <h3>Rank–GDP Correlation</h3>
                <p>Pearson r between rank and GDP = <span class="highlight">${corrDesc}</span> (${corrDir}).</p>
                <p>Regression: GDP = <span class="highlight">${reg.slope.toFixed(0)}</span> × Rank + 
                   <span class="highlight">${Math.round(reg.intercept).toLocaleString()}</span>, 
                   R² = <span class="highlight">${reg.r2.toFixed(4)}</span> 
                   — confirms a very strong (non-linear) relationship between rank and GDP.</p>
            </div>
        `;
    }
}

// ─── Render: Insights ────────────────────────────────────────

function renderInsights() {
    const countries = getCountryRows().sort((a, b) => getGDPValue(b) - getGDPValue(a));
    const gdpValues = countries.map(r => getGDPValue(r)).filter(v => v > 0);

    if (!gdpValues.length) return;

    const n = gdpValues.length;
    const total = gdpValues.reduce((a, b) => a + b, 0);
    const top1 = countries[0];
    const top1gdp = getGDPValue(top1);
    const bottom1 = countries[n - 1];
    const top5sum = countries.slice(0, 5).reduce((s, r) => s + getGDPValue(r), 0);
    const top5pct = (top5sum / total * 100).toFixed(1);
    const ratio = bottom1 ? (top1gdp / getGDPValue(bottom1)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A';

    const regionRows = getRegionRows().sort((a, b) => getGDPValue(b) - getGDPValue(a));
    const topRegion = regionRows[0];
    const botRegion = regionRows[regionRows.length - 1];

    const incomeRows = (window.DS || []).filter(r => String(r.Code || r.code || '').toUpperCase() === 'HIC');
    const incomeRow = incomeRows[0];
    const incomeGDP = incomeRow ? getGDPValue(incomeRow) : 0;
    const lowRows = (window.DS || []).filter(r => String(r.Code || r.code || '').toUpperCase() === 'LIC');
    const lowRow = lowRows[0];
    const lowGDP = lowRow ? getGDPValue(lowRow) : 0;
    const incomeRatio = lowGDP ? (incomeGDP / lowGDP).toFixed(0) : 'N/A';

    const el = document.getElementById('insightsText');
    if (!el) return;

    el.innerHTML = `
        <p>The 2017 World GDP dataset reveals a stark concentration of economic power: 
           <span class="highlight">${getNameValue(top1)}</span> leads with 
           <span class="highlight">$${Math.round(top1gdp / 1000).toLocaleString()} B</span>, 
           while the top 5 economies collectively hold <span class="highlight">${top5pct}%</span> 
           of all ranked-country GDP despite comprising just ${((5 / n) * 100).toFixed(1)}% of ranked nations.</p>
        <p>The gap between the largest and smallest ranked economy is staggering — 
           <span class="highlight">${getNameValue(top1)}</span> produces roughly 
           <span class="highlight">${ratio}×</span> the GDP of 
           <span class="highlight">${getNameValue(bottom1)}</span>, 
           underscoring extreme global economic inequality.</p>
        <p>At the regional level, <span class="highlight">${getNameValue(topRegion)}</span> is the 
           dominant bloc, significantly outpacing the smallest contributor 
           <span class="highlight">${getNameValue(botRegion)}</span>. 
           This regional divergence reflects differences in population, industrialisation, and resource endowments.</p>
        <p>The income-group breakdown is equally revealing: High-income nations collectively generate 
           <span class="highlight">${incomeRatio}×</span> the GDP of Low-income nations, 
           while the scatter plot confirms a steep, non-linear decay — GDP drops sharply as rank descends, 
           meaning most wealth is compressed into a narrow band at the top of the rankings.</p>
    `;
}

// ─── Init Charts ─────────────────────────────────────────────

function initCharts() {
    const countN    = parseInt(document.getElementById('barCountInput')?.value || '10');
    const countMode = document.getElementById('barModeSelect')?.value || 'top';

    drawBarChart('barChart', null, countMode, countN);
    drawRegionChart('regionChart');
    drawIncomeChart('incomeChart');
    drawScatterPlot('scatterPlot', 202, 'high');
    drawDoughnut('doughnutChart', 5, 20);
}

// ─── Called by Student 1 after data loads ───────────────────

function onDataReady() {
    // Load zoom plugin if not already present
    if (!window.Chart?.registry?.plugins?.get('zoom')) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-zoom/2.0.1/chartjs-plugin-zoom.min.js';
        s.onload = () => {
            Chart.register(window['chartjs-plugin-zoom']);
            _init();
        };
        // hammerjs required for touch/pinch
        const h = document.createElement('script');
        h.src = 'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js';
        h.onload = () => document.head.appendChild(s);
        document.head.appendChild(h);
    } else {
        _init();
    }
}

function _init() {
    Chart.defaults.font.family = "'Syne', sans-serif";
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(148,163,184,0.08)';

    initCharts();
    renderRegionTable();
    renderIncomeTable();
    renderAnalysis();
    renderInsights();
}

// ─── Bar chart update (called by controls) ──────────────────

function updateBarChart() {
    const n    = parseInt(document.getElementById('barCountInput')?.value || '10');
    const mode = document.getElementById('barModeSelect')?.value || 'top';
    drawBarChart('barChart', null, mode, n);
}