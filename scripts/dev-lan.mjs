import { writeFileSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { getLocalIp } from './get-local-ip.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ip = getLocalIp();
const serverPort = process.env.PORT || 3002;
const clientPort = process.env.CLIENT_PORT || 5173;

function freePort(port) {
  if (process.platform !== 'win32') return;
  try {
    execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore' }
    );
  } catch {
    // port may already be free
  }
}

freePort(serverPort);
freePort(clientPort);

writeFileSync(
  path.join(root, 'client', '.env'),
  `VITE_SOCKET_URL=http://${ip}:${serverPort}\n`
);

console.log('');
console.log('  Typing Race — LAN mode');
console.log('  ─────────────────────────────────────────');
console.log('');
console.log('  Share this URL with friends on the same Wi-Fi:');
console.log('');
console.log(`    http://${ip}:${clientPort}`);
console.log('');
console.log(`  Socket server: http://${ip}:${serverPort}`);
console.log('');
console.log('  If friends see "not reachable":');
console.log('    1. Right-click scripts/open-firewall.bat -> Run as administrator');
console.log('    2. Make sure they use the SAME Wi-Fi (not mobile data)');
console.log('    3. Run: npm run check:lan');
console.log('');
console.log('  After they open the link, share your room code from the lobby.');
console.log('  ─────────────────────────────────────────');
console.log('');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npm, ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, CLIENT_PORT: String(clientPort) },
});

child.on('exit', (code) => process.exit(code ?? 0));
