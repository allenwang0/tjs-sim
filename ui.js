// ============================================================
// TRADER JOE'S SIMULATOR — ui.js
// All rendering, event handling, chart drawing.
// ============================================================

let tickId = null;
let tickMs = 8000;
let gameRunning = false;

// Table rendering optimization - state tracking
let lastInventoryState = {};
let lastRenderFilter = 'all';
let lastRenderSort = 'status';

// ============================================================
// UI/UX IMPROVEMENTS - New helper functions
// ============================================================

// Confirmation Modal System
let pendingConfirmAction = null;

function showConfirm(message, onConfirm, title = 'CONFIRM ACTION') {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  document.getElementById('confirm-modal').style.display = 'flex';
  pendingConfirmAction = onConfirm;
}

function hideConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
  pendingConfirmAction = null;
}

// Input Validation Feedback
function showInputError(inputElement, message) {
  clearInputFeedback(inputElement);
  inputElement.classList.add('input-error');

  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error-msg';
  errorDiv.textContent = message;
  errorDiv.id = `${inputElement.id || 'input'}-error`;

  inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
  setTimeout(() => clearInputFeedback(inputElement), 4000);
}

function showInputSuccess(inputElement) {
  clearInputFeedback(inputElement);
  inputElement.classList.add('input-success');
  setTimeout(() => inputElement.classList.remove('input-success'), 800);
}

function clearInputFeedback(inputElement) {
  inputElement.classList.remove('input-error', 'input-success');
  const errorMsg = document.getElementById(`${inputElement.id || 'input'}-error`);
  if (errorMsg) errorMsg.remove();
}

// Keyboard Table Navigation
let currentTableRow = null;

function initTableKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(.empty-state)'));
    if (rows.length === 0) return;

    if (!currentTableRow && (e.code === 'ArrowDown' || e.code === 'ArrowUp')) {
      currentTableRow = rows[0];
      highlightTableRow(currentTableRow);
      e.preventDefault();
      return;
    }

    if (!currentTableRow) return;
    const currentIndex = rows.indexOf(currentTableRow);

    if (e.code === 'ArrowDown' && currentIndex < rows.length - 1) {
      e.preventDefault();
      currentTableRow = rows[currentIndex + 1];
      highlightTableRow(currentTableRow);
      currentTableRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (e.code === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      currentTableRow = rows[currentIndex - 1];
      highlightTableRow(currentTableRow);
      currentTableRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (e.code === 'Enter') {
      e.preventDefault();
      const firstInput = currentTableRow.querySelector('input');
      if (firstInput) firstInput.focus();
    } else if (e.code === 'Escape') {
      clearTableHighlight();
    }
  });
}

function highlightTableRow(row) {
  document.querySelectorAll('tr.keyboard-focus').forEach(r => r.classList.remove('keyboard-focus'));
  row.classList.add('keyboard-focus');
}

function clearTableHighlight() {
  currentTableRow = null;
  document.querySelectorAll('tr.keyboard-focus').forEach(r => r.classList.remove('keyboard-focus'));
}

// ============================================================
// MODAL MANAGER - Unified modal handling system
// ============================================================

