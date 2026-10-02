// Site configuration. Set FORM_ENDPOINT to any service that accepts a JSON POST
// (Formspree, Basin, a serverless function, your CRM webhook). When it is empty,
// the demo form falls back to opening an email to CONTACT_EMAIL.
const CONFIG = {
  FORM_ENDPOINT: "",
  CONTACT_EMAIL: "hello@nectral.ai",
};

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

// Book-a-demo form (work email only)
const form = document.getElementById("demo-form");
const email = document.getElementById("veil-email");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = email.value.trim();
  const valid = value !== "" && email.checkValidity();
  email.setAttribute("aria-invalid", String(!valid));
  if (!valid) {
    status.textContent = "Please enter a valid work email.";
    email.focus();
    return;
  }

  if (!CONFIG.FORM_ENDPOINT) {
    const subject = "Veil demo request";
    const body = `Please get in touch about a Veil demo.\n\nWork email: ${value}`;
    window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
      body: JSON.stringify({ email: value }),
    });
    if (!res.ok) throw new Error(res.statusText);
    form.reset();
    status.textContent = "Thanks. We'll be in touch within one business day.";
  } catch {
    status.textContent = `Something went wrong. Please email ${CONFIG.CONTACT_EMAIL} instead.`;
  } finally {
    button.disabled = false;
  }
});
