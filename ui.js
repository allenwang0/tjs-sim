// ============================================================
// TRADER JOE'S SIMULATOR — ui.js
// All rendering, event handling, chart drawing.
// ============================================================

let tickId = null;
let tickMs = 8000;
let gameRunning = false;

// ============================================================
// ENTRY POINT
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const had = Game.loadGame();
  if (had && Game.S.gamePhase === 'play') {
    showMain();
    startLoop();
    render();
  } else {
    showSetup();
  }
});

// ============================================================
// VIEW MANAGEMENT
// ============================================================

function showSetup() {
  document.getElementById('setup-screen').style.display = 'flex';
  document.getElementById('main-screen').style.display = 'none';
  renderSetup();
}

function showMain() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';
}

// ============================================================
// SETUP SCREEN
// ============================================================

function renderSetup() {
  const S = Game.S;
  const locGrid = document.getElementById('loc-grid');
  locGrid.innerHTML = '';

  Game.LOCATIONS.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'loc-card' + (S.locationId === loc.id ? ' selected' : '');
    card.dataset.id = loc.id;
    card.innerHTML = `
      <div class="loc-name">${loc.name}</div>
      <div class="loc-meta">Traffic: ${loc.traffic.toLocaleString()}/wk &nbsp;|&nbsp; Comp: ${loc.comp}</div>
      <div class="loc-rent">Rent: $${loc.rent.toLocaleString()}/wk</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.loc-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      S.locationId = loc.id;
    });
    locGrid.appendChild(card);
  });

  // Prestige perks display
  const perksEl = document.getElementById('prestige-perks-display');
  if (S.prestigeCount > 0) {
    perksEl.style.display = 'block';
    let html = '<div class="prestige-perks"><h4>Prestige Perks Active</h4>';
    if (S.prestigePerks.loyalCrew)       html += '+ Loyal Crew: Starting morale +20<br>';
    if (S.prestigePerks.supplierDiscount) html += '+ Supplier Discount: Sourcing fees & COGS -10%<br>';
    if (S.prestigePerks.dataAnalyst)     html += '+ Data Analyst: Suggested orders shown on catalog<br>';
    html += '</div>';
    perksEl.innerHTML = html;
  } else {
    perksEl.style.display = 'none';
  }

  document.getElementById('start-btn').onclick = () => {
    const S = Game.S;
    S.gamePhase = 'play';
    Game.seedStartingInventory();
    Game.rollAnnualViral();
    Game.log(`Store opened: ${Game.getLoc().name}. Year 1, Spring. Year 1 rent holiday active (${Math.round(Game.getLoc().rentHoliday*100)}% off first 13 weeks).`);
    Game.log(`You inherited a small running store. Review your inventory and ordering before the next tick.`);
    Game.saveGame();
    showMain();
    startLoop();
    render();
  };
}

// ============================================================
// TICK LOOP
// ============================================================

function startLoop() {
  if (tickId) clearInterval(tickId);
  tickId = setInterval(tick, tickMs);
  gameRunning = true;
}

function stopLoop() {
  if (tickId) clearInterval(tickId);
  gameRunning = false;
}

function tick() {
  const result = Game.gameTick();
  render();
  if (result === 'bankrupt') {
    stopLoop();
    document.getElementById('bankrupt-overlay').classList.add('show');
    document.getElementById('bankrupt-profit').textContent = Game.formatMoney(Game.S.cumulativeProfit, true);
  }
}

function setSpeed(s) {
  if (s === 'slow') tickMs = 15000;
  else if (s === 'fast') tickMs = 3000;
  else tickMs = 8000;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === s));
  if (gameRunning) startLoop();
}

// ============================================================
// MAIN RENDER
// ============================================================

function render() {
  const S = Game.S;
  renderHeader();
  renderLeftCol();
  renderCenterCol();
  renderRightCol();
}

// ============================================================
// HEADER
// ============================================================

function renderHeader() {
  const S = Game.S;
  document.getElementById('hdr-loc').textContent = Game.getLoc().name;
  document.getElementById('hdr-week').textContent = `Yr ${S.year} Wk ${S.week}`;
  document.getElementById('hdr-season').textContent = S.season.toUpperCase();

  const prestiBtn = document.getElementById('prestige-btn');
  prestiBtn.style.display = Game.prestigeEligible() ? 'inline-block' : 'none';
}

// ============================================================
// LEFT COLUMN: STATUS, LOCATION, STAFFING
// ============================================================

function renderLeftCol() {
  const S = Game.S;
  const loc = Game.getLoc();

  // Cash
  const cashEl = document.getElementById('cash-display');
  cashEl.textContent = '$' + Math.abs(S.cash).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  cashEl.className = S.cash < 0 ? 'negative' : '';
  if (S.cash < 0) cashEl.textContent = '-$' + Math.abs(S.cash).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});

  const netEl = document.getElementById('last-net');
  const net = S.pl.net;
  netEl.textContent = Game.formatMoney(net, true);
  netEl.className = net >= 0 ? 'num-pos' : 'num-neg';

  // Location
  document.getElementById('loc-name-disp').textContent = loc.name;
  document.getElementById('loc-rent-disp').textContent = '$' + loc.rent.toLocaleString() + '/wk';
  document.getElementById('loc-traffic-disp').textContent = loc.traffic.toLocaleString();

  // Rent holiday
  const rhEl = document.getElementById('rent-holiday-disp');
  if (S.year === 1 && S.week <= 13) {
    rhEl.textContent = `Year 1 lease holiday: ${Math.round(loc.rentHoliday*100)}% off`;
    rhEl.style.display = 'block';
  } else {
    rhEl.style.display = 'none';
  }

  // Staffing
  const sc = Game.suggestedCrew();
  document.getElementById('inp-crew').value = S.crew;
  document.getElementById('inp-wage').value = S.wage;
  document.getElementById('sugg-crew-disp').textContent = sc;
  document.getElementById('throughput-disp').textContent = Game.throughputMult().toFixed(2) + 'x';

  // Morale bar
  const pct = S.morale;
  const fill = document.getElementById('morale-fill');
  fill.style.width = pct + '%';
  fill.className = 'morale-bar-fill' + (pct < 40 ? ' low' : pct < 65 ? ' mid' : '');
  document.getElementById('morale-pct').textContent = pct + '/100';

  // Op state badge
  const os = Game.operationalState();
  const osEl = document.getElementById('op-state');
  osEl.textContent = os;
  osEl.className = '';
  osEl.id = 'op-state';
  osEl.style.color = os === 'HIGH MORALE' || os === 'NOMINAL'
    ? 'var(--green)'
    : os === 'LEAN'
    ? 'var(--amber)'
    : 'var(--accent)';
  osEl.style.borderColor = osEl.style.color;

  // Alerts
  renderAlerts();
}

function renderAlerts() {
  const S = Game.S;
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';

  const alerts = [];
  if (S.cash < 10000) alerts.push('Cash below $10,000. Reduce orders.');
  const wasteRate = S.cogsAccum > 0 ? S.wasteAccum / S.cogsAccum : 0;
  if (wasteRate > 0.08) alerts.push(`Waste rate ${(wasteRate*100).toFixed(1)}% — above 8% target.`);
  if (S.morale < 45) alerts.push(`Crew morale ${S.morale}%. Strike risk imminent.`);
  if (S.trend) {
    const cat = Game.getCat(S.trend.id);
    const stocked = !!S.inventory[S.trend.id];
    if (!stocked) alerts.push(`TREND: ${cat ? cat.name : '?'} — not stocked! ${S.trend.weeksLeft} weeks left.`);
    else alerts.push(`TREND ACTIVE: ${cat ? cat.name : '?'} ×${S.trend.mult.toFixed(1)} — ${S.trend.weeksLeft} weeks left.`);
  }

  alerts.forEach(txt => {
    const d = document.createElement('div');
    d.className = 'alert-block';
    d.textContent = txt;
    container.appendChild(d);
  });
}

// ============================================================
// CENTER COLUMN: INVENTORY TABLE + SOURCING + P&L
// ============================================================

function renderCenterCol() {
  const S = Game.S;

  // SKU count
  document.getElementById('sku-count').textContent = Object.keys(S.inventory).length;
  document.getElementById('sku-max').textContent = S.skuLimit;

  // View toggle
  const invView = document.getElementById('inv-view');
  const srcView = document.getElementById('sourcing-panel');
  const isSourceMode = srcView.style.display !== 'none';

  if (!isSourceMode) {
    renderInventoryTable();
  } else {
    renderSourcingTable();
  }

  renderPL();
}

function renderInventoryTable() {
  const S = Game.S;
  const tbody = document.getElementById('inv-tbody');
  tbody.innerHTML = '';

  // Build item list
  let items = [];
  for (const id in S.inventory) {
    const inv = S.inventory[id];
    const cat = Game.getCat(id);
    if (!cat) continue;

    // Filter
    if (S.filter !== 'all') {
      if (S.filter === 'Seasonal' && !cat.limited) continue;
      if (S.filter !== 'Seasonal' && cat.cat !== S.filter) continue;
    }

    // Pending arrival?
    const pending = inv.arrivalWk !== null && S.week < inv.arrivalWk;

    const margin = inv.price > 0 ? ((inv.price - cat.cost) / inv.price * 100) : 0;
    const sugg = Game.suggestedOrder(id);

    let status = 'STOCKED';
    if (pending) status = 'PENDING';
    else if (inv.onHand === 0) status = 'STOCKOUT';
    else if (inv.onHand < inv.lastSold) status = 'LOW';
    if (S.trend && S.trend.id === id && !pending) status = 'TRENDING';

    const sensLabel = Game.elasticityLabel(cat.elasticity);

    items.push({ id, inv, cat, margin, sugg, status, sensLabel });
  }

  // Sort
  const rank = { TRENDING:5, STOCKOUT:4, LOW:3, STOCKED:2, PENDING:1 };
  items.sort((a, b) => {
    switch (S.sort) {
      case 'name':   return a.cat.name.localeCompare(b.cat.name);
      case 'price':  return b.inv.price - a.inv.price;
      case 'margin': return b.margin - a.margin;
      case 'onHand': return b.inv.onHand - a.inv.onHand;
      case 'sold':   return b.inv.lastSold - a.inv.lastSold;
      default:       return (rank[b.status]||0) - (rank[a.status]||0);
    }
  });

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted);font-family:var(--mono);font-size:11px;">No SKUs match this filter. Use [+ Source Product] to add items.</td></tr>`;
    return;
  }

  items.forEach(({ id, inv, cat, margin, sugg, status, sensLabel }) => {
    const tr = document.createElement('tr');
    tr.className = status === 'TRENDING' ? 'row-trend'
                 : status === 'STOCKOUT' ? 'row-stockout'
                 : status === 'LOW'      ? 'row-low'
                 : status === 'PENDING'  ? 'row-pending'
                 : '';

    const pending = status === 'PENDING';
    const onHandStr = pending ? '<span style="color:#4466cc;font-size:10px">ARRIVING WK ' + inv.arrivalWk + '</span>' : inv.onHand;
    const sensColor = sensLabel === 'INELASTIC' || sensLabel === 'LOW' ? 'var(--green)'
                    : sensLabel === 'NEUTRAL' ? 'var(--ink)'
                    : sensLabel === 'ELASTIC' ? 'var(--amber)'
                    : 'var(--accent)';

    const ffBadge = Game.S.fanFavorites[id] ? '<span style="color:var(--green);font-size:9px;margin-left:3px">★FF</span>' : '';
    const catTagClass = cat.limited ? 'cat-tag seasonal' : 'cat-tag';

    tr.innerHTML = `
      <td>
        <div style="font-weight:700;font-size:11px;">${cat.name}${ffBadge}</div>
        <div><span class="${catTagClass}">${cat.cat}</span></div>
      </td>
      <td>
        <input class="price-input" type="number" step="0.01" value="${inv.price.toFixed(2)}"
          min="${cat.cost}" onchange="handlePrice('${id}', this.value)">
        <div style="font-size:9px;color:var(--muted);margin-top:1px;">min: $${cat.cost.toFixed(2)}</div>
      </td>
      <td style="font-weight:700;">${margin.toFixed(0)}%</td>
      <td><span style="font-family:var(--mono);font-size:10px;color:${sensColor};font-weight:700;">${sensLabel}</span></td>
      <td style="font-weight:${inv.onHand < 10 ? '700' : '400'}">${onHandStr}</td>
      <td>
        <input class="order-input" type="number" value="${inv.order}" min="0"
          onchange="handleOrder('${id}', this.value)">
        <div style="font-size:9px;color:var(--muted);margin-top:1px;">sugg: ${sugg}</div>
      </td>
      <td>${inv.lastSold}</td>
      <td><span class="status-badge ${status}">${status}</span></td>
      <td><button class="btn-link" onclick="doDiscontinue('${id}')">Drop</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSourcingTable() {
  const S = Game.S;
  const tbody = document.getElementById('src-tbody');
  tbody.innerHTML = '';

  const available = Game.CATALOG.filter(c => {
    if (S.inventory[c.id]) return false;
    if (c.limited && (S.week < c.startWk || S.week > c.endWk)) return false;
    return true;
  });

  if (available.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted);font-size:11px;">No products available to source this week.</td></tr>`;
    return;
  }

  available.forEach(cat => {
    const margin = ((cat.baseRetail - cat.cost) / cat.baseRetail * 100).toFixed(0);
    const fee = S.prestigePerks.supplierDiscount ? Math.round(cat.fee * 0.90) : cat.fee;
    const sensLabel = Game.elasticityLabel(cat.elasticity);
    const sensColor = sensLabel === 'INELASTIC' || sensLabel === 'LOW' ? 'var(--green)'
                    : sensLabel === 'NEUTRAL' ? 'var(--ink)'
                    : sensLabel === 'ELASTIC' ? 'var(--amber)'
                    : 'var(--accent)';
    const windowNote = cat.limited ? `<div style="color:var(--accent);font-size:9px;font-weight:700;margin-top:2px;">Window: Wk ${cat.startWk}–${cat.endWk}</div>` : '';
    const dataAnalystNote = S.prestigePerks.dataAnalyst ? `<div style="color:var(--green);font-size:9px;">Est. demand: ~${cat.baseDemand}/wk</div>` : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:700;font-size:11px;">${cat.name}</div>
        <span class="${cat.limited ? 'cat-tag seasonal' : 'cat-tag'}">${cat.cat}</span>
        ${windowNote}
      </td>
      <td>$${cat.cost.toFixed(2)}</td>
      <td>$${cat.baseRetail.toFixed(2)}</td>
      <td style="font-weight:700;">${margin}%</td>
      <td><span style="font-size:10px;font-weight:700;color:${sensColor}">${sensLabel}</span></td>
      <td style="font-family:var(--sans);font-size:10px;color:var(--muted);max-width:180px;line-height:1.4;">
        ${cat.note}
        ${dataAnalystNote}
      </td>
      <td>$${fee}</td>
      <td><button class="btn" onclick="doSource('${cat.id}')">Source</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPL() {
  const S = Game.S;
  const pl = S.pl;

  const rentHolidayActive = S.year === 1 && S.week <= 13;
  const rentNote = rentHolidayActive ? ' <span class="rent-holiday-note">(holiday)</span>' : '';

  const rows = [
    ['Revenue',      pl.revenue, false],
    ['COGS',        -pl.cogs, false],
    ['Gross Profit', pl.gross, true],
    ['Waste',       -pl.waste, false],
    ['Labor',       -pl.labor, false],
    ['Rent',        -pl.rent, false],
  ];

  const grid = document.getElementById('pl-grid');
  grid.innerHTML = '';

  rows.forEach(([lbl, val, isTotal]) => {
    const row = document.createElement('div');
    row.className = 'pl-row' + (isTotal ? ' total' : '');
    const cls = val >= 0 ? (isTotal ? 'num-pos' : '') : 'num-neg';
    const extraLabel = lbl === 'Rent' ? rentNote : '';
    row.innerHTML = `
      <span class="pl-lbl">${lbl}${extraLabel}</span>
      <span class="pl-val ${cls}">${Game.formatMoney(val, true)}</span>
    `;
    grid.appendChild(row);
  });

  // Net
  const netRow = document.createElement('div');
  netRow.className = 'pl-row total';
  netRow.style.borderTop = '2px solid var(--border)';
  netRow.style.marginTop = '4px';
  netRow.style.paddingTop = '4px';
  const nc = pl.net >= 0 ? 'num-pos' : 'num-neg';
  netRow.innerHTML = `<span class="pl-lbl" style="font-weight:700;color:var(--ink)">Net Profit</span><span class="pl-val ${nc}" style="font-size:14px;">${Game.formatMoney(pl.net, true)}</span>`;
  grid.appendChild(netRow);
}

// ============================================================
// RIGHT COLUMN: CHARTS + KPIs + LOG
// ============================================================

function renderRightCol() {
  renderSparkline();
  renderVelocityChart();
  renderDemandCurveChart();
  renderKPIs();
  renderLog();
}

// --- Sparkline ---
function renderSparkline() {
  const data = Game.S.profitHistory;
  const container = document.getElementById('chart-sparkline');
  container.innerHTML = '';
  if (data.length < 2) {
    container.innerHTML = '<svg width="264" height="56"><text x="10" y="30" font-size="10" font-family="monospace" fill="#999">Accumulating data...</text></svg>';
    return;
  }

  const W = 264, H = 56;
  const max = Math.max(...data, 1000);
  const min = Math.min(...data, -1000);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return [x, y];
  });

  const polyline = pts.map(p => p.join(',')).join(' ');
  const fillPoly = `0,${H} ` + polyline + ` ${W},${H}`;
  const lastNet = data[data.length-1];
  const stroke = lastNet >= 0 ? 'var(--green)' : 'var(--accent)';
  const fill   = lastNet >= 0 ? 'rgba(0,122,48,0.07)' : 'rgba(204,34,0,0.08)';

  // Zero line
  const zeroY = H - ((0 - min) / range) * (H - 8) - 4;

  container.innerHTML = `
    <svg width="${W}" height="${H}" style="display:block;">
      <line x1="0" y1="${zeroY}" x2="${W}" y2="${zeroY}" stroke="var(--rule)" stroke-dasharray="3,3"/>
      <polygon points="${fillPoly}" fill="${fill}"/>
      <polyline points="${polyline}" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3" fill="${stroke}"/>
      <text x="2" y="10" font-size="8" font-family="monospace" fill="var(--muted)">+${Math.round(max).toLocaleString()}</text>
      <text x="2" y="${H-2}" font-size="8" font-family="monospace" fill="var(--muted)">${Math.round(min).toLocaleString()}</text>
    </svg>
  `;
}

// --- Velocity bar chart ---
function renderVelocityChart() {
  const S = Game.S;
  const container = document.getElementById('chart-velocity');
  container.innerHTML = '';

  let list = [];
  for (const id in S.inventory) {
    const cat = Game.getCat(id);
    if (cat) list.push({ name: cat.name, sold: S.inventory[id].lastSold || 0 });
  }
  list.sort((a,b) => b.sold - a.sold);
  const top = list.slice(0, 8);

  if (top.length === 0) {
    container.innerHTML = '<svg width="264" height="40"><text x="10" y="22" font-size="10" font-family="monospace" fill="#999">No sales data yet.</text></svg>';
    return;
  }

  const W = 264;
  const rowH = 16;
  const H = top.length * rowH + 4;
  const labelW = 110;
  const barMaxW = W - labelW - 30;
  const maxSold = Math.max(...top.map(i => i.sold), 1);

  let svg = `<svg width="${W}" height="${H}" style="display:block;">`;
  top.forEach((item, i) => {
    const y = i * rowH + 12;
    const bw = Math.round((item.sold / maxSold) * barMaxW);
    const name = item.name.length > 18 ? item.name.substring(0,17) + '…' : item.name;
    svg += `
      <text x="2" y="${y}" font-family="monospace" font-size="9" fill="var(--ink)">${name}</text>
      <rect x="${labelW}" y="${y-9}" width="${bw}" height="9" fill="var(--ink)"/>
      <text x="${labelW + bw + 3}" y="${y}" font-family="monospace" font-size="9" font-weight="700" fill="var(--accent)">${item.sold}</text>
    `;
  });
  svg += '</svg>';
  container.innerHTML = svg;
}

// --- Seasonal demand curve ---
function renderDemandCurveChart() {
  const S = Game.S;
  const container = document.getElementById('chart-demand');
  container.innerHTML = '';

  const W = 264, H = 54;
  const seasons = ['spring','summer','fall','winter'];
  const mults = [1.00, 1.15, 1.30, 1.05];
  const labels = ['SPR','SUM','FALL','WIN'];
  const segW = W / 3;

  const pts = seasons.map((s, i) => {
    const x = i * segW;
    const y = H - (mults[i] / 1.45) * (H - 10) - 2;
    return [x, y];
  });

  // Smooth the line with a bezier through the 4 points
  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cpx = (pts[i][0] + pts[i+1][0]) / 2;
    path += ` Q ${cpx} ${pts[i][1]} ${pts[i+1][0]} ${pts[i+1][1]}`;
  }

  const curIdx = seasons.indexOf(S.season);
  const curX = curIdx * segW;
  const curY = pts[curIdx][1];

  let svg = `<svg width="${W}" height="${H}" style="display:block;">`;
  svg += `<path d="${path}" fill="none" stroke="var(--rule)" stroke-width="1.5"/>`;
  seasons.forEach((s, i) => {
    const x = i * segW;
    const isCur = s === S.season;
    svg += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${isCur ? 5 : 3}" fill="${isCur ? 'var(--accent)' : 'var(--rule)'}"/>`;
    svg += `<text x="${x - 8}" y="${H - 1}" font-size="8" font-family="monospace" fill="${isCur ? 'var(--accent)' : 'var(--muted)'}" font-weight="${isCur ? '700' : '400'}">${labels[i]}</text>`;
  });
  svg += '</svg>';
  container.innerHTML = svg;
}

