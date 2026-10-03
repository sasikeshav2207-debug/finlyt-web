/* Hero v2 — the failed rewind, in React.
 *
 * The finished hero is already in index.html as plain markup, so the page is
 * complete before this file runs and complete if it never does. React takes the
 * same container over to play the sequence:
 *
 *   1  the headline types in                 "We couldn't build a time machine."
 *   2  a stamp lands on the past             REWIND UNAVAILABLE
 *   3  the headline finishes                 "So we built the next best thing."
 *   4  the weeks ahead fill, one at a time
 *   5  the green-cash line arrives
 *
 * Anyone who has asked for less motion is taken straight to step 5.
 * No figure here is a real one; the panel says so on its face.
 */
(function () {
  'use strict';

  var MOUNT = document.querySelector('[data-hero]');
  if (!MOUNT) return;

  // The static hero already carries the mark. Lift it out before React replaces
  // the container, so the SVG lives in exactly one place.
  var existingMark = MOUNT.querySelector('.mark3d');
  var MARK_SVG = existingMark ? existingMark.innerHTML : '';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- content */

  var LINE_1 = "We couldn't build a time machine.";
  var LINE_2A = 'So we built the ';
  var LINE_2B = 'next best thing';

  var LEDGER = [
    ['TALLY · SALES', '₹ ●,●●,●●●'],
    ['BANK · NEFT IN', '₹ ●●,●●●'],
    ['ZOHO · INVOICE', '₹ ●,●●,●●●'],
    ['TALLY · PURCHASE', '₹ ●,●●,●●●']
  ];

  // week index, weekday index (0 = Mon), kind, label
  var CHIPS = [
    [0, 0, 'in', 'Customer'], [0, 2, 'out', 'Vendor'], [0, 4, 'in', 'Customer'],
    [1, 1, 'stat', 'TDS'], [1, 2, 'in', 'Customer'], [1, 3, 'out', 'Salaries'],
    [2, 0, 'stat', 'GST · 3B'], [2, 1, 'in', 'Customer'], [2, 3, 'out', 'Vendor'], [2, 4, 'in', 'Customer']
  ];

  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  /** The last close most books are actually sitting on: the end of last month. */
  function pastDate() {
    var d = new Date();
    d.setDate(0);
    return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------------------------------------------------------------- the view */

  function build(React, ReactDOM) {
    var h = React.createElement;
    var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

    function Mark3D() {
      var ref = useRef(null);
      useEffect(function () {
        if (REDUCED) return;
        var node = ref.current;
        if (!node) return;
        function move(e) {
          var r = node.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          node.style.setProperty('--my', (x * 46).toFixed(1) + 'deg');
          node.style.setProperty('--mx', (-y * 34 + 6).toFixed(1) + 'deg');
        }
        function leave() { node.style.removeProperty('--mx'); node.style.removeProperty('--my'); }
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerleave', leave);
        return function () { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', leave); };
      }, []);
      return h('span', { className: 'mark3d' + (REDUCED ? '' : ' mark3d-float'), ref: ref,
        dangerouslySetInnerHTML: { __html: MARK_SVG }, 'aria-hidden': 'true' });
    }

    function Hero() {
      // 0 typing one · 1 stamp · 2 typing two · 3 weeks · 4 green · 5 done
      var s = useState(REDUCED ? 5 : 0), phase = s[0], setPhase = s[1];
      var t1 = useState(REDUCED ? LINE_1.length : 0), n1 = t1[0], setN1 = t1[1];
      var t2 = useState(REDUCED ? LINE_2A.length + LINE_2B.length : 0), n2 = t2[0], setN2 = t2[1];
      var w = useState(REDUCED ? 3 : 0), weeks = w[0], setWeeks = w[1];
      var r = useState(0), run = r[0], setRun = r[1];
      var timers = useRef([]);

      function clear() { timers.current.forEach(clearTimeout); timers.current = []; }
      function after(ms, fn) { timers.current.push(setTimeout(fn, ms)); }

      useEffect(function () {
        if (REDUCED) return;
        clear();
        setPhase(0); setN1(0); setN2(0); setWeeks(0);
        var i = 0;
        function typeOne() {
          i += 1; setN1(i);
          if (i < LINE_1.length) after(26, typeOne);
          else after(260, function () {
            setPhase(1);
            after(620, function () {
              setPhase(2);
              var j = 0, total = LINE_2A.length + LINE_2B.length;
              (function typeTwo() {
                j += 1; setN2(j);
                if (j < total) after(26, typeTwo);
                else after(200, function () {
                  setPhase(3);
                  [0, 1, 2].forEach(function (k) { after(260 * k, function () { setWeeks(k + 1); }); });
                  after(260 * 3 + 220, function () { setPhase(4); after(500, function () { setPhase(5); }); });
                });
              })();
            });
          });
        }
        after(420, typeOne);
        return clear;
      }, [run]);

      var typed1 = LINE_1.slice(0, n1);
      var full2 = LINE_2A + LINE_2B;
      var typed2 = full2.slice(0, n2);
      var seg2a = typed2.slice(0, Math.min(n2, LINE_2A.length));
      var seg2b = n2 > LINE_2A.length ? typed2.slice(LINE_2A.length) : '';

      var headline = h('h1', null,
        typed1,
        phase === 0 ? h('span', { className: 'caret' }) : null,
        phase >= 2 ? h('br', null) : null,
        phase >= 2 ? seg2a : null,
        phase >= 2 ? h('span', { className: 'lead' }, seg2b) : null,
        phase >= 2 && n2 >= full2.length ? '.' : null,
        phase === 2 && n2 < full2.length ? h('span', { className: 'caret' }) : null
      );

      var grid = [h('span', { key: 'sp' }, '')];
      DOW.forEach(function (d) { grid.push(h('span', { key: 'd' + d, className: 'hero2-dow' }, d)); });
      [0, 1, 2].forEach(function (wk) {
        grid.push(h('span', { key: 'w' + wk, className: 'hero2-wk' }, 'WEEK ' + (wk + 1)));
        DOW.forEach(function (_, di) {
          var chip = null;
          CHIPS.forEach(function (c) { if (c[0] === wk && c[1] === di) chip = c; });
          grid.push(h('div', {
            key: wk + '-' + di,
            className: 'hero2-cell' + (chip ? ' is-' + chip[2] : '') + (weeks > wk ? ' shown' : '')
          }, chip ? [h('i', { key: 'i', className: 'k-' + (chip[2] === 'stat' ? 'stat' : chip[2]) }),
                     h('span', { key: 's' }, chip[3])] : null));
        });
      });

      return h('div', { className: 'hero2-inner' },
        h('div', null,
          h('span', { className: 'hero2-eyebrow' }, h('i', null), 'Delivering Excellence through FinTelligence'),
          headline,
          h('p', { className: 'hero2-lede' },
            'Your books already hold the weeks ahead: what customers owe, what vendors expect, and when the tax office wants its share. FinLytTech puts it all on a calendar, so you decide before it happens. In business, hindsight is the most expensive way to learn.'),
          h('div', { className: 'hero2-cta' },
            h('a', { className: 'btn-dark', href: '/contact/#demo' }, 'Book a demo on your books'),
            h('a', { className: 'btn-ghost', href: 'https://dashboard.finlyt.net/demo' }, 'See it live')),
          h('div', { className: 'hero2-sources' },
            h('b', null, 'Reads Tally · Zoho · ERPNext · any ERP via API · Excel'), ' · India-hosted, always')
        ),
        h('div', { className: 'hero2-panel' },
          h('div', { className: 'hero2-phead' },
            h('button', { type: 'button', className: 'hero2-rewind', onClick: function () { setRun(run + 1); },
              title: 'Replay', 'aria-label': 'Replay the intro' },
              h('svg', { viewBox: '0 0 24 24', width: 15, height: 15, fill: 'none', stroke: 'currentColor',
                strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
                h('path', { d: 'M11 19 2 12l9-7v14z' }), h('path', { d: 'M22 19l-9-7 9-7v14z' }))),
            h(Mark3D, null),
            h('span', { className: 'hero2-ptitle' }, 'FINANCE CALENDAR'),
            h('span', { className: 'hero2-legend' },
              h('span', null, h('i', { className: 'k-in' }), 'In'),
              h('span', null, h('i', { className: 'k-out' }), 'Out'),
              h('span', null, h('i', { className: 'k-stat' }), 'Statutory'))),
          h('div', { className: 'hero2-pbody' },
            h('div', { className: 'hero2-past' },
              h('div', { className: 'hero2-past-h' }, 'Past'),
              h('div', { className: 'hero2-past-date' }, pastDate()),
              LEDGER.map(function (row, i) {
                return h('div', { key: i, className: 'hero2-row' }, h('b', null, row[0]), h('span', null, row[1]));
              }),
              h('div', { className: 'hero2-hindsight' }, 'hindsight'),
              h('div', { className: 'hero2-stamp' + (phase >= 1 ? ' is-on' : '') }, 'REWIND UNAVAILABLE')),
            h('div', { className: 'hero2-weeks' },
              h('div', { className: 'hero2-today' }, h('b', null, 'TODAY')),
              h('div', { className: 'hero2-weeks-h' }, 'Weeks ahead'),
              h('div', { className: 'hero2-grid' }, grid))),
          h('div', { className: 'hero2-green' + (phase >= 4 ? ' shown' : '') },
            'Green cash available ', h('b', null, '₹ ●●,●●,●●●'), ' · stays spare for ', h('b', null, '●●'), ' weeks'),
          h('div', { className: 'hero2-foot' }, 'illustration · your figures appear here'))
      );
    }

    var root = ReactDOM.createRoot(MOUNT);
    root.render(h(Hero, null));
  }

  /* ------------------------------------------------------------ bring React in */

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function start() {
    if (window.React && window.ReactDOM) { build(window.React, window.ReactDOM); return; }
    load('https://unpkg.com/react@18.3.1/umd/react.production.min.js')
      .then(function () { return load('https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js'); })
      .then(function () { build(window.React, window.ReactDOM); })
      .catch(function () { /* the markup already in the page is the fallback */ });
  }

  // Nothing is gained by racing the first paint; the static hero is already there.
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 200);
})();
