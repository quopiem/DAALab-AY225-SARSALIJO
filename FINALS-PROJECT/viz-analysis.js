// ============================================================
// Student 2 – feature/viz-analysis
// World GDP Ranking Dashboard – Chart & Analysis Engine
// ============================================================

// ─── Helpers ────────────────────────────────────────────────

function variance(arr) {
    const values = arr.filter(Number.isFinite);
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function stdDev(arr) {
    return Math.sqrt(variance(arr));
}

function pearsonCorr(x, y) {
    const pairs = [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if (Number.isFinite(x[i]) && Number.isFinite(y[i])) pairs.push([x[i], y[i]]);
    }
    const n = pairs.length;
    if (!n) return 0;

    const xs = pairs.map(p => p[0]);
    const ys = pairs.map(p => p[1]);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx, dy = ys[i] - my;
        num += dx * dy; denX += dx * dx; denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
}

function linearRegression(x, y) {
    const pairs = [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if (Number.isFinite(x[i]) && Number.isFinite(y[i])) pairs.push([x[i], y[i]]);
    }
    const n = pairs.length;
    if (!n) return { slope: 0, intercept: 0, r2: 0 };

    const xs = pairs.map(p => p[0]);
    const ys = pairs.map(p => p[1]);
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
    return { slope, intercept, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

// ─── Chart Registry ────────────────────────────────────────

const chartInstances = { bar: null, region: null, income: null, scatter: null, doughnut: null };

function destroyChart(key) {
    if (chartInstances[key]) { chartInstances[key].destroy(); chartInstances[key] = null; }
}

function showCanvas(id) {
    const canvas = document.getElementById(id);
    if (canvas) canvas.style.display = 'block';
    const ph = document.getElementById(id + 'Placeholder') || document.getElementById(id + '-placeholder');
    if (ph) ph.style.display = 'none';
}

// ─── Chart Defaults ────────────────────────────────────────

Chart.defaults.font.family = "'Syne', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148,163,184,0.08)';

// ─── Bar Chart ─────────────────────────────────────────────

function drawBarChart(canvasId, data, mode = 'top10', count = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('bar');
    showCanvas(canvasId);

    const source = mode === 'all' ? getAllByGDP(data) : getTopNByGDP(data, count);
    const labels = source.map(r => getCountryName(r));
    const values = source.map(r => getGDP(r));

    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, canvas.offsetWidth, 0);
    gradient.addColorStop(0, '#f97316');
    gradient.addColorStop(1, '#fb923c88');

    chartInstances.bar = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'GDP (USD)',
                data: values,
                backgroundColor: gradient,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: mode === 'all' ? 'All Economies by GDP' : `Top ${count} Economies by GDP`,
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600' },
                    padding: { bottom: 16 }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => ` $${ctx.raw.toLocaleString()} B`
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b' } },
                y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
            }
        }
    });
}

// ─── Region Pie Chart ──────────────────────────────────────

function drawRegionChart(canvasId, data, limit = 7) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('region');
    showCanvas(canvasId);

    const grouped = splitByCategory(data).region;
    const entries = Object.entries(grouped)
        .map(([label, rows]) => ({ label, value: rows.reduce((s, r) => s + getGDP(r), 0) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    const palette = ['#f97316','#fb923c','#fdba74','#0ea5e9','#38bdf8','#7dd3fc','#a3e635'];

    chartInstances.region = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: entries.map(e => e.label),
            datasets: [{ data: entries.map(e => e.value), backgroundColor: palette, borderWidth: 2, borderColor: '#0f172a' }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'GDP by World Region', color: '#f1f5f9', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
                legend: { labels: { color: '#94a3b8', boxWidth: 12 } },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: { label: ctx => ` $${ctx.raw.toLocaleString()} B` }
                }
            }
        }
    });
}

// ─── Income Group Bar Chart ────────────────────────────────

function drawIncomeChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('income');
    showCanvas(canvasId);

    const grouped = splitByCategory(data).income;
    const order = ['World', 'High income', 'Upper middle income', 'Lower middle income', 'Low income'];
    const entries = order
        .map(label => ({ label, value: (grouped[label] || []).reduce((s, r) => s + getGDP(r), 0) }))
        .filter(e => e.value > 0);

    chartInstances.income = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: entries.map(e => e.label),
            datasets: [{
                label: 'GDP',
                data: entries.map(e => e.value),
                backgroundColor: ['#f97316','#0ea5e9','#a3e635','#f59e0b','#ef4444'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'GDP by Income Group', color: '#f1f5f9', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f97316',
                    bodyColor: '#cbd5e1',
                    callbacks: { label: ctx => ` $${ctx.raw.toLocaleString()} B` }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
            }
        }
    });
}