const ModalManager = {
  current: null,
  stack: [],

  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal not found: ${modalId}`);
      return false;
    }

    // Close current modal if exists (unless stacking)
    if (this.current && !options.stack) {
      this.close();
    }

    // Store modal info
    const modalInfo = {
      id: modalId,
      element: modal,
      onClose: options.onClose || null,
      closeOnEscape: options.closeOnEscape !== false, // Default true
      closeOnBackdrop: options.closeOnBackdrop !== false // Default true
    };

    // If stacking, push current to stack
    if (this.current && options.stack) {
      this.stack.push(this.current);
    }

    this.current = modalInfo;

    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('modal-active');

    // Add event listeners
    if (modalInfo.closeOnEscape) {
      document.addEventListener('keydown', this._handleEscape);
    }

    if (modalInfo.closeOnBackdrop) {
      modal.addEventListener('click', this._handleBackdropClick);
    }

    // Pause game if modal should pause (e.g., help, prestige)
    if (options.pauseGame && gameRunning) {
      stopLoop();
      modalInfo.gameWasPaused = false;
    } else {
      modalInfo.gameWasPaused = !gameRunning;
    }

    return true;
  },

  close() {
    if (!this.current) return false;

    const { element, onClose, gameWasPaused } = this.current;

    // Hide modal
    element.style.display = 'none';
    element.classList.remove('modal-active');

    // Remove event listeners
    document.removeEventListener('keydown', this._handleEscape);
    element.removeEventListener('click', this._handleBackdropClick);

    // Resume game if it was running before
    if (!gameWasPaused && !gameRunning) {
      startLoop();
    }

    // Call onClose callback
    if (onClose) {
      onClose();
    }

    this.current = null;

    // Restore stacked modal if exists
    if (this.stack.length > 0) {
      const previous = this.stack.pop();
      this.current = previous;
      previous.element.style.display = 'flex';
    }

    return true;
  },

  closeAll() {
    while (this.current) {
      this.close();
    }
    this.stack = [];
  },

  isOpen(modalId) {
    if (!this.current) return false;
    if (modalId) {
      return this.current.id === modalId;
    }
    return true;
  },

  _handleEscape(e) {
    if (e.key === 'Escape' && ModalManager.current && ModalManager.current.closeOnEscape) {
      e.preventDefault();
      ModalManager.close();
    }
  },

  _handleBackdropClick(e) {
    // Only close if clicking the modal backdrop itself, not its children
    if (e.target === e.currentTarget && ModalManager.current && ModalManager.current.closeOnBackdrop) {
      ModalManager.close();
    }
  }
};

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

  // Initialize confirmation modal
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  if (confirmCancel) confirmCancel.onclick = hideConfirm;
  if (confirmOk) {
    confirmOk.onclick = () => {
      if (pendingConfirmAction) pendingConfirmAction();
      hideConfirm();
    };
  }

  // Initialize keyboard navigation
  initTableKeyboardNav();

  // Initialize table scroll detection for mobile
  const tableWrap = document.querySelector('.table-wrap');
  if (tableWrap) {
    tableWrap.addEventListener('scroll', () => {
      if (tableWrap.scrollLeft > 20) {
        tableWrap.classList.add('scrolled');
      } else {
        tableWrap.classList.remove('scrolled');
      }
    });
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

    // Start tutorial for new games (skip if prestige, competitive, or tutorial already dismissed/completed)
    if (S.prestigeCount === 0 && !S.competitiveMode && !S.tutorial?.completed && !S.tutorial?.dismissed) {
      startTutorial();
    } else {
      startLoop();
      render();
    }
  };
}

// ============================================================
// TICK LOOP
// ============================================================

function startLoop() {
  // Prevent duplicate intervals
  if (gameRunning && tickId) {
    console.warn('[LOOP] Already running (tickId:', tickId, '). Ignoring duplicate startLoop() call.');
    return;
  }

  // Clear any existing interval
  if (tickId) {
    console.log('[LOOP] Clearing existing interval:', tickId);
    clearInterval(tickId);
    tickId = null;
  }

  console.log('[LOOP] Starting game loop. Tick interval:', tickMs, 'ms. Week:', Game.S.week);
  tickId = setInterval(tick, tickMs);
  gameRunning = true;

  // Update pause button UI
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.style.backgroundColor = '';
  }

  // Hide pause overlay
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = 'none';
}

function stopLoop() {
  if (tickId) clearInterval(tickId);
  gameRunning = false;
}

function tick() {
  try {
    console.log(`[TICK] Week ${Game.S.week}, Year ${Game.S.year} - Running game tick...`);
    const result = Game.gameTick();
    render();
    console.log(`[TICK] Complete. New week: ${Game.S.week}, Cash: ${Game.S.cash}`);
    if (result === 'bankrupt') {
      stopLoop();
      document.getElementById('bankrupt-overlay').classList.add('show');
      document.getElementById('bankrupt-profit').textContent = Game.formatMoney(Game.S.cumulativeProfit, true);
    }
  } catch (error) {
    console.error('Game tick error:', error);
    stopLoop();
    alert('An error occurred in the game simulation. The game has been paused. Check the console for details.');
  }
}

// Add manual tick function for debugging
function manualTick() {
  if (!gameRunning) {
    console.log('[MANUAL TICK] Game is paused. Starting loop first...');
    startLoop();
  }
  console.log('[MANUAL TICK] Forcing immediate tick...');
  tick();
}

function setSpeed(s) {
  if (s === 'slow') tickMs = 15000;
  else if (s === 'fast') tickMs = 3000;
  else tickMs = 8000;

  document.querySelectorAll('.speed-btn').forEach(b => {
    const btn = b;
    btn.classList.toggle('active', btn.dataset.speed === s);
    // Update button text to show timing
    if (btn.dataset.speed === 'slow') btn.textContent = 'Slow (15s)';
    if (btn.dataset.speed === 'normal') btn.textContent = 'Normal (8s)';
    if (btn.dataset.speed === 'fast') btn.textContent = 'Fast (3s)';
  });

  if (gameRunning) startLoop();
}

// ============================================================
// MAIN RENDER
// ============================================================

function render() {
  const S = Game.S;

  // Safeguard: If we're in play mode and game should be running but isn't, restart it
  if (S.gamePhase === 'play' && !S.tutorial?.active && !gameRunning) {
    console.warn('[RENDER] Game should be running but isn\'t. Restarting loop...');
    startLoop();
  }

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

  // Update pause button text based on actual game state
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    if (gameRunning) {
      pauseBtn.textContent = '⏸ Pause';
      pauseBtn.style.backgroundColor = '';
    } else {
      pauseBtn.textContent = '▶ Play (GAME PAUSED)';
      pauseBtn.style.backgroundColor = 'var(--green)';
    }
  }

  const prestiBtn = document.getElementById('prestige-btn');
  prestiBtn.style.display = Game.prestigeEligible() && !S.competitiveMode ? 'inline-block' : 'none';

  // Show submit score button if challenge is complete or player can submit sandbox score
  const submitBtn = document.getElementById('submit-score-btn');
  if (S.competitiveMode && S.challengeComplete) {
    submitBtn.style.display = 'inline-block';
    submitBtn.classList.add('visible');
  } else if (!S.competitiveMode && (S.cumulativeProfit > 100000 || S.cash > 200000)) {
    // In sandbox mode, show submit button after significant progress
    submitBtn.style.display = 'inline-block';
  } else {
    submitBtn.style.display = 'none';
  }

  // Challenge progress indicator
  const challengeProgress = document.getElementById('challenge-progress');
  if (challengeProgress && S.competitiveMode && window.CONFIG?.CHALLENGES?.[S.challengeId]) {
    const challenge = window.CONFIG.CHALLENGES[S.challengeId];
    if (challenge.weekLimit) {
      const totalWeeks = (S.year - 1) * 52 + S.week;
      const percentage = Math.round(totalWeeks / challenge.weekLimit * 100);
      challengeProgress.style.display = 'block';
      const progressText = document.getElementById('challenge-progress-text');
      if (progressText) {
        progressText.textContent = `Week ${totalWeeks} / ${challenge.weekLimit} (${percentage}%)`;
      }
    } else {
      challengeProgress.style.display = 'none';
    }
  } else if (challengeProgress) {
    challengeProgress.style.display = 'none';
  }
}

// ============================================================
// LEFT COLUMN: STATUS, LOCATION, STAFFING
// ============================================================

function renderLeftCol() {
  const S = Game.S;
  const loc = Game.getLoc();

  // Cash
  const cashEl = document.getElementById('cash-display');
  const absAmount = Math.abs(S.cash).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  cashEl.textContent = S.cash < 0 ? `-$${absAmount}` : `$${absAmount}`;
  cashEl.className = S.cash < 0 ? 'negative' : '';

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

  // Autopilot indicator
  // Autopilot section visibility (hide in competitive mode or during tutorial)
  const apSection = document.getElementById('autopilot-section');
  if (apSection) {
    const shouldHideAutopilot = S.competitiveMode || S.tutorial?.active;
    apSection.style.display = shouldHideAutopilot ? 'none' : 'block';
  }

  // Autopilot indicator (use class for proper transitions)
  const apIndicator = document.getElementById('autopilot-indicator');
  if (apIndicator) {
    apIndicator.classList.toggle('visible', S.autopilot?.enabled);
  }

  // Autopilot button UI sync - Update button to reflect state
  const apToggleBtn = document.getElementById('autopilot-toggle');
  const apStatusSpan = document.getElementById('autopilot-status');
  if (apToggleBtn && apStatusSpan && S.autopilot) {
    if (S.autopilot.enabled) {
      apStatusSpan.textContent = '⏸ Disable Autopilot';
      apToggleBtn.style.backgroundColor = 'var(--green)';
      apToggleBtn.style.color = '#fff';
    } else {
      apStatusSpan.textContent = '▶ Enable Autopilot';
      apToggleBtn.style.backgroundColor = '';
      apToggleBtn.style.color = '';
    }
  }
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

  // Trust penalty warning
  const trustStatus = Game.getTrustStatus();
  if (trustStatus.penalty) {
    // Calculate actual demand penalty being applied
    const trustMod = Math.max(0.6, 1.0 - (trustStatus.avgMarkup - 1.25) * 0.8);
    const demandReduction = ((1.0 - trustMod) * 100).toFixed(0);
    alerts.push(`⚠️ PRICE TRUST PENALTY: ${demandReduction}% demand reduction active. Avg markup ${(trustStatus.avgMarkup * 100 - 100).toFixed(0)}% above baseline.`);
  }

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

  // View toggle - use state instead of DOM visibility for single source of truth
  const currentTab = S.currentTab || 'inventory';

  if (currentTab === 'inventory') {
    renderInventoryTable();
  } else {
    renderSourcingTable();
  }

  renderPL();
}

// ============================================================
// TABLE RENDERING OPTIMIZATION - Helper functions
// ============================================================

function hasInventoryChanged(item, lastState) {
  if (!lastState) return true;

  return lastState.status !== item.status ||
    lastState.onHand !== item.inv.onHand ||
    lastState.lastSold !== item.inv.lastSold ||
    Math.abs(lastState.price - item.inv.price) > 0.01 ||
    lastState.order !== item.inv.order ||
    Math.abs(lastState.margin - item.margin) > 0.1 ||
    lastState.arrivalWk !== item.inv.arrivalWk ||
    lastState.fanFavorite !== (Game.S.fanFavorites[item.id] || false);
}

function createInventoryRow(item) {
  const { id, inv, cat, margin, sugg, status, sensLabel } = item;
  const S = Game.S;

  const tr = document.createElement('tr');
  tr.dataset.productId = id;
  tr.className = status === 'TRENDING' ? 'row-trend'
               : status === 'STOCKOUT' ? 'row-stockout'
               : status === 'LOW' ? 'row-low'
               : status === 'PENDING' ? 'row-pending' : '';

  const pending = status === 'PENDING';
  const statusIcons = {
    'TRENDING': '🔥',
    'STOCKOUT': '❌',
    'LOW': '⚠️',
    'PENDING': '📦',
    'STOCKED': '✓'
  };
  const statusIcon = statusIcons[status] || '';

  let onHandStr = inv.onHand;
  if (pending) {
    const weeksUntil = inv.arrivalWk - S.week;
    onHandStr = `<span style="color:#4466cc;font-size:10px">Arriving in ${weeksUntil} week${weeksUntil > 1 ? 's' : ''}</span>`;
  }

  const sensColor = sensLabel === 'INELASTIC' || sensLabel === 'LOW' ? 'var(--green)'
                  : sensLabel === 'NEUTRAL' ? 'var(--ink)'
                  : sensLabel === 'ELASTIC' ? 'var(--amber)' : 'var(--accent)';

  const ffBadge = S.fanFavorites[id] ? '<span style="color:var(--green);font-size:9px;margin-left:3px">★FF</span>' : '';
  const catTagClass = cat.limited ? 'cat-tag seasonal' : 'cat-tag';

  tr.innerHTML = `
    <td>
      <div style="font-weight:700;font-size:11px;">${cat.name}${ffBadge}</div>
      <div><span class="${catTagClass}">${cat.cat}</span></div>
    </td>
    <td>
      <input class="price-input" type="number" step="0.01" value="${inv.price.toFixed(2)}"
        min="${cat.cost}" inputmode="decimal" onchange="handlePrice('${id}', this.value)">
      <div style="font-size:9px;color:var(--muted);margin-top:1px;">min: $${cat.cost.toFixed(2)}</div>
    </td>
    <td style="font-weight:700;">${margin.toFixed(0)}%</td>
    <td><span style="font-family:var(--mono);font-size:10px;color:${sensColor};font-weight:700;">${sensLabel}</span></td>
    <td style="font-weight:${inv.onHand < 10 ? '700' : '400'}">${onHandStr}</td>
    <td>
      <div style="display:flex;align-items:center;gap:4px;">
        <input class="order-input" type="number" value="${inv.order}" min="0"
          inputmode="numeric" onchange="handleOrder('${id}', this.value)">
        <button class="btn-tiny" onclick="applySuggestion('${id}')" title="Apply suggested order">✓</button>
      </div>
      <div style="font-size:9px;color:var(--muted);margin-top:1px;">sugg: ${sugg}</div>
    </td>
    <td>${inv.lastSold}</td>
    <td><span class="status-badge ${status}">${statusIcon} ${status}</span></td>
    <td><button class="btn-link" onclick="doDiscontinue('${id}')">Drop</button></td>
  `;

  return tr;
}

function updateInventoryRow(row, item) {
  const { id, inv, cat, margin, sugg, status, sensLabel } = item;
  const S = Game.S;

  // Update row class
  row.className = status === 'TRENDING' ? 'row-trend'
               : status === 'STOCKOUT' ? 'row-stockout'
               : status === 'LOW' ? 'row-low'
               : status === 'PENDING' ? 'row-pending' : '';

  const cells = row.cells;

  // Cell 0: Product name with fan favorite badge
  const ffBadge = S.fanFavorites[id] ? '<span style="color:var(--green);font-size:9px;margin-left:3px">★FF</span>' : '';
  const productNameDiv = cells[0].querySelector('div:first-child');
  if (productNameDiv) {
    productNameDiv.innerHTML = `${cat.name}${ffBadge}`;
  }

  // Cell 1: Price input (preserve focus)
  const priceInput = cells[1].querySelector('.price-input');
  if (priceInput && document.activeElement !== priceInput) {
    if (Math.abs(parseFloat(priceInput.value) - inv.price) > 0.01) {
      priceInput.value = inv.price.toFixed(2);
    }
  }

  // Cell 2: Margin
  cells[2].textContent = margin.toFixed(0) + '%';

  // Cell 4: On Hand
  const pending = status === 'PENDING';
  let onHandStr = inv.onHand;
  if (pending) {
    const weeksUntil = inv.arrivalWk - S.week;
    onHandStr = `<span style="color:#4466cc;font-size:10px">Arriving in ${weeksUntil} week${weeksUntil > 1 ? 's' : ''}</span>`;
  }
  cells[4].innerHTML = onHandStr;
  cells[4].style.fontWeight = inv.onHand < 10 ? '700' : '400';

  // Cell 5: Order input (preserve focus) + suggestion
  const orderInput = cells[5].querySelector('.order-input');
  if (orderInput && document.activeElement !== orderInput) {
    if (parseInt(orderInput.value) !== inv.order) {
      orderInput.value = inv.order;
    }
  }
  const suggDiv = cells[5].querySelector('div:last-child');
  if (suggDiv) suggDiv.textContent = `sugg: ${sugg}`;

  // Cell 6: Last Sold
  cells[6].textContent = inv.lastSold;

  // Cell 7: Status badge
  const statusIcons = {
    'TRENDING': '🔥',
    'STOCKOUT': '❌',
    'LOW': '⚠️',
    'PENDING': '📦',
    'STOCKED': '✓'
  };
  const statusIcon = statusIcons[status] || '';
  cells[7].innerHTML = `<span class="status-badge ${status}">${statusIcon} ${status}</span>`;
}

function renderInventoryTable() {
  const S = Game.S;
  const tbody = document.getElementById('inv-tbody');

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

    // Get explicit status from helper
    const status = Game.getProductStatus(id);
    const margin = inv.price > 0 ? ((inv.price - cat.cost) / inv.price * 100) : 0;
    const sugg = Game.suggestedOrder(id);
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

  // Empty state
  if (items.length === 0) {
    const filterName = S.filter === 'all' ? 'inventory' : S.filter;
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="9">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">No ${filterName} products</div>
          <div class="empty-state-message">
            ${S.filter === 'all'
              ? 'Switch to "Available to Source" tab to add products to your store.'
              : `No ${S.filter} products in inventory. Try "All" filter or source new items.`}
          </div>
        </td>
      </tr>
    `;
    lastInventoryState = {};
    return;
  }

  // Check if full rebuild is needed
  const needsFullRebuild =
    tbody.children.length !== items.length ||
    S.filter !== lastRenderFilter ||
    S.sort !== lastRenderSort;

  if (needsFullRebuild) {
    // Full rebuild - clear and recreate all rows
    tbody.innerHTML = '';
    items.forEach(item => {
      tbody.appendChild(createInventoryRow(item));
    });
    lastRenderFilter = S.filter;
    lastRenderSort = S.sort;
    clearTableHighlight(); // Reset keyboard navigation state
  } else {
    // Selective update - only update changed cells
    const rows = Array.from(tbody.children);
    items.forEach((item, index) => {
      const row = rows[index];
      const lastState = lastInventoryState[item.id];

      if (hasInventoryChanged(item, lastState)) {
        updateInventoryRow(row, item);
      }
    });
  }

  // Save current state for next render
  lastInventoryState = {};
  items.forEach(item => {
    lastInventoryState[item.id] = {
      status: item.status,
      onHand: item.inv.onHand,
      lastSold: item.inv.lastSold,
      price: item.inv.price,
      order: item.inv.order,
      margin: item.margin,
      arrivalWk: item.inv.arrivalWk,
      fanFavorite: Game.S.fanFavorites[item.id] || false
    };
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
    // Determine why nothing is available
    const allSourced = Game.CATALOG.every(c => S.inventory[c.id]);
    const message = allSourced
      ? 'All products sourced! You have the full catalog.'
      : 'No seasonal products available this week. Check back during their window.';
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted);font-size:11px;">${message}</td></tr>`;
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

    // Urgency indicators for seasonal items
    let windowNote = '';
    let canSource = true;
    if (cat.limited) {
      const arrivalWk = S.week + 1;
      const weeksLeft = cat.endWk - arrivalWk;
      let urgencyColor = 'var(--green)';
      let urgencyIcon = '✓';

      if (arrivalWk >= cat.endWk) {
        urgencyColor = 'var(--accent)';
        urgencyIcon = '❌';
        canSource = false;
      } else if (weeksLeft <= 1) {
        urgencyColor = 'var(--accent)';
        urgencyIcon = '⚠️';
        canSource = false; // Block 1 week or less
      } else if (weeksLeft <= 2) {
        urgencyColor = 'var(--amber)';
        urgencyIcon = '⚠️';
      }

      windowNote = `<div style="color:${urgencyColor};font-size:9px;font-weight:700;margin-top:2px;">${urgencyIcon} Window: Wk ${cat.startWk}–${cat.endWk} (${weeksLeft} weeks after arrival)</div>`;
    }

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
      <td><button class="btn" onclick="doSource('${cat.id}')" ${!canSource ? 'disabled title="Window closing too soon"' : ''}>Source</button></td>
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

  // Accessibility: Create descriptive label
  const trend = lastNet >= 0 ? 'positive' : 'negative';
  const ariaLabel = `Net profit sparkline over last ${data.length} weeks. Current: ${Game.formatMoney(lastNet)}. Trend: ${trend}. Range: ${Game.formatMoney(min)} to ${Game.formatMoney(max)}.`;

  container.innerHTML = `
    <svg width="${W}" height="${H}" style="display:block;" role="img" aria-label="${ariaLabel}">
      <title>Net Profit Sparkline</title>
      <line x1="0" y1="${zeroY}" x2="${W}" y2="${zeroY}" stroke="var(--rule)" stroke-dasharray="3,3"/>
      <polygon points="${fillPoly}" fill="${fill}"/>
      <polyline points="${polyline}" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3" fill="${stroke}"/>
      <text x="2" y="10" font-size="8" font-family="monospace" fill="var(--muted)">+${Math.round(max).toLocaleString()}</text>
      <text x="2" y="${H-2}" font-size="8" font-family="monospace" fill="var(--muted)">${Math.round(min).toLocaleString()}</text>
    </svg>
    <div class="sr-only">${ariaLabel}</div>
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

  // Accessibility: Create descriptive label
  const topProducts = top.map(item => `${item.name}: ${item.sold} units`).join(', ');
  const ariaLabel = `Top ${top.length} selling products this week. ${topProducts}.`;

  let svg = `<svg width="${W}" height="${H}" style="display:block;" role="img" aria-label="${ariaLabel}">`;
  svg += '<title>Top Selling Products</title>';
  top.forEach((item, i) => {
    const y = i * rowH + 12;
    const bw = Math.round((item.sold / maxSold) * barMaxW);
    const name = item.name.length > 18 ? item.name.substring(0,17) + '…' : item.name;
    svg += `
      <text x="2" y="${y}" font-family="monospace" font-size="9" fill="var(--ink)" title="${item.name}">${name}</text>
      <rect x="${labelW}" y="${y-9}" width="${bw}" height="9" fill="var(--ink)"/>
      <text x="${labelW + bw + 3}" y="${y}" font-family="monospace" font-size="9" font-weight="700" fill="var(--accent)">${item.sold}</text>
    `;
  });
  svg += '</svg>';
  svg += `<div class="sr-only">${ariaLabel}</div>`;
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

  // Accessibility: Create descriptive label
  const seasonalData = seasons.map((s, i) => `${labels[i]}: ${(mults[i] * 100).toFixed(0)}% demand`).join(', ');
  const ariaLabel = `Seasonal demand curve. Current season: ${S.season.toUpperCase()}. ${seasonalData}.`;

  let svg = `<svg width="${W}" height="${H}" style="display:block;" role="img" aria-label="${ariaLabel}">`;
  svg += '<title>Seasonal Demand Pattern</title>';
  svg += `<path d="${path}" fill="none" stroke="var(--rule)" stroke-width="1.5"/>`;
  seasons.forEach((s, i) => {
    const x = i * segW;
    const isCur = s === S.season;
    svg += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${isCur ? 5 : 3}" fill="${isCur ? 'var(--accent)' : 'var(--rule)'}"/>`;
    svg += `<text x="${x - 8}" y="${H - 1}" font-size="8" font-family="monospace" fill="${isCur ? 'var(--accent)' : 'var(--muted)'}" font-weight="${isCur ? '700' : '400'}">${labels[i]}</text>`;
  });
  svg += '</svg>';
  svg += `<div class="sr-only">${ariaLabel}</div>`;
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

  // Customer trust calculation
  const trustStatus = Game.getTrustStatus();
  const trustValue = trustStatus.healthy ? '✓ Healthy' : '⚠ Declining';
  const trustClass = trustStatus.healthy ? 'num-pos' : 'num-neg';

  const kpis = [
    ['Cumulative Profit',   Game.formatMoney(S.cumulativeProfit, true), S.cumulativeProfit >= 0 ? 'num-pos' : 'num-neg'],
    ['Revenue / SKU Slot',  '$' + revPerSku.toLocaleString() + '/wk', ''],
    ['Gross Margin %',      grossPct + '%', parseFloat(grossPct) > 28 ? 'num-pos' : 'num-neg'],
    ['Waste / COGS',        wasteRate + '%', parseFloat(wasteRate) < 5 ? 'num-pos' : parseFloat(wasteRate) < 8 ? '' : 'num-neg'],
    ['Stockout Rate',       S.stockoutRatePct + '%', S.stockoutRatePct < 10 ? 'num-pos' : 'num-neg'],
    ['Customer Trust',      trustValue, trustClass],
    ['Labor / Revenue',     laborPct + '%', parseFloat(laborPct) < 15 ? 'num-pos' : 'num-neg'],
    ['Rent / Revenue',      rentPct + '%',  parseFloat(rentPct)  < 25 ? 'num-pos' : 'num-neg'],
  ];

  const kpiTooltips = {
    'Cumulative Profit': 'Total profit across all weeks of operation',
    'Revenue / SKU Slot': 'Revenue per product slot - higher is better. Target: $2000+/week',
    'Gross Margin %': 'Revenue minus cost of goods sold. Target: 28%+',
    'Waste / COGS': 'Perishable waste as % of costs. Keep under 8%',
    'Stockout Rate': '% of products out of stock. Damages demand after Week 8. Target: <10%',
    'Customer Trust': 'Pricing trust based on markup history. Penalty if overpricing',
    'Labor / Revenue': 'Labor cost as % of revenue. Target: <15%',
    'Rent / Revenue': 'Rent as % of revenue. Target: <25%'
  };

  kpis.forEach(([lbl, val, cls]) => {
    const row = document.createElement('div');
    row.className = 'kpi-row';

    const tooltip = kpiTooltips[lbl] || '';
    row.innerHTML = `
      <span class="kpi-lbl">
        <span class="tooltip-wrapper">
          <span class="tooltip-trigger">${lbl}</span>
          <span class="tooltip">${tooltip}</span>
        </span>
      </span>
      <span class="kpi-val ${cls}">${val}</span>
    `;
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

  const input = event.target;
  const validation = Game.Validators.price(val, cat);

  if (!validation.valid) {
    showInputError(input, validation.error);
    input.value = Game.S.inventory[id].price.toFixed(2);
    return;
  }

  showInputSuccess(input);
  Game.setPrice(id, validation.value);
  render();
}

function handleOrder(id, val) {
  const input = event.target;
  const validation = Game.Validators.order(val);

  if (!validation.valid) {
    showInputError(input, validation.error);
    input.value = Game.S.inventory[id].order;
    return;
  }

  showInputSuccess(input);
  Game.setOrder(id, validation.value);
  // No render needed here - order changes don't affect display until next tick
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
  const inv = Game.S.inventory[id];
  const recoveryValue = inv && cat ? Math.round(inv.onHand * cat.cost * 0.50) : 0;

  let message;
  if (recoveryValue > 0) {
    message = `Discontinue ${cat ? cat.name : id}?\n\nRemaining inventory (${inv.onHand} units) will be liquidated for ${Game.formatMoney(recoveryValue)} (50% recovery value).`;
  } else {
    message = `Discontinue ${cat ? cat.name : id}?\n\nThis will free up a SKU slot.`;
  }

  showConfirm(message, () => {
    const productName = cat ? cat.name : id;
    Game.discontinueProduct(id);
    render();
    showUndoNotification(productName);
  }, 'DISCONTINUE PRODUCT');
}

function showUndoNotification(productName) {
  const notif = document.createElement('div');
  notif.className = 'undo-notification';
  notif.innerHTML = `
    <span style="font-family:var(--mono);font-size:12px;">${productName} discontinued</span>
    <button class="btn-link" style="color:#fff;margin-left:16px;text-decoration:underline;" onclick="handleUndo()">UNDO</button>
  `;
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--ink);
    color: var(--bg);
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    z-index: 1003;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transition = 'opacity 0.3s';
    setTimeout(() => notif.remove(), 300);
  }, 10000);
}

