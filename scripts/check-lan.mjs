import { execSync } from 'child_process';
import { getLocalIp } from './get-local-ip.mjs';

const ip = getLocalIp();
const ports = [5173, 5174, 5175, 3002];

console.log('\n  Typing Race — LAN connectivity check\n');

console.log(`  Your IP: ${ip}\n`);

for (const port of ports) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Test-NetConnection -ComputerName ${ip} -Port ${port} -WarningAction SilentlyContinue).TcpTestSucceeded"`,
      { encoding: 'utf8' }
    ).trim();
    const ok = out === 'True';
    console.log(`  Port ${port}: ${ok ? 'OPEN' : 'closed/not listening'}`);
  } catch {
    console.log(`  Port ${port}: could not test`);
  }
}

console.log(`
  If ports show OPEN but friends still cannot connect:

  1. Run scripts/open-firewall.bat AS ADMINISTRATOR
  2. Confirm friends are on the SAME Wi-Fi (not mobile data)
  3. Some office/guest Wi-Fi blocks device-to-device traffic
  4. Share the exact URL printed by "npm run dev:lan"
  5. Try from your phone on Wi-Fi (not localhost): http://${ip}:5173
`);
