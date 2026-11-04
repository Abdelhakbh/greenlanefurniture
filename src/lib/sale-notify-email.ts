export async function sendSaleNotifyEmail(subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.SALE_NOTIFY_EMAIL?.trim() || "abdegeeK@gmail.com";
  const from =
    process.env.SALE_NOTIFY_FROM?.trim() ||
    "Green Lane Furniture <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[sale-notify] RESEND_API_KEY not set — email skipped");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return true;
}
