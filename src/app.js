/**
 * GlutenOff POS composition root.
 * Imports feature initializers and infrastructure, then injects them into the legacy UI shell.
 */
import { createSupabaseClient } from "./data/supabase-client.js";
import { createRepositories } from "./data/repositories.js";
import * as cart from "./domain/cart.js";
import { createMiniXPrinter } from "./printer/minix-ble-printer.js";
import { makeReceiptRaster } from "./receipt/raster.js";
import { printReceipt, buildReceiptLines } from "./receipt/receipt-composer.js";
import { createQrMatrix } from "./payment-qr/encoder.js";
import { buildUpiPaymentUri, validatePaymentQrSettings } from "./payment-qr/upi.js";

const app = globalThis.GlutenOffApp;
if (!app || typeof app.start !== "function") {
  throw new Error("GlutenOff POS startup function was not registered by index.html.");
}

const features = app.features;
if (!features || typeof features.initReceiptAndAdminEnhancements !== "function" || typeof features.initCartAndDiscountEnhancements !== "function") {
  throw new Error("POS feature adapters were not registered before application startup.");
}

features.previewPaymentQr = ({ vpa, payeeName }) => {
  const checked = validatePaymentQrSettings({ payment_qr_enabled: true, payment_qr_vpa: vpa, payment_qr_payee_name: payeeName });
  if (!checked.valid) throw new Error("Enter a valid UPI ID and payee name before previewing.");
  const uri = buildUpiPaymentUri({ order_number: 9999, total: 100 }, checked.value);
  const matrix = createQrMatrix(uri), count = matrix.length, cell = Math.max(2, Math.floor(220 / (count + 8))), quiet = cell * 4, size = count * cell + quiet * 2;
  let rects = "";
  for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (matrix[y][x]) rects += "<rect x=\"" + (quiet + x * cell) + "\" y=\"" + (quiet + y * cell) + "\" width=\"" + cell + "\" height=\"" + cell + "\"/>";
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + size + " " + size + "\" role=\"img\" aria-label=\"UPI payment QR preview\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g fill=\"black\">" + rects + "</g></svg>";
};

const modules = {
  createSupabaseClient, createRepositories, cart, createMiniXPrinter,
  makeReceiptRaster, printReceipt, buildReceiptLines, createQrMatrix,
  repositories: null, printer: null
};

await app.start(createSupabaseClient, {
  modules,
  features,
  initReceiptAndAdminEnhancements: features.initReceiptAndAdminEnhancements,
  initCartAndDiscountEnhancements: features.initCartAndDiscountEnhancements
});
