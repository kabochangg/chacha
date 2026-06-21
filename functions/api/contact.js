const MAX_MESSAGE_LENGTH = 3000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function verifyTurnstile(token, secret, remoteip) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteip) body.append("remoteip", remoteip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  return response.json();
}

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return json({ message: "お問い合わせの送信設定が完了していません。" }, 503);
  }

  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const message = String(form.get("message") || "").trim();
  const website = String(form.get("website") || "").trim();
  const turnstileToken = String(form.get("cf-turnstile-response") || "");

  if (website) return json({ ok: true });
  if (!name || !email || !message) return json({ message: "必須項目を入力してください。" }, 400);
  if (name.length > 80 || message.length > MAX_MESSAGE_LENGTH) {
    return json({ message: "入力できる文字数を超えています。" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: "メールアドレスを確認してください。" }, 400);
  }

  const verification = await verifyTurnstile(
    turnstileToken,
    env.TURNSTILE_SECRET_KEY,
    request.headers.get("CF-Connecting-IP"),
  );
  if (!verification.success) return json({ message: "送信確認に失敗しました。もう一度お試しください。" }, 400);

  const from = env.CONTACT_FROM_EMAIL || "副業タイプ診断 <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `【副業タイプ診断】${name}さんからのお問い合わせ`,
      text: `お名前: ${name}\nメールアドレス: ${email}\n\n${message}`,
    }),
  });

  if (!response.ok) return json({ message: "送信処理に失敗しました。時間をおいてお試しください。" }, 502);
  return json({ ok: true });
}

export function onRequestGet() {
  return json({ message: "Method not allowed" }, 405);
}
