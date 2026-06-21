const ALLOWED_EVENTS = new Set([
  "diagnosis_start",
  "diagnosis_complete",
  "affiliate_click",
  "result_share",
]);

export async function onRequestPost({ request, env }) {
  let event;
  try {
    event = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!ALLOWED_EVENTS.has(event.eventName)) return new Response(null, { status: 400 });

  if (env.SITE_EVENTS) {
    env.SITE_EVENTS.writeDataPoint({
      blobs: [
        event.eventName,
        String(event.resultType || ""),
        String(event.offerId || ""),
        String(event.network || ""),
        String(event.path || ""),
      ],
      indexes: [event.eventName],
    });
  }

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export function onRequestGet() {
  return new Response(null, { status: 405 });
}
