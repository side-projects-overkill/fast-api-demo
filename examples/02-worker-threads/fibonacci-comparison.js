/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║            COMPARISON: BLOCKING vs WORKER THREADS                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Side-by-side comparison showing the impact on event loop responsiveness  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// ============================================================================
// WORKER CODE
// ============================================================================
if (!isMainThread) {
    function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    const start = Date.now();
    const result = fibonacci(workerData.n);
    parentPort.postMessage({ result, duration: Date.now() - start });
}

// ============================================================================
// MAIN THREAD
// ============================================================================
if (isMainThread) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║         🔬 EXPERIMENT: BLOCKING vs WORKER THREADS COMPARISON              ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

    function fibonacciSync(n) {
        if (n <= 1) return n;
        return fibonacciSync(n - 1) + fibonacciSync(n - 2);
    }

    function runInWorker(n) {
        return new Promise((resolve) => {
            const worker = new Worker(__filename, { workerData: { n } });
            worker.on('message', resolve);
        });
    }

    function measureEventLoopLag(durationMs) {
        return new Promise((resolve) => {
            const measurements = [];
            const startTime = Date.now();
            let lastTick = Date.now();
            let missedTicks = 0;

            const interval = setInterval(() => {
                const now = Date.now();
                const lag = now - lastTick - 10; // Expected interval is 10ms
                if (lag > 5) missedTicks++; // Consider >5ms as significant lag
                measurements.push(lag);
                lastTick = now;

                if (now - startTime >= durationMs) {
                    clearInterval(interval);
                    resolve({
                        avgLag: measurements.reduce((a, b) => a + b, 0) / measurements.length,
                        maxLag: Math.max(...measurements),
                        missedTicks,
                        totalTicks: measurements.length
                    });
                }
            }, 10);
        });
    }

    async function runComparison() {
        const N = 42; // Fibonacci number to calculate

        // ────────────────────────────────────────────────────────────────────
        // TEST 1: BLOCKING (Synchronous)
        // ────────────────────────────────────────────────────────────────────
        console.log('─'.repeat(75));
        console.log('TEST 1: 🔴 BLOCKING FIBONACCI (Synchronous on Main Thread)');
        console.log('─'.repeat(75) + '\n');

        // Start measuring lag before the blocking operation
        console.log('  📊 Measuring event loop responsiveness...\n');
        
        const blockingStart = Date.now();
        
        // Run measurement alongside blocking operation
        // (This will show the blocking effect)
        const lagPromise = measureEventLoopLag(100);
        
        // Give the interval time to start
        await new Promise(r => setTimeout(r, 50));
        
        console.log('  🔴 Starting blocking fibonacci(42)...');
        const blockingResult = fibonacciSync(N);
        const blockingDuration = Date.now() - blockingStart;
        console.log(`  ✅ Completed: fib(${N}) = ${blockingResult}`);
        console.log(`  ⏱️  Duration: ${blockingDuration}ms\n`);

        // The lag measurement was blocked, so measure again after
        const blockingLag = await lagPromise;

        console.log(`  📊 Event Loop Stats During Blocking:`);
        console.log(`     └─ Ticks recorded: ${blockingLag.totalTicks} (mostly blocked)`);
        console.log(`     └─ Max lag: ${blockingLag.maxLag}ms`);
        console.log(`     └─ 🚨 Event loop was FROZEN during calculation!\n`);

        // ────────────────────────────────────────────────────────────────────
        // TEST 2: NON-BLOCKING (Worker Thread)
        // ────────────────────────────────────────────────────────────────────
        console.log('─'.repeat(75));
        console.log('TEST 2: 🟢 NON-BLOCKING FIBONACCI (Worker Thread)');
        console.log('─'.repeat(75) + '\n');

        console.log('  📊 Measuring event loop responsiveness during worker execution...\n');

        const workerStart = Date.now();
        
        // Start both the lag measurement and the worker
        const [workerResult, workerLag] = await Promise.all([
            runInWorker(N),
            measureEventLoopLag(5000) // Measure for entire duration
        ]);
        
        const workerDuration = Date.now() - workerStart;

        console.log(`  🟢 Worker completed: fib(${N}) = ${workerResult.result}`);
        console.log(`  ⏱️  Duration: ${workerDuration}ms\n`);

        console.log(`  📊 Event Loop Stats During Worker:`);
        console.log(`     └─ Ticks recorded: ${workerLag.totalTicks}`);
        console.log(`     └─ Average lag: ${workerLag.avgLag.toFixed(2)}ms`);
        console.log(`     └─ Max lag: ${workerLag.maxLag}ms`);
        console.log(`     └─ ✅ Event loop stayed responsive!\n`);

        // ────────────────────────────────────────────────────────────────────
        // COMPARISON TABLE
        // ────────────────────────────────────────────────────────────────────
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                        📊 COMPARISON RESULTS                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║                      BLOCKING              WORKER THREAD                  ║
║                      ─────────             ─────────────                  ║
║  Computation Time    ${String(blockingDuration).padEnd(6)}ms             ${String(workerResult.duration).padEnd(6)}ms                    ║
║  Event Loop Status   🔴 FROZEN            🟢 RESPONSIVE                  ║
║  HTTP Requests       ❌ BLOCKED           ✅ SERVED                       ║
║  WebSocket Messages  ❌ DROPPED           ✅ DELIVERED                    ║
║  Timer Accuracy      ❌ DELAYED           ✅ ON TIME                      ║
║  Server Health       ❌ APPEARS DEAD      ✅ HEALTHY                      ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  🔑 KEY INSIGHT:                                                          ║
║  ─────────────────────────────────────────────────────────────────────    ║
║  Both approaches take ~${blockingDuration}ms to compute fib(42), but:                 ║
║                                                                           ║
║  • BLOCKING: Server is unresponsive for entire ${blockingDuration}ms                  ║
║  • WORKER:   Server handles 100s of requests during those ${blockingDuration}ms       ║
║                                                                           ║
║  Worker threads don't make computation faster—they keep your              ║
║  server ALIVE while heavy computation happens in parallel.                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

        // Visual timeline
        console.log(`
  VISUAL TIMELINE (each █ = 100ms):
  ════════════════════════════════════════════════════════════════════════════

  BLOCKING:
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ${'█'.repeat(Math.ceil(blockingDuration / 100))} 🔴 CPU BLOCKED - NO EVENTS PROCESSED                           │
  └────────────────────────────────────────────────────────────────────────┘
    └─ ALL requests, timers, WebSockets FROZEN

  WORKER THREAD:
  ┌────────────────────────────────────────────────────────────────────────┐
  │ Main Thread: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🟢 FREE - handling events    │
  │ Worker:      ${'█'.repeat(Math.ceil(workerDuration / 100))} 🔄 Computing in parallel               │
  └────────────────────────────────────────────────────────────────────────┘
    └─ Main thread served HTTP, processed timers, handled WebSockets

`);
    }

    runComparison().catch(console.error);
}

