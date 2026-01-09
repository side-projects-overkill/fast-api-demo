/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                  SOLUTION A: WORKER THREAD POOL                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Production-ready pattern: Reusable pool of workers for CPU tasks         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 *  VISUAL: Worker Pool Architecture
 *  ════════════════════════════════════════════════════════════════════════════
 * 
 *                           ┌─────────────────────────┐
 *                           │      Main Thread        │
 *                           │   ┌───────────────────┐ │
 *     [Request 1] ─────────▶│   │   Task Queue     │ │
 *     [Request 2] ─────────▶│   │ ═══════════════  │ │
 *     [Request 3] ─────────▶│   │ [T1][T2][T3]...  │ │
 *     [Request 4] ─────────▶│   └────────┬────────┘ │
 *                           └────────────┼──────────┘
 *                                        │
 *                    ┌───────────────────┼───────────────────┐
 *                    │         WORKER POOL MANAGER           │
 *                    │   ┌───────────────────────────────┐   │
 *                    │   │  Assigns tasks to free workers│   │
 *                    │   │  Manages worker lifecycle      │   │
 *                    │   └───────────────────────────────┘   │
 *                    └───────────────────┬───────────────────┘
 *                                        │
 *          ┌─────────────────┬───────────┴────────────┬─────────────────┐
 *          ▼                 ▼                        ▼                 ▼
 *     ┌─────────┐       ┌─────────┐            ┌─────────┐       ┌─────────┐
 *     │Worker 1 │       │Worker 2 │            │Worker 3 │       │Worker 4 │
 *     │ 🔄 BUSY │       │ 🟢 IDLE │            │ 🔄 BUSY │       │ 🟢 IDLE │
 *     │ Task 1  │       │ Ready   │            │ Task 3  │       │ Ready   │
 *     └─────────┘       └─────────┘            └─────────┘       └─────────┘
 *          │                                        │
 *          └────────────────────┬───────────────────┘
 *                               ▼
 *                    ┌─────────────────────┐
 *                    │   Results Queue     │
 *                    │   → Promise.resolve │
 *                    └─────────────────────┘
 * 
 *  Benefits:
 *  ✅ Worker reuse (no spawn overhead per task)
 *  ✅ Bounded concurrency (prevents resource exhaustion)
 *  ✅ Task queuing (handles bursts gracefully)
 *  ✅ Graceful shutdown
 * 
 *  ════════════════════════════════════════════════════════════════════════════
 */

import { Worker, isMainThread, parentPort } from 'worker_threads';
import { fileURLToPath } from 'url';
import { cpus } from 'os';

const __filename = fileURLToPath(import.meta.url);
const NUM_WORKERS = cpus().length; // One worker per CPU core

// ============================================================================
// WORKER CODE (runs in separate thread)
// ============================================================================
if (!isMainThread) {
    // Worker listens for tasks
    parentPort.on('message', (task) => {
        const { taskId, type, payload } = task;
        
        let result;
        const startTime = Date.now();
        
        switch (type) {
            case 'fibonacci':
                result = fibonacci(payload.n);
                break;
            case 'primeCheck':
                result = isPrime(payload.n);
                break;
            case 'factorial':
                result = factorial(payload.n);
                break;
            case 'hash':
                result = simpleHash(payload.data, payload.iterations);
                break;
            default:
                result = { error: 'Unknown task type' };
        }
        
        parentPort.postMessage({
            taskId,
            type,
            result,
            duration: Date.now() - startTime
        });
    });

    // CPU-intensive functions
    function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    function isPrime(n) {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return false;
        }
        return true;
    }

    function factorial(n) {
        let result = 1n;
        for (let i = 2n; i <= BigInt(n); i++) {
            result *= i;
        }
        return result.toString();
    }

    function simpleHash(data, iterations) {
        let hash = 0;
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < data.length; i++) {
                hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
            }
        }
        return hash;
    }
}

// ============================================================================
// WORKER POOL CLASS
// ============================================================================
class WorkerPool {
    constructor(numWorkers = NUM_WORKERS) {
        this.workers = [];
        this.freeWorkers = [];
        this.taskQueue = [];
        this.taskCallbacks = new Map();
        this.taskIdCounter = 0;
        this.isShuttingDown = false;

        // Create workers
        for (let i = 0; i < numWorkers; i++) {
            this.addWorker(i);
        }

        console.log(`  🏊 Worker Pool initialized with ${numWorkers} workers\n`);
    }