function handleUndo() {
  if (Game.undoDiscontinue && Game.undoDiscontinue()) {
    const notif = document.querySelector('.undo-notification');
    if (notif) notif.remove();
    render();
  }
}

function doBulkSuggest() {
  Game.bulkAcceptSuggestions();
  render();
}

function applySuggestion(id) {
  const sugg = Game.suggestedOrder(id);
  Game.setOrder(id, sugg);
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

// Tab switching for inventory/sourcing views
function switchTab(tab) {
  const S = Game.S;

  // Save current tab to state (preserves filter/sort when switching back)
  S.currentTab = tab;

  // Update tab button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const invView = document.getElementById('inv-view');
  const srcView = document.getElementById('sourcing-panel');
  const filterBar = document.getElementById('filter-bar');
  const actionBar = document.getElementById('action-bar');

  if (tab === 'inventory') {
    invView.style.display = 'block';
    srcView.style.display = 'none';
    filterBar.style.display = 'flex';
    actionBar.style.display = 'flex';
    render(); // Re-renders with preserved filter/sort from state
  } else if (tab === 'sourcing') {
    invView.style.display = 'none';
    srcView.style.display = 'block';
    filterBar.style.display = 'none';
    actionBar.style.display = 'none';
    renderSourcingTable();
  }
}

let selectedPrestigeLocation = null;

function openPrestige() {
  if (!Game.prestigeEligible()) return;

  const grid = document.getElementById('prestige-loc-grid');
  const carryEl = document.getElementById('prestige-carry-cash');

  const carryAmount = Math.max(0, Game.S.cash * 0.20);
  carryEl.textContent = `20% of cash (${Game.formatMoney(carryAmount)})`;

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

  ModalManager.open('prestige-overlay', {
    pauseGame: true,
    onClose: () => {
      selectedPrestigeLocation = null;
    }
  });
}

function closePrestige() {
  ModalManager.close();
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
  showConfirm(
    'Permanently wipe all save data and restart? This cannot be undone.',
    () => {
      stopLoop();
      Game.hardReset();
      location.reload();
    },
    'RESET GAME'
  );
}

// ============================================================
// AUTOPILOT CONTROLS
// ============================================================

function toggleAutopilot() {
  const S = Game.S;

  // Ensure autopilot exists (should be handled by migration, but safety check)
  if (!S.autopilot) {
    console.error('[AUTOPILOT] Autopilot not initialized! Forcing save reload...');
    alert('Autopilot not initialized. Please refresh the page.');
    return;
  }

  // Prevent toggling autopilot in competitive mode or during tutorial
  if (S.competitiveMode) {
    Game.log('[AUTOPILOT] Autopilot not allowed in competitive mode.');
    return;
  }
  if (S.tutorial?.active) {
    Game.log('[AUTOPILOT] Autopilot disabled during tutorial.');
    return;
  }

  S.autopilot.enabled = !S.autopilot.enabled;

  const btn = document.getElementById('autopilot-toggle');
  const statusSpan = document.getElementById('autopilot-status');

  if (S.autopilot.enabled) {
    statusSpan.textContent = '⏸ Disable Autopilot';
    btn.style.backgroundColor = 'var(--green)';
    btn.style.color = '#fff';
    Game.log('[AUTOPILOT] Autopilot ENABLED. All decisions automated.');
  } else {
    statusSpan.textContent = '▶ Enable Autopilot';
    btn.style.backgroundColor = '';
    btn.style.color = '';
    Game.log('[AUTOPILOT] Autopilot DISABLED. Manual control resumed.');
  }

  Game.saveGame();
  render();
}

// ============================================================
// TUTORIAL SYSTEM
// ============================================================

function startTutorial() {
  const S = Game.S;
  S.tutorial = {
    active: true,
    completed: false,
    currentStep: 0,
    dismissed: false,
    pauseGame: true,
    wasRunning: gameRunning  // Track previous game loop state
  };

  // Always stop loop during tutorial
  stopLoop();

  showTutorialStep(0);

  const tutorialOverlay = document.getElementById('tutorial-overlay');
  if (tutorialOverlay) {
    tutorialOverlay.classList.add('show');
  } else {
    console.error('[TUTORIAL] Overlay element not found! Skipping tutorial.');
    S.tutorial = {
      active: false,
      completed: false,
      dismissed: true,
      pauseGame: false,
      wasRunning: false,
      currentStep: 0
    };
    startLoop(); // Start game immediately if overlay missing
    render();
  }

  // Auto-skip tutorial if overlay doesn't show within 5 seconds
  setTimeout(() => {
    if (S.tutorial?.active) {
      const overlayVisible = tutorialOverlay?.classList.contains('show');
      if (!overlayVisible) {
        console.error('[TUTORIAL] Overlay failed to show. Auto-skipping...');
        skipTutorialForce();
      }
    }
  }, 5000);

  Game.saveGame();
}

function showTutorialStep(stepIndex) {
  const step = Game.TUTORIAL_STEPS[stepIndex];
  const S = Game.S;

  S.tutorial.currentStep = stepIndex;

  // Update UI
  document.getElementById('tutorial-step-num').textContent = stepIndex + 1;
  document.getElementById('tutorial-step-total').textContent = Game.TUTORIAL_STEPS.length;
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-content').textContent = step.content;

  // Navigation buttons
  const prevBtn = document.getElementById('tutorial-prev');
  const nextBtn = document.getElementById('tutorial-next');

  prevBtn.disabled = stepIndex === 0;

  if (stepIndex === Game.TUTORIAL_STEPS.length - 1) {
    nextBtn.textContent = 'Finish Tutorial';
  } else {
    nextBtn.textContent = 'Next →';
  }

  // Highlight element if specified
  if (step.highlight) {
    highlightElement(step.highlight);
  } else {
    clearHighlight();
  }

  Game.saveGame();
}

function nextTutorialStep() {
  const S = Game.S;
  const nextIndex = S.tutorial.currentStep + 1;

  if (nextIndex >= Game.TUTORIAL_STEPS.length) {
    // Tutorial complete
    completeTutorial();
  } else {
    showTutorialStep(nextIndex);
  }
}

function prevTutorialStep() {
  const S = Game.S;
  const prevIndex = S.tutorial.currentStep - 1;

  if (prevIndex >= 0) {
    showTutorialStep(prevIndex);
  }
}

function completeTutorial() {
  const S = Game.S;
  S.tutorial.active = false;
  S.tutorial.completed = true;

  document.getElementById('tutorial-overlay').classList.remove('show');
  clearHighlight();

  // Always start game after completing tutorial
  startLoop();

  Game.log('[TUTORIAL] Tutorial completed. You are now in full control.');
  Game.saveGame();
  render();
}

function skipTutorial() {
  showConfirm(
    'Skip the tutorial? You can always refer to the event log and help menu for guidance.',
    () => {
      const S = Game.S;
      const wasRunning = S.tutorial?.wasRunning || false;

      S.tutorial.active = false;
      S.tutorial.dismissed = true;

      document.getElementById('tutorial-overlay').classList.remove('show');
      clearHighlight();

      // Restore previous loop state (only start if it was running before)
      // For new games, wasRunning is typically false, so we start the game
      startLoop();

      Game.saveGame();
      render();
    },
    'SKIP TUTORIAL'
  );
}

function highlightElement(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    clearHighlight();
    return;
  }

  const rect = el.getBoundingClientRect();
  const highlight = document.getElementById('tutorial-highlight-overlay');

  // Account for scroll position
  highlight.style.left = rect.left + window.scrollX - 4 + 'px';
  highlight.style.top = rect.top + window.scrollY - 4 + 'px';
  highlight.style.width = rect.width + 8 + 'px';
  highlight.style.height = rect.height + 8 + 'px';
  highlight.classList.add('active');
}

