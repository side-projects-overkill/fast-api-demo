/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    SOLUTION A: WORKER THREADS (BASIC)                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Offload CPU-intensive tasks to parallel threads, keeping main loop free  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 *  VISUAL: Worker Threads Architecture
 *  ════════════════════════════════════════════════════════════════════════════
 * 
 *     ┌─────────────────────────────────────────────────────────────────────┐
 *     │                         MAIN THREAD                                  │
 *     │  ┌─────────────────────────────────────────────────────────────────┐ │
 *     │  │                      EVENT LOOP                                 │ │
 *     │  │   ╔═════════════════════════════════════════════════════════╗   │ │
 *     │  │   ║  🟢 FREE - Handling requests while workers compute!     ║   │ │
 *     │  │   ╚═════════════════════════════════════════════════════════╝   │ │
 *     │  │                                                                 │ │
 *     │  │   [HTTP] → [WS] → [Timer] → [Worker Done!] → [HTTP] → ...     │ │
 *     │  └─────────────────────────────────────────────────────────────────┘ │
 *     └───────────────────────────┬─────────────────────────────────────────┘
 *                                 │
 *          ┌──────────────────────┼──────────────────────┐
 *          │                      │                      │
 *          ▼                      ▼                      ▼
 *     ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
 *     │  WORKER 1   │       │  WORKER 2   │       │  WORKER 3   │
 *     │  ┌───────┐  │       │  ┌───────┐  │       │  ┌───────┐  │
 *     │  │ CPU   │  │       │  │ CPU   │  │       │  │ CPU   │  │
 *     │  │ TASK  │  │       │  │ TASK  │  │       │  │ TASK  │  │
 *     │  └───────┘  │       │  └───────┘  │       │  └───────┘  │
 *     │  fib(40)    │       │  fib(41)    │       │  fib(42)    │
 *     └─────────────┘       └─────────────┘       └─────────────┘
 *          │                      │                      │
 *          └──────────────────────┼──────────────────────┘
 *                                 │
 *                                 ▼
 *                    ┌───────────────────────┐
 *                    │  Results via message  │
 *                    │  passing (postMessage)│
 *                    └───────────────────────┘
 * 
 *  ════════════════════════════════════════════════════════════════════════════
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// ============================================================================
// WORKER CODE (runs in separate thread)
// ============================================================================
if (!isMainThread) {
    // This code runs in the worker thread
    const { taskId, n } = workerData;
    
    // CPU-intensive Fibonacci calculation
    function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    const startTime = Date.now();
    const result = fibonacci(n);
    const duration = Date.now() - startTime;
    
    // Send result back to main thread
    parentPort.postMessage({
        taskId,
        n,
        result,
        duration
    });
}

// ============================================================================
// MAIN THREAD CODE
// ============================================================================
if (isMainThread) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║            🧵 DEMO: WORKER THREADS - OFFLOADING CPU TASKS                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

    // Function to run CPU task in a worker
    function runInWorker(taskId, n) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: { taskId, n }
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

    async function demonstrateWorkers() {
        console.log('─'.repeat(75));
        console.log('Starting CPU tasks in PARALLEL worker threads...');
        console.log('─'.repeat(75) + '\n');

        const startTime = Date.now();

        // Track event loop responsiveness
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            tickCount++;
            console.log(`  ⚡ Event loop tick #${tickCount} - main thread is FREE!`);
        }, 200);

        // Spawn multiple workers for CPU-intensive tasks
        const tasks = [
            runInWorker('Task A', 40),
            runInWorker('Task B', 41),
            runInWorker('Task C', 42),
        ];

        console.log(`  🧵 Spawned ${tasks.length} worker threads for Fibonacci calculations\n`);

        // Wait for all workers to complete
        const results = await Promise.all(tasks);

        clearInterval(tickInterval);

        const totalTime = Date.now() - startTime;

        console.log('\n' + '─'.repeat(75));
        console.log('                         📊 WORKER RESULTS');
        console.log('─'.repeat(75) + '\n');

        results.forEach(r => {
            console.log(`  📦 ${r.taskId}: fib(${r.n}) = ${r.result}`);
            console.log(`      └─ Computed in ${r.duration}ms\n`);
        });

        // Calculate what sequential would have taken
        const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                              📊 PERFORMANCE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Worker Threads Used:  ${tasks.length}                                                   ║
║  Parallel Time:        ${String(totalTime).padEnd(5)}ms  (actual)                            ║
║  Sequential Time:      ${String(sequentialTime).padEnd(5)}ms  (if run one-by-one)                    ║
║  Speed Improvement:    ${(sequentialTime / totalTime).toFixed(1)}x faster!                                    ║
║  Event Loop Ticks:     ${tickCount} (main thread stayed responsive!)              ║
║                                                                           ║
║  🟢 Main thread handled ${tickCount} event loop iterations while workers computed!║
║     - HTTP requests could have been served                                ║
║     - WebSocket messages could have been processed                        ║
║     - Timers fired on schedule                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
    }

    demonstrateWorkers().catch(console.error);
}