// ─── Scatter Plot ──────────────────────────────────────────

function drawScatterPlot(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('scatter');
    showCanvas(canvasId);

    const points = getValidEconomicRows(data)
        .map(r => ({ x: getAttendance(r), y: getGDP(r), name: getCountryName(r) }))
        .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (!points.length) return;

    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const reg = linearRegression(xs, ys);
    const minX = Math.min(...xs), maxX = Math.max(...xs);

    chartInstances.scatter = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Countries',
                    data: points,
                    backgroundColor: '#4ade8088',
                    borderColor: '#4ade80',
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Trend Line',
                    type: 'line',
                    data: [
                        { x: minX, y: reg.slope * minX + reg.intercept },
                        { x: maxX, y: reg.slope * maxX + reg.intercept }
                    ],
                    borderColor: '#f97316',
                    borderWidth: 2,
                    borderDash: [6, 3],
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Attendance vs GDP', color: '#f1f5f9', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
                legend: { labels: { color: '#94a3b8', boxWidth: 12 } },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#4ade80',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => ctx.dataset.label === 'Countries'
                            ? `${ctx.raw.name}: (${ctx.raw.x}, ${ctx.raw.y})`
                            : 'Trend line'
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Attendance', color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b' } },
                y: { title: { display: true, text: 'GDP', color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// ─── Doughnut Chart ────────────────────────────────────────

function drawDoughnut(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('doughnut');
    showCanvas(canvasId);

    const grades = { A: 0, B: 0, C: 0, D: 0 };
    cleanData(data).forEach(r => { const g = getGrade(r); if (grades[g] !== undefined) grades[g]++; });

    const labels = ['A', 'B', 'C', 'D'];
    const values = labels.map(l => grades[l]);
    const total = values.reduce((a, b) => a + b, 0);

    chartInstances.doughnut = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#22c55e', '#4ade80', '#facc15', '#f87171'],
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: {
                title: { display: true, text: 'Grade Distribution', color: '#f1f5f9', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
                legend: { labels: { color: '#94a3b8', boxWidth: 12 } },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#facc15',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: ctx => {
                            const pct = total === 0 ? 0 : ((ctx.raw / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ─── Analysis ──────────────────────────────────────────────

function renderAnalysis(data) {
    const valid = cleanData(data);
    const gdp = valid.map(getGDP).filter(Number.isFinite);
    const attendance = valid.map(getAttendance).filter(Number.isFinite);
    const score = valid.map(getScore).filter(Number.isFinite);
    const studyHours = valid.map(getStudyHours).filter(Number.isFinite);

    const avgGDP = gdp.length ? gdp.reduce((a, b) => a + b, 0) / gdp.length : 0;
    const avgStudy = studyHours.length ? studyHours.reduce((a, b) => a + b, 0) / studyHours.length : 0;
    const meanScore = score.length ? score.reduce((a, b) => a + b, 0) / score.length : 0;
    const passRate = score.length ? (score.filter(v => v >= 60).length / score.length) * 100 : 0;
    const sdScore = stdDev(score);

    const topScorer = [...valid].sort((a, b) => getScore(b) - getScore(a))[0];
    const topRanked = [...valid].filter(r => Number.isFinite(getRank(r))).sort((a, b) => getRank(a) - getRank(b))[0];

    const corrAS = pearsonCorr(attendance, score);
    const corrSS = pearsonCorr(studyHours, score);
    const reg = linearRegression(attendance, score);

    const statsEl = document.getElementById('analysisStats');
    if (statsEl) {
        statsEl.innerHTML = [
            { label: 'Mean Final Score', value: Number.isFinite(meanScore) ? meanScore.toFixed(2) : 'N/A' },
            { label: 'Std Deviation', value: Number.isFinite(sdScore) ? sdScore.toFixed(2) : 'N/A' },
            { label: 'Top Scorer', value: topScorer ? getCountryName(topScorer) : 'N/A' },
            { label: 'Pass Rate (≥60)', value: Number.isFinite(passRate) ? passRate.toFixed(1) + '%' : 'N/A' },
            { label: 'Avg Study Hours', value: Number.isFinite(avgStudy) ? avgStudy.toFixed(2) : 'N/A' },
            { label: 'Top Ranked', value: topRanked ? getCountryName(topRanked) : 'N/A' },
            { label: 'Avg GDP', value: Number.isFinite(avgGDP) ? '$' + Math.round(avgGDP).toLocaleString() : 'N/A' },
        ].map(c => `<div class="card"><div class="card-label">${c.label}</div><div class="card-value">${c.value}</div></div>`).join('');
    }

    const textEl = document.getElementById('analysisText');
    if (textEl) {
        textEl.innerHTML = `
            <p>Attendance vs final score: Pearson r = <span class="highlight">${corrAS.toFixed(3)}</span>.</p>
            <p>Study hours vs final score: Pearson r = <span class="highlight">${corrSS.toFixed(3)}</span>.</p>
            <p>Regression (attendance → score): slope = <span class="highlight">${reg.slope.toFixed(3)}</span>,
               intercept = <span class="highlight">${reg.intercept.toFixed(3)}</span>,
               R² = <span class="highlight">${reg.r2.toFixed(3)}</span>.</p>
            <p>Mean score = <span class="highlight">${Number.isFinite(meanScore) ? meanScore.toFixed(2) : 'N/A'}</span> |
               Std dev = <span class="highlight">${sdScore.toFixed(2)}</span> |
               Pass rate = <span class="highlight">${Number.isFinite(passRate) ? passRate.toFixed(1) + '%' : 'N/A'}</span>.</p>
        `;
    }
}

// ─── Insights ──────────────────────────────────────────────

function renderInsights(data) {
    const valid = cleanData(data);
    const score = valid.map(getScore).filter(Number.isFinite);
    const attendance = valid.map(getAttendance).filter(Number.isFinite);
    const studyHours = valid.map(getStudyHours).filter(Number.isFinite);

    const meanScore = score.length ? score.reduce((a, b) => a + b, 0) / score.length : 0;
    const passRate = score.length ? (score.filter(v => v >= 60).length / score.length) * 100 : 0;
    const avgStudy = studyHours.length ? studyHours.reduce((a, b) => a + b, 0) / studyHours.length : 0;
    const topScorer = [...valid].sort((a, b) => getScore(b) - getScore(a))[0];
    const corr = pearsonCorr(attendance, score);

    const insightsEl = document.getElementById('insightsText');
    if (insightsEl) {
        const corrStr = Math.abs(corr) > 0.6 ? 'strong' : Math.abs(corr) > 0.3 ? 'moderate' : 'weak';
        insightsEl.innerHTML = `
            <p>Across all entries, the class mean final score stands at <span class="highlight">${Number.isFinite(meanScore) ? meanScore.toFixed(2) : 'N/A'}</span>, 
               indicating the overall performance level of the dataset.</p>
            <p>The top scorer is <span class="highlight">${topScorer ? getCountryName(topScorer) : 'N/A'}</span>, 
               achieving <span class="highlight">${topScorer ? getScore(topScorer).toFixed(0) : 'N/A'}</span> points — 
               setting the benchmark for academic excellence.</p>
            <p>With a pass rate of <span class="highlight">${Number.isFinite(passRate) ? passRate.toFixed(1) + '%' : 'N/A'}</span> 
               and an average study time of <span class="highlight">${Number.isFinite(avgStudy) ? avgStudy.toFixed(2) : 'N/A'}</span> hours, 
               there is a visible link between time invested and outcomes.</p>
            <p>Attendance and score share a <span class="highlight">${corrStr}</span> correlation of 
               <span class="highlight">${corr.toFixed(3)}</span>, 
               suggesting that physical presence ${Math.abs(corr) > 0.4 ? 'meaningfully influences' : 'has some bearing on'} academic results.</p>
        `;
    }
}

// ─── Init ──────────────────────────────────────────────────

function initCharts(data) {
    drawBarChart('barChart', data, 'top10', 10);
    drawRegionChart('regionChart', data, 7);
    drawIncomeChart('incomeChart', data);
    drawScatterPlot('scatterPlot', data);
    drawDoughnut('doughnutChart', data);
}

function onDataReady() {
    const cleaned = cleanData(window.DS);
    initCharts(cleaned);
    renderAnalysis(cleaned);
    renderInsights(cleaned);
}

function updateBarChart() {
    const mode = document.getElementById('barMode').value;
    drawBarChart('barChart', cleanData(window.DS), mode === 'all' ? 'all' : 'top10', 10);
}
