import os from 'os';

/** Returns the first non-internal IPv4 address, or 127.0.0.1 as fallback. */
export function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      const isIpv4 = net.family === 'IPv4' || net.family === 4;
      if (isIpv4 && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
