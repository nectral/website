// Site configuration. Set FORM_ENDPOINT to any service that accepts a JSON POST
// (Formspree, Basin, a serverless function, your CRM webhook). When it is empty,
// the early-access form falls back to opening an email to CONTACT_EMAIL.
const CONFIG = {
  FORM_ENDPOINT: "",
  CONTACT_EMAIL: "hello@nectral.ai",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Mark one button in a group as selected
function select(buttons, active) {
  buttons.forEach((b) => {
    const on = b === active;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

// Mobile nav
const toggle = $(".nav-toggle");
const links = $("#nav-links");
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

$("#year").textContent = new Date().getFullYear();

// Hero demo: pick an example and a policy response
const SAMPLES = [
  { site: "chat.ai-assistant.com", detector: "AWS access key", what: "An AWS access key",
    before: 'Why does this fail with 403?\n\nclient = boto3.client("s3",\n  aws_access_key_id="', match: "AKIAIOSFODNN7EXAMPLE", after: '",\n  region_name="eu-west-1")', redact: "[REDACTED:AWS_KEY]" },
  { site: "chat.ai-assistant.com", detector: "Internal source", what: "Code from a private repository",
    before: "Refactor this to be faster:\n\n", match: "// @acme/billing-core · src/ledger/reconcile.ts\nexport function reconcile(ledger: Ledger) {…}", after: "", redact: "[REDACTED:INTERNAL_SOURCE]" },
  { site: "notes.ai-writer.io", detector: "PII · 2 matches", what: "Customer personal data",
    before: "Draft a reply to this complaint from ", match: "Maria Lopez, maria.lopez@example.com, +44 7700 900123", after: " about her late refund.", redact: "[REDACTED:PII]" },
  { site: "chat.ai-assistant.com", detector: "Confidential file", what: "A file labelled Confidential", isFile: true,
    fileName: "customers_q3_export.csv", fileMeta: "2.4 MB · 18,204 rows · label: Confidential",
    before: "Summarise churn by region from ", match: "this file", after: ".", redact: "[UPLOAD REMOVED]" },
];

const BANNERS = {
  Warn: { icon: "ph-fill ph-warning", title: "This looks sensitive",
    body: (s) => `${s.what} was found in what you're about to send to ${s.site}. Your company policy asks you to remove it or give a reason.`,
    actions: [["Remove it", "btn-primary"], ["Send with reason", "btn-secondary"]] },
  Redact: { icon: "ph-fill ph-eye-slash", title: "Redacted before sending",
    body: (s) => `${s.what} was replaced automatically. The rest of your message will send as normal.`,
    actions: [["Send redacted", "btn-primary"], ["Undo", "btn-secondary"]] },
  Block: { icon: "ph-fill ph-prohibit", title: "Blocked by policy",
    body: (s) => `${s.what} can't be shared with ${s.site}. This event has been logged for your security team.`,
    actions: [["Request exception", "btn-primary"], ["Learn why", "btn-secondary"]] },
};

const demo = { sample: 0, mode: "Warn" };

function renderDemo() {
  const s = SAMPLES[demo.sample];
  const isRedact = demo.mode === "Redact";
  const isBlock = demo.mode === "Block";
  const banner = BANNERS[demo.mode];

  $("#demo-site").textContent = s.site;
  $("#file-pill").hidden = !s.isFile;
  if (s.isFile) {
    $("#file-name").textContent = s.fileName;
    $("#file-meta").textContent = s.fileMeta;
  }
  $("#txt-before").textContent = s.before;
  $("#txt-after").textContent = s.after;
  const match = $("#txt-match");
  match.textContent = isRedact ? s.redact : s.match;
  match.classList.toggle("is-redact", isRedact);
  match.classList.toggle("is-block", isBlock);
  $("#composer").classList.toggle("is-block", isBlock);
  $("#send-state").classList.toggle("is-off", isBlock);
  $("#send-label").textContent = isBlock ? "Send disabled" : isRedact ? "Ready to send" : "Waiting for your choice";

  $("#banner-icon").className = banner.icon;
  $("#banner-title").textContent = banner.title;
  $("#banner-detector").textContent = s.detector;
  $("#banner-body").textContent = banner.body(s);
  const actions = $("#banner-actions");
  actions.replaceChildren(...banner.actions.map(([label, cls]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn ${cls}`;
    b.textContent = label;
    return b;
  }));
}

const sampleButtons = $$("[data-sample]");
sampleButtons.forEach((b) => b.addEventListener("click", () => {
  demo.sample = Number(b.dataset.sample);
  select(sampleButtons, b);
  renderDemo();
}));
const modeButtons = $$("[data-mode]");
modeButtons.forEach((b) => b.addEventListener("click", () => {
  demo.mode = b.dataset.mode;
  select(modeButtons, b);
  renderDemo();
}));
renderDemo();

// Console mock: time range switches the KPIs and the chart (sample data)
const RANGES = {
  "24h": { kpis: [["Prompts inspected", "18,406", "+6% vs. yesterday"], ["Detections", "214", "1.2% of prompts"], ["Blocked", "52", "24% of detections"], ["Exceptions pending", "7", "3 older than 4h"]], start: "00:00", end: "Now", n: 12, seed: 3 },
  "7d": { kpis: [["Prompts inspected", "126,930", "+11% vs. last week"], ["Detections", "1,284", "1.0% of prompts"], ["Blocked", "312", "24% of detections"], ["Exceptions pending", "7", "3 older than 4h"]], start: "Mon", end: "Sun", n: 7, seed: 7 },
  "30d": { kpis: [["Prompts inspected", "548,112", "+18% vs. last month"], ["Detections", "5,903", "1.1% of prompts"], ["Blocked", "1,377", "23% of detections"], ["Exceptions pending", "7", "3 older than 4h"]], start: "30 days ago", end: "Today", n: 15, seed: 11 },
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function renderConsole(range) {
  const r = RANGES[range];
  $("#kpis").replaceChildren(...r.kpis.map(([label, value, delta]) => {
    const k = el("div", "kpi");
    k.append(el("span", "kpi-label", label), el("span", "kpi-value", value), el("span", "kpi-delta", delta));
    return k;
  }));
  $("#bars").replaceChildren(...Array.from({ length: r.n }, (_, i) => {
    const v = 0.35 + 0.55 * Math.abs(Math.sin((i + 1) * r.seed * 0.7));
    const hard = v * (0.22 + 0.12 * Math.abs(Math.cos(i * r.seed)));
    const bar = el("div", "bar");
    bar.title = `${Math.round(v * 100)} detections`;
    const soft = el("div", "bar-soft");
    soft.style.height = `${((v - hard) * 100).toFixed(1)}%`;
    const h = el("div", "bar-hard");
    h.style.height = `${(hard * 100).toFixed(1)}%`;
    bar.append(soft, h);
    return bar;
  }));
  $("#axis-start").textContent = r.start;
  $("#axis-end").textContent = r.end;
}

const rangeButtons = $$("[data-range]");
rangeButtons.forEach((b) => b.addEventListener("click", () => {
  select(rangeButtons, b);
  renderConsole(b.dataset.range);
}));
renderConsole("7d");

// FAQ: one answer open at a time
const faqButtons = $$(".faq-item button");
faqButtons.forEach((b) => b.addEventListener("click", () => {
  const opening = b.getAttribute("aria-expanded") !== "true";
  faqButtons.forEach((other) => {
    const open = other === b && opening;
    other.setAttribute("aria-expanded", String(open));
    $("#" + other.getAttribute("aria-controls")).hidden = !open;
    other.querySelector("i").className = open ? "ph ph-minus" : "ph ph-plus";
  });
}));

// Early-access form
const form = $("#access-form");
const email = $("#f-email");
const emailError = $("#email-error");
const status = $("#form-status");
const sizeButtons = $$("#size-opts .seg-opt");
const toolButtons = $$("#tool-opts .chip-btn");
let size = "";

sizeButtons.forEach((b) => b.addEventListener("click", () => {
  size = b.dataset.size;
  select(sizeButtons, b);
}));
toolButtons.forEach((b) => b.addEventListener("click", () => {
  const on = b.getAttribute("aria-pressed") !== "true";
  b.classList.toggle("is-on", on);
  b.setAttribute("aria-pressed", String(on));
}));
email.addEventListener("input", () => {
  email.setAttribute("aria-invalid", "false");
  emailError.hidden = true;
});

function showDone(address) {
  $("#done-text").textContent = `We'll write to ${address} within two business days to set up a short call.`;
  form.hidden = true;
  $("#form-done").hidden = false;
}

$("#form-reset").addEventListener("click", () => {
  form.reset();
  size = "";
  select(sizeButtons, null);
  toolButtons.forEach((b) => { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
  status.textContent = "We only use this to contact you about Veil.";
  $("#form-done").hidden = true;
  form.hidden = false;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const address = email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    email.setAttribute("aria-invalid", "true");
    emailError.hidden = false;
    email.focus();
    return;
  }

  const data = {
    name: $("#f-name").value.trim(),
    email: address,
    company: $("#f-company").value.trim(),
    role: $("#f-role").value.trim(),
    size,
    tools: toolButtons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent),
    notes: $("#f-notes").value.trim(),
  };

  if (!CONFIG.FORM_ENDPOINT) {
    const lines = [
      `Name: ${data.name}`, `Work email: ${data.email}`, `Company: ${data.company}`, `Role: ${data.role}`,
      `Company size: ${data.size}`, `AI tools: ${data.tools.join(", ")}`, "", data.notes,
    ];
    const subject = `Veil early access: ${data.company || data.email}`;
    window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    status.textContent = `Your email app should open with the request filled in. If it doesn't, write to ${CONFIG.CONTACT_EMAIL}.`;
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
    showDone(address);
  } catch {
    status.textContent = `Something went wrong. Please email ${CONFIG.CONTACT_EMAIL} instead.`;
  } finally {
    button.disabled = false;
  }
});