function clearHighlight() {
  const highlight = document.getElementById('tutorial-highlight-overlay');
  highlight.classList.remove('active');
}

function doBankruptRestart() {
  document.getElementById('bankrupt-overlay').classList.remove('show');
  stopLoop();
  Game.hardReset();
  location.reload();
}

function handleCrewChange() {
  const crewInput = document.getElementById('inp-crew');
  const wageInput = document.getElementById('inp-wage');
  const crewValue = crewInput.value;
  const wageValue = wageInput.value;

  // Validate crew count
  const crewValidation = Game.Validators.crew(crewValue);
  if (!crewValidation.valid) {
    showInputError(crewInput, crewValidation.error);
    crewInput.value = Game.S.crew;
  } else {
    showInputSuccess(crewInput);
    Game.S.crew = crewValidation.value;
  }

  // Validate wage
  const wageValidation = Game.Validators.wage(wageValue);
  if (!wageValidation.valid) {
    showInputError(wageInput, wageValidation.error);
    wageInput.value = Game.S.wage;
  } else {
    showInputSuccess(wageInput);
    Game.S.wage = wageValidation.value;
  }

  Game.saveGame();
  render();
}

// ============================================================
// SAVE INDICATOR
// ============================================================

window.showSaveIndicator = function() {
  const indicator = document.getElementById('save-indicator');
  if (!indicator) return;
  indicator.style.opacity = '1';
  setTimeout(() => {
    indicator.style.opacity = '0';
  }, 1500);
};

