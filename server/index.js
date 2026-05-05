import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import PDFDocument from "pdfkit";
import Razorpay from "razorpay";
import { z } from "zod";
import { db, FieldValue } from "./lib/firebase.js";
import { createInvoicePdf, createCataloguePdf } from "./lib/pdf.js";
import { sendWhatsAppText, sendWhatsAppDocument } from "./lib/whatsapp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
fs.mkdirSync(publicDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 8080);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/files", express.static(publicDir));

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  price: z.number().positive(),
  dealerPrice: z.number().positive().optional(),
  qty: z.number().int().positive().default(1),
  category: z.string().optional()
});

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default("")
});

function invoiceNumber() {
  const now = new Date();
  return `VKP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-6)}`;
}

function calcTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  return { subtotal, gst, total: subtotal + gst };
}

async function getProductBySku(sku) {
  const snap = await db.collection("products").where("sku", "==", sku).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function reduceStock(items, orderId) {
  const batch = db.batch();
  const lowStock = [];

  for (const item of items) {
    if (!item.sku) continue;
    const product = await getProductBySku(item.sku);
    if (!product) continue;
    const nextStock = Number(product.stock_quantity || 0) - item.qty;
    if (nextStock < 0) throw new Error(`Insufficient stock for ${item.sku}`);
    const ref = db.collection("products").doc(product.id);
    batch.update(ref, {
      stock_quantity: FieldValue.increment(-item.qty),
      updated_at: FieldValue.serverTimestamp(),
      last_order_id: orderId
    });
    if (nextStock <= Number(process.env.LOW_STOCK_THRESHOLD || 5)) {
      lowStock.push({ ...product, stock_quantity: nextStock });
    }
  }

  await batch.commit();
  return lowStock;
}

app.get("/health", (_, res) => res.json({ ok: true, service: "vkp-platform-api" }));

app.post("/api/leads", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().optional().default(""),
    interest: z.string().min(2),
    message: z.string().optional().default("")
  });
  const lead = schema.parse(req.body);
  const ref = await db.collection("leads").add({
    ...lead,
    status: "new",
    source: "website",
    next_followup_at: new Date(Date.now() + 10 * 60 * 1000),
    created_at: FieldValue.serverTimestamp()
  });
  await sendWhatsAppText(lead.phone, `Thank you ${lead.name}. VKP Technologies received your ${lead.interest} enquiry. Our team will follow up shortly.`);
  res.status(201).json({ id: ref.id, ok: true });
});

app.post("/api/payments/create-order", async (req, res) => {
  const schema = z.object({
    items: z.array(itemSchema).min(1),
    customer: customerSchema
  });
  const { items, customer } = schema.parse(req.body);
  const totals = calcTotals(items);
  const receipt = `vkp_${Date.now()}`;
  const order = await razorpay.orders.create({
    amount: totals.total * 100,
    currency: "INR",
    receipt,
    notes: { customer_name: customer.name, phone: customer.phone }
  });
  const ref = await db.collection("orders").add({
    receipt,
    razorpay_order_id: order.id,
    customer,
    items,
    totals,
    status: "created",
    payment_status: "pending",
    created_at: FieldValue.serverTimestamp()
  });
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    orderRecordId: ref.id,
    amount: order.amount,
    currency: order.currency
  });
});

app.post("/api/payments/verify", async (req, res) => {
  const schema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    orderRecordId: z.string()
  });
  const data = schema.parse(req.body);
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== data.razorpay_signature) {
    await db.collection("orders").doc(data.orderRecordId).update({
      payment_status: "failed",
      failure_reason: "Invalid payment signature",
      updated_at: FieldValue.serverTimestamp()
    });
    return res.status(400).json({ ok: false, error: "Payment verification failed" });
  }

  const orderRef = db.collection("orders").doc(data.orderRecordId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return res.status(404).json({ ok: false, error: "Order not found" });
  const order = { id: orderSnap.id, ...orderSnap.data() };
  const invoiceNo = invoiceNumber();
  const lowStock = await reduceStock(order.items, order.id);
  const fileName = `${invoiceNo}.pdf`;
  const filePath = path.join(publicDir, fileName);
  await createInvoicePdf(filePath, { invoiceNo, order, paymentId: data.razorpay_payment_id });

  await orderRef.update({
    status: "paid",
    payment_status: "success",
    razorpay_payment_id: data.razorpay_payment_id,
    invoice_no: invoiceNo,
    invoice_url: `/files/${fileName}`,
    low_stock_alerts: lowStock,
    updated_at: FieldValue.serverTimestamp()
  });

  await db.collection("transactions").add({
    order_id: order.id,
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    amount: order.totals.total,
    status: "success",
    created_at: FieldValue.serverTimestamp()
  });

  if (order.customer?.phone) {
    await sendWhatsAppText(order.customer.phone, `Payment received by VKP Technologies. Invoice ${invoiceNo} is ready.`);
    await sendWhatsAppDocument(order.customer.phone, `${process.env.APP_URL || ""}/files/${fileName}`, `Invoice ${invoiceNo}`);
  }

  res.json({ ok: true, invoiceNo, invoiceUrl: `/files/${fileName}`, lowStock });
});

