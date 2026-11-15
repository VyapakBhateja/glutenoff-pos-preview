const DEFAULTS = Object.freeze({
  payment_qr_enabled: false,
  payment_qr_vpa: "",
  payment_qr_payee_name: "",
  payment_qr_heading: "PAYMENT QR",
  payment_qr_message: "Scan to pay using any UPI app",
  payment_qr_merchant_label: "GlutenOff",
  payment_qr_print_policy: "all_receipts"
});

const VPA_PATTERN = /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/;
const POLICIES = new Set(["all_receipts", "upi_only"]);

export function normalizePaymentQrSettings(settings = {}) {
  const normalized = { ...DEFAULTS, ...settings };
  for (const key of [
    "payment_qr_vpa", "payment_qr_payee_name", "payment_qr_heading",
    "payment_qr_message", "payment_qr_merchant_label"
  ]) normalized[key] = String(normalized[key] ?? "").trim();
  normalized.payment_qr_enabled = normalized.payment_qr_enabled === true;
  if (!POLICIES.has(normalized.payment_qr_print_policy)) {
    normalized.payment_qr_print_policy = DEFAULTS.payment_qr_print_policy;
  }
  return normalized;
}

export function validatePaymentQrSettings(settings = {}) {
  const value = normalizePaymentQrSettings(settings);
  const errors = {};
  if (value.payment_qr_enabled) {
    if (!VPA_PATTERN.test(value.payment_qr_vpa)) errors.payment_qr_vpa = "Enter a valid UPI ID (VPA), for example name@bank.";
    if (!value.payment_qr_payee_name) errors.payment_qr_payee_name = "Payee name is required.";
  }
  if (!POLICIES.has(value.payment_qr_print_policy)) errors.payment_qr_print_policy = "Choose a supported print policy.";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function isPaymentQrEligible(order, settings = {}) {
  const { valid, value } = validatePaymentQrSettings(settings);
  if (!valid || !value.payment_qr_enabled || !order) return false;
  if (value.payment_qr_print_policy === "upi_only" && String(order.payment_method).toLowerCase() !== "upi") return false;
  const amount = Number(order.total);
  return Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Number(order.order_number)) && Number(order.order_number) > 0;
}

export function buildUpiPaymentUri(order, settings = {}) {
  const { valid, errors, value } = validatePaymentQrSettings({ ...settings, payment_qr_enabled: true });
  if (!valid) {
    const error = new Error("Payment QR settings are incomplete or invalid.");
    error.details = errors;
    throw error;
  }
  if (!order || !Number.isSafeInteger(Number(order.order_number)) || Number(order.order_number) <= 0) {
    throw new Error("A saved order with a valid order number is required.");
  }
  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment QR requires a saved order total greater than zero.");
  const params = new URLSearchParams({
    pa: value.payment_qr_vpa,
    pn: value.payment_qr_payee_name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: "GlutenOff Order " + order.order_number,
    tr: String(order.order_number)
  });
  return "upi://pay?" + params.toString();
}

export const PAYMENT_QR_DEFAULTS = DEFAULTS;
