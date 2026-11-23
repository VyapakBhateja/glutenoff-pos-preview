/** SEZNIK MiniX BLE transport. Protocol constants and chunk pacing are intentionally preserved. */
export const MINIX_SERVICE_UUID = "0000ff00-0000-1000-8000-00805f9b34fb";
export const MINIX_WRITE_UUID = "0000ff02-0000-1000-8000-00805f9b34fb";
export function createMiniXPrinter({ bluetooth = globalThis.navigator?.bluetooth, onStatus = () => {} } = {}) {
  let device = null, characteristic = null;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function connect() {
    if (!bluetooth) throw new Error("Web Bluetooth is unavailable. Open this app in Bluefy.");
    onStatus("Connecting…");
    try {
      device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [MINIX_SERVICE_UUID] });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(MINIX_SERVICE_UUID);
      characteristic = await service.getCharacteristic(MINIX_WRITE_UUID);
      onStatus("Connected");
    } catch (error) { characteristic = null; onStatus("Disconnected"); throw error; }
  }
  function disconnect() { try { device?.gatt?.disconnect(); } catch {} characteristic = null; onStatus("Disconnected"); }
  async function writeBytes(bytes) {
    if (!characteristic) throw new Error("MiniX printer is not connected.");
    for (let offset = 0; offset < bytes.length; offset += 180) {
      await characteristic.writeValue(bytes.slice(offset, offset + 180));
      await sleep(50);
    }
  }
  return { connect, disconnect, writeBytes, isConnected: () => Boolean(characteristic) };
}
