// ============================================================
// Student 1 – feature/data-engine
// World GDP Ranking Dashboard – Data Engine
// Parses: Code, Rank, (blank), Economy, GDP columns
// ============================================================

let RAW_DATA = [];
window.DS = [];

// ─── Accessors ──────────────────────────────────────────────

function getCountryName(row) {
    return String(row.Economy ?? row.CountryName ?? row.name ?? row.Country ?? row['Country Name'] ?? '').trim();
}

function getGDP(row) {
    const raw = row.GDP ?? row.gdp ?? row.value ?? row['GDP (millions of US dollars)'] ?? '';
    return parseFloat(String(raw).replace(/[^0-9.-]/g, '')) || 0;
}

function getRank(row) {
    const raw = row.Rank ?? row.rank ?? '';
    const n = parseInt(String(raw).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : NaN;
}

function getCode(row) {
    return String(row.Code ?? row.code ?? row.CountryCode ?? '').trim().toUpperCase();
}

// For Student 2 compatibility
function getStudyHours(row)  { return parseFloat(row.studyHours ?? row['Study Hours'] ?? 'NaN') || NaN; }
function getAttendance(row)  { return parseFloat(row.attendance  ?? row['Attendance']  ?? 'NaN') || NaN; }
function getScore(row)       { return parseFloat(row.finalScore  ?? row.score         ?? 'NaN') || NaN; }
function getGrade(row)       { return String(row.grade ?? row.Grade ?? '').trim().toUpperCase(); }

// ─── Filtering ──────────────────────────────────────────────

const INCOME_GROUP_CODES = new Set(['WLD','HIC','UMC','LMC','LIC']);
const REGION_CODES       = new Set(['EAS','ECS','LCN','MEA','NAC','SAS','SSF']);

function isCountryRow(row) {
    const code = getCode(row);
    if (!code) return false;
    if (INCOME_GROUP_CODES.has(code) || REGION_CODES.has(code)) return false;
    const rank = row.Rank ?? row.rank ?? '';
    if (String(rank).trim() === '' || String(rank).trim() === '..') return false;
    return Number.isFinite(getRank(row));
}

function cleanData(data) {
    // returns only valid country rows (what Student 2 charts use)
    return Array.isArray(data) ? data.filter(isCountryRow) : [];
}

// ─── Table ──────────────────────────────────────────────────

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const thead = document.getElementById('tableHeader');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Only show country rows in table
    const rows = data.filter(isCountryRow);

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-3)">No results found</td></tr>';
        return;
    }

    // Build headers once
    if (!thead.children.length) {
        ['Rank','Code','Economy','GDP (Million USD)'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            if (h === 'Rank' || h === 'GDP (Million USD)') th.className = 'num-h';
            thead.appendChild(th);
        });
    }

    rows.forEach(row => {
        const tr = document.createElement('tr');

        // Rank
        const rankTd = document.createElement('td');
        rankTd.className = 'rank-cell';
        rankTd.textContent = getRank(row) || '';
        tr.appendChild(rankTd);

        // Code
        const codeTd = document.createElement('td');
        codeTd.textContent = getCode(row);
        codeTd.style.fontFamily = 'var(--mono)';
        codeTd.style.fontSize = '0.8rem';
        codeTd.style.color = 'var(--text-3)';
        tr.appendChild(codeTd);

        // Economy
        const nameTd = document.createElement('td');
        nameTd.textContent = getCountryName(row);
        tr.appendChild(nameTd);

        // GDP
        const gdpTd = document.createElement('td');
        gdpTd.className = 'num';
        gdpTd.textContent = '$' + Math.round(getGDP(row)).toLocaleString();
        tr.appendChild(gdpTd);

        tbody.appendChild(tr);
    });
}