    addWorker(id) {
        const worker = new Worker(__filename);
        worker.id = id;

        worker.on('message', (result) => {
            // Resolve the pending promise
            const callback = this.taskCallbacks.get(result.taskId);
            if (callback) {
                callback.resolve(result);
                this.taskCallbacks.delete(result.taskId);
            }

            // Mark worker as free and process next task
            this.freeWorkers.push(worker);
            this.processQueue();
        });

        worker.on('error', (error) => {
            console.error(`Worker ${id} error:`, error);
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }

    runTask(type, payload) {
        return new Promise((resolve, reject) => {
            if (this.isShuttingDown) {
                reject(new Error('Pool is shutting down'));
                return;
            }

            const taskId = ++this.taskIdCounter;
            const task = { taskId, type, payload };

            this.taskCallbacks.set(taskId, { resolve, reject });
            this.taskQueue.push(task);
            this.processQueue();
        });
    }

    processQueue() {
        while (this.freeWorkers.length > 0 && this.taskQueue.length > 0) {
            const worker = this.freeWorkers.pop();
            const task = this.taskQueue.shift();
            worker.postMessage(task);
        }
    }

    getStats() {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.length - this.freeWorkers.length,
            freeWorkers: this.freeWorkers.length,
            queuedTasks: this.taskQueue.length
        };
    }

    async shutdown() {
        this.isShuttingDown = true;
        await Promise.all(this.workers.map(w => w.terminate()));
        console.log('  🛑 Worker pool shut down\n');
    }
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================
if (isMainThread) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          🏊 DEMO: WORKER THREAD POOL - PRODUCTION PATTERN                ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
    console.log('─'.repeat(75));
    console.log(`Initializing worker pool with ${NUM_WORKERS} workers (one per CPU core)...`);
    console.log('─'.repeat(75) + '\n');

    const pool = new WorkerPool(NUM_WORKERS);

    async function runDemo() {
        const startTime = Date.now();

        // Track event loop responsiveness
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            tickCount++;
            const stats = pool.getStats();
            console.log(`  ⚡ Tick #${tickCount.toString().padStart(2)} | Busy: ${stats.busyWorkers}/${stats.totalWorkers} workers | Queue: ${stats.queuedTasks} tasks`);
        }, 100);

        // Create many tasks (more than workers)
        const tasks = [
            // Fibonacci tasks
            pool.runTask('fibonacci', { n: 38 }),
            pool.runTask('fibonacci', { n: 39 }),
            pool.runTask('fibonacci', { n: 40 }),
            pool.runTask('fibonacci', { n: 41 }),
            
            // Prime checking tasks
            pool.runTask('primeCheck', { n: 999999937 }),
            pool.runTask('primeCheck', { n: 999999929 }),
            
            // Factorial tasks
            pool.runTask('factorial', { n: 10000 }),
            pool.runTask('factorial', { n: 12000 }),
            
            // Hash tasks
            pool.runTask('hash', { data: 'Hello, World!', iterations: 5000000 }),
            pool.runTask('hash', { data: 'Worker Threads Rock!', iterations: 5000000 }),
        ];

        console.log(`  📋 Submitted ${tasks.length} tasks to the pool\n`);

        const results = await Promise.all(tasks);

        clearInterval(tickInterval);

        const totalTime = Date.now() - startTime;

        console.log('\n' + '─'.repeat(75));
        console.log('                         📊 TASK RESULTS');
        console.log('─'.repeat(75) + '\n');

        results.forEach((r, i) => {
            let resultStr = String(r.result);
            if (resultStr.length > 30) {
                resultStr = resultStr.substring(0, 27) + '...';
            }
            console.log(`  ${(i + 1).toString().padStart(2)}. [${r.type.padEnd(10)}] Result: ${resultStr.padEnd(30)} (${r.duration}ms)`);
        });

        const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                              📊 POOL PERFORMANCE                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Pool Size:            ${NUM_WORKERS} workers                                           ║
║  Tasks Completed:      ${tasks.length}                                                  ║
║  Total Time:           ${String(totalTime).padEnd(5)}ms (parallel)                           ║
║  Sum of Task Times:    ${String(sequentialTime).padEnd(5)}ms (sequential equivalent)              ║
║  Parallelization:      ${(sequentialTime / totalTime).toFixed(1)}x speedup                                   ║
║  Event Loop Ticks:     ${tickCount} (main thread stayed responsive!)              ║
║                                                                           ║
║  ✅ Tasks queued when all workers busy                                    ║
║  ✅ Workers reused (no spawn overhead)                                    ║
║  ✅ Bounded concurrency (${NUM_WORKERS} max parallel tasks)                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

        await pool.shutdown();
    }

    runDemo().catch(console.error);
}

