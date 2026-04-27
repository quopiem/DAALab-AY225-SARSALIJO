// ============================================================
// Student 1 – feature/data-engine
// World GDP Ranking Dashboard – Data Engine
// ============================================================

let RAW_DATA = [];
window.DS = [];

const INCOME_GROUPS = {
    WLD: 'World', HIC: 'High income', UMC: 'Upper middle income',
    LMC: 'Lower middle income', LIC: 'Low income'
};
const REGIONS = {
    EAS: 'East Asia & Pacific', ECS: 'Europe & Central Asia',
    LCN: 'Latin America & Caribbean', MEA: 'Middle East & North Africa',
    NAC: 'North America', SAS: 'South Asia', SSF: 'Sub-Saharan Africa'
};
const SPECIAL_TERRITORIES = {
    HKG: 'Hong Kong SAR, China', MAC: 'Macao SAR, China',
    PRI: 'Puerto Rico', GUM: 'Guam', IMN: 'Isle of Man'
};

function toNumber(value) {
    const n = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
}
function getCountryName(row) {
    return String(row.CountryName ?? row.name ?? row.Country ?? row['Country Name'] ?? '').trim();
}
function getGDP(row) { return toNumber(row.GDP ?? row.gdp ?? row.value ?? row['GDP']); }
function getRank(row) {
    const raw = row.Rank ?? row.rank ?? row['Rank'];
    if (raw == null || String(raw).trim() === '') return NaN;
    return parseInt(String(raw).replace(/[^0-9.-]/g, ''), 10);
}
function getStudyHours(row) { return toNumber(row.studyHours ?? row['study hours'] ?? row['Study Hours']); }
function getAttendance(row) { return toNumber(row.attendance ?? row['Attendance']); }
function getScore(row) { return toNumber(row.finalScore ?? row.score ?? row['final score'] ?? row['Score']); }
function getGrade(row) {
    const raw = String(row.grade ?? row['Grade'] ?? '').trim().toUpperCase();
    if (!raw) return '';
    return raw.startsWith('G') ? raw.slice(1) : raw;
}
function getCode(row) {
    return String(row.Code ?? row.code ?? row.countryCode ?? row.CountryCode ?? '').trim().toUpperCase();
}

function isValidRow(row) {
    const name = getCountryName(row);
    const gdp  = getGDP(row);
    const rankRaw = row.Rank ?? row.rank ?? row['Rank'];
    if (!name || !Number.isFinite(gdp)) return false;
    if (rankRaw != null && String(rankRaw).trim() !== '') return Number.isFinite(getRank(row));
    return true;
}
function cleanData(data) { return Array.isArray(data) ? data.filter(isValidRow) : []; }

function getCategory(row) {
    const code = getCode(row);
    if (INCOME_GROUPS[code])      return { type: 'income',  label: INCOME_GROUPS[code] };
    if (REGIONS[code])            return { type: 'region',  label: REGIONS[code] };
    if (SPECIAL_TERRITORIES[code])return { type: 'special', label: SPECIAL_TERRITORIES[code] };
    return { type: 'country', label: getCountryName(row) };
}

function splitByCategory(data) {
    const grouped = { income: {}, region: {}, special: {}, country: {} };
    cleanData(data).forEach(row => {
        const cat = getCategory(row);
        if (!grouped[cat.type][cat.label]) grouped[cat.type][cat.label] = [];
        grouped[cat.type][cat.label].push(row);
    });
    return grouped;
}

function getValidEconomicRows(data) {
    return cleanData(data).filter(r => getCountryName(r) && Number.isFinite(getGDP(r)));
}
function getTopNByGDP(data, n = 10) {
    return [...getValidEconomicRows(data)].sort((a, b) => getGDP(b) - getGDP(a)).slice(0, n);
}
function getAllByGDP(data) {
    return [...getValidEconomicRows(data)].sort((a, b) => getGDP(b) - getGDP(a));
}

