// Site configuration. Set FORM_ENDPOINT to any service that accepts a JSON POST
// (Formspree, Basin, a serverless function, your CRM webhook). When it is empty,
// the demo form falls back to opening an email to CONTACT_EMAIL.
const CONFIG = {
  FORM_ENDPOINT: "",
  CONTACT_EMAIL: "hello@nectral.ai",
};

document.documentElement.classList.add("js");

// Mobile nav
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  links.classList.toggle("open", !open);
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Hero flow: highlight each stage in turn and cycle the action and policy rule
(function flow() {
  const nodes = document.querySelectorAll(".flow-node");
  const acts = document.querySelectorAll("#flow-actions span");
  const rule = document.getElementById("flow-rule");
  if (!nodes.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const scenarios = [
    { act: "redact", rule: "if app = unsanctioned and data = secret → redact" },
    { act: "warn", rule: "if app = tolerated and data = customer PII → warn" },
    { act: "block", rule: "if upload = Confidential and app ≠ sanctioned → block" },
  ];
  let stage = 0;
  let scenario = 0;
  function tick() {
    nodes.forEach((n, i) => n.classList.toggle("active", i === stage));
    if (stage === 2) {
      const { act, rule: text } = scenarios[scenario];
      acts.forEach((el) => el.classList.toggle("on", el.dataset.act === act));
      rule.textContent = text;
      scenario = (scenario + 1) % scenarios.length;
    }
    stage = (stage + 1) % nodes.length;
    setTimeout(tick, 1400);
  }
  tick();
})();

// Redaction demo: reveal typed -> sent -> restored, then loop
(function demo() {
  const body = document.querySelector(".demo-body");
  const badge = document.getElementById("demo-badge");
  if (!body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const parts = Array.from(body.children); // label, bubble pairs
  const stages = [
    { show: 2, badge: "Nectral Observe · inspecting" },
    { show: 4, badge: "3 values redacted" },
    { show: 6, badge: "Restored locally" },
  ];
  let i = 0;
  function step() {
    const { show, badge: text } = stages[i];
    parts.forEach((el, idx) => el.classList.toggle("pending", idx >= show));
    badge.textContent = text;
    i = (i + 1) % stages.length;
    setTimeout(step, i === 0 ? 4200 : 1800);
  }
  step();
})();

// Plan buttons preselect the form's interest field
const interest = document.getElementById("f-interest");
document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const plan = btn.dataset.plan;
    const opt = Array.from(interest.options).find((o) => o.text.startsWith(plan));
    if (opt) interest.value = opt.value;
  });
});

// Demo request form
const form = document.getElementById("demo-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";

  let firstInvalid = null;
  form.querySelectorAll("[required]").forEach((el) => {
    const ok = el.checkValidity() && el.value.trim() !== "";
    el.setAttribute("aria-invalid", String(!ok));
    if (!ok && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) {
    status.textContent = "Please fill in your name, a valid work email and your company.";
    status.classList.add("err");
    firstInvalid.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form));

  if (!CONFIG.FORM_ENDPOINT) {
    const subject = `Veil demo request: ${data.company}`;
    const lines = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Company: ${data.company}`,
      `Employees: ${data.size}`,
      `Interested in: ${data.interest}`,
      "",
      data.message || "",
    ];
    window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    status.textContent = `Your email app should open with the request filled in. If it doesn't, write to ${CONFIG.CONTACT_EMAIL}.`;
    status.classList.add("ok");
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Sending…";
  try {
    const res = await fetch(CONFIG.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(res.statusText);
    form.reset();
    status.textContent = "Thanks. We'll be in touch within one business day.";
    status.classList.add("ok");
  } catch {
    status.textContent = `Something went wrong. Please email ${CONFIG.CONTACT_EMAIL} instead.`;
    status.classList.add("err");
  } finally {
    button.disabled = false;
  }
});
