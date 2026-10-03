/* Hero v2 — the failed rewind, in React.
 *
 * The finished hero is already plain markup in index.html, so the page is
 * complete before this runs and complete if it never does. React takes the same
 * container over to play the sequence.
 *
 * The timings below were measured off the design reference rather than guessed.
 * Words do not type, they rise and fade in one after another; the rewind is
 * attempted and fails; the calendar fills cell by cell while the second line is
 * still arriving.
 *
 *     300ms   line one begins, a word every 85ms
 *     900ms   the rewind is attempted - the button lights, the ledger reels
 *             backwards under motion blur, the date counts back, a playhead
 *             sweeps left across the past
 *    1900ms   the tape runs out and the reel snaps home
 *    1980ms   REWIND UNAVAILABLE lands on the past
 *    2150ms   line two begins, same cadence
 *    2350ms   the weeks fill, a cell every 38ms, overlapping line two
 *    2850ms   the copy, then the buttons, then the connector line
 *    3350ms   the green-cash line
 *
 * One caution for whoever edits this next: verify motion by measuring the
 * property the effect actually uses. An opacity probe is blind to a reel
 * sliding 430px, which is exactly how the rewind went missing the first time.
 *
 * Every step is a CSS transition or keyframe with its own delay, so replaying
 * is a matter of dropping one class and putting it back. Only the counting date
 * needs JavaScript, and it writes straight to the node. Anyone who has asked for
 * less motion gets the finished state, no transitions, and no reel at all.
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

  var T = { line1: 300, word: 85, rewind: 900, rewindDur: 1000, stamp: 1980, line2: 2150,
    chips: 2350, chip: 38, lede: 2850, cta: 3050, src: 3200, green: 3350 };
  var REEL_REPEAT = 5;        // enough rows that the reel never runs out
  var REWIND_FLOOR_MONTHS = 14; // how far back the attempt gets before it gives up

  var LINE_1 = ['We', "couldn't", 'build', 'a', 'time', 'machine.'];
  var LINE_2 = ['So', 'we', 'built', 'the', 'next', 'best', 'thing.'];
  var LEAD_FROM = 4; // "next best thing." carries the accent

  var LEDGER = [
    ['TALLY · SALES', '₹ ●,●●,●●●'],
    ['BANK · NEFT IN', '₹ ●●,●●●'],
    ['ZOHO · INVOICE', '₹ ●,●●,●●●'],
    ['TALLY · PURCHASE', '₹ ●,●●,●●●']
  ];

  // week, weekday (0 = Mon), kind, label — in the order they light up
  var CHIPS = [
    [0, 0, 'in', 'Customer'], [0, 2, 'out', 'Vendor'], [0, 4, 'in', 'Customer'],
    [1, 1, 'stat', 'TDS'], [1, 2, 'in', 'Customer'], [1, 3, 'out', 'Salaries'],
    [2, 0, 'stat', 'GST · 3B'], [2, 1, 'in', 'Customer'], [2, 3, 'out', 'Vendor'], [2, 4, 'in', 'Customer']
  ];

  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function fmt(d) {
    return (d.getDate() < 10 ? '0' : '') + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** The last close most books are actually sitting on: the end of last month. */
  function lastClose() { var d = new Date(); d.setDate(0); return d; }

  /** As far back as the attempt gets before the tape runs out. */
  function floorDate() {
    var d = lastClose();
    d.setMonth(d.getMonth() - REWIND_FLOOR_MONTHS);
    return d;
  }

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
        return function () {
          node.removeEventListener('pointermove', move);
          node.removeEventListener('pointerleave', leave);
        };
      }, []);
      return h('span', { className: 'mark3d' + (REDUCED ? '' : ' mark3d-float'), ref: ref,
        dangerouslySetInnerHTML: { __html: MARK_SVG }, 'aria-hidden': 'true' });
    }

    function Hero() {
      var box = useRef(null);
      var dateRef = useRef(null);
      var raf = useRef(0);

      var reel = [];
      for (var r = 0; r < REEL_REPEAT; r += 1) { reel = reel.concat(LEDGER); }

      /* The date reels backwards while the strip does, accelerating the way a
         tape does, and stops where the attempt gives up. Written straight to
         the node: sixty React renders a second to change one string would be
         a poor trade. */
      function countBack() {
        if (REDUCED || !dateRef.current) return;
        var from = lastClose().getTime(), to = floorDate().getTime();
        var node = dateRef.current, t0 = performance.now();
        cancelAnimationFrame(raf.current);
        node.textContent = fmt(new Date(from));   // a replay starts from today again
        function step(now) {
          var k = (now - t0 - T.rewind) / T.rewindDur;
          if (k < 0) { raf.current = requestAnimationFrame(step); return; }
          if (k >= 1) { node.textContent = fmt(new Date(to)); return; }
          var e = k * k * k;                       // slow, then a rush
          node.textContent = fmt(new Date(from + (to - from) * e));
          raf.current = requestAnimationFrame(step);
        }
        raf.current = requestAnimationFrame(step);
      }

      /* The sequence is pure CSS once is-play is on, so it is driven on the
         node rather than through state. A transition-delay also runs on the way
         out, so a replay has to paint one frame with transitions off first,
         otherwise the hero fades away over three seconds instead of starting
         again. */
      function play() {
        var el = box.current;
        if (!el) return;
        if (REDUCED) { el.classList.remove('is-reset'); el.classList.add('is-play'); return; }
        el.classList.remove('is-play');
        el.classList.add('is-reset');
        void el.offsetWidth;
        requestAnimationFrame(function () {
          el.classList.remove('is-reset');
          el.classList.add('is-play');
          countBack();
        });
      }

      useEffect(function () {
        play();
        return function () { cancelAnimationFrame(raf.current); };
      }, []);

      function word(w, i, group, lead) {
        return h('span', {
          key: group + i, className: 'hw' + (lead ? ' lead' : ''),
          style: REDUCED ? null : { transitionDelay: (T[group] + i * T.word) + 'ms' }
        }, w);
      }

      var headline = h('h1', null,
        h('span', { className: 'hline' }, LINE_1.map(function (w, i) {
          return [word(w, i, 'line1', false), ' '];
        })),
        h('span', { className: 'hline' }, LINE_2.map(function (w, i) {
          return [word(w, i, 'line2', i >= LEAD_FROM), ' '];
        }))
      );

      var grid = [h('span', { key: 'sp' })];
      DOW.forEach(function (d) { grid.push(h('span', { key: 'd' + d, className: 'hero2-dow' }, d)); });
      [0, 1, 2].forEach(function (wk) {
        grid.push(h('span', { key: 'w' + wk, className: 'hero2-wk' }, 'WEEK ' + (wk + 1)));
        DOW.forEach(function (_, di) {
          var chip = null;
          CHIPS.forEach(function (c) { if (c[0] === wk && c[1] === di) chip = c; });
          grid.push(h('div', {
            key: wk + '-' + di,
            className: 'hero2-cell' + (chip ? ' is-' + chip[2] : ''),
            style: REDUCED ? null : { transitionDelay: (T.chips + (wk * 6 + di) * T.chip) + 'ms' }
          }, chip ? [h('i', { key: 'i', className: 'k-' + chip[2] }), h('span', { key: 's' }, chip[3])] : null));
        });
      });

      return h('div', {
        className: 'hero2-inner hero2-anim is-reset',
        ref: box
      },
        h('div', null,
          h('span', { className: 'hero2-eyebrow' }, h('i', null), 'Delivering Excellence through FinTelligence'),
          headline,
          h('p', { className: 'hero2-lede hero2-rise', style: REDUCED ? null : { transitionDelay: T.lede + 'ms' } },
            'Your books already hold the weeks ahead: what customers owe, what vendors expect, and when the tax office wants its share. FinLytTech puts it all on a calendar, so you decide before it happens. In business, hindsight is the most expensive way to learn.'),
          h('div', { className: 'hero2-cta hero2-rise', style: REDUCED ? null : { transitionDelay: T.cta + 'ms' } },
            h('a', { className: 'btn-dark', href: '/contact/#demo' }, 'Book a demo on your books'),
            h('a', { className: 'btn-ghost', href: 'https://dashboard.finlyt.net/demo' }, 'See it live')),
          h('div', { className: 'hero2-sources hero2-rise', style: REDUCED ? null : { transitionDelay: T.src + 'ms' } },
            h('b', null, 'Reads Tally · Zoho · ERPNext · any ERP via API · Excel'), ' · India-hosted, always')
        ),
        h('div', { className: 'hero2-panel' },
          h('div', { className: 'hero2-phead' },
            h('button', { type: 'button', className: 'hero2-rewind', onClick: play,
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
              h('div', { className: 'hero2-past-date', ref: dateRef }, fmt(lastClose())),
              h('div', { className: 'hero2-reelbox' },
                h('div', { className: 'hero2-reel' },
                  reel.map(function (row, i) {
                    return h('div', { key: i, className: 'hero2-row' }, h('b', null, row[0]), h('span', null, row[1]));
                  }))),
              h('i', { className: 'hero2-head', 'aria-hidden': 'true' }),
              h('div', { className: 'hero2-hindsight' }, 'hindsight'),
              h('div', { className: 'hero2-stamp',
                style: REDUCED ? null : { transitionDelay: T.stamp + 'ms' } }, 'REWIND UNAVAILABLE')),
            h('div', { className: 'hero2-weeks' },
              h('div', { className: 'hero2-today' }, h('b', null, 'TODAY')),
              h('div', { className: 'hero2-weeks-h' }, 'Weeks ahead'),
              h('div', { className: 'hero2-grid' }, grid))),
          h('div', { className: 'hero2-green', style: REDUCED ? null : { transitionDelay: T.green + 'ms' } },
            'Green cash available ', h('b', null, '₹ ●●,●●,●●●'), ' · stays spare for ', h('b', null, '●●'), ' weeks'),
          h('div', { className: 'hero2-foot' }, 'illustration · your figures appear here'))
      );
    }

    ReactDOM.createRoot(MOUNT).render(h(Hero, null));
  }

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
