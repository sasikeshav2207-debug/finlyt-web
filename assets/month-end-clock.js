/* ==========================================================================
   FinLytTech · Month-End Clock
   Full calculator on /month-end-clock/ ([data-mec-full]) and the compact
   version on the home page ([data-mec-mini]).

   Maths (shown to visitors in "How we calculate"):
     day cost        = monthly CTC x employer-cost multiplier / working days in the month
     monthly value   = sum over roles of (day cost x days on the pack)
     days back       = every day except review and sign-off, which stays with the team
                       (the most senior role keeps one review day; optionally every role does)
     annual          = monthly x 12
   Every input is the visitor's. FinLytTech supplies no time or savings estimate.
   ========================================================================== */
(function () {
  "use strict";

  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ formatting */
  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function inrShort(n) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " crore";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " lakh";
    return inr(n);
  }
  function days(n) { return (Math.round(n * 10) / 10).toString().replace(/\.0$/, ""); }
  function parseMoney(s) { var v = parseFloat(String(s).replace(/[^0-9.]/g, "")); return isFinite(v) ? v : 0; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function initials(t) {
    var w = String(t).trim().split(/\s+/).filter(Boolean);
    if (!w.length) return "?";
    if (/^[A-Z]{2,4}$/.test(w[0])) return w[0];
    return (w[0][0] + (w[1] ? w[1][0] : "")).toUpperCase();
  }

  function countUp(el, to, f) {
    if (!el) return;
    var from = parseFloat(el.getAttribute("data-val") || "0");
    el.setAttribute("data-val", String(to));
    if (RM || from === to) { el.textContent = f(to); return; }
    var t0 = null, dur = 600;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = f(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* --------------------------------------------------------------- presets */
  var PRESETS = {
    finance: {
      rolesLabel: "Who builds the monthly pack?",
      addLabel: "+ Add a role",
      newRole: "Accounts Executive",
      roles: [
        { title: "Manager Accounts", ctc: 75000, days: 10 },
        { title: "Senior Manager Accounts", ctc: 100000, days: 3 },
        { title: "DGM Finance", ctc: 250000, days: 1 }
      ],
      groups: [
        { name: "Cashflow Analytics", href: "/products/#cashflow-analytics", sol: "cf", tasks: [
          ["pull", "Pulling ledgers from Tally, Zoho and the banks", "Pulling ledgers"],
          ["recon", "Bank and party reconciliations", "Reconciling"],
          ["ageing", "Receivables and payables ageing", "Ageing debtors"],
          ["cash", "Cash position and how long it lasts", "Cash and runway"],
          ["dues", "Statutory dues by date", "Dues by date"]
        ] },
        { name: "Business Decisions", href: "/products/#business-decisions", sol: "bd", tasks: [
          ["pnl", "P&L and variance commentary", "Variance notes"],
          ["conc", "Customer and vendor concentration", "Concentration"],
          ["proj", "Cash projection for the coming weeks", "Cash projection"],
          ["pack", "The promoter or board pack", "Board pack"]
        ] }
      ],
      chips: ["Collections follow-up", "Vendor and pricing negotiation", "Cash and funding planning", "Bank and lender conversations", "Partnering with sales and operations", "Audit readiness", "Developing the team"],
      short: { "Collections follow-up": "Collections", "Vendor and pricing negotiation": "Vendor terms", "Cash and funding planning": "Cash planning", "Bank and lender conversations": "Lender talks", "Partnering with sales and operations": "Sales and ops", "Audit readiness": "Audit prep", "Developing the team": "Team coaching" },
      clients: false
    },
    ca: {
      rolesLabel: "Who builds client MIS in your firm?",
      addLabel: "+ Add a role",
      newRole: "Article Assistant",
      roles: [
        { title: "Senior Associate", ctc: 50000, days: 12 },
        { title: "Manager", ctc: 100000, days: 6 },
        { title: "Partner", ctc: 300000, days: 2 }
      ],
      groups: [
        { name: "Cashflow Analytics", href: "/products/#cashflow-analytics", sol: "cf", tasks: [
          ["chase", "Chasing client data and ledgers", "Chasing data"],
          ["import", "Importing books per client", "Imports"],
          ["recon", "Client reconciliations", "Reconciling"],
          ["cash", "Ageing and cash position per client", "Ageing and cash"]
        ] },
        { name: "Business Decisions", href: "/products/#business-decisions", sol: "bd", tasks: [
          ["build", "Building the MIS pack in Excel", "MIS build"],
          ["notes", "Variance commentary per client", "Commentary"],
          ["send", "Formatting and sending", "Send-out"]
        ] }
      ],
      chips: ["Client advisory", "Tax planning", "New client onboarding", "Planning conversations with clients", "Audit and assurance", "Growing the practice"],
      short: { "Client advisory": "Advisory", "Tax planning": "Tax planning", "New client onboarding": "New clients", "Planning conversations with clients": "Client planning", "Audit and assurance": "Assurance", "Growing the practice": "Practice growth" },
      clients: true
    }
  };

  var SOL = {
    cf: { name: "Cashflow Analytics", price: 1000, href: "/products/#cashflow-analytics" },
    bd: { name: "Business Decisions", price: 5000, href: "/products/#business-decisions" }
  };

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /* ================================================================ FULL */
  function initFull(root) {
    var state;
    var prevWork = {};

    function fresh(mode, seed) {
      var p = PRESETS[mode];
      var checked = {};
      p.groups.forEach(function (g) { g.tasks.forEach(function (t) { checked[t[0]] = true; }); });
      state = {
        mode: mode,
        roles: seed || p.roles.map(function (r) { return { title: r.title, ctc: r.ctc, days: r.days }; }),
        checked: checked,
        wd: 22, mult: 1, perRole: false,
        clients: 15,
        run: false, year: false,
        chips: p.chips.slice(0, 3)
      };
      prevWork = {};
    }

    /* ---- seed from the home-page mini calculator (?role=&ctc=&days=) */
    var qs = new URLSearchParams(window.location.search);
    var startMode = window.location.hash === "#ca" ? "ca" : "finance";
    var seed = null;
    if (qs.get("ctc") && qs.get("days") && startMode === "finance") {
      seed = [{ title: qs.get("role") || "Your finance lead", ctc: parseMoney(qs.get("ctc")), days: Math.min(15, Math.max(0.5, parseFloat(qs.get("days")) || 10)) }];
    }
    fresh(startMode, seed);

    /* ---- the math */
    function compute() {
      var anyTask = Object.keys(state.checked).some(function (k) { return state.checked[k]; });
      var roles = state.roles.map(function (r, i) {
        var dc = (r.ctc * state.mult) / state.wd;
        return { i: i, r: r, dayCost: dc, days: Math.max(0, r.days) };
      });
      var active = roles.filter(function (x) { return x.days > 0; });
      var senior = active.slice().sort(function (a, b) { return b.r.ctc - a.r.ctc; })[0];
      var junior = active.slice().sort(function (a, b) { return a.r.ctc - b.r.ctc; })[0];
      roles.forEach(function (x) {
        if (!anyTask) x.kept = x.days;
        else if (state.perRole || x === senior) x.kept = Math.min(1, x.days);
        else x.kept = 0;
        x.ret = x.days - x.kept;
      });
      var monthly = 0, back = 0, total = 0, ret = 0;
      roles.forEach(function (x) { monthly += x.dayCost * x.days; back += x.dayCost * x.ret; total += x.days; ret += x.ret; });
      var bd = PRESETS[state.mode].groups.filter(function (g) { return g.sol === "bd"; })[0];
      var usesBD = bd.tasks.some(function (t) { return state.checked[t[0]]; });
      return { roles: roles, active: active, senior: senior, junior: junior, monthly: monthly, back: back, total: total, ret: ret, anyTask: anyTask, sol: usesBD ? "bd" : "cf" };
    }

    /* ---- the calendar */
    function calendar(c) {
      var now = new Date();
      var y = now.getFullYear(), m = now.getMonth() + 1;
      if (m > 11) { m = 0; y += 1; }
      var closing = MONTHS[now.getMonth()];
      var first = new Date(y, m, 1), nDays = new Date(y, m + 1, 0).getDate();
      var satCount = 0, work = [], cells = [];
      var lead = (first.getDay() + 6) % 7; // Monday-first
      for (var b = 0; b < lead; b++) cells.push({ blank: true });
      for (var d = 1; d <= nDays; d++) {
        var dow = new Date(y, m, d).getDay();
        if (dow === 6) satCount++;
        var on = dow !== 0 && (dow !== 6 || state.wd >= 26 || (state.wd === 24 && satCount % 2 === 1));
        var cell = { d: d, dow: dow, working: on };
        if (on) work.push(cell);
        cells.push(cell);
      }
      // place roles: the most junior starts on day one; everyone else finishes on the last day of the window
      var W = 0;
      c.active.forEach(function (x) { W = Math.max(W, Math.ceil(x.days)); });
      W = Math.min(W, work.length);
      c.active.forEach(function (x) {
        var n = Math.min(Math.ceil(x.days), W);
        var start = x === c.junior ? 0 : W - n;
        var keptSlots = Math.ceil(x.kept);
        for (var k = 0; k < n; k++) {
          var cell = work[start + k];
          if (!cell) continue;
          (cell.who = cell.who || []).push(x);
          if (k >= n - keptSlots) (cell.keep = cell.keep || []).push(x);
        }
      });
      var tasks = [];
      PRESETS[state.mode].groups.forEach(function (g) { g.tasks.forEach(function (t) { if (state.checked[t[0]]) tasks.push(t[2]); }); });
      if (!tasks.length) tasks = ["By hand"];
      var workCells = work.slice(0, W).filter(function (x) { return !x.keep; });
      workCells.forEach(function (cell, idx) {
        cell.task = tasks[Math.min(tasks.length - 1, Math.floor(idx / Math.max(1, workCells.length) * tasks.length))];
      });
      var chips = state.chips.length ? state.chips : ["Time back"];
      var gi = 0;
      work.slice(0, W).forEach(function (cell) {
        if (cell.keep) { cell.task = "Review, sign-off"; cell.after = "Review, sign-off"; }
        else { var full = chips[gi % chips.length]; cell.after = (PRESETS[state.mode].short || {})[full] || full; gi++; }
      });
      return { cells: cells, title: "Closing " + closing + " · " + MONTHS[m] + " " + y, W: W, closingIdx: now.getMonth(), closingYear: now.getFullYear() };
    }

    /* ---- skeleton */
    root.innerHTML =
      '<div class="mec-bar">' +
        '<div class="mec-tabs" role="tablist" aria-label="Who is this for">' +
          '<button type="button" class="mec-tab" role="tab" data-mode="finance">Finance team</button>' +
          '<button type="button" class="mec-tab" role="tab" data-mode="ca">CA firm</button>' +
        "</div>" +
        '<div class="mec-steps" aria-hidden="true">' +
          '<span class="mec-step" data-step="1"><b>1</b>Your month</span>' +
          '<span class="mec-step" data-step="2"><b>2</b>On FinLytTech</span>' +
          '<span class="mec-step" data-step="3"><b>3</b>The year</span>' +
        "</div>" +
      "</div>" +
      '<div class="mec-grid">' +
        "<div>" +
          '<div class="mec-row-head"><h3 class="mec-h3" data-el="rolesLabel"></h3><span class="mec-hint">monthly CTC · days a month</span></div>' +
          '<span class="mec-example">Example figures. Change them to yours.</span>' +
          '<div data-el="clients" style="display:none;margin:0 0 12px" class="mec-role"><div class="mec-slider-top"><label class="mec-lbl" for="mecClients" style="margin:0">Clients on a monthly MIS pack</label><b data-el="clientsVal"></b></div><input type="range" id="mecClients" min="1" max="120" step="1" data-el="clientsRange"></div>' +
          '<div class="mec-roles" data-el="roles"></div>' +
          '<button type="button" class="mec-add" data-el="add" style="margin-top:10px"></button>' +
          '<div class="mec-tasks"><div class="mec-row-head" style="margin:0"><h3 class="mec-h3">What goes into the pack?</h3><span class="mec-hint">untick what you don\'t do</span></div><div data-el="groups"></div></div>' +
          '<details class="mec-settings"><summary>How we calculate <span class="mec-hint">settings</span></summary>' +
            '<div class="mec-set-grid">' +
              '<div class="mec-field"><label for="mecWd">Working days in a month</label><select id="mecWd" class="mec-select" data-el="wd"><option value="22">22 · Monday to Friday</option><option value="24">24 · alternate Saturdays</option><option value="26">26 · Monday to Saturday</option></select></div>' +
              '<div class="mec-field"><label for="mecMult">Employer cost multiplier</label><div class="mec-money"><span>×</span><input id="mecMult" inputmode="decimal" data-el="mult" value="1.0" aria-describedby="mecMultHelp"></div><div id="mecMultHelp" class="mec-hint" style="margin-top:4px">1.0 uses CTC as it is. Raise it to include seat cost.</div></div>' +
              '<label class="mec-toggle"><input type="checkbox" data-el="perRole"><span>Every role also reviews its own section. Each keeps one review day.</span></label>' +
              '<p class="mec-formula">Day cost = monthly CTC × multiplier ÷ working days<br>Value per month = Σ (day cost × days on the pack)<br>Days back = every day except review and sign-off, which stays with your team<br>Per year = per month × 12</p>' +
            "</div>" +
          "</details>" +
        "</div>" +
        '<div class="mec-card" data-el="card">' +
          '<div class="mec-sweep"></div>' +
          '<div class="mec-card-head"><span class="mec-dot"></span><span class="mec-card-title" data-el="calTitle"></span><span class="mec-card-meta" data-el="calMeta"></span></div>' +
          '<div class="mec-legend"><span><i style="background:var(--amber-50);border:1px solid rgba(239,159,39,.55)"></i>On the pack</span><span><i style="background:var(--emerald-50);border:1px solid rgba(29,158,117,.5)"></i>Given back</span><span><i style="background:#fff;border:1.5px solid var(--brand-navy)"></i>Review, sign-off</span></div>' +
          '<div class="mec-cal"><div class="mec-wk"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div class="mec-days" data-el="days"></div></div>' +
          '<div class="mec-empty" data-el="empty">Tick at least one task the pack involves, and the clock can show what comes back.</div>' +
          '<div class="mec-sticky-sum" style="background:#fff"><div class="mec-results" aria-live="polite" data-el="results">' +
            '<div class="mec-res"><div class="k" data-el="k1"></div><div class="v" data-el="v1">₹0</div><div class="s" data-el="s1"></div></div>' +
            '<div class="mec-res"><div class="k" data-el="k2"></div><div class="v" data-el="v2">₹0</div><div class="s" data-el="s2"></div></div>' +
          "</div>" +
          '<div class="mec-perclient" data-el="perClient"></div>' +
          '<div class="mec-actions" data-el="actions"></div></div>' +
        "</div>" +
      "</div>" +
      '<section class="mec-year" data-el="year" aria-labelledby="mecYearH">' +
        '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:18px"><h2 id="mecYearH" style="font:600 34px/1.12 var(--font-display);letter-spacing:-.024em;color:var(--ink);margin:0">What do the next twelve closes give back?</h2><span class="mec-hint" data-el="yearMeta" style="margin-left:auto"></span></div>' +
        '<div class="mec-months" data-el="months"></div>' +
        '<div class="mec-year-grid">' +
          '<div><h3 class="mec-h3" style="font-size:18px">Where should those days go?</h3><p style="font:400 14px/1.6 var(--font-sans);color:var(--fg-2);margin:8px 0 0">Pick up to three. The green days on the calendar relabel to match, and the days split evenly between them.</p><div class="mec-chips" data-el="chips"></div></div>' +
          '<div class="mec-panel" aria-live="polite">' +
            '<div class="mec-panel-top"><div><div class="k">Given back each year</div><div class="big g" data-el="yDays">0 days</div></div><div><div class="k">Value of that senior time</div><div class="big" data-el="yVal">₹0</div></div></div>' +
            '<div class="mec-split" data-el="split"></div>' +
            '<div class="mec-rec" data-el="rec"></div>' +
            '<div class="note">Everyone keeps their seat. The pack stops eating their month.</div>' +
          "</div>" +
        "</div>" +
      "</section>" +
      '<p class="mec-foot">These are your figures. FinLytTech does not estimate your team\'s time; you do. Review and sign-off stay with your team, and everything else is prepared from your books, with every figure traced back to a posted voucher. A demo on your own books shows how much of your pack that covers.</p>';

    var el = {};
    Array.prototype.forEach.call(root.querySelectorAll("[data-el]"), function (n) { el[n.getAttribute("data-el")] = n; });

    /* ---- roles list */
    function renderRoles() {
      var p = PRESETS[state.mode];
      el.rolesLabel.textContent = p.rolesLabel;
      el.add.textContent = p.addLabel;
      el.clients.style.display = p.clients ? "block" : "none";
      el.clientsRange.value = state.clients;
      el.clientsVal.textContent = state.clients;
      el.roles.innerHTML = state.roles.map(function (r, i) {
        return '<div class="mec-role" data-i="' + i + '">' +
          '<div class="mec-role-top"><span class="mec-av" data-av>' + esc(initials(r.title)) + '</span>' +
            '<input class="mec-role-name" data-f="title" value="' + esc(r.title) + '" aria-label="Role title">' +
            '<span class="mec-day-rate" data-rate></span>' +
            (state.roles.length > 1 ? '<button type="button" class="mec-x" data-f="remove" aria-label="Remove ' + esc(r.title) + '">×</button>' : "") +
          "</div>" +
          '<div class="mec-role-body">' +
            '<div class="mec-field"><label for="mecCtc' + i + '">Monthly CTC</label><div class="mec-money"><span>₹</span><input id="mecCtc' + i + '" inputmode="numeric" data-f="ctc" value="' + Math.round(r.ctc).toLocaleString("en-IN") + '"></div></div>' +
            '<div><div class="mec-slider-top"><label class="mec-lbl" for="mecDays' + i + '" style="margin:0">Days on the pack, each month</label><b data-daysv>' + days(r.days) + " d</b></div>" +
            '<input type="range" id="mecDays' + i + '" min="0" max="15" step="0.5" value="' + r.days + '" data-f="days"></div>' +
          "</div></div>";
      }).join("");
    }

    function renderGroups() {
      var p = PRESETS[state.mode];
      el.groups.innerHTML = p.groups.map(function (g) {
        return '<div class="mec-group"><div class="mec-group-h"><a href="' + g.href + '">' + g.name + "</a><i>₹" + SOL[g.sol].price.toLocaleString("en-IN") + " per login / month</i></div>" +
          '<div class="mec-checks">' + g.tasks.map(function (t) {
            return '<label class="mec-check"><input type="checkbox" data-task="' + t[0] + '"' + (state.checked[t[0]] ? " checked" : "") + "><span>" + esc(t[1]) + "</span></label>";
          }).join("") + "</div></div>";
      }).join("");
    }

    function renderChips() {
      var p = PRESETS[state.mode];
      el.chips.innerHTML = p.chips.map(function (c) {
        var on = state.chips.indexOf(c) > -1;
        return '<button type="button" class="mec-chip" aria-pressed="' + on + '" data-chip="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
    }

    /* ---- main render */
    function render(opts) {
      opts = opts || {};
      var c = compute();
      var cal = calendar(c);

      // tabs and steps
      Array.prototype.forEach.call(root.querySelectorAll(".mec-tab"), function (t) { t.setAttribute("aria-selected", t.getAttribute("data-mode") === state.mode ? "true" : "false"); });
      var step = state.year ? 3 : state.run ? 2 : 1;
      Array.prototype.forEach.call(root.querySelectorAll(".mec-step"), function (s) {
        var n = +s.getAttribute("data-step");
        s.classList.toggle("is-on", n === step);
        s.classList.toggle("is-done", n < step);
      });

      // role day-rates and avatars
      Array.prototype.forEach.call(el.roles.querySelectorAll(".mec-role"), function (card) {
        var x = c.roles[+card.getAttribute("data-i")];
        if (!x) return;
        card.querySelector("[data-rate]").textContent = inr(x.dayCost) + " / working day";
        card.querySelector("[data-av]").textContent = initials(x.r.title);
        card.querySelector("[data-daysv]").textContent = days(x.days) + " d";
      });

      // calendar
      el.calTitle.textContent = cal.title;
      el.calMeta.textContent = days(c.total) + " person-days" + (state.mode === "ca" ? " · all clients" : "");
      var html = "", flipIdx = 0, newWork = {};
      cal.cells.forEach(function (cell) {
        if (cell.blank) { html += '<div class="mec-cell is-blank"></div>'; return; }
        if (!cell.working) { html += '<div class="mec-cell off"><div class="mec-flip"><div class="mec-face front"><span class="d">' + cell.d + "</span></div></div></div>"; return; }
        if (!cell.who) { html += '<div class="mec-cell"><div class="mec-flip"><div class="mec-face front"><span class="d">' + cell.d + "</span></div></div></div>"; return; }
        newWork[cell.d] = 1;
        var cls = "mec-cell work " + (cell.keep ? "review" : "back") + (state.run ? " flipped" : "") + (!prevWork[cell.d] && !state.run ? " fill" : "");
        var who = '<span class="who">' + cell.who.map(function (x) { return "<em>" + esc(initials(x.r.title)) + "</em>"; }).join("") + "</span>";
        var aria = cell.d + " " + MONTHS[(cal.closingIdx + 1) % 12] + ": " + (state.run ? cell.after : cell.task) + ", " + cell.who.map(function (x) { return x.r.title; }).join(", ");
        html += '<div class="' + cls + '" style="--i:' + flipIdx + '" role="img" aria-label="' + esc(aria) + '"><div class="mec-flip" style="transition-delay:' + (opts.animateFlip ? flipIdx * 40 : 0) + 'ms">' +
          '<div class="mec-face front"><span class="d">' + cell.d + "</span>" + who + '<span class="t">' + esc(cell.task) + "</span></div>" +
          '<div class="mec-face mec-back"><span class="d">' + cell.d + "</span>" + who + '<span class="t">' + esc(cell.after) + "</span></div>" +
        "</div></div>";
        flipIdx++;
      });
      if (opts.animateFlip && !RM) {
        // render unflipped, then flip on the next frame so the stagger plays
        el.days.innerHTML = html.replace(/ flipped/g, "");
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          Array.prototype.forEach.call(el.days.querySelectorAll(".mec-cell.work"), function (n) { n.classList.add("flipped"); });
        }); });
        el.card.classList.remove("sweeping"); void el.card.offsetWidth; el.card.classList.add("sweeping");
      } else if (opts.animateUnflip && !RM) {
        el.days.innerHTML = html.replace(/ flipped/g, "") ;
        Array.prototype.forEach.call(el.days.querySelectorAll(".mec-cell.work"), function (n) {
          n.classList.add("flipped"); n.querySelector(".mec-flip").style.transition = "none";
        });
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          Array.prototype.forEach.call(el.days.querySelectorAll(".mec-cell.work"), function (n, k) {
            var f = n.querySelector(".mec-flip"); f.style.transition = ""; f.style.transitionDelay = (k * 25) + "ms"; n.classList.remove("flipped");
          });
        }); });
      } else {
        el.days.innerHTML = html;
      }
      prevWork = newWork;
      el.card.classList.toggle("is-run", state.run);
      el.empty.style.display = c.anyTask ? "none" : "block";

      // results
      if (!state.run) {
        el.k1.textContent = "Senior time on the pack, per month";
        countUp(el.v1, c.monthly, inr);
        el.s1.textContent = days(c.total) + " person-days a month";
        el.k2.textContent = "Per year";
        countUp(el.v2, c.monthly * 12, inrShort);
        el.s2.textContent = days(c.total * 12) + " person-days a year";
      } else {
        el.k1.textContent = "Back in your month";
        countUp(el.v1, c.back, inr);
        el.s1.textContent = "review and sign-off stay with your team";
        el.k2.textContent = "Days returned";
        el.v2.setAttribute("data-val", "0");
        el.v2.textContent = days(c.ret) + " of " + days(c.total);
        el.s2.textContent = "person-days a month";
      }
      if (state.mode === "ca" && state.clients > 0) {
        el.perClient.style.display = "block";
        el.perClient.textContent = state.run
          ? inr(c.back / state.clients) + " of partner and team time back per client, per month · " + state.clients + " clients"
          : inr(c.monthly / state.clients) + " of team time per client, per month · " + state.clients + " clients";
      } else el.perClient.style.display = "none";

      // actions
      el.actions.innerHTML = !state.run
        ? '<button type="button" class="mec-btn" data-act="run"' + (c.anyTask && c.total > 0 ? "" : " disabled") + ">Run it on FinLytTech →</button><span class=\"mec-cap\">Capacity only · nobody is replaced</span>"
        : '<button type="button" class="mec-btn green" data-act="year">' + (state.year ? "See the year ↓" : "See the year →") + '</button><button type="button" class="mec-btn ghost" data-act="edit">← Edit the inputs</button><span class="mec-cap">Capacity only · nobody is replaced</span>';

      // year
      el.year.classList.toggle("is-open", state.year);
      if (state.year) renderYear(c, cal);
    }

    function renderYear(c, cal) {
      var out = "";
      for (var k = 0; k < 12; k++) {
        var mi = (cal.closingIdx + k) % 12;
        var yy = cal.closingYear + Math.floor((cal.closingIdx + k) / 12);
        out += '<div class="mec-month"><div class="m">' + MONTHS[mi].slice(0, 3) + " " + String(yy).slice(2) + '</div><div class="dd">' + days(c.ret * (k + 1)) + ' d</div><div class="rr">' + inrShort(c.back * (k + 1)) + '</div><span class="bar" data-w="' + ((k + 1) / 12 * 100) + '"></span></div>';
      }
      el.months.innerHTML = out;
      el.yearMeta.textContent = "Closes of " + MONTHS[cal.closingIdx].slice(0, 3) + " " + cal.closingYear + " to " + MONTHS[(cal.closingIdx + 11) % 12].slice(0, 3) + " " + (cal.closingYear + Math.floor((cal.closingIdx + 11) / 12)) + " · cumulative";
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(el.months.querySelectorAll(".bar"), function (b, i) { b.style.transitionDelay = (RM ? 0 : i * 45) + "ms"; b.style.width = b.getAttribute("data-w") + "%"; });
      });
      countUp(el.yDays, c.ret * 12, function (v) { return days(v) + " days"; });
      countUp(el.yVal, c.back * 12, inrShort);

      var chips = state.chips.length ? state.chips : ["Time back"];
      var per = (c.ret * 12) / chips.length;
      el.split.innerHTML = chips.map(function (ch) {
        return '<div><div class="row"><span>' + esc(ch) + "</span><span>" + days(per) + ' days / yr</span></div><div class="track"><i style="width:0" data-w="' + (100 / chips.length) + '"></i></div></div>';
      }).join("");
      requestAnimationFrame(function () { Array.prototype.forEach.call(el.split.querySelectorAll("i"), function (i) { i.style.width = i.getAttribute("data-w") + "%"; }); });

      var s = SOL[c.sol];
      var n = Math.max(1, c.active.length);
      var seats = s.price * n;
      var who = state.mode === "ca" ? "Seats inside your firm" : "The Solution your ticks point to";
      el.rec.innerHTML = '<div class="k">' + who + '</div><div class="name">' + s.name + " · ₹" + s.price.toLocaleString("en-IN") + " per login / month</div>" +
        "<p>Your pack takes " + inr(c.monthly) + " of " + (state.mode === "ca" ? "partner and team" : "senior") + " time a month. " + n + " " + s.name + " login" + (n > 1 ? "s" : "") + " for the people who build it come to " + inr(seats) + " a month.</p>" +
        '<div class="cta"><a class="btn-green" href="/contact/#demo">Book a demo on your books</a><a class="btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.3)" href="' + (state.mode === "ca" ? "/for-cas/#seats" : s.href) + '">' + (state.mode === "ca" ? "How firms buy seats" : "See " + s.name) + "</a></div>";
    }

    /* ---- events */
    root.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t || !root.contains(t)) return;
      if (t.classList.contains("mec-tab")) {
        var mode = t.getAttribute("data-mode");
        if (mode === state.mode) return;
        fresh(mode);
        history.replaceState(null, "", mode === "ca" ? "#ca" : window.location.pathname);
        renderRoles(); renderGroups(); renderChips(); render();
        return;
      }
      if (t === el.add) {
        var p = PRESETS[state.mode];
        state.roles.unshift({ title: p.newRole, ctc: Math.round(state.roles[0].ctc * 0.6 / 1000) * 1000 || 40000, days: 4 });
        renderRoles(); render();
        return;
      }
      if (t.getAttribute("data-f") === "remove") {
        state.roles.splice(+t.closest(".mec-role").getAttribute("data-i"), 1);
        renderRoles(); render();
        return;
      }
      var act = t.getAttribute("data-act");
      if (act === "run") { state.run = true; render({ animateFlip: true }); return; }
      if (act === "edit") { state.run = false; state.year = false; render({ animateUnflip: true }); return; }
      if (act === "year") {
        state.year = true; render();
        el.year.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
        return;
      }
      if (t.hasAttribute("data-chip")) {
        var ch = t.getAttribute("data-chip"), at = state.chips.indexOf(ch);
        if (at > -1) state.chips.splice(at, 1);
        else { state.chips.push(ch); if (state.chips.length > 3) state.chips.shift(); }
        renderChips(); render();
      }
    });

    root.addEventListener("input", function (e) {
      var t = e.target;
      var card = t.closest(".mec-role[data-i]");
      if (card) {
        var r = state.roles[+card.getAttribute("data-i")];
        var f = t.getAttribute("data-f");
        if (f === "title") r.title = t.value || "Role";
        if (f === "days") r.days = parseFloat(t.value);
        if (f === "ctc") {
          r.ctc = parseMoney(t.value);
          var pos = t.value.length - t.selectionStart;
          t.value = r.ctc ? Math.round(r.ctc).toLocaleString("en-IN") : "";
          try { t.setSelectionRange(t.value.length - pos, t.value.length - pos); } catch (err) { /* ignore */ }
        }
        render();
        return;
      }
      if (t === el.clientsRange) { state.clients = +t.value; el.clientsVal.textContent = t.value; render(); return; }
      if (t === el.mult) { var m = parseFloat(t.value); state.mult = isFinite(m) && m > 0 ? m : 1; render(); return; }
    });

    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-task")) { state.checked[t.getAttribute("data-task")] = t.checked; render(); return; }
      if (t === el.wd) { state.wd = +t.value; render(); return; }
      if (t === el.perRole) { state.perRole = t.checked; render(); return; }
    });

    window.addEventListener("hashchange", function () {
      var mode = window.location.hash === "#ca" ? "ca" : null;
      if (mode && mode !== state.mode) { fresh(mode); renderRoles(); renderGroups(); renderChips(); render(); }
    });

    renderRoles(); renderGroups(); renderChips(); render();
  }

  /* ================================================================ MINI */
  function initMini(root) {
    var roles = PRESETS.finance.roles;
    var st = { i: 0, ctc: roles[0].ctc, days: roles[0].days };
    root.innerHTML =
      '<div class="mec-mini">' +
        '<div class="mec-mini-in">' +
          '<div><div class="mec-lbl" style="margin-bottom:8px">Who builds your monthly pack?</div><div class="mec-mini-roles mec-tabs" role="tablist" aria-label="Role">' +
            roles.map(function (r, i) { return '<button type="button" class="mec-tab" role="tab" data-r="' + i + '">' + esc(r.title) + "</button>"; }).join("") +
          "</div></div>" +
          '<div style="display:grid;grid-template-columns:170px 1fr;gap:16px;align-items:end" class="mec-role-body">' +
            '<div class="mec-field"><label for="mecMiniCtc">Monthly CTC</label><div class="mec-money"><span>₹</span><input id="mecMiniCtc" inputmode="numeric" data-m="ctc"></div></div>' +
            '<div><div class="mec-slider-top"><label class="mec-lbl" for="mecMiniDays" style="margin:0">Days on the pack, each month</label><b data-m="dv"></b></div><input type="range" id="mecMiniDays" min="0.5" max="15" step="0.5" data-m="days"></div>' +
          "</div>" +
          '<div><div class="mec-strip" data-m="strip" aria-hidden="true">' + new Array(23).join("<i></i>") + '</div><div class="mec-hint" style="margin-top:6px">Each block is one working day in a 22-day month.</div></div>' +
          '<span class="mec-example" style="align-self:flex-start;margin:0">Example figures. Change them to yours.</span>' +
        "</div>" +
        '<div class="mec-mini-out" aria-live="polite">' +
          '<div class="k">Senior time on the pack, every month</div><div class="v" data-m="mv">₹0</div>' +
          '<div class="k" style="margin-top:6px">Every year</div><div class="v g" data-m="yv">₹0</div>' +
          '<p style="font:400 13.5px/1.6 var(--font-sans);color:rgba(255,255,255,.72);margin:4px 0 0">That is the time the pack costs today. Run the full clock to see which days come back, and where your team could spend them.</p>' +
          '<div style="margin-top:auto;display:flex;gap:10px;flex-wrap:wrap"><a class="btn-green" data-m="go" href="/month-end-clock/">Open the Month-End Clock →</a></div>' +
          '<div class="mec-hint" style="color:rgba(255,255,255,.45)">Capacity only · nobody is replaced</div>' +
        "</div>" +
      "</div>";
    var q = function (k) { return root.querySelector('[data-m="' + k + '"]'); };
    function draw() {
      Array.prototype.forEach.call(root.querySelectorAll(".mec-tab"), function (b) { b.setAttribute("aria-selected", +b.getAttribute("data-r") === st.i ? "true" : "false"); });
      q("ctc").value = Math.round(st.ctc).toLocaleString("en-IN");
      q("days").value = st.days;
      q("dv").textContent = days(st.days) + " d";
      var monthly = st.ctc / 22 * st.days;
      countUp(q("mv"), monthly, inr);
      countUp(q("yv"), monthly * 12, inrShort);
      Array.prototype.forEach.call(q("strip").children, function (c, k) { c.classList.toggle("on", k < Math.ceil(st.days)); });
      q("go").setAttribute("href", "/month-end-clock/?role=" + encodeURIComponent(roles[st.i].title) + "&ctc=" + Math.round(st.ctc) + "&days=" + st.days);
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]");
      if (!b) return;
      st.i = +b.getAttribute("data-r"); st.ctc = roles[st.i].ctc; draw();
    });
    root.addEventListener("input", function (e) {
      if (e.target === q("days")) { st.days = parseFloat(e.target.value); draw(); }
      if (e.target === q("ctc")) { st.ctc = parseMoney(e.target.value); var v = st.ctc / 22 * st.days; countUp(q("mv"), v, inr); countUp(q("yv"), v * 12, inrShort); q("go").setAttribute("href", "/month-end-clock/?role=" + encodeURIComponent(roles[st.i].title) + "&ctc=" + Math.round(st.ctc) + "&days=" + st.days); }
    });
    q("ctc").addEventListener("blur", draw);
    draw();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-mec-full]"), initFull);
    Array.prototype.forEach.call(document.querySelectorAll("[data-mec-mini]"), initMini);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