// ============================================================
// PAUSE/PLAY & EXPORT
// ============================================================

function togglePause() {
  const btn = document.getElementById('pause-btn');
  const overlay = document.getElementById('pause-overlay');

  if (gameRunning) {
    stopLoop();
    btn.textContent = '▶ Play';
    btn.style.backgroundColor = 'var(--green)';
    btn.style.color = '#fff';
    if (overlay) overlay.style.display = 'block';
    console.log('[PAUSE] Game paused');
  } else {
    startLoop();
    btn.textContent = '⏸ Pause';
    btn.style.backgroundColor = '';
    btn.style.color = '';
    if (overlay) overlay.style.display = 'none';
    console.log('[PAUSE] Game resumed');
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
  if (ModalManager.isOpen('help-overlay')) {
    ModalManager.close();
  } else {
    ModalManager.open('help-overlay', {
      pauseGame: false, // Don't pause game for help
      closeOnBackdrop: true
    });
  }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
  // Ignore if typing in an input
  if (e.target.tagName === 'INPUT') return;

  // Block all shortcuts during tutorial (tutorial is modal and should prevent all game actions)
  if (Game.S.tutorial?.active) return;

  // ?: toggle help
  if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
    e.preventDefault();
    toggleHelp();
    return;
  }

  // Escape: close modals and panels
  if (e.code === 'Escape') {
    // ModalManager handles modal closing automatically via its own handler
    // Just handle non-modal closures here
    if (!ModalManager.isOpen()) {
      // Close source panel if open
      const srcPanel = document.getElementById('sourcing-panel');
      if (srcPanel && srcPanel.style.display !== 'none') {
        switchTab('inventory');
      }
    }
    return;
  }

  // Space: toggle pause
  if (e.code === 'Space') {
    e.preventDefault(); // Prevent page scroll
    if (document.getElementById('main-screen').style.display !== 'none') {
      togglePause();
    }
    return; // Exit early to prevent other handlers
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

  // S: toggle between tabs
  if (e.code === 'KeyS') {
    const invVisible = document.getElementById('inv-view').style.display !== 'none';
    if (invVisible) switchTab('sourcing');
    else switchTab('inventory');
  }

  // L: toggle leaderboard
  if (e.code === 'KeyL') {
    toggleLeaderboard();
  }
});

