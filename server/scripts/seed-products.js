import "dotenv/config";
import { db, FieldValue } from "../lib/firebase.js";

const products = [
  ["Dell PowerEdge Tower Server", "VKP-SRV-001", "Servers", 74999, 70499, 7, "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80"],
  ["Business Laptop Intel i5", "VKP-LAP-014", "Laptops & Desktops", 42999, 39999, 19, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"],
  ["Office Desktop Combo", "VKP-DESK-022", "Laptops & Desktops", 24999, 22999, 23, "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=900&q=80"],
  ["24 Port PoE Network Switch", "VKP-NET-031", "Networking", 18999, 17499, 11, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80"],
  ["8 Channel CCTV Installation Kit", "VKP-CCTV-044", "CCTV & Security", 21999, 19999, 15, "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=80"],
  ["SMB UTM Firewall Appliance", "VKP-FW-009", "Firewalls", 32999, 30499, 5, "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=80"],
  ["Office Laser Printer", "VKP-PRN-018", "Printers", 14999, 13799, 12, "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80"],
  ["1KVA UPS Backup System", "VKP-ACC-067", "Accessories", 6999, 6299, 28, "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80"]
];

for (const [product_name, SKU, category, price, dealer_price, stock_quantity, image] of products) {
  const existing = await db.collection("products").where("SKU", "==", SKU).limit(1).get();
  const payload = {
    product_name,
    name: product_name,
    SKU,
    sku: SKU,
    category,
    price,
    dealer_price,
    dealerPrice: dealer_price,
    stock_quantity,
    image,
    updated_at: FieldValue.serverTimestamp()
  };
  if (existing.empty) {
    await db.collection("products").add({ ...payload, created_at: FieldValue.serverTimestamp() });
  } else {
    await existing.docs[0].ref.set(payload, { merge: true });
  }
}

console.log("VKP product catalogue seeded.");
