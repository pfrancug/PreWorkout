import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EMULATOR_PID_FILE = resolve(__dirname, '.emulator-pid');

const globalTeardown = async () => {
  if (!existsSync(EMULATOR_PID_FILE)) {
    return;
  }

  const pid = readFileSync(EMULATOR_PID_FILE, 'utf-8').trim();
  console.log(`Stopping Firebase emulators (PID tree: ${pid})...`);

  try {
    // Kill the process tree on Windows
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-Number(pid), 'SIGTERM');
    }
  } catch {
    // Process may already be gone
  }

  unlinkSync(EMULATOR_PID_FILE);
};

export default globalTeardown;
