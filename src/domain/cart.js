/** Pure cart pricing and order-item mapping. No DOM, Supabase or printer dependencies. */
export function clampPercent(value) { return Math.min(100, Math.max(0, Number(value) || 0)); }
export function calculateCartTotals(items, billDiscountPercent = 0) {
  const lines = [...items];
  const gross = lines.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const itemDiscount = lines.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity) * clampPercent(item.discountPercent) / 100, 0);
  const afterItemDiscount = Math.max(0, gross - itemDiscount);
  const billDiscount = afterItemDiscount * clampPercent(billDiscountPercent) / 100;
  return { gross, itemDiscount, billDiscount, total: Math.max(0, afterItemDiscount - billDiscount) };
}
export function mapCartToOrderItems(items) {
  return [...items].map(item => {
    const gross = Number(item.unitPrice) * Number(item.quantity);
    const discountAmount = gross * clampPercent(item.discountPercent) / 100;
    return {
      product_id: item.productId,
      variant_id: item.variantId || null,
      product_name: item.name,
      variant_name: item.variantName || null,
      unit_price: Number(item.unitPrice),
      quantity: Number(item.quantity),
      line_total: Number((gross - discountAmount).toFixed(2)),
      discount_percent: clampPercent(item.discountPercent),
      discount_amount: Number(discountAmount.toFixed(2))
    };
  });
}
