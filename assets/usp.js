/* The three signals, interactive.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE IS PUBLIC. ANYONE CAN READ IT.
 *
 * Nothing from the product's scoring or benchmarking belongs here. Not the
 * real inputs, not the real mapping, not the real comparison data, not the
 * recommendations. Not in code, not in comments, not in the markup it writes.
 *
 * What is here is a coarse demonstration built on textbook endpoints and round
 * numbers. It behaves the way the product behaves. It is not how the product
 * works, and the page says as much to the reader.
 *
 * A model that runs in a browser is a published model. If real figures are
 * ever wanted on this page they must come from an authenticated API call.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  /* The product's own spectrum (apps/proposed/ui.jsx), worst to best. */
  var SPECTRUM = ['#8F1D1D', '#B42318', '#B8480D', '#946200', '#57731A', '#1B7A4E'];

  function ink(v) {
    var n = SPECTRUM.length;
    var i = Math.max(0, Math.min(n - 1, Math.floor((Math.max(0, Math.min(100, v)) / 100) * n)));
    return SPECTRUM[i];
  }

  /* --- 01 score. Seven parts, each a plain ramp between two textbook
     endpoints. Round numbers, chosen to read well, not to be accurate. */
  var PARTS = [
    ['Liquidity', [
      ['Current ratio', 'current_ratio', 'x', 0.8, 2.0, [0.4, 3.2], 0.05, 1.3],
      ['Weeks of payments in cash', 'cash_weeks', 'weeks', 2, 20, [0, 36], 0.5, 5]
    ]],
    ['Leverage', [
      ['Debt to equity', 'debt_equity', 'x', 2.5, 0.2, [0, 4], 0.05, 1.4],
      ['Interest cover', 'interest_cover', 'x', 1, 6, [0, 12], 0.1, 2.6]
    ]],
    ['Profitability', [
      ['Net margin', 'net_margin', '%', -2, 15, [-10, 30], 0.1, 2],
      ['EBITDA margin', 'ebitda_margin', '%', 0, 22, [-5, 40], 0.1, 4]
    ]],
    ['Working capital', [
      ['Cash conversion cycle', 'ccc', 'days', 180, 30, [0, 260], 1, 95],
      ['Debtor days', 'dso', 'days', 150, 30, [0, 200], 1, 86]
    ]],
    ['Collections', [
      ['Receivables past 90 days', 'over_90_pct', '%', 40, 0, [0, 60], 1, 22]
    ]],
    ['Growth', [
      ['Revenue growth', 'revenue_growth', '%', -15, 20, [-30, 45], 0.5, 11]
    ]],
    ['Concentration', [
      ['Largest customer', 'top_customer_pct', '%', 55, 10, [0, 80], 1, 38]
    ]]
  ];

  var SHAPES = {
    'Carrying its customers': { ccc: 110, dso: 95, net_margin: 1.5, ebitda_margin: 3, over_90_pct: 26,
      top_customer_pct: 42, cash_weeks: 4, current_ratio: 1.2, debt_equity: 1.5, interest_cover: 2.3, revenue_growth: 10 },
    'Stock on the floor': { ccc: 135, dso: 80, net_margin: 6, ebitda_margin: 13, over_90_pct: 14,
      top_customer_pct: 29, cash_weeks: 6, current_ratio: 1.5, debt_equity: 1.1, interest_cover: 3.4, revenue_growth: 14 },
    'Collects well': { ccc: 45, dso: 52, net_margin: 12, ebitda_margin: 18, over_90_pct: 5,
      top_customer_pct: 40, cash_weeks: 15, current_ratio: 2.3, debt_equity: 0.2, interest_cover: 9, revenue_growth: 19 }
  };

  function ramp(v, poor, good) {
    if (poor === good) return 50;
    return Math.max(0, Math.min(100, ((v - poor) / (good - poor)) * 100));
  }

  function overall(values) {
    var parts = PARTS.map(function (p) {
      var ms = p[1].map(function (m) { return ramp(values[m[1]], m[3], m[4]); });
      return { label: p[0], score: ms.reduce(function (a, b) { return a + b; }, 0) / ms.length };
    });
    var mean = parts.reduce(function (a, b) { return a + b.score; }, 0) / parts.length;
    return { parts: parts, mean: mean, score: Math.round(300 + 6 * mean) };
  }

  /* --- 02 industry. One generic range, nudged by the picker. */
  var MEASURES = [
    ['Debtor days', 'dso', 'days', 'down', 70, 95],
    ['Inventory days', 'dio', 'days', 'down', 55, 80],
    ['Cash conversion cycle', 'ccc', 'days', 'down', 80, 120],
    ['Gross margin', 'gm', '%', 'up', 30, 22],
    ['EBITDA margin', 'ebitda', '%', 'up', 12, 7],
    ['Largest customer', 'top', '%', 'down', 25, 42]
  ];
  var INDUSTRIES = ['Distribution', 'Manufacturing', 'Services', 'Retail'];
  var SHIFT = { Distribution: 0.85, Manufacturing: 1.15, Services: 0.95, Retail: 0.8 };

  /* --- 03 calendar. The dates are in the Act. The money beside them is an
     illustration, and is labelled as one on screen. */
  var MONTHLY = [[7, 'TDS and TCS deposit', 'out'], [11, 'GSTR-1', 'file'],
    [15, 'PF and ESI', 'out'], [20, 'GSTR-3B', 'out']];
  var ADVANCE_TAX = { 5: '15%', 8: '45%', 11: '75%', 2: '100%' };
  var ANNUAL = { 6: [[31, 'Income tax return']], 8: [[30, 'Tax audit report']],
    9: [[31, 'Income tax return']], 10: [[30, 'Transfer pricing report']], 2: [[31, 'Year end']] };
  var RECEIPTS = [4, 9, 14, 18, 23, 27];
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* --- helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(v, unit) {
    var r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
    return unit === 'x' ? r.toFixed(2) + 'x' : unit === '%' ? r + '%' : r + ' ' + unit;
  }
  function inr(v) {
    var n = Math.round(Math.abs(v));
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L';
    return '₹' + n.toLocaleString('en-IN');
  }

  /* --- 01 widget */
  function gauge(score, mean, size) {
    var W = size === 'mini' ? 200 : 240, s = W / 200;
    var R = 82 * s, cx = 100 * s, cy = 96 * s, n = SPECTRUM.length;
    var ang = function (v) { return Math.PI * (1 - (Math.max(300, Math.min(900, v)) - 300) / 600); };
    var pt = function (a) { return (cx + R * Math.cos(a)).toFixed(1) + ' ' + (cy - R * Math.sin(a)).toFixed(1); };
    var arcs = '';
    for (var i = 0; i < n; i += 1) {
      var f = 300 + (600 / n) * i, t = 300 + (600 / n) * (i + 1);
      var live = score >= f && (score < t || i === n - 1);
      arcs += '<path d="M' + pt(ang(f)) + ' A' + R.toFixed(1) + ' ' + R.toFixed(1) + ' 0 0 1 ' + pt(ang(t)) +
        '" stroke="' + SPECTRUM[i] + '" stroke-width="' + (12 * s).toFixed(1) + '" fill="none" opacity="' + (live ? 1 : 0.25) + '"></path>';
    }
    var a = ang(score), c = ink(mean);
    return '<svg viewBox="0 0 ' + W + ' ' + (112 * s).toFixed(0) + '" class="usp-gauge" role="img" aria-label="Score ' + score + ' of 900">' + arcs +
      '<circle cx="' + (cx + R * Math.cos(a)).toFixed(1) + '" cy="' + (cy - R * Math.sin(a)).toFixed(1) +
        '" r="' + (9 * s).toFixed(1) + '" fill="' + c + '" stroke="#fff" stroke-width="' + (3 * s).toFixed(1) + '"></circle>' +
      '<text x="' + cx + '" y="' + (cy - 14 * s).toFixed(0) + '" text-anchor="middle" class="usp-gauge-num" fill="' + c + '">' + score + '</text>' +
      '<text x="' + (18 * s).toFixed(0) + '" y="' + (108 * s).toFixed(0) + '" class="usp-gauge-end">300</text>' +
      '<text x="' + (182 * s).toFixed(0) + '" y="' + (108 * s).toFixed(0) + '" text-anchor="end" class="usp-gauge-end">900</text>' +
      '</svg>';
  }

  function mountScore(root, mode) {
    var mini = mode === 'mini', values = {};
    PARTS.forEach(function (p) { p[1].forEach(function (m) { values[m[1]] = m[7]; }); });
    var keep = mini ? ['ccc', 'net_margin', 'top_customer_pct'] : null;

    root.innerHTML = '';
    root.appendChild(el('div', 'usp-head', '<div><span class="usp-num">01</span><span class="usp-name">Financial Health Score</span></div>'));

    if (!mini) {
      var shapes = el('div', 'usp-presets');
      shapes.innerHTML = Object.keys(SHAPES).map(function (k, i) {
        return '<button type="button" class="usp-chip' + (i === 0 ? ' is-on' : '') + '" data-shape="' + esc(k) + '">' + esc(k) + '</button>';
      }).join('');
      root.appendChild(shapes);
    }

    var body = el('div', 'usp-score-body' + (mini ? ' is-mini' : ''));
    var left = el('div', 'usp-score-left'), right = el('div', 'usp-score-right');
    body.appendChild(left); body.appendChild(right);
    root.appendChild(body);

    function render() {
      var r = overall(values);
      left.innerHTML = gauge(r.score, r.mean, mini ? 'mini' : 'full') +
        '<div class="usp-comps">' + r.parts.map(function (p) {
          return '<div class="usp-comp"><div class="usp-comp-top"><span>' + esc(p.label) + '</span></div>' +
            '<div class="usp-comp-bar"><i style="width:' + p.score.toFixed(1) + '%;background:' + ink(p.score) + '"></i></div></div>';
        }).join('') + '</div>';
    }

    function sliders() {
      var html = '';
      PARTS.forEach(function (p) {
        var ms = p[1].filter(function (m) { return !keep || keep.indexOf(m[1]) > -1; });
        if (!ms.length) return;
        if (!mini) html += '<div class="usp-group">' + esc(p[0]) + '</div>';
        ms.forEach(function (m) {
          html += '<label class="usp-slider"><span class="usp-slider-top"><span>' + esc(m[0]) + '</span>' +
            '<output data-out="' + m[1] + '">' + fmt(values[m[1]], m[2]) + '</output></span>' +
            '<input type="range" data-m="' + m[1] + '" min="' + m[5][0] + '" max="' + m[5][1] + '" step="' + m[6] + '" value="' + values[m[1]] + '"></label>';
        });
      });
      right.innerHTML = '<div class="usp-sliders">' + html + '</div>';
    }

    root.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-m');
      if (!k) return;
      values[k] = parseFloat(e.target.value);
      var o = root.querySelector('[data-out="' + k + '"]');
      PARTS.forEach(function (p) { p[1].forEach(function (m) { if (m[1] === k && o) o.textContent = fmt(values[k], m[2]); }); });
      render();
    });
    root.addEventListener('click', function (e) {
      var s = e.target.getAttribute && e.target.getAttribute('data-shape');
      if (!s) return;
      for (var k in SHAPES[s]) values[k] = SHAPES[s][k];
      Array.prototype.forEach.call(root.querySelectorAll('[data-shape]'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-shape') === s);
      });
      sliders(); render();
    });

    sliders(); render();
  }

  /* --- 02 widget */
  function mountIndustry(root, mode) {
    var mini = mode === 'mini', industry = 'Distribution', revenue = 50000000, yours = {};
    function reset() { MEASURES.forEach(function (m) { yours[m[1]] = Math.round(m[5] * SHIFT[industry] * 10) / 10; }); }
    reset();

    root.innerHTML = '';
    root.appendChild(el('div', 'usp-head', '<div><span class="usp-num">02</span><span class="usp-name">Industry Pack</span></div>'));

    var controls = el('div', 'usp-controls');
    controls.innerHTML = '<label class="usp-field"><span>Industry</span><select data-ind>' +
      INDUSTRIES.map(function (i) { return '<option>' + i + '</option>'; }).join('') + '</select></label>' +
      (mini ? '' : '<label class="usp-field"><span>Your revenue</span><input type="text" data-rev value="5,00,00,000" inputmode="numeric"></label>');
    root.appendChild(controls);
    var rows = el('div', 'usp-rows');
    root.appendChild(rows);

    function render() {
      var list = mini ? MEASURES.slice(0, 3) : MEASURES;
      rows.innerHTML = list.map(function (m) {
        var mid = m[4] * SHIFT[industry], v = yours[m[1]];
        var lo = mid * 0.72, hi = mid * 1.3, span = hi - lo;
        var pos = Math.max(3, Math.min(97, 10 + ((v - lo) / span) * 80));
        var frac = (v - lo) / span;
        var g = Math.max(0, Math.min(100, (m[3] === 'up' ? frac : 1 - frac) * 100));
        var w = null;
        if (!mini) {
          if (m[2] === 'days' && v > mid) w = ((v - mid) / 365) * revenue;
          else if (m[2] === '%' && m[3] === 'up' && v < mid) w = ((mid - v) / 100) * revenue;
        }
        return '<div class="usp-row">' +
          '<div class="usp-row-top"><span class="usp-row-label">' + esc(m[0]) + '</span>' +
          '<span class="usp-row-me" style="color:' + ink(g) + '">' + fmt(v, m[2]) +
            (v > hi || v < lo ? ' · outside' : ' · inside') + '</span></div>' +
          '<div class="usp-band">' +
            '<i class="usp-band-fill" style="left:10%;width:80%"></i>' +
            '<i class="usp-band-med" style="left:50%"></i>' +
            '<i class="usp-band-me" style="left:' + pos + '%;background:' + ink(g) + '"></i>' +
            (mini ? '' : '<input type="range" class="usp-row-input" data-i="' + m[1] + '" min="' + (lo * 0.5).toFixed(1) +
              '" max="' + (hi * 1.6).toFixed(1) + '" step="' + (m[2] === 'days' ? 1 : 0.1) + '" value="' + v +
              '" aria-label="' + esc(m[0]) + ', drag to change">') +
          '</div>' +
          (mini || !w ? '' : '<div class="usp-row-foot"><span class="usp-worth"><b>' + inr(w) + '</b> against the middle of the band</span></div>') +
          '</div>';
      }).join('');
    }

    root.addEventListener('change', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-ind')) { industry = e.target.value; reset(); render(); }
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

  /* --- 03 widget */
  function monthItems(y, m) {
    var out = [], last = new Date(y, m + 1, 0).getDate();
    MONTHLY.forEach(function (r) { out.push({ day: r[0], name: r[1], kind: r[2] }); });
    if (ADVANCE_TAX[m]) out.push({ day: 15, name: 'Advance tax, ' + ADVANCE_TAX[m] + ' cumulative', kind: 'out' });
    (ANNUAL[m] || []).forEach(function (r) { out.push({ day: Math.min(r[0], last), name: r[1], kind: 'file' }); });
    RECEIPTS.forEach(function (d) { if (d <= last) out.push({ day: d, name: 'Customer receipts', kind: 'in' }); });
    return out.sort(function (a, b) { return a.day - b.day; });
  }

  function mountCalendar(root, mode) {
    var mini = mode === 'mini';
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), sel = null;

    root.innerHTML = '';
    if (!mini) root.classList.add('usp-cal-full');
    root.appendChild(el('div', 'usp-head', '<div><span class="usp-num">03</span><span class="usp-name">Finance Calendar</span></div>'));
    var nav = el('div', 'usp-cal-nav'); root.appendChild(nav);
    var grid = el('div', 'usp-cal-grid'); root.appendChild(grid);
    var side = el('div', 'usp-ladder'); side.setAttribute('aria-live', 'polite'); root.appendChild(side);

    function render() {
      var items = monthItems(y, m), byDay = {};
      items.forEach(function (it) { (byDay[it.day] = byDay[it.day] || []).push(it); });
      var lead = (new Date(y, m, 1).getDay() + 6) % 7, last = new Date(y, m + 1, 0).getDate();
      var today = new Date(), thisMonth = today.getFullYear() === y && today.getMonth() === m;
      var ins = items.filter(function (i) { return i.kind === 'in'; }).length;
      var outs = items.filter(function (i) { return i.kind === 'out'; }).length;
      // the point of the calendar is not only what is due: count the days that
      // are clear, because those are the days cash is free to be put to work
      var clear = 0;
      for (var dd = 1; dd <= last; dd += 1) {
        var o = byDay[dd] || [];
        var due = false;
        o.forEach(function (x) { if (x.kind !== 'in') due = true; });
        if (!due) clear += 1;
      }

      nav.innerHTML = '<button type="button" class="usp-navbtn" data-step="-1" aria-label="Previous month">‹</button>' +
        '<span class="usp-cal-title">' + MONTH_NAMES[m] + ' ' + y + '</span>' +
        '<button type="button" class="usp-navbtn" data-step="1" aria-label="Next month">›</button>' +
        '<span class="usp-cal-legend"><i class="k-in"></i>in<i class="k-out"></i>out<i class="k-file"></i>filing</span>';

      var cells = '';
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { cells += '<span class="usp-dow">' + d + '</span>'; });
      for (var i = 0; i < lead; i += 1) cells += '<span class="usp-cell is-blank"></span>';
      for (var d = 1; d <= last; d += 1) {
        var on = byDay[d] || [];
        var hasOut = false, hasIn = false;
        on.forEach(function (x) { if (x.kind === 'out') hasOut = true; if (x.kind === 'in') hasIn = true; });
        var cls = hasOut ? ' is-out' : hasIn ? ' is-in' : on.length ? ' is-file' : '';
        cells += '<button type="button" class="usp-cell' + cls + (thisMonth && today.getDate() === d ? ' is-today' : '') +
          (sel === d ? ' is-sel' : '') + '"' + (on.length ? ' data-day="' + d + '"' : ' tabindex="-1"') + '>' +
          '<span class="usp-cell-d">' + d + '</span>' +
          (on.length ? '<span class="usp-cell-dots">' + on.map(function (x) { return '<i class="k-' + x.kind + '"></i>'; }).join('') + '</span>' : '') +
          '</button>';
      }
      grid.innerHTML = cells;

      var show = sel && byDay[sel] ? byDay[sel] : null;
      side.innerHTML = '<div class="usp-ladder-head">' + (show ? sel + ' ' + MONTH_SHORT[m] : MONTH_NAMES[m]) + '</div>' +
        (show
          ? show.map(function (it) {
              return '<div class="usp-ladder-row"><div class="usp-ladder-name"><i class="k-' + it.kind + '"></i>' + esc(it.name) + '</div></div>';
            }).join('')
          : '<div class="usp-ladder-row"><div class="usp-ladder-name"><i class="k-in"></i>' + ins + ' days money comes in</div></div>' +
            '<div class="usp-ladder-row"><div class="usp-ladder-name"><i class="k-out"></i>' + outs + ' days money goes out</div></div>' +
            '<div class="usp-ladder-row"><div class="usp-ladder-name"><i class="k-file"></i>' + (items.length - ins - outs) + ' filings</div></div>') +
        '<div class="usp-free"><span>Days with money in and nothing due</span><b>' + clear + ' of ' + last + '</b></div>' +
        '<div class="usp-ladder-foot">Statutory dates are the standard ones. The money beside them is an illustration until your books are connected.</div>';
    }

    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-day],[data-step]') : null;
      if (!t) return;
      if (t.hasAttribute('data-step')) {
        m += parseInt(t.getAttribute('data-step'), 10);
        if (m < 0) { m = 11; y -= 1; }
        if (m > 11) { m = 0; y += 1; }
        sel = null;
      } else {
        var d = parseInt(t.getAttribute('data-day'), 10);
        sel = sel === d ? null : d;
      }
      render();
    });
    render();
  }

  /* --- init */
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-usp]'), function (node) {
      var which = node.getAttribute('data-usp'), mode = node.getAttribute('data-mode') || 'full';
      try {
        if (which === 'score') mountScore(node, mode);
        else if (which === 'industry') mountIndustry(node, mode);
        else if (which === 'calendar') mountCalendar(node, mode);
      } catch (err) {
        node.innerHTML = '<div class="usp-fallback">This panel needs JavaScript.</div>';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