// --- KPIs ---
function renderKPIs() {
  const S = Game.S;
  const container = document.getElementById('kpi-container');
  container.innerHTML = '';

  const wasteRate = S.cogsAccum > 0 ? (S.wasteAccum / S.cogsAccum * 100).toFixed(1) : '0.0';
  const skuCount = Object.keys(S.inventory).length;
  const revPerSku = skuCount > 0 ? Math.round(S.pl.revenue / skuCount) : 0;
  const laborPct = S.pl.revenue > 0 ? (S.pl.labor / S.pl.revenue * 100).toFixed(1) : '0.0';
  const rentPct  = S.pl.revenue > 0 ? (S.pl.rent  / S.pl.revenue * 100).toFixed(1) : '0.0';
  const grossPct = S.pl.revenue > 0 ? (S.pl.gross / S.pl.revenue * 100).toFixed(1) : '0.0';

  const kpis = [
    ['Cumulative Profit',   Game.formatMoney(S.cumulativeProfit, true), S.cumulativeProfit >= 0 ? 'num-pos' : 'num-neg'],
    ['Revenue / SKU Slot',  '$' + revPerSku.toLocaleString() + '/wk', ''],
    ['Gross Margin %',      grossPct + '%', parseFloat(grossPct) > 28 ? 'num-pos' : 'num-neg'],
    ['Waste / COGS',        wasteRate + '%', parseFloat(wasteRate) < 5 ? 'num-pos' : parseFloat(wasteRate) < 8 ? '' : 'num-neg'],
    ['Stockout Rate',       S.stockoutRatePct + '%', S.stockoutRatePct < 10 ? 'num-pos' : 'num-neg'],
    ['Labor / Revenue',     laborPct + '%', parseFloat(laborPct) < 15 ? 'num-pos' : 'num-neg'],
    ['Rent / Revenue',      rentPct + '%',  parseFloat(rentPct)  < 25 ? 'num-pos' : 'num-neg'],
  ];

  kpis.forEach(([lbl, val, cls]) => {
    const row = document.createElement('div');
    row.className = 'kpi-row';
    row.innerHTML = `<span class="kpi-lbl">${lbl}</span><span class="kpi-val ${cls}">${val}</span>`;
    container.appendChild(row);
  });
}

