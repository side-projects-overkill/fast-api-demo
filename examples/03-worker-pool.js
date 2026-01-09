/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WORKER POOL PATTERN (Production-Ready)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Creating workers for every task is expensive. A Worker Pool maintains
 * a fixed number of pre-spawned workers for efficient task distribution.
 * 
 * This is how libraries like Piscina and workerpool operate.
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { cpus } from 'os';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const CPU_COUNT = cpus().length || 4; // Fallback to 4 if detection fails

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER CODE
// ═══════════════════════════════════════════════════════════════════════════════

if (!isMainThread) {
  // Worker receives tasks via messages
  parentPort.on('message', (task) => {
    let result;
    
    switch (task.type) {
      case 'prime':
        result = countPrimes(task.max);
        break;
      case 'fibonacci':
        result = fibonacci(task.n);
        break;
      case 'factorial':
        result = factorial(task.n);
        break;
      default:
        result = { error: 'Unknown task type' };
    }

    parentPort.postMessage({
      taskId: task.id,
      result,
      workerId: workerData.id
    });
  });

  function countPrimes(max) {
    let count = 0;
    for (let i = 2; i <= max; i++) {
      if (isPrime(i)) count++;
    }
    return count;
  }

  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  function fibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  function factorial(n) {
    let result = 1n;
    for (let i = 2n; i <= BigInt(n); i++) {
      result *= i;
    }
    return result.toString();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER POOL CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class WorkerPool extends EventEmitter {
  constructor(size = CPU_COUNT) {
    super();
    this.size = size;
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.taskCallbacks = new Map();
    this.taskCounter = 0;

    this._initializeWorkers();
  }

  _initializeWorkers() {
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(__filename, {
        workerData: { id: i + 1 }
      });

      worker.on('message', (result) => {
        const callback = this.taskCallbacks.get(result.taskId);
        if (callback) {
          callback.resolve(result);
          this.taskCallbacks.delete(result.taskId);
        }
        this._processNextTask(worker);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${i + 1} error:`, error);
      });

      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  _processNextTask(worker) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      worker.postMessage(task);
    } else {
      this.availableWorkers.push(worker);
    }
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      const taskId = ++this.taskCounter;
      const fullTask = { ...task, id: taskId };
      
      this.taskCallbacks.set(taskId, { resolve, reject });

      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.pop();
        worker.postMessage(fullTask);
      } else {
        this.taskQueue.push(fullTask);
      }
    });
  }

  async shutdown() {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }

  getStats() {
    return {
      totalWorkers: this.size,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      pendingTasks: this.taskCallbacks.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THREAD: DEMO
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         WORKER POOL PATTERN                                   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌───────────────────────────────────────────────────────────────────┐       ║
║   │                           MAIN THREAD                             │       ║
║   │                                                                   │       ║
║   │         ┌─────────────────────────────────────┐                   │       ║
║   │         │           TASK QUEUE                │                   │       ║
║   │         │  [Task1] [Task2] [Task3] [Task4]... │                   │       ║
║   │         └──────────────┬──────────────────────┘                   │       ║
║   │                        │                                          │       ║
║   └────────────────────────┼──────────────────────────────────────────┘       ║
║                            │                                                  ║
║           ┌────────────────┼────────────────┐                                 ║
║           │                │                │                                 ║
║           ▼                ▼                ▼                                 ║
║   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                       ║
║   │   WORKER 1    │ │   WORKER 2    │ │   WORKER 3    │  ... × CPU_COUNT      ║
║   │ (pre-spawned) │ │ (pre-spawned) │ │ (pre-spawned) │                       ║
║   │               │ │               │ │               │                       ║
║   │ ███ Task A    │ │ ███ Task B    │ │ (idle/ready)  │                       ║
║   └───────────────┘ └───────────────┘ └───────────────┘                       ║
║                                                                               ║
║   Benefits:                                                                   ║
║   ✅ Workers pre-spawned (no startup overhead per task)                       ║
║   ✅ Automatic load balancing                                                 ║
║   ✅ Queue management for burst traffic                                       ║
║   ✅ Configurable pool size (default: CPU cores)                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  async function demo() {
    console.log(`📗 DEMO: Worker Pool with ${CPU_COUNT} workers\n`);

    const pool = new WorkerPool(4);
    console.log('   Pool initialized:', pool.getStats());
    console.log('');

    // Submit multiple tasks
    console.log('   Submitting 10 CPU tasks to pool of 4 workers...\n');
    
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(
        pool.execute({
          type: 'prime',
          max: 100000 + i * 10000
        })
      );
    }

    // Simulate main thread responsiveness
    const interval = setInterval(() => {
      console.log('   📨 Main thread still responsive! Queue:', pool.getStats());
    }, 100);

    console.log('   ⏳ Waiting for all tasks to complete...\n');
    const results = await Promise.all(tasks);
    clearInterval(interval);

    console.log('\n   Results:');
    results.forEach((r, i) => {
      console.log(`   Task ${i + 1}: Worker ${r.workerId} found ${r.result} primes`);
    });

    console.log('\n   Final stats:', pool.getStats());
    await pool.shutdown();
    console.log('\n   ✅ Pool shutdown complete\n');

    showProductionExample();
  }

  function showProductionExample() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                  PRODUCTION LIBRARIES FOR WORKER POOLS                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   📦 PISCINA (Recommended by Node.js team)                                    ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   import Piscina from 'piscina';                                              ║
║                                                                               ║
║   const pool = new Piscina({                                                  ║
║     filename: new URL('./worker.mjs', import.meta.url).href,                  ║
║     maxThreads: 4,                                                            ║
║     minThreads: 2                                                             ║
║   });                                                                         ║
║                                                                               ║
║   // Automatically queues and distributes tasks                               ║
║   const result = await pool.run({ data: 'process this' });                    ║
║                                                                               ║
║   ────────────────────────────────────────────────────────────────────────    ║
║                                                                               ║
║   📦 WORKERPOOL                                                               ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   import workerpool from 'workerpool';                                        ║
║                                                                               ║
║   const pool = workerpool.pool('./worker.js', { maxWorkers: 4 });             ║
║   const result = await pool.exec('heavyTask', [arg1, arg2]);                  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  demo();
}