app.post("/api/payments/failure", async (req, res) => {
  const schema = z.object({ orderRecordId: z.string(), reason: z.string().optional() });
  const { orderRecordId, reason } = schema.parse(req.body);
  await db.collection("orders").doc(orderRecordId).update({
    status: "payment_failed",
    payment_status: "failed",
    failure_reason: reason || "Payment failed",
    updated_at: FieldValue.serverTimestamp()
  });
  res.json({ ok: true });
});

app.get("/api/products", async (_, res) => {
  const snap = await db.collection("products").orderBy("category").get();
  res.json(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

app.post("/api/products", async (req, res) => {
  const schema = z.object({
    product_name: z.string().min(2),
    SKU: z.string().min(2),
    category: z.string().min(2),
    price: z.number().positive(),
    dealer_price: z.number().positive(),
    stock_quantity: z.number().int().nonnegative(),
    image: z.string().url().optional()
  });
  const product = schema.parse(req.body);
  const ref = await db.collection("products").add({
    ...product,
    sku: product.SKU,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  });
  res.status(201).json({ id: ref.id, ok: true });
});

app.put("/api/products/:id", async (req, res) => {
  await db.collection("products").doc(req.params.id).update({
    ...req.body,
    updated_at: FieldValue.serverTimestamp()
  });
  res.json({ ok: true });
});

app.delete("/api/products/:id", async (req, res) => {
  await db.collection("products").doc(req.params.id).delete();
  res.json({ ok: true });
});

app.post("/api/users/approve", async (req, res) => {
  const schema = z.object({ uid: z.string(), role: z.enum(["admin", "staff", "dealer"]) });
  const { uid, role } = schema.parse(req.body);
  await db.collection("users").doc(uid).set({
    role,
    approved: true,
    approved_at: FieldValue.serverTimestamp()
  }, { merge: true });
  res.json({ ok: true });
});

app.get("/api/catalogue.pdf", async (_, res) => {
  const snap = await db.collection("products").orderBy("category").get();
  const filePath = path.join(publicDir, "catalogue.pdf");
  await createCataloguePdf(filePath, snap.docs.map((doc) => doc.data()));
  res.download(filePath, "vkp-technologies-catalogue.pdf");
});

app.post("/webhooks/whatsapp", async (req, res) => {
  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  const from = message?.from;
  const text = message?.text?.body?.trim();
  if (!from || !text) return res.sendStatus(200);

  const menu = {
    "1": "Laptop/Desktop",
    "2": "CCTV",
    "3": "Networking",
    "4": "Server",
    "5": "Catalogue"
  };
  const interest = menu[text] || text;
  await db.collection("leads").add({
    name: "WhatsApp Lead",
    phone: from,
    interest,
    source: "whatsapp",
    status: "new",
    next_followup_at: new Date(Date.now() + 10 * 60 * 1000),
    created_at: FieldValue.serverTimestamp()
  });

  if (text === "5") {
    await sendWhatsAppDocument(from, process.env.WHATSAPP_CATALOGUE_PDF, "VKP Technologies Catalogue");
  } else if (menu[text]) {
    await sendWhatsAppText(from, `Thanks. VKP Technologies captured your ${interest} requirement. Please share quantity, location, and preferred budget.`);
  } else {
    await sendWhatsAppText(from, "Welcome to VKP Technologies. Reply 1 Laptop/Desktop, 2 CCTV, 3 Networking, 4 Server, 5 Get Catalogue.");
  }
  res.sendStatus(200);
});

app.get("/webhooks/whatsapp", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.listen(port, () => {
  console.log(`VKP API running on port ${port}`);
});