// ── Table ────────────────────────────────────────────────────

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const thead = document.getElementById('tableHeader');
    tbody.innerHTML = '';

    if (!data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align:center;padding:24px;color:var(--text-muted)">No results found</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    if (!thead.children.length) {
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            thead.appendChild(th);
        });
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            let value = row[h];
            if (typeof value === 'string') {
                value = value.trim();
                if (h.toLowerCase() === 'rank') { const n = parseInt(value, 10); value = Number.isFinite(n) ? n : ''; }
            }
            td.textContent = value ?? '';
            const isNum = typeof value === 'number' || (!Number.isNaN(parseFloat(value)) && String(value).trim() !== '');
            if (h.toLowerCase() === 'rank' || h.toLowerCase() === 'gdp' || isNum) td.classList.add('num');
            if (h.toLowerCase() === 'grade') {
                const g = String(value || '').trim().toUpperCase();
                if (g) td.classList.add('g' + g);
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderSummaryCards(data) {
    const container = document.getElementById('summaryCards');
    container.innerHTML = '';
    const valid = cleanData(data);
    if (!valid.length) return;

    const gdpValues    = valid.map(getGDP).filter(Number.isFinite);
    const scoreValues  = valid.map(getScore).filter(Number.isFinite);
    const studyValues  = valid.map(getStudyHours).filter(Number.isFinite);

    const avgGDP      = gdpValues.length   ? gdpValues.reduce((a,b) => a+b,0)  / gdpValues.length  : 0;
    const meanScore   = scoreValues.length ? scoreValues.reduce((a,b) => a+b,0) / scoreValues.length : 0;
    const passRate    = scoreValues.length ? (scoreValues.filter(v => v>=60).length / scoreValues.length)*100 : 0;
    const avgStudy    = studyValues.length  ? studyValues.reduce((a,b) => a+b,0) / studyValues.length : 0;

    const highestGDP  = [...valid].sort((a,b) => getGDP(b)-getGDP(a))[0];
    const topRanked   = [...valid].filter(r => Number.isFinite(getRank(r))).sort((a,b) => getRank(a)-getRank(b))[0];
    const topScorer   = [...valid].sort((a,b) => getScore(b)-getScore(a))[0];

    [
        { label: 'Total Countries', value: valid.length },
        { label: 'Avg GDP',         value: `$${Math.round(avgGDP).toLocaleString()}` },
        { label: 'Highest GDP',     value: highestGDP  ? getCountryName(highestGDP)  : 'N/A' },
        { label: 'Top Ranked',      value: topRanked   ? getCountryName(topRanked)   : 'N/A' },
        { label: 'Mean Score',      value: Number.isFinite(meanScore) ? meanScore.toFixed(2) : 'N/A' },
        { label: 'Pass Rate',       value: Number.isFinite(passRate)  ? passRate.toFixed(1)+'%' : 'N/A' },
        { label: 'Avg Study Hours', value: Number.isFinite(avgStudy)  ? avgStudy.toFixed(2)  : 'N/A' },
    ].forEach(c => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<div class="card-label">${c.label}</div><div class="card-value">${c.value}</div>`;
        container.appendChild(div);
    });
}

function applyFilterSort() {
    const text   = document.getElementById('filterInput').value.toLowerCase();
    const option = document.getElementById('sortSelect').value;

    let filtered = window.DS.filter(r => String(getCountryName(r)).toLowerCase().includes(text));
    if (option === 'nameAsc')  filtered.sort((a,b) => getCountryName(a).localeCompare(getCountryName(b)));
    if (option === 'gdpDesc')  filtered.sort((a,b) => getGDP(b) - getGDP(a));

    renderTable(filtered);
    document.getElementById('rowCount').textContent = `Rows: ${filtered.length}`;
}

function resetTable() {
    document.getElementById('filterInput').value = '';
    document.getElementById('sortSelect').value  = 'none';
    renderTable(window.DS);
    document.getElementById('rowCount').textContent = `Rows: ${window.DS.length}`;
}

// ── Load ─────────────────────────────────────────────────────

function loadDataset() {
    window.DS = RAW_DATA.map(r => ({ ...r }));
    renderTable(window.DS);
    renderSummaryCards(window.DS);
    document.getElementById('rowCount').textContent = `Rows: ${window.DS.length}`;
    if (typeof onDataReady === 'function') onDataReady();
}

async function fetchKaggleDataset() {
    try {
        const res  = await fetch('data.csv');
        const text = await res.text();
        Papa.parse(text, {
            header: true, dynamicTyping: true, skipEmptyLines: true,
            complete: r => { RAW_DATA = r.data || []; loadDataset(); },
            error:    e => console.error('CSV parse error:', e)
        });
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

window.addEventListener('load', fetchKaggleDataset);