// ============================================================
// COMPETITIVE MODE & LEADERBOARD
// ============================================================

function showChallengeSelect() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('challenge-screen').style.display = 'flex';
  renderChallengeSelect();
}

function renderChallengeSelect() {
  const container = document.getElementById('challenge-grid');
  container.innerHTML = '';

  const challenges = window.CONFIG?.CHALLENGES || {};
  Object.values(challenges).forEach(challenge => {
    if (!challenge.enabled) return;

    const card = document.createElement('div');
    card.className = 'challenge-card';
    card.innerHTML = `
      <div class="challenge-name">${challenge.name}</div>
      <div class="challenge-desc">${challenge.description}</div>
      <div class="challenge-meta">
        <div>Location: ${challenge.locationId.toUpperCase()}</div>
        <div>Duration: ${challenge.weekLimit ? challenge.weekLimit + ' weeks' : 'Unlimited'}</div>
        <div>Starting Cash: ${Game.formatMoney(challenge.startingCash)}</div>
      </div>
      <button class="btn-accent" onclick="startChallenge('${challenge.id}')">Start Challenge</button>
    `;
    container.appendChild(card);
  });
}

function startChallenge(challengeId) {
  const result = Game.startCompetitiveChallenge(challengeId);
  if (result.ok) {
    document.getElementById('challenge-screen').style.display = 'none';
    showMain();
    startLoop();
    render();
  } else {
    alert(result.msg);
  }
}

