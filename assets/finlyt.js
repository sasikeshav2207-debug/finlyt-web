/* ==========================================================================
   FinLytTech · site behaviour
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
    solutions: {
      tag: "The Solutions · on the books you already keep",
      head: "Where did the cash go, who owes you, and how long do you last?",
      body: "Cashflow Analytics and Business Decisions read Tally, Zoho, ERPNext, any ERP via API or an Excel drop zone, and put money on dates in the Finance Calendar.",
      points: [
        "Green cash: the spare money, and how long it stays spare",
        "Company risk position moving red to green, with the action attached",
        "Every figure traced back to a posted voucher"
      ],
      cta: "See the Solutions",
      ctaHref: "/products/#cashflow-analytics",
      price: "From ₹1,000 per login / month",
      screenTitle: "Finance Calendar · this week",
      screenMeta: "Illustration · your figures appear here",
      kpis: [["Green cash", "₹ ●●,●●,●●●"], ["Stays spare", "●● weeks"], ["Owed to you", "₹ ●●,●●,●●●"], ["Due this week", "₹ ●●,●●,●●●"]]
    },
    ced: {
      tag: "CED · your industry's shape, in your cloud",
      head: "When your industry's data fits no template.",
      body: "The same substrate deployed into your own cloud, India region, adapted to how your business actually runs, and operated by FinLytTech.",
      points: [
        "Built to your industry's operating shape",
        "Runs in your VPC. You keep the data and the KPI definitions",
        "First deployment live in a customer's own cloud"
      ],
      cta: "Request a scoping call",
      ctaHref: "/contact/#enterprise",
      price: "By quotation",
      screenTitle: "Group view · several business lines",
      screenMeta: "Illustration · schematic",
      kpis: [["Business lines", "●"], ["Consoles", "●●"], ["Role views", "●●"], ["Data", "Your VPC"]]
    },
    erp: {
      tag: "Enterprise ERP · a universal journal, ten consoles above it",
      head: "Outgrown Tally, and SAP is a twelve-month project?",
      body: "Finance, HRMS, revenue, supply chain and statutory work wired to one universal journal, so every report is a live view. Live at erp.finlyt.net.",
      points: [
        "IGAAP and Ind AS books in parallel",
        "Prepares GSTR-1 and 3B; a person still files on GSTN",
        "Moving from the Solutions is a load, with nothing to migrate"
      ],
      cta: "Talk to us about the ERP",
      ctaHref: "/contact/#erp",
      price: "Pilot-first, six to eight weeks",
      screenTitle: "ERP · consoles",
      screenMeta: "erp.finlyt.net",
      kpis: [["Consoles", "10"], ["Journal", "1"], ["Books", "IGAAP + Ind AS"], ["Close", "Continuous"]]
    }
  };

  var VISUALS = {
    solutions: (function () {
      var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var inH = [34, 12, 0, 46, 20, 8], outH = [10, 30, 44, 6, 26, 0];
      var cols = days.map(function (d, i) {
        var x = 18 + i * 74;
        return '<text x="' + (x + 22) + '" y="150" text-anchor="middle" style="font:500 10.5px var(--font-mono);fill:#647688">' + d + '</text>' +
          (inH[i] ? '<rect x="' + (x + 8) + '" y="' + (70 - inH[i]) + '" width="28" height="' + inH[i] + '" rx="4" fill="#1D9E75"/>' : "") +
          (outH[i] ? '<rect x="' + (x + 8) + '" y="76" width="28" height="' + outH[i] + '" rx="4" fill="' + (i === 2 ? "#EF9F27" : "#9DA8B7") + '"/>' : "");
      }).join("");
      return '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div style="display:flex;justify-content:space-between;font:600 12.5px var(--font-sans);color:var(--ink)">' +
          '<span>Money on dates</span><span style="color:var(--fg-3);font-weight:500">in above the line · out below</span></div>' +
        '<svg viewBox="0 0 460 160" style="width:100%;height:150px" role="img" aria-label="Schematic Finance Calendar week: inflows above the line, outflows and a statutory due below it">' +
          '<line x1="10" y1="73" x2="450" y2="73" stroke="#CFD6DE" stroke-width="1.4"/>' + cols +
        "</svg>" +
        '<div style="display:flex;gap:10px;align-items:flex-start;padding:12px;background:var(--paper-2);border:1px solid var(--rule);border-radius:8px">' +
          '<img src="/assets/finlyttech-app-icon.png" alt="" style="width:24px;height:24px;border-radius:6px;flex-shrink:0;display:block">' +
          '<div style="font:400 11.5px/1.45 var(--font-sans);color:var(--fg-2)"><b style="color:var(--ink)">Wednesday carries a statutory due.</b> Schematic illustration; on your books every bar is a posted voucher.</div>' +
        "</div></div>";
    })(),
    ced:
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<div style="font:600 12.5px var(--font-sans);color:var(--ink)">Several systems, one group view</div>' +
        '<svg viewBox="0 0 460 150" style="width:100%;height:150px" role="img" aria-label="Five source systems converging into one group dashboard">' +
          '<g stroke="#CFD6DE" stroke-width="1.4" fill="none">' +
            '<path d="M96,25 C170,25 170,75 208,75"/><path d="M96,50 C170,50 170,75 208,75"/>' +
            '<path d="M96,75 H208"/><path d="M96,100 C170,100 170,75 208,75"/><path d="M96,125 C170,125 170,75 208,75"/></g>' +
          '<g><rect x="4" y="14" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="29" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">HRMS</text>' +
          '<rect x="4" y="39" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="54" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">Ops</text>' +
          '<rect x="4" y="64" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="79" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">ERP</text>' +
          '<rect x="4" y="89" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="104" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">Billing</text>' +
          '<rect x="4" y="114" width="92" height="22" rx="6" fill="#fff" stroke="#CFD6DE"/><text x="50" y="129" text-anchor="middle" style="font:500 11px var(--font-sans);fill:#3D5163">Field ops</text></g>' +
          '<rect x="208" y="57" width="36" height="36" rx="10" fill="#0D1B2A"/>' +
          '<path d="M232 68 L240 61 L240 65 L236 69 Z" fill="#1D9E75"/>' +
          '<line x1="244" y1="75" x2="300" y2="75" stroke="#CFD6DE" stroke-width="1.4"/>' +
          '<rect x="300" y="30" width="156" height="90" rx="10" fill="rgba(29,158,117,.07)" stroke="#1D9E75" stroke-width="1.4"/>' +
          '<text x="378" y="62" text-anchor="middle" style="font:600 13px var(--font-display);fill:#0D1B2A">Group dashboard</text>' +
          '<text x="378" y="82" text-anchor="middle" style="font:400 11px var(--font-sans);fill:#3D5163">Your VPC · your industry shape</text>' +
        "</svg>" +
        '<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Line A</div><div style="font:600 15px var(--font-mono);color:var(--fg-3)">●● %</div></div>' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Line B</div><div style="font:600 15px var(--font-mono);color:var(--fg-3)">●● %</div></div>' +
          '<div style="border:1px solid var(--rule);border-radius:8px;padding:9px 11px"><div style="font:500 10.5px var(--font-sans);color:var(--fg-3)">Line C</div><div style="font:600 15px var(--font-mono);color:var(--fg-3)">●● %</div></div>' +
        "</div></div>",
    erp: (function () {
      var mods = ["Finance", "HRMS", "Revenue", "Marketing", "SCM", "Inter-Company", "SGA", "Capex", "Statutory", "Admin"];
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

    render("solutions");
  }

  /* ------------------------------------------------------- contact form */
  // Submissions POST to the FinLytTech backend and land in the admin console
  // under Enquiries (dashboard.finlyt.net/admin/enquiries), which is where
  // website leads are already worked. The backend emails a notification and
  // an acknowledgement; this page only has to hand over the fields.
  //
  // CORS on that endpoint already allows https://finlyt.net.
  var ENQUIRY_URL = "https://app.finlyt.net/api/enquiry";
  var MAILBOX = "founder@finlyt.net";   // fallback only, if the POST fails

  // Existing CTAs across the site deep-link to /contact/#demo, #partner and so
  // on. Those anchors now preselect the enquiry type rather than pointing at
  // separate cards.
  var HASH_INTENT = {
    "demo": "Book a demo",
    "early-access": "Book a demo",
    "enterprise": "Enterprise ERP or custom dashboard",
    "erp": "Enterprise ERP or custom dashboard",
    "api": "Enterprise ERP or custom dashboard",
    "partner": "CA Partner Programme",
    "deck": "Request the deck",
    "roadmap": "Roadmap request"
  };

  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var select = document.getElementById("intentSelect");
    var errEl = document.getElementById("formError");
    var dialog = document.getElementById("contactDialog");

    /* ---- open / close -------------------------------------------------- */
    function open() {
      if (!dialog) return;
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");   // very old browsers
      }
      var first = form.elements.name;
      if (first) setTimeout(function () { first.focus(); }, 40);
    }
    function close() {
      if (!dialog) return;
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    Array.prototype.slice.call(document.querySelectorAll("[data-open-contact]"))
      .forEach(function (b) {
        b.addEventListener("click", function (e) { e.preventDefault(); open(); });
      });
    Array.prototype.slice.call(document.querySelectorAll("[data-close-contact]"))
      .forEach(function (b) { b.addEventListener("click", close); });

    // Clicking the backdrop closes. The dialog element itself fills the
    // backdrop area, so compare against the inner panel's bounds.
    if (dialog) {
      dialog.addEventListener("click", function (e) {
        if (e.target !== dialog) return;
        var box = dialog.getBoundingClientRect();
        var inside = e.clientX >= box.left && e.clientX <= box.right &&
                     e.clientY >= box.top && e.clientY <= box.bottom;
        if (!inside) close();
      });
    }

    /* ---- deep links ---------------------------------------------------- */
    // Landing on /contact/#demo (or any CTA anchor) preselects the enquiry
    // type and opens the form, since the visitor already declared intent.
    function applyHash(autoOpen) {
      var key = (window.location.hash || "").replace(/^#/, "");
      var want = HASH_INTENT[key];
      if (!want) return;
      if (select) {
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].value === want) {
            select.selectedIndex = i;
            break;
          }
        }
      }
      if (autoOpen) open();
    }
    applyHash(true);
    window.addEventListener("hashchange", function () { applyHash(true); });

    function val(name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var required = [["name", "your name"], ["company", "your company"], ["email", "your email"]];
      var missing = required.filter(function (p) { return !val(p[0]); });
      if (missing.length) {
        if (errEl) {
          errEl.textContent = "Please add " + missing.map(function (p) { return p[1]; }).join(", ") + ".";
          errEl.hidden = false;
        }
        var first = form.elements[missing[0][0]];
        if (first) first.focus();
        return;
      }
      var email = val("email");
      if (email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        if (errEl) {
          errEl.textContent = "That email address does not look right.";
          errEl.hidden = false;
        }
        form.elements.email.focus();
        return;
      }
      if (errEl) errEl.hidden = true;

      var intent = val("intent") || "Enquiry";
      var body = [
        "Needs: " + intent,
        "Books: " + (val("books") || "not stated"),
        "",
        val("message") || "(no message)"
      ].join(String.fromCharCode(10));

      // Honeypot: real people never fill this.
      if (val("website")) { close(); return; }

      var submitBtn = form.querySelector('button[type="submit"]');
      var restore = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

      function fail() {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = restore; }
        if (errEl) {
          errEl.innerHTML = 'That did not send. <a href="mailto:' + MAILBOX + '">Email us instead</a>.';
          errEl.hidden = false;
        }
      }

      if (!window.fetch) { fail(); return; }

      window.fetch(ENQUIRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: val("name"),
          email: email,
          company: val("company"),
          phone: val("phone"),
          message: body,
          source: "Contact Us (website)"
        })
      }).then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        showSent(intent);
      })["catch"](fail);
    });

    /* ---- success state ------------------------------------------------- */
    function showSent(intent) {
      var title = document.getElementById("contactDialogTitle");
      if (title) title.textContent = "Thank you, that has reached us";
      var lede = document.getElementById("contactDialogLede");
      if (lede) lede.remove();
      form.innerHTML =
        '<div style="padding:4px 0">' +
          '<div style="width:46px;height:46px;border-radius:999px;background:var(--emerald-50);' +
          'display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">' +
            '<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" stroke="#157E5C" ' +
            'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M20 6 9 17l-5-5"></path></svg>' +
          '</div>' +
          '<p style="font:400 15px/1.65 var(--font-sans);color:var(--fg-2);margin:0 0 20px">' +
            'We have your note about <b style="color:var(--ink)">' + intent.toLowerCase() +
            '</b>, and a confirmation is on its way to your inbox. The founding team usually ' +
            'replies the same working day, IST.</p>' +
          '<button type="button" class="btn-dark" data-close-sent ' +
          'style="border:0;cursor:pointer;font:600 15px var(--font-sans)">Close</button>' +
        '</div>';
      var btn = form.querySelector("[data-close-sent]");
      if (btn) btn.addEventListener("click", close);
    }
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    initNav();
    initSelector();
    initContactForm();

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
