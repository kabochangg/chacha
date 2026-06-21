(function () {
  "use strict";

  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const container = document.querySelector("#turnstile-container");
  const config = window.SideWorkFinderConfig || {};

  if (config.turnstileSiteKey) {
    container.className = "cf-turnstile";
    container.dataset.sitekey = config.turnstileSiteKey;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.append(script);
  } else {
    status.textContent = "現在、お問い合わせフォームを準備中です。";
    status.dataset.state = "error";
    form.querySelector("button").disabled = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    status.textContent = "送信しています…";
    status.dataset.state = "";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "送信できませんでした。");

      form.reset();
      window.turnstile?.reset();
      status.textContent = "お問い合わせを送信しました。";
      status.dataset.state = "success";
    } catch (error) {
      status.textContent = error.message || "送信できませんでした。時間をおいてお試しください。";
      status.dataset.state = "error";
    } finally {
      button.disabled = false;
    }
  });
})();
