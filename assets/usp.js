/* The three signals, playable.
 *
 * Every curve, weight and percentile in this file is copied from the product,
 * not invented for the website:
 *   - COMPONENTS / METRICS / BANDS / interpolate  → backend health.py
 *   - PACKS.sample / SIZE_ADJUST / levers         → backend industry/catalog.py
 *   - the statutory dates                         → the Act, not a guess
 * So a number a visitor produces here is the number the product would produce
 * from the same inputs. If health.py changes, this file has to change with it.
 *
 * Mount points: <div data-usp="score|industry|calendar" data-mode="mini|full">
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ data */

  var COMPONENTS = [
    ['liquidity', 'Liquidity', 20],
    ['leverage', 'Leverage', 15],
    ['profitability', 'Profitability', 20],
    ['working_capital', 'Working capital', 15],
    ['collections', 'Collections', 10],
    ['growth', 'Growth', 10],
    ['concentration', 'Concentration', 10]
  ];

  // component, key, label, unit, weight inside component, breakpoints, slider range, step
  var METRICS = [
    ['liquidity', 'current_ratio', 'Current ratio', 'x', 40, [[0.8, 0], [1.0, 40], [1.33, 70], [2.0, 100]], [0.3, 3.5], 0.05],
    ['liquidity', 'quick_ratio', 'Quick ratio', 'x', 30, [[0.5, 0], [1.0, 70], [1.5, 100]], [0.2, 2.5], 0.05],
    ['liquidity', 'cash_weeks', 'Weeks of payments in cash', 'weeks', 30, [[2, 0], [8, 60], [26, 100]], [0, 40], 0.5],
    ['leverage', 'debt_equity', 'Debt to equity', 'x', 60, [[0, 100], [1, 70], [2, 30], [3, 0]], [0, 4], 0.05],
    ['leverage', 'interest_cover', 'Interest cover', 'x', 40, [[1, 0], [3, 60], [6, 100]], [0, 12], 0.1],
    ['profitability', 'net_margin', 'Net margin', '%', 40, [[-5, 0], [0, 20], [5, 60], [10, 80], [20, 100]], [-10, 30], 0.1],
    ['profitability', 'ebitda_margin', 'EBITDA margin', '%', 30, [[0, 10], [10, 60], [20, 90], [30, 100]], [-5, 40], 0.1],
    ['profitability', 'roe', 'Return on equity', '%', 30, [[0, 20], [15, 70], [25, 100]], [-10, 45], 0.5],
    ['working_capital', 'ccc', 'Cash conversion cycle', 'days', 60, [[30, 100], [60, 80], [90, 60], [150, 25], [240, 0]], [0, 280], 1],
    ['working_capital', 'dso', 'Debtor days', 'days', 40, [[30, 100], [60, 75], [90, 50], [180, 0]], [0, 200], 1],
    ['collections', 'over_90_pct', 'Receivables past 90 days', '%', 60, [[0, 100], [10, 70], [25, 40], [50, 0]], [0, 60], 1],
    ['collections', 'over_30_pct', 'Receivables past 30 days', '%', 40, [[0, 100], [30, 70], [60, 30], [90, 0]], [0, 95], 1],
    ['growth', 'revenue_growth', 'Revenue growth', '%', 60, [[-20, 0], [0, 40], [10, 70], [25, 100]], [-30, 50], 0.5],
    ['growth', 'profit_growth', 'Profit growth', '%', 40, [[-30, 0], [0, 40], [15, 80], [30, 100]], [-40, 60], 0.5],
    ['concentration', 'top_customer_pct', 'Largest customer, share of receivables', '%', 60, [[10, 100], [25, 70], [40, 40], [60, 0]], [0, 80], 1],
    ['concentration', 'top3_customer_pct', 'Top three customers, share of receivables', '%', 40, [[30, 100], [50, 70], [70, 35], [90, 0]], [0, 100], 1]
  ];

  var BANDS = [[750, 'Strong'], [650, 'Sound'], [550, 'Watch'], [0, 'Weak']];
  var BAND_INK = { Strong: '#1D9E75', Sound: '#3DB78B', Watch: '#EF9F27', Weak: '#D7423F' };

  var PRESETS = {
    distributor: {
      label: 'A distributor carrying its customers',
      note: 'Thin margins, long receivables, one hospital group too large.',
      v: { current_ratio: 1.25, quick_ratio: 0.8, cash_weeks: 4, debt_equity: 1.4, interest_cover: 2.6,
        net_margin: 1.8, ebitda_margin: 3.4, roe: 11, ccc: 95, dso: 86, over_90_pct: 22, over_30_pct: 58,
        revenue_growth: 11, profit_growth: 4, top_customer_pct: 38, top3_customer_pct: 64 }
    },
    manufacturer: {
      label: 'A manufacturer with stock on the floor',
      note: 'Healthy margin, but the cash cycle is long and the bank is doing the funding.',
      v: { current_ratio: 1.5, quick_ratio: 0.85, cash_weeks: 6, debt_equity: 1.1, interest_cover: 3.4,
        net_margin: 6.5, ebitda_margin: 13, roe: 16, ccc: 128, dso: 82, over_90_pct: 14, over_30_pct: 45,
        revenue_growth: 14, profit_growth: 9, top_customer_pct: 29, top3_customer_pct: 55 }
    },
    services: {
      label: 'A services firm that collects well',
      note: 'No stock, wide margin, and the only real risk is one client.',
      v: { current_ratio: 2.3, quick_ratio: 2.1, cash_weeks: 14, debt_equity: 0.15, interest_cover: 9,
        net_margin: 12, ebitda_margin: 18, roe: 24, ccc: 48, dso: 56, over_90_pct: 6, over_30_pct: 30,
        revenue_growth: 19, profit_growth: 22, top_customer_pct: 41, top3_customer_pct: 68 }
    }
  };

  /* Industry packs. Percentiles are [p10, p25, p50, p75, p90]. */
  var IMETRICS = [
    ['growth', 'Revenue growth', '%', 'up', 'This year against last'],
    ['gm', 'Gross margin', '%', 'up', 'Revenue less cost of goods sold'],
    ['ebitda', 'EBITDA margin', '%', 'up', 'Before interest, tax, depreciation'],
    ['nm', 'Net margin', '%', 'up', 'Profit after tax to revenue'],
    ['opex', 'Operating costs', '%', 'down', 'Share of revenue, excluding depreciation'],
    ['dso', 'Debtor days', 'd', 'down', 'Receivables over revenue, in days'],
    ['dio', 'Inventory days', 'd', 'down', 'Stock over cost of goods sold'],
    ['dpo', 'Creditor days', 'd', 'band', 'Payables over cost of goods sold'],
    ['ccc', 'Cash conversion cycle', 'd', 'down', 'Debtor plus inventory less creditor days'],
    ['cr', 'Current ratio', 'x', 'band', 'Current assets over current liabilities'],
    ['de', 'Debt to equity', 'x', 'down', 'Borrowings over net worth'],
    ['at', 'Asset turnover', 'x', 'up', 'Revenue over total assets'],
    ['top', 'Largest customer', '%', 'down', 'Share of receivables']
  ];

  var SIZE_ADJUST = {
    micro: { growth: [1, 2], gm: [0.95, 0], ebitda: [0.85, 0], nm: [0.8, 0], opex: [1.1, 0], dso: [1.12, 0],
      dio: [1.08, 0], dpo: [0.92, 0], ccc: [1.15, 0], cr: [1, -0.1], de: [0.8, 0], at: [0.95, 0], top: [1.2, 0] },
    small: {},
    medium: { growth: [1, -1], gm: [1.03, 0], ebitda: [1.1, 0], nm: [1.1, 0], opex: [0.92, 0], dso: [0.92, 0],
      dio: [0.95, 0], dpo: [1.05, 0], ccc: [0.9, 0], cr: [1, 0.05], de: [1.15, 0], at: [1.05, 0], top: [0.85, 0] }
  };

  var PACKS = {
    pharmadist: {
      name: 'Pharmaceutical distribution',
      model: 'Buys from manufacturers and supplies chemists and hospitals on credit. Volume, credit discipline and stock turns decide profit.',
      n: { micro: 214, small: 486, medium: 132 },
      sample: { growth: [-2, 5, 11, 18, 28], gm: [6, 8, 10.5, 13, 17], ebitda: [1.2, 2.2, 3.4, 5, 7.5], nm: [0.3, 0.9, 1.8, 3, 4.8],
        opex: [3, 4.5, 6, 8, 11], dso: [25, 38, 52, 70, 95], dio: [18, 26, 35, 48, 65], dpo: [20, 30, 42, 55, 72],
        ccc: [10, 25, 45, 68, 95], cr: [1.0, 1.2, 1.45, 1.8, 2.4], de: [0, 0.3, 0.8, 1.4, 2.2], at: [1.8, 2.6, 3.4, 4.3, 5.5],
        top: [5, 9, 15, 26, 40] },
      levers: {
        dso: ['Put hospitals on 45-day terms with a written schedule', 'Offer 1 to 2% for payment inside 15 days to chemists', 'Stop fresh supply at 90 days, not 180'],
        dio: ['Reorder on the last 60 days of sales, not on the principal’s scheme', 'Return near-expiry stock before month 3'],
        dpo: ['Negotiate 30 to 45 days with non-MSME principals', 'Keep MSME suppliers inside 45 days under section 43B(h)'],
        gm: ['Shift mix toward generic and trade-generic lines', 'Claim every scheme and quantity discount in the same month'],
        opex: ['Route delivery by beat plan; freight is the largest controllable cost'],
        top: ['Add one hospital or chain each quarter until the largest is under 25%', 'Put the largest customer on a written supply agreement']
      }
    },
    pharmamfg: {
      name: 'Pharmaceutical manufacturing',
      model: 'Makes formulations or bulk drugs for own brands or on contract. Margins are wide, but inventory and receivables are long.',
      n: { micro: 96, small: 312, medium: 208 },
      sample: { growth: [-5, 3, 9, 16, 26], gm: [28, 35, 42, 50, 58], ebitda: [5, 9, 13, 18, 24], nm: [1, 3.5, 6.5, 10, 14],
        opex: [12, 16, 21, 26, 32], dso: [45, 62, 80, 100, 125], dio: [50, 70, 92, 120, 150], dpo: [35, 50, 68, 88, 110],
        ccc: [45, 75, 105, 135, 170], cr: [1.0, 1.25, 1.55, 2.0, 2.7], de: [0.1, 0.4, 0.8, 1.3, 2.0], at: [0.8, 1.1, 1.4, 1.8, 2.3],
        top: [6, 12, 20, 32, 48] },
      levers: {
        dso: ['Move distributors to 60-day terms with credit limits tied to secondary sales', 'Factor export receivables'],
        dio: ['Plan batches to 30-day dispatch forecasts', 'Hold API cover at 45 days, not 90'],
        gm: ['Raise own-brand share over contract manufacturing', 'Re-tender packing material yearly'],
        opex: ['Consolidate QC testing across lines', 'Cut power cost per batch with scheduling'],
        top: ['Cap any one loan-licence customer at 30% of capacity']
      }
    },
    auto: {
      name: 'Auto components',
      model: 'Machines or assembles parts for vehicle makers and the replacement market. A few customers dominate; metal prices pass through with a lag.',
      n: { micro: 142, small: 528, medium: 344 },
      sample: { growth: [-8, 2, 9, 15, 24], gm: [22, 27, 32, 38, 45], ebitda: [5, 8, 11, 14, 18], nm: [0.5, 2.5, 4.5, 7, 10],
        opex: [10, 13, 17, 21, 26], dso: [40, 55, 70, 88, 110], dio: [30, 45, 60, 78, 100], dpo: [35, 50, 65, 82, 100],
        ccc: [20, 40, 62, 85, 110], cr: [0.9, 1.1, 1.35, 1.7, 2.2], de: [0.3, 0.7, 1.1, 1.7, 2.5], at: [0.9, 1.2, 1.5, 1.9, 2.4],
        top: [15, 25, 38, 52, 68] },
      levers: {
        dso: ['Use TReDS to discount OEM invoices', 'Invoice on dispatch, not on OEM receipt'],
        dio: ['Run kanban with the top two OEMs', 'Sell off tooling-specific stock when a programme ends'],
        gm: ['Put a metal-price pass-through clause in every contract', 'Grow replacement-market sales, which carry wider margins'],
        opex: ['Track power per part; it is usually the largest controllable cost'],
        top: ['Add a second OEM platform before the current one ends']
      }
    },
    it: {
      name: 'IT and software services',
      model: 'Sells people-time or software to domestic and export clients. People are most of the cost; there is almost no inventory.',
      n: { micro: 188, small: 604, medium: 290 },
      sample: { growth: [-5, 6, 14, 22, 35], gm: [30, 38, 46, 55, 65], ebitda: [6, 11, 16, 22, 30], nm: [3, 7, 11, 16, 22],
        opex: [20, 26, 32, 40, 48], dso: [35, 50, 65, 85, 110], dio: [0, 0, 0, 2, 5], dpo: [10, 18, 28, 40, 55],
        ccc: [20, 35, 55, 75, 100], cr: [1.2, 1.6, 2.1, 2.9, 4.0], de: [0, 0, 0.1, 0.4, 0.9], at: [0.9, 1.3, 1.7, 2.2, 2.8],
        top: [12, 22, 35, 50, 70] },
      levers: {
        dso: ['Bill monthly in advance for retainers', 'Reconcile TDS receivable every quarter'],
        gm: ['Lift utilisation above 80%', 'Reprice the oldest contracts first'],
        opex: ['Keep sales and admin under a fixed share of revenue'],
        top: ['Sign a second anchor client before the largest passes 40%']
      }
    }
  };
  var PACK_ORDER = ['pharmadist', 'pharmamfg', 'auto', 'it'];

  /* The statutory calendar. Dates are the standard ones in the Act; the
     product also moves them for extensions and for QRMP filers, which this
     page does not. */
  var MONTHLY = [
    [7, 'TDS and TCS deposit', 'Tax deducted last month is paid to the government.', 'Interest at 1.5% a month from the date of deduction.'],
    [11, 'GSTR-1', 'Outward supplies for last month, monthly filers.', 'Late fee per day, and your customer cannot claim credit until you file.'],
    [15, 'PF and ESI', 'Employee contributions for last month.', 'Damages and interest, and the dues are a first charge.'],
    [20, 'GSTR-3B', 'Summary return and the tax payment with it.', 'Interest at 18% a year on the tax paid late.']
  ];
  var ADVANCE_TAX = { 5: ['15 June', '15% of the year’s tax'], 8: ['15 September', '45% cumulative'], 11: ['15 December', '75% cumulative'], 2: ['15 March', '100% cumulative'] };
  var ANNUAL = {
    6: [[31, 'Income tax return', 'Non-audit cases for the year just ended.', 'Interest under 234A, and losses cannot be carried forward.']],
    8: [[30, 'Tax audit report', 'Form 3CA/3CB and 3CD where turnover crosses the limit.', 'Penalty up to 0.5% of turnover.']],
    9: [[31, 'Income tax return', 'Audit cases.', 'Interest under 234A on the tax outstanding.']],
    10: [[30, 'Transfer pricing report', 'Form 3CEB where there are international or specified domestic transactions.', 'Penalty for non-furnishing.']],
    2: [[31, 'Financial year ends', 'Books close. Section 43B(h) tests every MSME bill still unpaid.', 'An unpaid MSME bill past its limit is added back to profit for the year.']]
  };
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* --------------------------------------------------------------- helpers */

  function interpolate(x, pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0]; });
    if (x <= p[0][0]) return p[0][1];
    if (x >= p[p.length - 1][0]) return p[p.length - 1][1];
    for (var i = 0; i < p.length - 1; i += 1) {
      var a = p[i], b = p[i + 1];
      if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    }
    return p[p.length - 1][1];
  }

  function bandOf(score) {
    for (var i = 0; i < BANDS.length; i += 1) if (score >= BANDS[i][0]) return BANDS[i][1];
    return 'Weak';
  }

  function computeScore(values) {
    var usedWeight = 0, weighted = 0, comps = [];
    COMPONENTS.forEach(function (c) {
      var key = c[0], mwUsed = 0, mwSum = 0, totalMw = 0, rows = [];
      METRICS.forEach(function (m) {
        if (m[0] !== key) return;
        totalMw += m[4];
        var v = values[m[1]];
        if (v === undefined || v === null || isNaN(v)) { rows.push({ key: m[1], label: m[2], value: null, score: null }); return; }
        var s = interpolate(v, m[5]);
        rows.push({ key: m[1], label: m[2], unit: m[3], value: v, score: s, weight: m[4] });
        mwUsed += m[4]; mwSum += s * m[4];
      });
      var compScore = mwUsed ? mwSum / mwUsed : null;
      if (compScore !== null) { var share = c[2] * mwUsed / totalMw; usedWeight += share; weighted += compScore * share; }
      var scored = rows.filter(function (r) { return r.score !== null; });
      var drag = scored.length ? scored.reduce(function (a, b) { return b.score < a.score ? b : a; }) : null;
      comps.push({ key: key, label: c[1], weight: c[2], score: compScore, rows: rows,
        drag: drag && drag.score < 70 ? drag : null });
    });
    if (!usedWeight) return { score: null, components: comps };
    var s100 = weighted / usedWeight;
    var final = Math.round(300 + 6 * s100);
    return { score: final, band: bandOf(final), builtOn: Math.round(usedWeight * 10) / 10, components: comps };
  }

  /* Which single change buys the most points, tested the way the screen does
     it: move one measure to the next breakpoint and re-score everything. */
  function biggestLift(values) {
    var base = computeScore(values).score, best = null;
    METRICS.forEach(function (m) {
      var v = values[m[1]];
      if (v === undefined || v === null) return;
      var pts = m[5].slice().sort(function (a, b) { return a[0] - b[0]; });
      // the next breakpoint in the improving direction
      var improving = pts[pts.length - 1][1] > pts[0][1] ? 1 : -1, target = null;
      for (var i = 0; i < pts.length; i += 1) {
        if (improving === 1 && pts[i][0] > v) { target = pts[i][0]; break; }
        if (improving === -1 && pts[i][0] < v) target = pts[i][0];
      }
      if (target === null) return;
      var trial = {}; for (var k in values) trial[k] = values[k];
      trial[m[1]] = target;
      var gain = computeScore(trial).score - base;
      if (gain > 0 && (!best || gain > best.gain)) best = { metric: m, from: v, to: target, gain: gain };
    });
    return best;
  }

  function pctl(pack, size, key) {
    var base = PACKS[pack].sample[key];
    var adj = (SIZE_ADJUST[size] || {})[key];
    if (!adj) return base.slice();
    return base.map(function (x) { return Math.round((x * adj[0] + adj[1]) * 100) / 100; });
  }

  function inr(v) {
    var n = Math.round(Math.abs(v));
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    var s = String(n), out = '';
    if (s.length > 3) {
      var head = s.slice(0, -3), tail = s.slice(-3), parts = [];
      while (head.length > 2) { parts.unshift(head.slice(-2)); head = head.slice(0, -2); }
      if (head) parts.unshift(head);
      out = parts.join(',') + ',' + tail;
    } else out = s;
    return '₹' + out;
  }

  function fmt(v, unit) {
    if (v === null || v === undefined) return '—';
    var r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
    return unit === 'x' ? r.toFixed(2) + 'x' : unit === '%' ? r + '%' : unit === 'd' || unit === 'days' ? r + ' days' : r + ' ' + unit;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ----------------------------------------------------------- 01 · score */

  function gaugeSvg(score, size) {
    var W = size === 'mini' ? 200 : 260, scale = W / 200;
    var R = 82 * scale, cx = 100 * scale, cy = 96 * scale;
    var ang = function (s) { return Math.PI * (1 - (Math.max(300, Math.min(900, s)) - 300) / 600); };
    var pt = function (a) { return (cx + R * Math.cos(a)).toFixed(1) + ' ' + (cy - R * Math.sin(a)).toFixed(1); };
    var arc = function (f, t) { return 'M' + pt(ang(f)) + ' A' + R.toFixed(1) + ' ' + R.toFixed(1) + ' 0 0 1 ' + pt(ang(t)); };
    var b = bandOf(score), ink = BAND_INK[b];
    var a = ang(score), nx = (cx + R * Math.cos(a)).toFixed(1), ny = (cy - R * Math.sin(a)).toFixed(1);
    var segs = [[300, 550, '#D7423F'], [550, 650, '#EF9F27'], [650, 750, '#6DCFA9'], [750, 900, '#1D9E75']];
    var paths = segs.map(function (s) {
      var on = b === bandOf(s[0] + 1) || (s[0] === 750 && b === 'Strong');
      var live = score >= s[0] && score < s[1] || (s[1] === 900 && score >= 750);
      return '<path d="' + arc(s[0], s[1]) + '" stroke="' + s[2] + '" stroke-width="' + (11 * scale).toFixed(1) +
        '" fill="none" stroke-linecap="round" opacity="' + (live ? 1 : 0.22) + '"></path>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + (116 * scale).toFixed(0) + '" class="usp-gauge" role="img" aria-label="Score ' + score + ' of 900, band ' + b + '">' +
      paths +
      '<circle cx="' + nx + '" cy="' + ny + '" r="' + (9 * scale).toFixed(1) + '" fill="' + ink + '" stroke="#fff" stroke-width="' + (3 * scale).toFixed(1) + '"></circle>' +
      '<text x="' + cx + '" y="' + (cy - 20 * scale).toFixed(0) + '" text-anchor="middle" class="usp-gauge-num" fill="' + ink + '">' + score + '</text>' +
      '<text x="' + cx + '" y="' + (cy - 4 * scale).toFixed(0) + '" text-anchor="middle" class="usp-gauge-band">' + b + '</text>' +
      '<text x="' + (18 * scale).toFixed(0) + '" y="' + (112 * scale).toFixed(0) + '" class="usp-gauge-end">300</text>' +
      '<text x="' + (182 * scale).toFixed(0) + '" y="' + (112 * scale).toFixed(0) + '" text-anchor="end" class="usp-gauge-end">900</text>' +
      '</svg>';
  }

  function mountScore(root, mode) {
    var mini = mode === 'mini';
    var preset = 'distributor';
    var values = {}; for (var k in PRESETS[preset].v) values[k] = PRESETS[preset].v[k];
    var shown = mini ? ['ccc', 'net_margin', 'top_customer_pct'] : METRICS.map(function (m) { return m[1]; });

    root.innerHTML = '';
    var head = el('div', 'usp-head');
    head.innerHTML = '<div><span class="usp-num">01</span><span class="usp-name">Financial Health Score</span></div>' +
      '<div class="usp-sub">A credit score reads what you borrowed. This reads how you run.</div>';
    root.appendChild(head);

    if (!mini) {
      var presets = el('div', 'usp-presets');
      presets.innerHTML = '<span class="usp-presets-label">Start from</span>' +
        Object.keys(PRESETS).map(function (p, i) {
          return '<button type="button" class="usp-chip' + (i === 0 ? ' is-on' : '') + '" data-preset="' + p + '">' + esc(PRESETS[p].label) + '</button>';
        }).join('');
      root.appendChild(presets);
    }

    var body = el('div', 'usp-score-body' + (mini ? ' is-mini' : ''));
    var left = el('div', 'usp-score-left');
    var right = el('div', 'usp-score-right');
    body.appendChild(left); body.appendChild(right);
    root.appendChild(body);

    function render() {
      var r = computeScore(values);
      left.innerHTML = gaugeSvg(r.score, mini ? 'mini' : 'full') +
        '<div class="usp-comps">' + r.components.map(function (c) {
          var pct = Math.max(0, Math.min(100, c.score || 0));
          var ink = BAND_INK[bandOf(300 + pct * 6)];
          return '<div class="usp-comp"><div class="usp-comp-top"><span>' + esc(c.label) + '</span>' +
            '<span class="usp-comp-val">' + Math.round(pct) + '<i>/100 · wt ' + c.weight + '</i></span></div>' +
            '<div class="usp-comp-bar"><i style="width:' + pct.toFixed(1) + '%;background:' + ink + '"></i></div></div>';
        }).join('') + '</div>';

      if (!mini) {
        var lift = biggestLift(values);
        var note = el('div', 'usp-lift');
        note.innerHTML = lift
          ? '<b>Biggest single lift.</b> Move <b>' + esc(lift.metric[2]) + '</b> from ' + fmt(lift.from, lift.metric[3]) +
            ' to ' + fmt(lift.to, lift.metric[3]) + ' and the score rises <b>' + lift.gain + ' points</b>.'
          : '<b>Nothing left to lift.</b> Every measure is already at the top of its curve.';
        left.appendChild(note);
      }
    }

    function sliders() {
      var html = '';
      COMPONENTS.forEach(function (c) {
        var ms = METRICS.filter(function (m) { return m[0] === c[0] && shown.indexOf(m[1]) > -1; });
        if (!ms.length) return;
        if (!mini) html += '<div class="usp-group">' + esc(c[1]) + '<i>weight ' + c[2] + '</i></div>';
        ms.forEach(function (m) {
          html += '<label class="usp-slider"><span class="usp-slider-top"><span>' + esc(m[2]) + '</span>' +
            '<output data-out="' + m[1] + '">' + fmt(values[m[1]], m[3]) + '</output></span>' +
            '<input type="range" data-m="' + m[1] + '" min="' + m[6][0] + '" max="' + m[6][1] + '" step="' + m[7] + '" value="' + values[m[1]] + '"></label>';
        });
      });
      right.innerHTML = (mini ? '' : '<div class="usp-sliders-head">Sixteen measures, seven parts · scroll for the rest</div>') +
        '<div class="usp-sliders">' + html + '</div>';
    }

    root.addEventListener('input', function (e) {
      var key = e.target.getAttribute && e.target.getAttribute('data-m');
      if (!key) return;
      values[key] = parseFloat(e.target.value);
      var out = root.querySelector('[data-out="' + key + '"]');
      var m = METRICS.filter(function (x) { return x[1] === key; })[0];
      if (out && m) out.textContent = fmt(values[key], m[3]);
      render();
    });

    root.addEventListener('click', function (e) {
      var p = e.target.getAttribute && e.target.getAttribute('data-preset');
      if (!p) return;
      preset = p;
      for (var kk in PRESETS[p].v) values[kk] = PRESETS[p].v[kk];
      Array.prototype.forEach.call(root.querySelectorAll('[data-preset]'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-preset') === p);
      });
      sliders(); render();
    });

    sliders(); render();
  }

  /* -------------------------------------------------------- 02 · industry */

  function mountIndustry(root, mode) {
    var mini = mode === 'mini';
    var pack = 'pharmadist', size = 'small', revenue = 50000000;
    var yours = {};
    function reset() {
      IMETRICS.forEach(function (m) {
        var p = pctl(pack, size, m[0]);
        yours[m[0]] = m[3] === 'up' ? p[1] : m[3] === 'down' ? p[3] : p[2];
      });
    }
    reset();
    // start a little outside on the ones that matter, so the screen has something to say
    yours.dso = Math.round(pctl(pack, size, 'dso')[4] * 1.25);
    yours.top = Math.round(pctl(pack, size, 'top')[4] * 1.05);

    root.innerHTML = '';
    var head = el('div', 'usp-head');
    head.innerHTML = '<div><span class="usp-num">02</span><span class="usp-name">Industry Pack</span></div>' +
      '<div class="usp-sub">Your days and margins against firms of the same industry and size.</div>';
    root.appendChild(head);

    var controls = el('div', 'usp-controls');
    controls.innerHTML =
      '<label class="usp-field"><span>Industry</span><select data-pack>' + PACK_ORDER.map(function (p) {
        return '<option value="' + p + '">' + esc(PACKS[p].name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="usp-field"><span>Size</span><select data-size>' +
        '<option value="micro">Micro</option><option value="small" selected>Small</option><option value="medium">Medium</option>' +
      '</select></label>' +
      (mini ? '' : '<label class="usp-field"><span>Your revenue</span><input type="text" data-rev value="5,00,00,000" inputmode="numeric"></label>');
    root.appendChild(controls);

    var model = el('div', 'usp-model');
    root.appendChild(model);
    var rows = el('div', 'usp-rows');
    root.appendChild(rows);
    var levers = el('div', 'usp-levers');
    if (!mini) root.appendChild(levers);

    function position(v, p) {
      // p10 sits at 8%, p90 at 92%, clamped, so a marker well outside still shows
      var lo = p[0], hi = p[4];
      if (hi === lo) return 50;
      return Math.max(3, Math.min(97, 8 + (v - lo) / (hi - lo) * 84));
    }

    var PRICEABLE = ['dso', 'ccc', 'dio', 'dpo', 'gm', 'ebitda', 'nm', 'opex'];

    /* Returns {v, what} when there is a gap worth money, {none:true} when the
       measure can be priced but sits at or ahead of the median, and null when
       the measure is a ratio with no flow behind it to price. */
    function worth(key, v, p) {
      if (PRICEABLE.indexOf(key) < 0) return null;
      var med = p[2], gm = yours.gm != null ? yours.gm : pctl(pack, size, 'gm')[2];
      var cogs = revenue * (1 - gm / 100);
      var gap, amount, what;
      if (key === 'dso' || key === 'ccc') { gap = v - med; amount = gap / 365 * revenue; what = 'cash tied up above the median'; }
      else if (key === 'dio') { gap = v - med; amount = gap / 365 * cogs; what = 'stock held above the median'; }
      else if (key === 'dpo') { gap = med - v; amount = gap / 365 * cogs; what = 'cash you pay out earlier than peers'; }
      else if (key === 'opex') { gap = v - med; amount = gap / 100 * revenue; what = 'operating cost above the median'; }
      else { gap = med - v; amount = gap / 100 * revenue; what = 'profit a year, at the median margin'; }
      return gap > 0 ? { v: amount, what: what } : { none: true };
    }

    function outside(key, v, p, dir) {
      if (dir === 'up') return v < p[1] ? 'below' : v > p[3] ? 'ahead' : null;
      if (dir === 'down') return v > p[3] ? 'outside' : v < p[1] ? 'ahead' : null;
      return v > p[3] || v < p[1] ? 'outside' : null;
    }

    function render() {
      var P = PACKS[pack];
      model.innerHTML = '<p>' + esc(P.model) + '</p><span class="usp-model-n">Sample percentiles · ' +
        P.n[size] + ' ' + size + ' companies · replaced by live cohort data once 20 books are in</span>';

      var list = mini ? IMETRICS.filter(function (m) { return ['dso', 'ccc', 'ebitda'].indexOf(m[0]) > -1; }) : IMETRICS;
      rows.innerHTML = list.map(function (m) {
        var key = m[0], p = pctl(pack, size, key), v = yours[key];
        var st = outside(key, v, p, m[3]);
        var w = worth(key, v, p);
        var ink = st === 'outside' || st === 'below' ? '#A66312' : st === 'ahead' ? '#157E5C' : '#647688';
        var band10 = position(p[1], p), band90 = position(p[3], p), med = position(p[2], p), me = position(v, p);
        return '<div class="usp-row"' + (mini ? '' : ' data-row="' + key + '"') + '>' +
          '<div class="usp-row-top"><span class="usp-row-label">' + esc(m[1]) +
            (mini ? '' : '<i>' + esc(m[4]) + '</i>') + '</span>' +
          '<span class="usp-row-me" style="color:' + ink + '">' + fmt(v, m[2]) +
            (st ? ' · ' + st : ' · inside') + '</span></div>' +
          '<div class="usp-band">' +
            '<i class="usp-band-fill" style="left:' + band10 + '%;width:' + Math.max(1, band90 - band10) + '%"></i>' +
            '<i class="usp-band-med" style="left:' + med + '%"></i>' +
            '<i class="usp-band-me" style="left:' + me + '%;background:' + ink + '"></i>' +
            (mini ? '' : '<input type="range" class="usp-row-input" data-i="' + key + '" min="' + (p[0] * 0.4).toFixed(2) + '" max="' + (p[4] * 1.8 + 1).toFixed(2) + '" step="' + (m[2] === 'x' ? 0.05 : m[2] === 'd' ? 1 : 0.1) + '" value="' + v + '" aria-label="' + esc(m[1]) + ', drag to change">') +
          '</div>' +
          '<div class="usp-row-foot">' + (mini ? '' : '<span>p25 ' + fmt(p[1], m[2]) + ' · median ' + fmt(p[2], m[2]) + ' · p75 ' + fmt(p[3], m[2]) + '</span>') +
            '<span class="usp-worth">' + (!w ? 'a ratio — no flow behind it to price'
              : w.none ? 'at or ahead of the median' : '<b>' + inr(w.v) + '</b> ' + w.what) + '</span></div>' +
          '</div>';
      }).join('');

      if (!mini) {
        var gaps = IMETRICS.map(function (m) {
          var p = pctl(pack, size, m[0]), w = worth(m[0], yours[m[0]], p);
          return w && !w.none ? { key: m[0], label: m[1], v: w.v, what: w.what } : null;
        }).filter(Boolean).sort(function (a, b) { return b.v - a.v; }).slice(0, 3);
        levers.innerHTML = '<div class="usp-levers-head">What closing the three widest gaps is worth, on the revenue you entered</div>' +
          (gaps.length ? gaps.map(function (g) {
            var lv = (PACKS[pack].levers || {})[g.key] || [];
            return '<div class="usp-lever"><div class="usp-lever-top"><span>' + esc(g.label) + '</span><b>' + inr(g.v) + '</b></div>' +
              '<div class="usp-lever-what">' + esc(g.what) + '</div>' +
              (lv.length ? '<ul>' + lv.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
                : '<div class="usp-lever-what">No standard lever for this one in the pack.</div>') +
              '</div>';
          }).join('') : '<div class="usp-lever-what">Every priced measure is at or ahead of the median. Nothing to close.</div>');
      }
    }

    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-pack')) { pack = t.value; reset(); render(); }
      else if (t.hasAttribute && t.hasAttribute('data-size')) { size = t.value; render(); }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-i')) { yours[t.getAttribute('data-i')] = parseFloat(t.value); render(); }
      else if (t.hasAttribute && t.hasAttribute('data-rev')) {
        var n = parseFloat(String(t.value).replace(/[^0-9.]/g, ''));
        if (!isNaN(n) && n > 0) { revenue = n; render(); }
      }
    });

    render();
  }

  /* -------------------------------------------------------- 03 · calendar */

  function statutoryFor(y, m) {
    var out = [];
    MONTHLY.forEach(function (r) { out.push({ day: r[0], name: r[1], note: r[2], cost: r[3] }); });
    if (ADVANCE_TAX[m]) out.push({ day: 15, name: 'Advance tax instalment', note: ADVANCE_TAX[m][1] + ' of the year’s tax is due.', cost: 'Section 234C charges 1% a month on the shortfall.' });
    (ANNUAL[m] || []).forEach(function (r) {
      var last = new Date(y, m + 1, 0).getDate();
      out.push({ day: Math.min(r[0], last), name: r[1], note: r[2], cost: r[3] });
    });
    return out.sort(function (a, b) { return a.day - b.day; });
  }

  function mountCalendar(root, mode) {
    var mini = mode === 'mini';
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth(), sel = null;

    root.innerHTML = '';
    if (!mini) root.classList.add('usp-cal-full');
    var head = el('div', 'usp-head');
    head.innerHTML = '<div><span class="usp-num">03</span><span class="usp-name">Finance Calendar</span></div>' +
      '<div class="usp-sub">Every due date, bill and receipt on the day it actually lands.</div>';
    root.appendChild(head);

    var nav = el('div', 'usp-cal-nav');
    root.appendChild(nav);
    var grid = el('div', 'usp-cal-grid');
    root.appendChild(grid);
    var ladder = el('div', 'usp-ladder');
    ladder.setAttribute('aria-live', 'polite');
    root.appendChild(ladder);
    var year = el('div', 'usp-year');
    if (!mini) root.appendChild(year);

    function render() {
      var items = statutoryFor(y, m);
      var byDay = {}; items.forEach(function (it) { (byDay[it.day] = byDay[it.day] || []).push(it); });
      var first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, last = new Date(y, m + 1, 0).getDate();
      var today = new Date(); var isThisMonth = today.getFullYear() === y && today.getMonth() === m;

      nav.innerHTML = '<button type="button" class="usp-navbtn" data-step="-1" aria-label="Previous month">‹</button>' +
        '<span class="usp-cal-title">' + MONTH_NAMES[m] + ' ' + y + '</span>' +
        '<button type="button" class="usp-navbtn" data-step="1" aria-label="Next month">›</button>' +
        '<span class="usp-cal-count">' + items.length + ' dated items</span>';

      var cells = '';
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { cells += '<span class="usp-dow">' + d + '</span>'; });
      for (var i = 0; i < lead; i += 1) cells += '<span class="usp-cell is-blank"></span>';
      for (var d = 1; d <= last; d += 1) {
        var on = byDay[d], isToday = isThisMonth && today.getDate() === d;
        cells += '<button type="button" class="usp-cell' + (on ? ' has-due' : '') + (isToday ? ' is-today' : '') +
          (sel === d ? ' is-sel' : '') + '" data-day="' + d + '"' + (on ? '' : ' tabindex="-1"') + '>' +
          '<span class="usp-cell-d">' + d + '</span>' +
          (on ? '<span class="usp-cell-dots">' + on.map(function () { return '<i></i>'; }).join('') + '</span>' : '') +
          '</button>';
      }
      grid.innerHTML = cells;

      var show = sel && byDay[sel] ? byDay[sel] : null;
      if (show) {
        ladder.innerHTML = '<div class="usp-ladder-head">' + sel + ' ' + MONTH_SHORT[m] + ' · ' + show.length + ' item' + (show.length > 1 ? 's' : '') + '</div>' +
          show.map(function (it) {
            return '<div class="usp-ladder-row"><div class="usp-ladder-name">' + esc(it.name) + '</div>' +
              '<div class="usp-ladder-note">' + esc(it.note) + '</div>' +
              '<div class="usp-ladder-cost">' + esc(it.cost) + '</div></div>';
          }).join('');
      } else {
        ladder.innerHTML = '<div class="usp-ladder-head">' + items.length + ' dated items this month</div>' +
          items.map(function (it) {
            return '<div class="usp-ladder-row is-compact"><div class="usp-ladder-name"><b>' + it.day + '</b> ' + esc(it.name) + '</div>' +
              '<div class="usp-ladder-note">' + esc(it.note) + '</div></div>';
          }).join('') +
          '<div class="usp-ladder-foot">Pick a date for what it costs if it slips.</div>';
      }

      if (!mini) {
        var fyStart = m >= 3 ? y : y - 1;
        year.innerHTML = '<div class="usp-year-head">The statutory load across the year, FY ' + fyStart + '–' + String(fyStart + 1).slice(2) + '</div>' +
          '<div class="usp-year-grid">' + Array.apply(null, Array(12)).map(function (_, i) {
            var mm = (3 + i) % 12, yy = fyStart + (mm < 3 ? 1 : 0);
            var n = statutoryFor(yy, mm).length, on = mm === m && yy === y;
            return '<button type="button" class="usp-mon' + (on ? ' is-on' : '') + '" data-mon="' + mm + '" data-yr="' + yy + '">' +
              '<span>' + MONTH_SHORT[mm] + '</span><b>' + n + '</b>' +
              '<i style="height:' + Math.min(100, n * 14) + '%"></i></button>';
          }).join('') + '</div>' +
          '<div class="usp-year-foot">Standard dates under the Act. Extensions, QRMP filers and your own 43B(h) exposure are read off your books in the product.</div>';
      }
    }

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-day],[data-step],[data-mon]') : null;
      if (!t) return;
      if (t.hasAttribute('data-step')) { m += parseInt(t.getAttribute('data-step'), 10); if (m < 0) { m = 11; y -= 1; } if (m > 11) { m = 0; y += 1; } sel = null; }
      else if (t.hasAttribute('data-mon')) { m = parseInt(t.getAttribute('data-mon'), 10); y = parseInt(t.getAttribute('data-yr'), 10); sel = null; }
      else { var d = parseInt(t.getAttribute('data-day'), 10); sel = sel === d ? null : d; }
      render();
    });

    render();
  }

  /* ------------------------------------------------------------------ init */

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-usp]'), function (node) {
      var which = node.getAttribute('data-usp'), mode = node.getAttribute('data-mode') || 'full';
      try {
        if (which === 'score') mountScore(node, mode);
        else if (which === 'industry') mountIndustry(node, mode);
        else if (which === 'calendar') mountCalendar(node, mode);
      } catch (err) {
        node.innerHTML = '<div class="usp-fallback">This panel needs JavaScript. The figures it shows are on the Solutions page.</div>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
