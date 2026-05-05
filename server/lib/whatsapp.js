const graphBase = "https://graph.facebook.com/v20.0";

async function sendWhatsApp(payload) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return { skipped: true };
  const response = await fetch(`${graphBase}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`WhatsApp API failed: ${response.status}`);
  return response.json();
}

export function sendWhatsAppText(to, body) {
  return sendWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body }
  });
}

export function sendWhatsAppDocument(to, link, filename = "VKP Technologies.pdf") {
  return sendWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "document",
    document: { link, filename }
  });
}
