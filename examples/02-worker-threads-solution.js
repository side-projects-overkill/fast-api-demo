/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOLUTION A: WORKER THREADS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Worker Threads allow Node.js to run JavaScript in parallel threads,
 * keeping the main event loop free for I/O operations.
 * 
 * This is the PRIMARY solution for CPU-intensive JavaScript operations.
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DIAGRAM
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     SOLUTION A: WORKER THREADS                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌───────────────────────────────────────────────────────────────────┐       ║
║   │                         MAIN THREAD                               │       ║
║   │  ┌─────────────────────────────────────────────────────────────┐  │       ║
║   │  │  EVENT LOOP: Handles I/O, HTTP, timers (stays responsive!)  │  │       ║
║   │  └─────────────────────────────────────────────────────────────┘  │       ║
║   │                              │                                    │       ║
║   │                    ┌─────────┴─────────┐                          │       ║
║   │                    │ postMessage()     │                          │       ║
║   │                    ▼                   ▼                          │       ║
║   └────────────────────┬───────────────────┬──────────────────────────┘       ║
║                        │                   │                                  ║
║   ┌────────────────────┴───┐   ┌───────────┴────────────────┐                 ║
║   │    WORKER THREAD 1     │   │     WORKER THREAD 2        │                 ║
║   │  ┌──────────────────┐  │   │  ┌──────────────────┐      │                 ║
║   │  │ CPU-bound task   │  │   │  │ CPU-bound task   │      │                 ║
║   │  │ (own V8 isolate) │  │   │  │ (own V8 isolate) │      │                 ║
║   │  └──────────────────┘  │   │  └──────────────────┘      │                 ║
║   └────────────────────────┘   └────────────────────────────┘                 ║
║                                                                               ║
║   ✅ Main thread stays responsive                                             ║
║   ✅ True parallel execution on multi-core CPUs                               ║
║   ✅ Can share memory via SharedArrayBuffer                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER CODE (runs in separate thread)
// ═══════════════════════════════════════════════════════════════════════════════

if (!isMainThread) {
  // This code runs inside a Worker Thread
  const { max, workerId } = workerData;
  
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  function countPrimes(max) {
    let count = 0;
    for (let i = 2; i <= max; i++) {
      if (isPrime(i)) count++;
    }
    return count;
  }

  const start = performance.now();
  const result = countPrimes(max);
  const duration = performance.now() - start;

  // Send result back to main thread
  parentPort.postMessage({
    workerId,
    result,
    duration: duration.toFixed(0)
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THREAD CODE
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  
  // Simulates incoming HTTP requests
  function simulateHTTPRequest(id) {
    const start = performance.now();
    return new Promise((resolve) => {
      setImmediate(() => {
        const latency = performance.now() - start;
        resolve({ id, latency: latency.toFixed(2) });
      });
    });
  }

  // Creates a worker thread for CPU task
  function createWorker(max, workerId) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { max, workerId }
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEMO: Parallel CPU Tasks with Responsive Event Loop
  // ═══════════════════════════════════════════════════════════════════════════════

  async function workerThreadDemo() {
    console.log('📗 DEMO: Worker Threads in Action\n');
    console.log('   Starting 4 parallel CPU tasks while handling HTTP requests...\n');

    // Start CPU-intensive tasks in worker threads
    const cpuTasks = [
      createWorker(200000, 1),
      createWorker(200000, 2),
      createWorker(200000, 3),
      createWorker(200000, 4)
    ];

    // Simultaneously handle "HTTP requests" on main thread
    const requestsInterval = setInterval(async () => {
      const result = await simulateHTTPRequest(Date.now() % 1000);
      console.log(`   📨 HTTP Request handled in ${result.latency}ms`);
    }, 50);

    console.log('   ┌────────────────────────────────────────────────┐');
    console.log('   │  MAIN THREAD: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ RESPONSIVE!      │');
    console.log('   │  WORKER 1:    ████████████████ Computing...    │');
    console.log('   │  WORKER 2:    ████████████████ Computing...    │');
    console.log('   │  WORKER 3:    ████████████████ Computing...    │');
    console.log('   │  WORKER 4:    ████████████████ Computing...    │');
    console.log('   └────────────────────────────────────────────────┘\n');

    // Wait for all CPU tasks to complete
    const workerResults = await Promise.all(cpuTasks);
    clearInterval(requestsInterval);

    console.log('\n   Worker Thread Results:');
    workerResults.forEach((r) => {
      console.log(`   Worker ${r.workerId}: Found ${r.result} primes in ${r.duration}ms`);
    });

    console.log('\n   ✅ Main thread stayed responsive while workers computed!\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXAMPLE: Real-World Worker Thread Pattern
  // ═══════════════════════════════════════════════════════════════════════════════

  function showRealWorldExample() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    REAL-WORLD WORKER THREAD PATTERNS                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   // worker-crypto.js - Dedicated worker for password hashing                 ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   import { parentPort } from 'worker_threads';                                ║
║   import crypto from 'crypto';                                                ║
║                                                                               ║
║   parentPort.on('message', ({ password, salt }) => {                          ║
║     const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');    ║
║     parentPort.postMessage({ hash: hash.toString('hex') });                   ║
║   });                                                                         ║
║                                                                               ║
║   ────────────────────────────────────────────────────────────────────────    ║
║                                                                               ║
║   // main.js - Express route using worker                                     ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   app.post('/register', async (req, res) => {                                 ║
║     const worker = new Worker('./worker-crypto.js');                          ║
║                                                                               ║
║     worker.postMessage({                                                      ║
║       password: req.body.password,                                            ║
║       salt: crypto.randomBytes(16).toString('hex')                            ║
║     });                                                                       ║
║                                                                               ║
║     worker.on('message', ({ hash }) => {                                      ║
║       db.saveUser({ email: req.body.email, passwordHash: hash });             ║
║       res.json({ success: true });                                            ║
║     });                                                                       ║
║   });                                                                         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  async function main() {
    await workerThreadDemo();
    showRealWorldExample();
    
    console.log('🔧 Next: See Worker Pool pattern for production use:\n');
    console.log('   → npm run demo:worker-pool\n');
  }

  main();
}