function renderSummaryCards(data) {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    container.innerHTML = '';

    const countries = data.filter(isCountryRow);
    if (!countries.length) return;

    const gdpValues = countries.map(getGDP).filter(v => v > 0);
    const totalGDP  = gdpValues.reduce((a, b) => a + b, 0);
    const avgGDP    = totalGDP / gdpValues.length;
    const topEcon   = [...countries].sort((a, b) => getGDP(b) - getGDP(a))[0];
    const topRanked = [...countries].filter(r => Number.isFinite(getRank(r))).sort((a, b) => getRank(a) - getRank(b))[0];

    // World total from dataset
    const worldRow  = data.find(r => getCode(r) === 'WLD');
    const worldGDP  = worldRow ? getGDP(worldRow) : totalGDP;

    [
        { label: 'Countries Ranked',  value: countries.length },
        { label: 'World GDP (2017)',   value: '$' + Math.round(worldGDP / 1000).toLocaleString() + ' M' },
        { label: 'Largest Economy',    value: topEcon   ? getCountryName(topEcon)   : 'N/A' },
        { label: '#1 Ranked',          value: topRanked ? getCountryName(topRanked) : 'N/A' },
        { label: 'Mean GDP',           value: '$' + Math.round(avgGDP).toLocaleString() + ' M' },
        { label: 'Data Year',          value: '2017' },
    ].forEach(c => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<div class="card-label">${c.label}</div><div class="card-value">${c.value}</div>`;
        container.appendChild(div);
    });
}

function applyFilterSort() {
    const text   = document.getElementById('filterInput').value.toLowerCase().trim();
    const option = document.getElementById('sortSelect').value;

    let filtered = window.DS.filter(r =>
        isCountryRow(r) && getCountryName(r).toLowerCase().includes(text)
    );

    if (option === 'nameAsc')  filtered.sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)));
    if (option === 'gdpDesc')  filtered.sort((a, b) => getGDP(b) - getGDP(a));
    if (option === 'gdpAsc')   filtered.sort((a, b) => getGDP(a) - getGDP(b));

    renderTable(filtered);
    document.getElementById('rowCount').textContent = `Rows: ${filtered.filter(isCountryRow).length}`;
}

function resetTable() {
    document.getElementById('filterInput').value = '';
    document.getElementById('sortSelect').value  = 'none';
    renderTable(window.DS);
    document.getElementById('rowCount').textContent = `Rows: ${window.DS.filter(isCountryRow).length}`;
}

// ─── CSV Parser for this specific World Bank format ─────────
// Columns: Code, Rank, (blank), Economy, GDP, (notes...)

function parseWorldBankCSV(results) {
    const rows = [];

    for (const raw of results.data) {
        const row = Array.isArray(raw) ? raw : raw;

        const code = String(row.CountryCode ?? row.Code ?? '').trim().toUpperCase();
        const rankRaw = String(row.Rank ?? '').trim();
        const name = String(row.CountryName ?? row.Economy ?? '').trim();
        const gdpRaw = String(row.GDP ?? row.gdp ?? '').replace(/[^0-9.-]/g, '').trim();

        if (!code || !name) continue;
        if (code === 'COUNTRYCODE') continue; // skip header row if it appears as data

        const rankNum = parseInt(rankRaw, 10);
        const gdp = parseFloat(gdpRaw);

        rows.push({
            Code: code,
            Rank: Number.isFinite(rankNum) ? rankNum : '',
            Economy: name,
            GDP: Number.isFinite(gdp) ? gdp : 0
        });
    }

    return rows;
}

// ─── Load ────────────────────────────────────────────────────

function loadDataset() {
    window.DS = RAW_DATA.map(r => ({ ...r }));
    renderTable(window.DS);
    renderSummaryCards(window.DS);
    document.getElementById('rowCount').textContent =
        `Rows: ${window.DS.filter(isCountryRow).length}`;
    if (typeof onDataReady === 'function') onDataReady();
}

async function fetchKaggleDataset() {
    try {
        const res  = await fetch('data.csv');
        const text = await res.text();
        Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: results => {
        RAW_DATA = parseWorldBankCSV(results);
        console.log('Parsed rows:', RAW_DATA.length);
        loadDataset();
    }
});
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

window.addEventListener('load', fetchKaggleDataset);