// --- Event Log ---
function renderLog() {
  const S = Game.S;
  const box = document.getElementById('log-box');
  box.innerHTML = '';

  S.logs.slice(0, 40).forEach(entry => {
    const d = document.createElement('div');
    const txt = entry.text || '';
    const isWarn  = txt.includes('[WARNING') || txt.includes('[CRITICAL') || txt.includes('[BANKRUPTCY') || txt.includes('[STOCKOUT') || txt.includes('[LABOR') || txt.includes('[BRAND');
    const isTrend = txt.includes('[TREND') || txt.includes('[VIRAL') || txt.includes('[SIGNAL') || txt.includes('[FAN FAVORITE');
    const isInfo  = txt.includes('[ADVISORY') || txt.includes('[UNLOCK') || txt.includes('[NOTE');
    d.className = 'log-entry' + (isWarn ? ' log-warn' : isTrend ? ' log-trend' : isInfo ? ' log-info' : '');
    d.innerHTML = `<span class="log-ts">[Yr${entry.yr || 1} W${entry.wk || 1}]</span>${txt}`;
    box.appendChild(d);
  });
}

// ============================================================
// EVENT HANDLERS (called from inline HTML)
// ============================================================

function handlePrice(id, val) {
  const cat = Game.getCat(id);
  if (!cat) return;
  if (!Game.setPrice(id, val)) {
    alert('Price cannot be below cost price ($' + cat.cost.toFixed(2) + '). Margin floor enforced.');
  }
  render();
}

