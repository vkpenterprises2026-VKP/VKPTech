import PDFDocument from "pdfkit";
import fs from "node:fs";

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

export function createInvoicePdf(filePath, { invoiceNo, order, paymentId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).fillColor("#0f766e").text("VKP Technologies", { continued: false });
    doc.fontSize(10).fillColor("#60706d").text("IT Services | Hardware Sales | CCTV | Networking | Coimbatore");
    doc.moveDown();
    doc.fontSize(16).fillColor("#17201f").text("Tax Invoice");
    doc.fontSize(10).text(`Invoice No: ${invoiceNo}`);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(`Payment ID: ${paymentId}`);
    doc.moveDown();

    doc.fontSize(12).text("Bill To", { underline: true });
    doc.fontSize(10).text(order.customer?.name || "Customer");
    doc.text(order.customer?.phone || "");
    doc.text(order.customer?.email || "");
    doc.moveDown();

    const startY = doc.y + 8;
    doc.fontSize(10).fillColor("#17201f");
    doc.text("Product", 42, startY);
    doc.text("Qty", 300, startY);
    doc.text("Rate", 350, startY);
    doc.text("Amount", 455, startY);
    doc.moveTo(42, startY + 16).lineTo(552, startY + 16).stroke("#dce7e4");
    let y = startY + 28;
    for (const item of order.items) {
      doc.text(item.name, 42, y, { width: 235 });
      doc.text(String(item.qty), 300, y);
      doc.text(money(item.price), 350, y);
      doc.text(money(item.price * item.qty), 455, y);
      y += 28;
    }

    doc.moveTo(42, y).lineTo(552, y).stroke("#dce7e4");
    y += 18;
    doc.text(`Subtotal: ${money(order.totals.subtotal)}`, 380, y);
    doc.text(`GST 18%: ${money(order.totals.gst)}`, 380, y + 18);
    doc.fontSize(13).fillColor("#0f766e").text(`Total: ${money(order.totals.total)}`, 380, y + 42);
    doc.moveDown(4);
    doc.fontSize(9).fillColor("#60706d").text("This is a system generated invoice from VKP Technologies.");

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

export function createCataloguePdf(filePath, products) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(22).fillColor("#0f766e").text("VKP Technologies Product Catalogue");
    doc.fontSize(10).fillColor("#60706d").text("Servers | Laptops | Networking | CCTV | Firewalls | Printers | Accessories");
    doc.moveDown();

    products.forEach((product, index) => {
      if (doc.y > 720) doc.addPage();
      doc.fontSize(12).fillColor("#17201f").text(`${index + 1}. ${product.product_name || product.name}`);
      doc.fontSize(9).fillColor("#60706d").text(`${product.category || "Product"} | SKU: ${product.SKU || product.sku || "NA"}`);
      doc.fontSize(10).fillColor("#0f766e").text(`Starting Price: ${money(product.price)} | Dealer: ${money(product.dealer_price || product.dealerPrice)}`);
      doc.moveDown(0.8);
    });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
