/** 384-dot canvas rasterizer; output layout remains 48 bytes per row. */
export function makeReceiptRaster(lines, { documentRef = globalThis.document, headerLines = [], align = "center", indent = 0 } = {}) {
  const W = 384, lineH = 34, pad = 12, all = [...headerLines, ...lines];
  const H = Math.max(100, all.length * lineH + pad * 2);
  const canvas = documentRef.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000"; ctx.font = "bold 24px Arial"; ctx.textBaseline = "top";
  all.forEach((line, n) => {
    const isHeader = n < headerLines.length, textAlign = isHeader ? align : "left";
    const offset = isHeader && textAlign !== "center" ? Math.min(20, Math.max(0, Number(indent) || 0)) * 8 : 0;
    ctx.textAlign = textAlign;
    const x = textAlign === "center" ? W / 2 : textAlign === "right" ? W - pad - offset : pad + offset;
    ctx.fillText(String(line).slice(0, 42), x, pad + n * lineH);
  });
  const rgba = ctx.getImageData(0, 0, W, H).data, rowBytes = W / 8, data = new Uint8Array(rowBytes * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (rgba[i] < 128) data[y * rowBytes + (x >> 3)] |= 128 >> (x & 7);
  }
  return { data, rowBytes, width: W, height: H };
}
