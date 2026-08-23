/* ==========================================================================
   FinLytTech — site behaviour
   1. Navigation: dropdown panels, mobile menu
   2. Home page "Start where you are" selector (ported from the design's
      React logic to dependency-free vanilla JS)
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- nav */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;

    var triggers = Array.prototype.slice.call(nav.querySelectorAll(".nav-trigger"));
    var panels = {};
    triggers.forEach(function (t) {
      var id = t.getAttribute("data-panel");
      panels[id] = nav.querySelector('.nav-panel[data-panel="' + id + '"]');
    });

    function closeAll(exceptId) {
      triggers.forEach(function (t) {
        var id = t.getAttribute("data-panel");
        if (id === exceptId) return;
        t.setAttribute("aria-expanded", "false");
        if (panels[id]) panels[id].classList.remove("is-open");
      });
    }

    triggers.forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = t.getAttribute("data-panel");
        var open = t.getAttribute("aria-expanded") === "true";
        closeAll(id);
        t.setAttribute("aria-expanded", open ? "false" : "true");
        if (panels[id]) panels[id].classList.toggle("is-open", !open);
      });
    });

    // Click outside closes any open panel
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) closeAll(null);
    });

    // Escape closes and returns focus to the trigger that was open
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openTrigger = triggers.filter(function (t) {
        return t.getAttribute("aria-expanded") === "true";
      })[0];
      closeAll(null);
      if (openTrigger) openTrigger.focus();
    });

    // Mobile menu
    var burger = nav.querySelector(".nav-burger");
    var links = nav.querySelector(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        if (!open) closeAll(null);
      });
    }
  }

  /* ----------------------------------------------------- home selector */
  var SEL = {
    mis: {
      tag: "MIS · reporting, to capital-readiness",
      head: "The reports your investors ask for, without a finance team.",
      body: "Investor-grade statements, operating analytics and forward-looking cash forecasts, all from the books you already run.",
      points: [
        "Board pack in five minutes, not fifteen days",
        "Cash runway forecast to six months out",
        "Scales into a full capital suite when you raise"
      ],
      cta: "Start with MIS",
      ctaHref: "/products/#mis-essentials",
      price: "From ₹999 / month + GST",
      screenTitle: "MIS · Aug 2026",
      screenMeta: "Tally · synced 4 min ago",
      kpis: [["Revenue MTD", "₹1.86 Cr"], ["Burn", "₹34.2 L"], ["Runway", "11 mo"], ["EBITDA", "14.2 %"]]
    },
    ced: {
      tag: "CED · your industry's shape, in your cloud",
      head: "Five systems, one number everyone agrees on.",
      body: "HRMS, ops, billing and your ERP feed one dashboard shaped to your industry, deployed inside your own VPC.",
      points: [
        "Built to your industry's operating shape",
        "Runs in your VPC. You keep the data",
        "Fortnight to scope, eight weeks to pilot"
      ],
      cta: "Request a scoping call",
      ctaHref: "/contact/#enterprise",
      price: "By quotation",
      screenTitle: "Group dashboard · 4 plants",
      screenMeta: "6 sources · live",
      kpis: [["Sources", "6 live"], ["OEE", "78.4 %"], ["Headcount", "1,284"], ["Order book", "₹92 Cr"]]
    },
    erp: {
      tag: "ERP · a universal journal, ten consoles above it",
      head: "Everything Tally has outgrown, on one posting table.",
      body: "The books, the payroll, the sales pipeline, the compliance calendar. Every function wired to the same posting table.",
      points: [
        "IGAAP and Ind AS books side by side",
        "GST, TDS and MCA calendars built in",
        "Migration is a load, not a re-implementation"
      ],
      cta: "Talk to sales",
      ctaHref: "/contact/#erp",
      price: "Pilot-first onboarding, six to eight weeks",
      screenTitle: "ERP · consoles",
      screenMeta: "10 live end-to-end",
      kpis: [["Consoles", "10"], ["Vouchers MTD", "1,842"], ["Close day", "D+3"], ["Books", "2"]]
    }
  };

  var VISUALS = {
    mis:
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div style="display:flex;justify-content:space-between;font:600 12.5px var(--font-sans);color:var(--ink)">' +
          "<span>Cash flow, actual and forecast</span><span style=\"color:var(--fg-3);font-weight:500\">12 months</span></div>" +
        '<svg viewBox="0 0 460 140" style="width:100%;height:140px" role="img" aria-label="Cash flow actual and forecast over twelve months, trending upward">' +
          '<g stroke="#E5E9EE" stroke-width="1"><line x1="0" y1="35" x2="460" y2="35"/><line x1="0" y1="70" x2="460" y2="70"/><line x1="0" y1="105" x2="460" y2="105"/></g>' +
          '<path d="M0,110 L57,102 L115,106 L172,88 L230,80 L287,62 L345,54 L402,38 L460,26 L460,140 L0,140 Z" fill="rgba(29,158,117,.10)"/>' +
          '<polyline points="0,110 57,102 115,106 172,88 230,80 287,62 345,54 402,38 460,26" fill="none" stroke="#1D9E75" stroke-width="2.4"/>' +
          '<polyline points="230,80 287,76 345,66 402,58 460,48" fill="none" stroke="#647688" stroke-width="1.8" stroke-dasharray="5 5"/>' +
        "</svg>" +
        '<div style="display:flex;gap:10px;align-items:flex-start;padding:12px;background:var(--paper-2);border:1px solid var(--rule);border-radius:8px">' +
          '<img src="/assets/finlyttech-app-icon.png" alt="" style="width:24px;height:24px;border-radius:6px;flex-shrink:0;display:block">' +
          '<div style="font:400 11.5px/1.45 var(--font-sans);color:var(--fg-2)"><b style="color:var(--ink)">Runway extends to 11 months</b> if the October collection lands on time.</div>' +
        "</div></div>",
    ced:
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<div style="font:600 12.5px var(--font-sans);color:var(--ink)">Six sources, one view</div>' +
        '<svg viewBox="0 0 460 150" style="width:100%;height:150px" role="img" aria-label="Five source systems converging into one group dashboard">' +
          '<g stroke="#CFD6DE" stroke-width="1.4" fill="none">' +
            '<path d="M96,25 C170,25 170,75 208,75"/><path d="M96,50 C170,50 170,75 208,75"/>' +
            '<path d="M96,75 H208"/><path d="M96,100 C170,100 170,75 208,75"/><path d="M96,125 C170,125 170,75 208,75"/></g>' +
          '<g><rect x="4" y="14" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="29" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">HRMS</text>' +
          '<rect x="4" y="39" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="54" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">Ops</text>' +
          '<rect x="4" y="64" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="79" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">ERP</text>' +
          '<rect x="4" y="89" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="104" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">Billing</text>' +
          '<rect x="4" y="114" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="129" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">CRM</text></g>' +
          '<rect x="208" y="57" width="36" height="36" rx="10" fill="#0D1B2A"/>' +
          '<path d="M232 68 L240 61 L240 65 L236 69 Z" fill="#1D9E75"/>' +
          '<line x1="244" y1="75" x2="300" y2="75" stroke="#CFD6DE" stroke-width="1.4"/>' +
          '<rect x="300" y="30" width="156" height="90" rx="10" fill="rgba(29,158,117,.07)" stroke="#1D9E75" stroke-width="1.4"/>' +
          '<text x="378" y="62" text-anchor="middle" style="font:600 13px var(--font-display);fill:#0D1B2A">Group dashboard</text>' +
          '<text x="378" y="82" text-anchor="middle" style="font:400 11px var(--font-sans);fill:#3D5163">Your VPC · your industry shape</text>' +
        "</svg>" +
        '<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Plant 1</div><div style="font:600 15px var(--font-display);color:var(--ink);font-variant-numeric:tabular-nums">82.1 %</div></div>' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Plant 2</div><div style="font:600 15px var(--font-display);color:var(--ink);font-variant-numeric:tabular-nums">76.4 %</div></div>' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Plant 3</div><div style="font:600 15px var(--font-display);color:var(--ink);font-variant-numeric:tabular-nums">71.0 %</div></div>' +
        "</div></div>",
    erp: (function () {
      var mods = ["Books", "Payroll", "Sales", "Purchase", "Inventory", "Compliance", "Fixed assets", "Banking", "Projects", "MIS"];
      var cells = mods.map(function (m, i) {
        var hot = i % 4 === 2;
        return '<div style="padding:12px 9px;border-radius:8px;text-align:center;font:500 11.5px var(--font-sans);' +
          "background:" + (hot ? "rgba(29,158,117,.10)" : "var(--paper-2)") + ";" +
          "border:1px solid " + (hot ? "rgba(29,158,117,.35)" : "var(--rule)") + ';color:var(--ink)">' + m + "</div>";
      }).join("");
      return '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<div style="font:600 12.5px var(--font-sans);color:var(--ink)">Ten consoles above one journal</div>' +
        '<div class="g4" style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px">' + cells + "</div>" +
        '<div style="padding:12px 14px;border-radius:8px;background:var(--brand-navy);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
          '<span style="font:600 12.5px var(--font-display);color:#fff">Universal journal</span>' +
          '<span style="font:500 11px var(--font-mono);color:rgba(255,255,255,.6)">IGAAP + Ind AS · single posting table</span>' +
        "</div></div>";
    })()
  };

  function initSelector() {
    var root = document.querySelector("[data-selector]");
    if (!root) return;

    var chips = Array.prototype.slice.call(root.querySelectorAll("[data-key]"));
    var out = {};
    ["tag", "head", "body", "cta", "price", "screenTitle", "screenMeta", "visual", "points"].forEach(function (n) {
      out[n] = root.querySelector('[data-out="' + n + '"]');
    });
    var kpiEls = Array.prototype.slice.call(root.querySelectorAll("[data-kpi]"));

    function render(key) {
      var d = SEL[key];
      if (!d) return;

      chips.forEach(function (c) {
        var on = c.getAttribute("data-key") === key;
        c.setAttribute("aria-selected", on ? "true" : "false");
        c.style.background = on ? "#FFFFFF" : "transparent";
        c.style.color = on ? "#0D1B2A" : "#3D5163";
        c.style.boxShadow = on ? "0 1px 2px rgba(13,27,42,.10)" : "none";
      });

      if (out.tag) out.tag.textContent = d.tag;
      if (out.head) out.head.textContent = d.head;
      if (out.body) out.body.textContent = d.body;
      if (out.price) out.price.textContent = d.price;
      if (out.screenTitle) out.screenTitle.textContent = d.screenTitle;
      if (out.screenMeta) out.screenMeta.textContent = d.screenMeta;
      if (out.cta) {
        out.cta.textContent = d.cta;
        out.cta.setAttribute("href", d.ctaHref);
      }

      if (out.points) {
        out.points.innerHTML = d.points.map(function (p) {
          return '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="width:20px;height:20px;border-radius:999px;background:var(--emerald-50);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' +
            '<svg viewBox="0 0 24 24" style="width:12px;height:12px" fill="none" stroke="#157E5C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>' +
            "</span>" +
            '<span style="font:500 14.5px var(--font-sans);color:var(--ink-soft)">' + p + "</span></div>";
        }).join("");
      }

      kpiEls.forEach(function (el, i) {
        var pair = d.kpis[i];
        if (!pair) return;
        var l = el.querySelector("[data-kpi-label]");
        var v = el.querySelector("[data-kpi-value]");
        if (l) l.textContent = pair[0];
        if (v) v.textContent = pair[1];
      });

      if (out.visual) out.visual.innerHTML = VISUALS[key] || "";
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        render(c.getAttribute("data-key"));
      });
    });

    render("mis");
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    initNav();
    initSelector();

    // Mark the FAQ accordion arrows so open/closed reads correctly
    Array.prototype.slice.call(document.querySelectorAll("details.faq")).forEach(function (d) {
      var sign = d.querySelector("[data-sign]");
      if (!sign) return;
      var sync = function () { sign.textContent = d.open ? "−" : "+"; };
      d.addEventListener("toggle", sync);
      sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