function openSubmitScore() {
  const S = Game.S;
  const finalScore = Game.calculateFinalScore();

  document.getElementById('submit-final-score').textContent = Game.formatMoney(finalScore);
  document.getElementById('submit-weeks').textContent = `Week ${S.week}, Year ${S.year}`;
  document.getElementById('submit-location').textContent = Game.getLoc().name;

  const modeText = S.competitiveMode
    ? (window.CONFIG?.CHALLENGES[S.challengeId]?.name || 'Competitive')
    : 'Sandbox';
  document.getElementById('submit-mode').textContent = modeText;

  ModalManager.open('submit-score-overlay', {
    pauseGame: true,
    closeOnBackdrop: false // Prevent accidental closes during submission
  });
}

function closeSubmitScore() {
  ModalManager.close();
}

async function confirmSubmitScore() {
  const playerName = document.getElementById('player-name-input').value.trim();
  if (!playerName) {
    alert('Please enter your name');
    return;
  }

  if (playerName.length > 50) {
    alert('Name must be 50 characters or less');
    return;
  }

  // Check if Supabase is configured
  if (!window.Supabase.client) {
    alert('Leaderboard is not configured. Please check your Supabase configuration.');
    return;
  }

  const S = Game.S;
  const finalScore = Game.calculateFinalScore();

  const mode = S.competitiveMode ? `competitive_${S.challengeId}` : 'sandbox';

  const entry = {
    player_name: playerName,
    score: finalScore,
    mode: mode,
    location_id: S.locationId,
    weeks_played: (S.year - 1) * 52 + S.week,
    prestige_count: S.prestigeCount,
    metadata: {
      cash: S.cash,
      cumulative_profit: S.cumulativeProfit,
      year: S.year,
      week: S.week,
      challenge_id: S.challengeId,
      challenge_complete: S.challengeComplete
    }
  };

  // Show loading state
  const btn = document.getElementById('confirm-submit-btn');
  const originalText = btn.textContent;
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  const result = await window.Supabase.client.submitScore(entry);

  btn.disabled = false;
  btn.textContent = originalText;

  if (result.success) {
    alert('Score submitted successfully!');
    closeSubmitScore();
    // Open leaderboard to show the new score
    openLeaderboard(mode);
  } else {
    alert('Failed to submit score: ' + (result.error || 'Unknown error'));
  }
}