function handleOrder(id, val) {
  Game.setOrder(id, val);
}

function doSource(id) {
  const result = Game.sourceProduct(id);
  if (!result.ok) {
    alert(result.msg);
  } else {
    render();
  }
}

function doDiscontinue(id) {
  const cat = Game.getCat(id);
  if (confirm(`Set [${cat ? cat.name : id}] adrift? Remaining inventory is written off.`)) {
    Game.discontinueProduct(id);
    render();
  }
}

function doBulkSuggest() {
  Game.bulkAcceptSuggestions();
  render();
}

function setFilter(f) {
  Game.S.filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  render();
}

function setSort(col) {
  Game.S.sort = col;
  render();
}

function openSource() {
  document.getElementById('inv-view').style.display = 'none';
  document.getElementById('sourcing-panel').style.display = 'block';
  document.getElementById('btn-open-src').style.display = 'none';
  document.getElementById('btn-close-src').style.display = 'inline-block';
  renderSourcingTable();
}

function closeSource() {
  document.getElementById('inv-view').style.display = 'block';
  document.getElementById('sourcing-panel').style.display = 'none';
  document.getElementById('btn-open-src').style.display = 'inline-block';
  document.getElementById('btn-close-src').style.display = 'none';
  render();
}

let selectedPrestigeLocation = null;

