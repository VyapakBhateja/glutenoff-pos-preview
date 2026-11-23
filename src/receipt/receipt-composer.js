import { buildUpiPaymentUri, isPaymentQrEligible } from "../payment-qr/upi.js";
import { renderQrMatrixToRaster, appendReceiptRasters } from "../payment-qr/raster.js";

/** Receipt content and command composition; transport is injected by the caller. */
export function buildReceiptLines(order, items, settings, money) {
  const lines = ["ORDER #" + order.order_number, new Date(order.created_at).toLocaleString("en-IN"), "--------------------------------"];
  items.forEach(item => {
    const variant = item.variant_name ? " · " + item.variant_name : "";
    const discount = Number(item.discount_amount || 0) > 0 ? " (-" + money(item.discount_amount) + ")" : "";
    lines.push(item.product_name + variant + " x" + item.quantity + " " + money(item.line_total) + discount, "");
  });
  lines.push("--------------------------------", "TOTAL                    " + money(order.total));
  String(settings.terms_and_conditions || "").split("\n").forEach(line => lines.push(line));
  lines.push("");
  String(settings.footer_text || "").split("\n").forEach(line => lines.push(line));
  return {
    headerLines: String(settings.receipt_header || settings.business_name || "").split("\n").map(line => line.trimEnd()).filter(Boolean),
    lines,
    align: settings.receipt_header_align || "center",
    indent: settings.receipt_header_indent || 0
  };
}
export async function printReceipt({ order, items, settings, money, rasterize, printer, qrEncoder }) {
  const content = buildReceiptLines(order, items, settings, money);
  let raster = rasterize(content.lines, { headerLines: content.headerLines, align: content.align, indent: content.indent });

  // Compose the optional QR fully before the first BLE write to avoid partial receipts.
  if (isPaymentQrEligible(order, settings)) {
    if (typeof qrEncoder !== "function") throw new Error("The local payment QR encoder is unavailable.");
    const uri = buildUpiPaymentUri(order, settings);
    const qrRaster = renderQrMatrixToRaster(qrEncoder(uri));
    const labelRaster = rasterize(["PAYMENT QR", String(settings.payment_qr_payee_name), "Amount: " + money(order.total), String(settings.payment_qr_message || "Scan to pay using any UPI app"), ""], { headerLines: [], align: "center", indent: 0 });
    raster = appendReceiptRasters(raster, labelRaster, qrRaster);
  }
  const write = printer.writeBytes;
  await write(new Uint8Array([0x10,0xFF,0x40]));
  await write(new Uint8Array([0x10,0xFF,0xF1,0x03]));
  await write(new Uint8Array([0x10,0xFF,0x10,0x00,0x03,0x00]));
  await write(new Uint8Array([0x1D,0x76,0x30,0x00,raster.rowBytes&255,(raster.rowBytes>>8)&255,raster.height&255,(raster.height>>8)&255]));
  await write(raster.data);
  await write(new Uint8Array([0x1B,0x4A,0x64]));
  await write(new Uint8Array([0x10,0xFF,0xF1,0x45]));
}
