import type { ChildProcess } from 'child_process';

import { execSync, spawn } from 'child_process';
import { writeFileSync } from 'fs';
import http from 'http';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EMULATOR_PID_FILE = resolve(__dirname, '.emulator-pid');

const waitForPort = (port: number, timeoutMs = 30_000): Promise<void> =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/' }, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };

    check();
  });

const isPortOpen = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/' }, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.end();
  });

const checkJavaInstalled = (): boolean => {
  try {
    execSync('java -version', { stdio: 'ignore' });

    return true;
  } catch {
    return false;
  }
};

const clearEmulatorData = async (): Promise<void> => {
  await Promise.all([
    fetch(
      'http://127.0.0.1:9099/emulator/v1/projects/demo-preworkout/accounts',
      {
        method: 'DELETE',
      },
    ),
    fetch(
      'http://127.0.0.1:9000/.json?ns=demo-preworkout-default-rtdb&access_token=owner',
      {
        method: 'DELETE',
      },
    ),
  ]);
};

const globalSetup = async () => {
  // Check if emulators are already running (reuse in dev mode)
  const authRunning = await isPortOpen(9099);
  const dbRunning = await isPortOpen(9000);

  if (authRunning && dbRunning) {
    console.log('Firebase emulators already running, reusing.');
    // Clear stale data from previous runs
    await clearEmulatorData();

    return;
  }

  // Verify Java is installed (required by Firebase Emulator Suite)
  if (!checkJavaInstalled()) {
    throw new Error(
      'Java is required for Firebase Emulators. Install JDK 11+ and ensure `java` is on your PATH.\n' +
        'Alternatively, start emulators manually: npx firebase emulators:start --project demo-preworkout',
    );
  }

  console.log('Starting Firebase emulators...');

  const emulatorProcess: ChildProcess = spawn(
    'npx',
    ['firebase', 'emulators:start', '--project', 'demo-preworkout'],
    {
      cwd: resolve(__dirname, '..'),
      stdio: 'pipe',
      shell: true,
      detached: true,
    },
  );

  emulatorProcess.unref();

  // Save PID so teardown can kill it
  if (emulatorProcess.pid) {
    writeFileSync(EMULATOR_PID_FILE, String(emulatorProcess.pid));
  }

  // Wait for Auth and Database emulators
  await Promise.all([waitForPort(9099), waitForPort(9000)]);

  console.log('Firebase emulators ready.');
};

export default globalSetup;