async function toggleLeaderboard() {
  if (ModalManager.isOpen('leaderboard-overlay')) {
    ModalManager.close();
  } else {
    await openLeaderboard('sandbox');
  }
}

async function openLeaderboard(mode = 'sandbox') {
  // Set active tab
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  ModalManager.open('leaderboard-overlay', {
    pauseGame: false, // Don't pause game for leaderboard viewing
    closeOnBackdrop: true
  });

  await loadLeaderboard(mode);
}

function closeLeaderboard() {
  ModalManager.close();
}

async function loadLeaderboard(mode) {
  const container = document.getElementById('leaderboard-content');
  container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">Loading leaderboard...</div>';

  // Check if Supabase is configured
  if (!window.Supabase.client) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--accent);">Leaderboard unavailable. Supabase not configured.</div>';
    return;
  }

  const scores = await window.Supabase.client.getLeaderboard(mode, 100);

  if (scores.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">No scores yet. Be the first!</div>';
    return;
  }

  let html = '<table style="width:100%;font-family:var(--mono);font-size:11px;">';
  html += '<thead><tr><th style="text-align:left;padding:8px;">Rank</th><th style="text-align:left;">Player</th><th style="text-align:right;">Score</th><th style="text-align:right;">Weeks</th><th style="text-align:left;">Location</th><th style="text-align:right;">Date</th></tr></thead>';
  html += '<tbody>';

  scores.forEach((entry, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const date = new Date(entry.created_at).toLocaleDateString();
    const location = entry.location_id ? entry.location_id.toUpperCase() : 'N/A';

    html += `
      <tr style="border-bottom:1px solid var(--rule);">
        <td style="padding:8px;font-weight:700;">${medal} #${rank}</td>
        <td style="padding:8px;">${escapeHtml(entry.player_name)}</td>
        <td style="padding:8px;text-align:right;font-weight:700;color:var(--green);">${Game.formatMoney(entry.score)}</td>
        <td style="padding:8px;text-align:right;">${entry.weeks_played || 'N/A'}</td>
        <td style="padding:8px;">${location}</td>
        <td style="padding:8px;text-align:right;color:var(--muted);font-size:10px;">${date}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function switchLeaderboardTab(mode) {
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  await loadLeaderboard(mode);
}

// ============================================================
// EMERGENCY CONTROLS - Detects stuck state and provides recovery
// ============================================================

// Check for stuck state every 2 seconds
setInterval(() => {
  const S = Game?.S;
  const emergencyControls = document.getElementById('emergency-controls');

  if (!S || !emergencyControls) return;

  // Game is stuck if:
  // 1. In play phase AND
  // 2. Game loop not running AND
  // 3. Tutorial not active AND
  // 4. No modal is open
  const isStuck = S.gamePhase === 'play' &&
                  !gameRunning &&
                  !S.tutorial?.active &&
                  !ModalManager.isOpen();

  emergencyControls.style.display = isStuck ? 'block' : 'none';
}, 2000);

function forceStartGame() {
  console.log('[EMERGENCY] Force starting game...');
  const S = Game.S;

  // Clear tutorial state
  S.tutorial = {
    active: false,
    completed: true,
    dismissed: true,
    pauseGame: false,
    wasRunning: false,
    currentStep: 0
  };

  // Close all modals
  ModalManager.closeAll();

  // Remove tutorial overlay
  document.getElementById('tutorial-overlay')?.classList.remove('show');

  // Reset loop state
  if (tickId) {
    clearInterval(tickId);
    tickId = null;
  }
  gameRunning = false;

  // Start fresh
  startLoop();
  render();
  Game.saveGame();

  Game.log('[EMERGENCY] Game force-started by user.');
  alert('✅ Game restarted. If issues persist, try Export Save → Hard Reset → Import Save.');
}

function skipTutorialForce() {
  console.log('[EMERGENCY] Force skipping tutorial...');
  const S = Game.S;
  S.tutorial = {
    active: false,
    completed: false,
    dismissed: true,
    pauseGame: false,
    wasRunning: false,
    currentStep: 0
  };

  document.getElementById('tutorial-overlay')?.classList.remove('show');
  forceStartGame();
}

// ============================================================
// GAME STATE HEARTBEAT - Auto-recovery system
// ============================================================

let lastTickWeek = 0;
let stuckCheckCount = 0;
let lastTickTime = Date.now();

setInterval(() => {
  const S = Game?.S;
  if (!S || S.gamePhase !== 'play') {
    stuckCheckCount = 0;
    return;
  }

  const now = Date.now();

  // Check 1: Game should be running but isn't
  const shouldBeRunning = !S.tutorial?.active && !ModalManager.isOpen();

  if (shouldBeRunning && !gameRunning) {
    stuckCheckCount++;
    console.warn(`[HEARTBEAT] Game stuck detection #${stuckCheckCount}. Week: ${S.week}, gameRunning: ${gameRunning}`);

    if (stuckCheckCount >= 3) {
      console.error('[HEARTBEAT] Game confirmed stuck. Auto-recovering...');
      gameRunning = false; // Reset flag
      tickId = null; // Clear tickId
      startLoop();
      render();
      stuckCheckCount = 0;
      Game.log('[SYSTEM] Auto-recovery: Game loop restarted.');
    }
  } else {
    stuckCheckCount = 0;
  }

  // Check 2: Week not advancing (infinite loop detection)
  if (gameRunning) {
    const timeSinceLastTick = now - lastTickTime;

    if (S.week === lastTickWeek && timeSinceLastTick > tickMs * 3) {
      console.warn(`[HEARTBEAT] Week ${S.week} hasn't changed in ${(timeSinceLastTick/1000).toFixed(1)}s. Expected tick every ${(tickMs/1000).toFixed(1)}s.`);

      // If week hasn't changed in 30 seconds despite game running, restart loop
      if (timeSinceLastTick > 30000) {
        console.error('[HEARTBEAT] Week stuck. Restarting game loop.');
        stopLoop();
        startLoop();
        Game.log('[SYSTEM] Auto-recovery: Week advancement detected as stuck.');
      }
    }

    if (S.week !== lastTickWeek) {
      lastTickTime = now;
      lastTickWeek = S.week;
    }
  }

}, 10000); // Check every 10 seconds
