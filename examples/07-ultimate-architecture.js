/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE ULTIMATE ARCHITECTURE: Main Thread → Worker Pool → Native Core
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This example demonstrates the ideal architecture for high-performance Node.js
 * applications that need to handle both I/O and CPU-intensive tasks.
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const CPU_COUNT = cpus().length || 4; // Fallback to 4 if detection fails

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║              THE ULTIMATE ARCHITECTURE FOR NODE.JS PERFORMANCE                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌───────────────────────────────────────────────────────────────────────┐   ║
║   │                         INCOMING REQUESTS                             │   ║
║   │                    HTTP │ WebSocket │ gRPC                            │   ║
║   └─────────────────────────────────┬─────────────────────────────────────┘   ║
║                                     │                                         ║
║                                     ▼                                         ║
║   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║
║   ┃                       MAIN THREAD (Event Loop)                        ┃   ║
║   ┃  ╔═══════════════════════════════════════════════════════════════╗    ┃   ║
║   ┃  ║  • HTTP Routing & Request Parsing                             ║    ┃   ║
║   ┃  ║  • WebSocket Connection Management                            ║    ┃   ║
║   ┃  ║  • Response Assembly & Streaming                              ║    ┃   ║
║   ┃  ║  • Task Orchestration                                         ║    ┃   ║
║   ┃  ║                                                               ║    ┃   ║
║   ┃  ║  ⚡ MUST STAY LIGHTWEIGHT - No CPU work here!                  ║    ┃   ║
║   ┃  ╚═══════════════════════════════════════════════════════════════╝    ┃   ║
║   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║
║                              │                                                ║
║              ┌───────────────┴───────────────┐                                ║
║              │      postMessage() / IPC      │                                ║
║              │   (Tasks sent to workers)     │                                ║
║              └───────────────┬───────────────┘                                ║
║                              │                                                ║
║   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║
║   ┃                          WORKER POOL                                  ┃   ║
║   ┃  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ┃   ║
║   ┃  │   Worker 1   │ │   Worker 2   │ │   Worker 3   │ │   Worker N   │  ┃   ║
║   ┃  │              │ │              │ │              │ │              │  ┃   ║
║   ┃  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │  ┃   ║
║   ┃  │ │ V8 Heap  │ │ │ │ V8 Heap  │ │ │ │ V8 Heap  │ │ │ │ V8 Heap  │ │  ┃   ║
║   ┃  │ │ (JS CPU  │ │ │ │ (JS CPU  │ │ │ │ (JS CPU  │ │ │ │ (JS CPU  │ │  ┃   ║
║   ┃  │ │  tasks)  │ │ │ │  tasks)  │ │ │ │  tasks)  │ │ │ │  tasks)  │ │  ┃   ║
║   ┃  │ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │  ┃   ║
║   ┃  │      │       │ │      │       │ │      │       │ │      │       │  ┃   ║
║   ┃  │      ▼       │ │      ▼       │ │      ▼       │ │      ▼       │  ┃   ║
║   ┃  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │  ┃   ║
║   ┃  │ │ NATIVE   │ │ │ │ NATIVE   │ │ │ │ NATIVE   │ │ │ │ NATIVE   │ │  ┃   ║
║   ┃  │ │ MODULE   │ │ │ │ MODULE   │ │ │ │ MODULE   │ │ │ │ MODULE   │ │  ┃   ║
║   ┃  │ │ (Rust/C++)│ │ │ │ (Rust/C++)│ │ │ │ (Rust/C++)│ │ │ │ (Rust/C++)│ │  ┃   ║
║   ┃  │ │  🚀🚀🚀  │ │ │ │  🚀🚀🚀  │ │ │ │  🚀🚀🚀  │ │ │ │  🚀🚀🚀  │ │  ┃   ║
║   ┃  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │  ┃   ║
║   ┃  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  ┃   ║
║   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║
║                                                                               ║
║   BENEFITS:                                                                   ║
║   ✅ Main thread stays responsive (handles thousands of connections)          ║
║   ✅ Worker pool provides parallel CPU processing                             ║
║   ✅ Native modules provide maximum computation speed                         ║
║   ✅ Scales across all CPU cores                                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER CODE (Simulates Native Module Integration)
// ═══════════════════════════════════════════════════════════════════════════════

