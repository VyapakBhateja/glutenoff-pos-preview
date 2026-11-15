/** Convert a QR boolean matrix into the POS 384-dot, 1-bit raster format. */
export function renderQrMatrixToRaster(matrix, { width = 384, targetWidth = 346, quietZoneModules = 4, minModuleDots = 3 } = {}) {
  if (!Array.isArray(matrix) || matrix.length < 21 || matrix.some(row => !Array.isArray(row) || row.length !== matrix.length)) {
    throw new Error("QR encoder must return a non-empty square module matrix.");
  }
  if (width !== 384 || targetWidth <= 0 || targetWidth > width || quietZoneModules < 4) {
    throw new Error("Unsupported QR receipt geometry.");
  }
  const matrixSize = matrix.length;
  const totalModules = matrixSize + quietZoneModules * 2;
  const moduleDots = Math.floor(targetWidth / totalModules);
  if (moduleDots < minModuleDots) {
    throw new Error("Payment QR is too dense for reliable thermal printing at the supported width.");
  }
  const symbolDots = totalModules * moduleDots;
  const left = Math.floor((width - symbolDots) / 2);
  const top = 0;
  const height = symbolDots;
  const rowBytes = width / 8;
  const data = new Uint8Array(rowBytes * height);
  for (let y = 0; y < matrixSize; y++) {
    if (matrix[y].some(value => typeof value !== "boolean")) throw new Error("QR matrix modules must be booleans.");
    for (let x = 0; x < matrixSize; x++) {
      if (!matrix[y][x]) continue;
      const startX = left + (x + quietZoneModules) * moduleDots;
      const startY = top + (y + quietZoneModules) * moduleDots;
      for (let dy = 0; dy < moduleDots; dy++) {
        const row = (startY + dy) * rowBytes;
        for (let dx = 0; dx < moduleDots; dx++) {
          const px = startX + dx;
          data[row + (px >> 3)] |= 0x80 >> (px & 7);
        }
      }
    }
  }
  return { data, rowBytes, width, height, moduleDots, symbolDots, left, quietZoneModules };
}

/** Vertically append compatible 384-dot rasters without touching their pixels. */
export function appendReceiptRasters(...sections) {
  const valid = sections.filter(Boolean);
  if (!valid.length) throw new Error("At least one receipt raster section is required.");
  for (const section of valid) {
    if (section.rowBytes !== 48 || section.width !== 384 || !(section.data instanceof Uint8Array) || section.data.length !== section.rowBytes * section.height) {
      throw new Error("Receipt sections must use the POS 384-dot one-bit raster format.");
    }
  }
  const height = valid.reduce((sum, section) => sum + section.height, 0);
  const data = new Uint8Array(48 * height);
  let offset = 0;
  for (const section of valid) {
    data.set(section.data, offset);
    offset += section.data.length;
  }
  return { data, rowBytes: 48, width: 384, height };
}