function openPrestige() {
  if (!Game.prestigeEligible()) return;

  const overlay = document.getElementById('prestige-overlay');
  const grid = document.getElementById('prestige-loc-grid');
  const carryEl = document.getElementById('prestige-carry-cash');

  carryEl.textContent = `20% of cash (${Game.formatMoney(Game.S.cash * 0.20)})`;

  grid.innerHTML = '';
  selectedPrestigeLocation = Game.LOCATIONS[0].id;

  Game.LOCATIONS.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'loc-card' + (selectedPrestigeLocation === loc.id ? ' selected' : '');
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="loc-name">${loc.name}</div>
      <div class="loc-meta">Traffic: ${loc.traffic.toLocaleString()}/wk | Comp: ${loc.comp}</div>
      <div class="loc-rent">Rent: $${loc.rent.toLocaleString()}/wk</div>
    `;
    card.onclick = () => {
      selectedPrestigeLocation = loc.id;
      grid.querySelectorAll('.loc-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    };
    grid.appendChild(card);
  });

  overlay.style.display = 'flex';
}

function closePrestige() {
  document.getElementById('prestige-overlay').style.display = 'none';
  selectedPrestigeLocation = null;
}

function confirmPrestige() {
  if (!selectedPrestigeLocation) return;

  closePrestige();
  Game.doPrestige(selectedPrestigeLocation);
  stopLoop();
  showMain();
  startLoop();
  render();
}

function doHardReset() {
  if (confirm('Permanently wipe all save data and restart?')) {
    stopLoop();
    Game.hardReset();
    location.reload();
  }
}

function doBankruptRestart() {
  document.getElementById('bankrupt-overlay').classList.remove('show');
  stopLoop();
  Game.hardReset();
  location.reload();
}

function handleCrewChange() {
  const crew = parseInt(document.getElementById('inp-crew').value);
  const wage = parseFloat(document.getElementById('inp-wage').value);
  if (!isNaN(crew) && crew >= 1) Game.S.crew = crew;
  if (!isNaN(wage)) {
    if (wage < 18) { alert('Minimum wage is $18/hr.'); document.getElementById('inp-wage').value = 18; Game.S.wage = 18; }
    else Game.S.wage = wage;
  }
  Game.saveGame();
  render();
}

// ============================================================
// PAUSE/PLAY & EXPORT
// ============================================================

function togglePause() {
  const btn = document.getElementById('pause-btn');
  if (gameRunning) {
    stopLoop();
    btn.textContent = '▶ Play';
    btn.style.backgroundColor = 'var(--green)';
  } else {
    startLoop();
    btn.textContent = '⏸ Pause';
    btn.style.backgroundColor = '';
  }
}

function exportGameData() {
  const data = {
    exportDate: new Date().toISOString(),
    gameState: Game.S,
    summary: {
      week: Game.S.week,
      year: Game.S.year,
      cash: Game.S.cash,
      cumulativeProfit: Game.S.cumulativeProfit,
      location: Game.getLoc().name,
      skuCount: Object.keys(Game.S.inventory).length,
      prestigeCount: Game.S.prestigeCount,
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tjs-sim-save-yr${Game.S.year}-wk${Game.S.week}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  Game.log('[EXPORT] Game data exported successfully.');
}

// ============================================================
// HELP MODAL
// ============================================================

function toggleHelp() {
  const overlay = document.getElementById('help-overlay');
  overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
  // Ignore if typing in an input
  if (e.target.tagName === 'INPUT') return;

  // ?: toggle help
  if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
    e.preventDefault();
    toggleHelp();
    return;
  }

  // Escape: close modals
  if (e.code === 'Escape') {
    closePrestige();
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay.style.display === 'flex') toggleHelp();
    return;
  }

  // Space: toggle pause
  if (e.code === 'Space') {
    e.preventDefault();
    if (document.getElementById('main-screen').style.display !== 'none') {
      togglePause();
    }
  }

  // 1, 2, 3: set speed
  if (e.code === 'Digit1') setSpeed('slow');
  if (e.code === 'Digit2') setSpeed('normal');
  if (e.code === 'Digit3') setSpeed('fast');

  // B: bulk accept suggestions
  if (e.code === 'KeyB') {
    if (document.getElementById('inv-view').style.display !== 'none') {
      doBulkSuggest();
    }
  }

  // S: toggle source panel
  if (e.code === 'KeyS') {
    const invVisible = document.getElementById('inv-view').style.display !== 'none';
    if (invVisible) openSource();
    else closeSource();
  }
});