if (!isMainThread) {
  parentPort.on('message', async (task) => {
    const start = performance.now();
    let result;

    switch (task.type) {
      case 'image-resize':
        // Simulates sharp.resize() - native image processing
        result = await simulateImageResize(task.data);
        break;
      
      case 'password-hash':
        // Simulates bcrypt.hash() - native cryptography
        result = await simulatePasswordHash(task.data);
        break;
      
      case 'data-analysis':
        // Simulates heavy data processing
        result = await simulateDataAnalysis(task.data);
        break;
      
      default:
        result = { error: 'Unknown task type' };
    }

    const duration = performance.now() - start;
    parentPort.postMessage({
      taskId: task.id,
      workerId: workerData.id,
      result,
      duration: duration.toFixed(2)
    });
  });

  // Simulated native operations (in reality these would be actual native modules)
  async function simulateImageResize(data) {
    // Simulate CPU work that native sharp would do
    let hash = 0;
    for (let i = 0; i < 1000000; i++) {
      hash = (hash * 31 + i) % 1000000007;
    }
    return {
      originalSize: data.size,
      newSize: { width: data.width, height: data.height },
      format: data.format,
      hash
    };
  }

  async function simulatePasswordHash(data) {
    // Simulate bcrypt native hashing
    let hash = 0;
    for (let i = 0; i < 500000 * data.rounds; i++) {
      hash = (hash * 31 + i) % 1000000007;
    }
    return {
      algorithm: 'bcrypt',
      rounds: data.rounds,
      hash: `$2b$${data.rounds}$${hash.toString(16).padStart(16, '0')}`
    };
  }

  async function simulateDataAnalysis(data) {
    // Simulate heavy data crunching
    const results = [];
    for (let i = 0; i < data.rows; i++) {
      let sum = 0;
      for (let j = 0; j < 1000; j++) {
        sum += Math.sin(i * j) * Math.cos(i + j);
      }
      results.push(sum);
    }
    return {
      rowsProcessed: data.rows,
      avgValue: results.reduce((a, b) => a + b, 0) / results.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THREAD: ULTIMATE ARCHITECTURE DEMO
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  // Worker Pool Implementation
  class UltimateWorkerPool extends EventEmitter {
    constructor(size = CPU_COUNT) {
      super();
      this.size = size;
      this.workers = [];
      this.availableWorkers = [];
      this.taskQueue = [];
      this.taskCallbacks = new Map();
      this.taskCounter = 0;
      this.metrics = {
        tasksProcessed: 0,
        totalDuration: 0
      };

      this._initializeWorkers();
    }

    _initializeWorkers() {
      for (let i = 0; i < this.size; i++) {
        const worker = new Worker(__filename, { workerData: { id: i + 1 } });
        
        worker.on('message', (result) => {
          this.metrics.tasksProcessed++;
          this.metrics.totalDuration += parseFloat(result.duration);
          
          const callback = this.taskCallbacks.get(result.taskId);
          if (callback) {
            callback.resolve(result);
            this.taskCallbacks.delete(result.taskId);
          }
          this._processNextTask(worker);
        });

        worker.on('error', (err) => {
          console.error(`Worker ${i + 1} error:`, err);
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

    getStats() {
      return {
        poolSize: this.size,
        availableWorkers: this.availableWorkers.length,
        queuedTasks: this.taskQueue.length,
        tasksProcessed: this.metrics.tasksProcessed,
        avgDuration: this.metrics.tasksProcessed > 0 
          ? (this.metrics.totalDuration / this.metrics.tasksProcessed).toFixed(2) + 'ms'
          : '0ms'
      };
    }

    async shutdown() {
      await Promise.all(this.workers.map(w => w.terminate()));
    }
  }

  // Simulated Express-like Request Handler
  class RequestHandler {
    constructor(workerPool) {
      this.pool = workerPool;
    }

    // Route: POST /images/resize
    async handleImageResize(req) {
      return this.pool.execute({
        type: 'image-resize',
        data: { size: '5MB', width: 800, height: 600, format: 'webp' }
      });
    }

    // Route: POST /auth/register
    async handlePasswordHash(req) {
      return this.pool.execute({
        type: 'password-hash',
        data: { password: 'userPassword123', rounds: 12 }
      });
    }

    // Route: POST /analytics/process
    async handleDataAnalysis(req) {
      return this.pool.execute({
        type: 'data-analysis',
        data: { rows: 10000 }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEMO: Simulating Production Workload
  // ═══════════════════════════════════════════════════════════════════════════════

  async function runDemo() {
    console.log(`\n📗 DEMO: Ultimate Architecture in Action\n`);
    console.log(`   Initializing worker pool with ${Math.min(4, CPU_COUNT)} workers...\n`);

    const pool = new UltimateWorkerPool(Math.min(4, CPU_COUNT));
    const handler = new RequestHandler(pool);

    // Simulate incoming requests
    console.log('   Simulating production workload:');
    console.log('   • 5 image resize requests');
    console.log('   • 5 password hashing requests');
    console.log('   • 5 data analysis requests\n');

    const startTime = performance.now();

    // Track main thread responsiveness
    let mainThreadChecks = 0;
    const responsiveInterval = setInterval(() => {
      mainThreadChecks++;
      console.log(`   📨 Main thread check #${mainThreadChecks} - RESPONSIVE`);
    }, 100);

    // Fire off all requests in parallel
    const allTasks = [
      // Image processing tasks
      ...Array(5).fill(null).map(() => handler.handleImageResize({})),
      // Password hashing tasks
      ...Array(5).fill(null).map(() => handler.handlePasswordHash({})),
      // Data analysis tasks
      ...Array(5).fill(null).map(() => handler.handleDataAnalysis({}))
    ];

    console.log('   ⏳ Processing all tasks in parallel...\n');

    const results = await Promise.all(allTasks);
    clearInterval(responsiveInterval);

    const totalTime = performance.now() - startTime;

    // Display results
    console.log('\n   ┌─────────────────────────────────────────────────────────────┐');
    console.log('   │                    RESULTS SUMMARY                          │');
    console.log('   ├─────────────────────────────────────────────────────────────┤');
    console.log(`   │  Total tasks processed:      ${results.length.toString().padStart(20)}   │`);
    console.log(`   │  Total time:                 ${totalTime.toFixed(0).padStart(17)}ms   │`);
    console.log(`   │  Main thread responsive:     ${mainThreadChecks.toString().padStart(18)}x   │`);
    console.log(`   │  Avg task duration:          ${pool.getStats().avgDuration.padStart(20)}   │`);
    console.log('   └─────────────────────────────────────────────────────────────┘\n');

    // Show task breakdown
    console.log('   Task Results by Worker:');
    results.forEach((r, i) => {
      const taskType = i < 5 ? 'image' : i < 10 ? 'password' : 'analytics';
      console.log(`   ${taskType.padEnd(10)} | Worker ${r.workerId} | ${r.duration}ms`);
    });

    await pool.shutdown();
    console.log('\n   ✅ Pool shutdown complete\n');

    showRealWorldExample();
  }

  function showRealWorldExample() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    REAL-WORLD IMPLEMENTATION                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   // server.js - Express with Piscina Worker Pool                             ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   import express from 'express';                                              ║
║   import Piscina from 'piscina';                                              ║
║   import sharp from 'sharp';      // Native image processing                  ║
║   import bcrypt from 'bcrypt';    // Native password hashing                  ║
║                                                                               ║
║   const app = express();                                                      ║
║   const pool = new Piscina({                                                  ║
║     filename: new URL('./worker.mjs', import.meta.url).href,                  ║
║     maxThreads: os.cpus().length                                              ║
║   });                                                                         ║
║                                                                               ║
║   // Main thread: Routing only (stays fast!)                                  ║
║   app.post('/images/resize', async (req, res) => {                            ║
║     const result = await pool.run({                                           ║
║       task: 'resize',                                                         ║
║       buffer: req.body,                                                       ║
║       options: { width: 800, format: 'webp' }                                 ║
║     });                                                                       ║
║     res.contentType('image/webp').send(result);                               ║
║   });                                                                         ║
║                                                                               ║
║   ────────────────────────────────────────────────────────────────────────    ║
║                                                                               ║
║   // worker.mjs - Worker with Native Modules                                  ║
║   ────────────────────────────────────────────────────────────────────────    ║
║   import sharp from 'sharp';                                                  ║
║   import bcrypt from 'bcrypt';                                                ║
║                                                                               ║
║   export default async function({ task, ...data }) {                          ║
║     switch (task) {                                                           ║
║       case 'resize':                                                          ║
║         return sharp(data.buffer)                                             ║
║           .resize(data.options.width)                                         ║
║           .toFormat(data.options.format)                                      ║
║           .toBuffer();                                                        ║
║                                                                               ║
║       case 'hash':                                                            ║
║         return bcrypt.hash(data.password, 12);                                ║
║                                                                               ║
║       case 'verify':                                                          ║
║         return bcrypt.compare(data.password, data.hash);                      ║
║     }                                                                         ║
║   }                                                                           ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

    showArchitectureSummary();
  }

  function showArchitectureSummary() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         ARCHITECTURE SUMMARY                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   LAYER 1: MAIN THREAD                                                        ║
║   ─────────────────────────────────────────────────────────────────────────   ║
║   Purpose:  HTTP routing, connection management, response streaming           ║
║   Rules:    NO CPU work! Delegate everything to workers                       ║
║   Tools:    Express, Fastify, Koa (any async framework)                       ║
║                                                                               ║
║   ─────────────────────────────────────────────────────────────────────────   ║
║                                                                               ║
║   LAYER 2: WORKER POOL                                                        ║
║   ─────────────────────────────────────────────────────────────────────────   ║
║   Purpose:  Parallel execution, load balancing, CPU task isolation            ║
║   Rules:    Pre-spawn workers, reuse them, queue tasks                        ║
║   Tools:    Piscina, workerpool, or custom pool                               ║
║                                                                               ║
║   ─────────────────────────────────────────────────────────────────────────   ║
║                                                                               ║
║   LAYER 3: NATIVE CORE                                                        ║
║   ─────────────────────────────────────────────────────────────────────────   ║
║   Purpose:  Maximum performance for compute-heavy operations                  ║
║   Rules:    Use proven native libraries, or write in Rust/C++                 ║
║   Tools:    sharp, bcrypt, better-sqlite3, napi-rs                            ║
║                                                                               ║
║   ═══════════════════════════════════════════════════════════════════════     ║
║                                                                               ║
║   RESULT: Thousands of concurrent connections + CPU-intensive processing      ║
║           with no event loop blocking!                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  runDemo();
}

