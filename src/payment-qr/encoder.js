import qrcode from "./vendor/qrcode.mjs";

/** Build a deterministic boolean QR module matrix from a UPI intent URI. */
export function createQrMatrix(value) {
  if (typeof value !== "string" || !value.startsWith("upi://pay?")) throw new Error("Only validated UPI payment intents can be encoded.");
  const qr = qrcode(0, "M");
  qr.addData(value, "Byte");
  qr.make();
  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, row) => Array.from({ length: count }, (_, col) => qr.isDark(row, col)));
}
