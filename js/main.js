(function () {
  var cfg = window.TRU_CONFIG || {};

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Cal.com ---------- */
  // Every "Book a call" button gets the real Cal.com URL as a fallback link,
  // and opens the Cal.com pop-up once the embed script has loaded.
  var calButtons = document.querySelectorAll("[data-book]");
  calButtons.forEach(function (btn) {
    btn.setAttribute("href", "https://cal.com/" + cfg.calLink);
    btn.setAttribute("data-cal-link", cfg.calLink);
    btn.setAttribute("data-cal-config", '{"layout":"month_view"}');
  });

  var inline = document.getElementById("cal-inline");
  if (calButtons.length || inline) {
    // Official Cal.com embed loader
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal; var ar = arguments;
        if (!cal.loaded) {
          cal.ns = {}; cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    Cal("init", { origin: "https://cal.com" });
    Cal("ui", {
      theme: "light",
      cssVarsPerTheme: { light: { "cal-brand": "#1e3a2b" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });

    if (inline) {
      Cal("inline", {
        elementOrSelector: "#cal-inline",
        calLink: cfg.calLink,
        layout: "month_view",
      });
    }
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function show(type, msg) {
    status.className = "form-status " + type;
    status.textContent = msg;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var data = new FormData(form);
    if (data.get("bot-field")) return; // spam honeypot

    // Clean JSON payload for automation tools
    var payload = {
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      phone: data.get("phone"),
      service: data.get("service"),
      budget: data.get("budget"),
      message: data.get("message"),
      source: "tru-integrations-website",
      page: window.location.href,
      submitted_at: new Date().toISOString(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    // 1) Netlify Forms (stores submissions + can trigger email / webhook / Zapier)
    var netlify = fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    });

    // 2) Optional direct webhook (Zapier / Make / n8n / etc.)
    var webhook = cfg.webhookUrl
      ? fetch(cfg.webhookUrl, {
          method: "POST",
          // text/plain avoids a CORS preflight, which Zapier & Make hooks don't answer
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload),
        })
      : Promise.resolve({ ok: true });

    Promise.allSettled([netlify, webhook]).then(function (results) {
      var anyOk = results.some(function (r) {
        return r.status === "fulfilled" && r.value && r.value.ok !== false;
      });
      if (anyOk) {
        form.reset();
        show("success", "Thank you — your message is in. We'll reply within one business day.");
      } else {
        show("error", "Something went wrong sending your message. Please email us directly or book a call.");
      }
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    });
  });
})();
