import os from 'os';

export function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (String(net.family).includes('4') && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
