/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BENCHMARK: Compare Different Performance Strategies
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This benchmark compares:
 * 1. Blocking (single-threaded) execution
 * 2. Worker Thread execution
 * 3. Simulated Native Module performance
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { cpus } from 'os';

const __filename = fileURLToPath(import.meta.url);
const CPU_COUNT = cpus().length || 4; // Fallback to 4 if detection fails

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER CODE
// ═══════════════════════════════════════════════════════════════════════════════

if (!isMainThread) {
  parentPort.on('message', (task) => {
    const result = countPrimes(task.max);
    parentPort.postMessage({ taskId: task.id, result, workerId: workerData.id });
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THREAD: BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════════

if (isMainThread) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      PERFORMANCE BENCHMARK SUITE                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Comparing different strategies for CPU-intensive tasks:                     ║
║                                                                               ║
║   1. ❌ Blocking      - Single-threaded, blocks event loop                    ║
║   2. ✅ Worker Threads - Parallel execution in background                     ║
║   3. 🚀 Native (sim)  - Simulated native module performance                   ║
║                                                                               ║
║   System: ${CPU_COUNT} CPU cores available                                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  // Shared prime counting function
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // BENCHMARK 1: Blocking (Single-Threaded)
  // ═══════════════════════════════════════════════════════════════════════════════

  async function benchmarkBlocking(tasks) {
    console.log('\n📊 Benchmark 1: BLOCKING (Single-Threaded)\n');
    console.log('   Running all tasks sequentially on main thread...\n');

    const start = performance.now();
    const results = [];

    for (const max of tasks) {
      const taskStart = performance.now();
      const result = countPrimes(max);
      const duration = performance.now() - taskStart;
      results.push({ max, result, duration: duration.toFixed(0) });
      console.log(`   Task (max: ${max.toLocaleString()}): ${result} primes in ${duration.toFixed(0)}ms`);
    }

    const totalTime = performance.now() - start;
    return { method: 'Blocking', totalTime, results };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BENCHMARK 2: Worker Threads
  // ═══════════════════════════════════════════════════════════════════════════════

  async function benchmarkWorkerThreads(tasks) {
    console.log('\n📊 Benchmark 2: WORKER THREADS (Parallel)\n');
    console.log(`   Running ${tasks.length} tasks across ${Math.min(4, CPU_COUNT)} workers...\n`);

    const start = performance.now();
    const workerCount = Math.min(4, CPU_COUNT);
    const workers = [];
    const availableWorkers = [];
    const taskQueue = [...tasks.map((max, i) => ({ id: i, max }))];
    const results = [];
    const callbacks = new Map();

    // Create workers
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(__filename, { workerData: { id: i + 1 } });
      
      worker.on('message', (result) => {
        const task = callbacks.get(result.taskId);
        if (task) {
          task.resolve(result);
          callbacks.delete(result.taskId);
        }
        
        if (taskQueue.length > 0) {
          const nextTask = taskQueue.shift();
          worker.postMessage(nextTask);
        } else {
          availableWorkers.push(worker);
        }
      });

      workers.push(worker);
      availableWorkers.push(worker);
    }

    // Process tasks
    const taskPromises = tasks.map((max, i) => {
      return new Promise((resolve) => {
        callbacks.set(i, { resolve });
      });
    });

    // Start initial tasks
    while (availableWorkers.length > 0 && taskQueue.length > 0) {
      const worker = availableWorkers.pop();
      const task = taskQueue.shift();
      worker.postMessage(task);
    }

    // Wait for all
    const workerResults = await Promise.all(taskPromises);
    const totalTime = performance.now() - start;

    // Display results
    workerResults.forEach((r, i) => {
      console.log(`   Task ${i + 1} (Worker ${r.workerId}): ${r.result} primes`);
    });

    // Cleanup
    await Promise.all(workers.map(w => w.terminate()));

    return { method: 'Worker Threads', totalTime, results: workerResults };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BENCHMARK 3: Simulated Native (estimates native performance)
  // ═══════════════════════════════════════════════════════════════════════════════

  async function benchmarkNativeSimulated(tasks, jsTime) {
    console.log('\n📊 Benchmark 3: NATIVE MODULE (Simulated Estimate)\n');
    console.log('   Native modules (Rust/C++) are typically 10-50x faster...\n');

    // Native is typically 10-50x faster than JS for compute tasks
    const nativeSpeedup = 25;
    const estimatedTime = jsTime / nativeSpeedup;

    console.log(`   Estimated total time: ${estimatedTime.toFixed(0)}ms (${nativeSpeedup}x speedup)`);

    return { 
      method: 'Native (estimated)', 
      totalTime: estimatedTime, 
      speedup: nativeSpeedup,
      note: 'Based on typical Rust/C++ vs JS performance ratios'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RUN ALL BENCHMARKS
  // ═══════════════════════════════════════════════════════════════════════════════

  async function runBenchmarks() {
    // Test workload: 4 prime counting tasks
    const tasks = [200000, 250000, 200000, 250000];
    
    console.log(`   Workload: ${tasks.length} tasks (counting primes up to ${tasks.map(t => t.toLocaleString()).join(', ')})\n`);
    console.log('   ═══════════════════════════════════════════════════════════════\n');

    // Run benchmarks
    const blockingResult = await benchmarkBlocking(tasks);
    const workerResult = await benchmarkWorkerThreads(tasks);
    const nativeResult = await benchmarkNativeSimulated(tasks, blockingResult.totalTime);

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESULTS SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════════

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            BENCHMARK RESULTS                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────┬──────────────┬─────────────┬─────────────────────┐  ║
║   │       METHOD        │  TOTAL TIME  │   SPEEDUP   │   EVENT LOOP        │  ║
║   ├─────────────────────┼──────────────┼─────────────┼─────────────────────┤  ║
║   │ ❌ Blocking         │ ${blockingResult.totalTime.toFixed(0).padStart(8)}ms  │    1.0x     │ ⛔ BLOCKED          │  ║
║   │ ✅ Worker Threads   │ ${workerResult.totalTime.toFixed(0).padStart(8)}ms  │   ${(blockingResult.totalTime / workerResult.totalTime).toFixed(1).padStart(5)}x    │ ✅ FREE             │  ║
║   │ 🚀 Native (est.)    │ ${nativeResult.totalTime.toFixed(0).padStart(8)}ms  │  ${nativeResult.speedup.toFixed(1).padStart(5)}x    │ ✅ FREE             │  ║
║   └─────────────────────┴──────────────┴─────────────┴─────────────────────┘  ║
║                                                                               ║
║   KEY INSIGHTS:                                                               ║
║   • Worker Threads: ${(blockingResult.totalTime / workerResult.totalTime).toFixed(1)}x faster + keeps event loop responsive     ║
║   • Native Modules: ~${nativeResult.speedup}x faster (actual results depend on workload)       ║
║   • Best Practice: Worker Pool + Native Modules for maximum performance       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

    // Visual bar chart
    console.log('\n   Visual Comparison (shorter = faster):');
    console.log('');
    
    const maxTime = blockingResult.totalTime;
    const scale = 50;
    
    const blockingBar = '█'.repeat(Math.round((blockingResult.totalTime / maxTime) * scale));
    const workerBar = '█'.repeat(Math.round((workerResult.totalTime / maxTime) * scale));
    const nativeBar = '█'.repeat(Math.max(1, Math.round((nativeResult.totalTime / maxTime) * scale)));

    console.log(`   Blocking:       ${blockingBar} ${blockingResult.totalTime.toFixed(0)}ms`);
    console.log(`   Worker Threads: ${workerBar} ${workerResult.totalTime.toFixed(0)}ms`);
    console.log(`   Native (est.):  ${nativeBar} ${nativeResult.totalTime.toFixed(0)}ms`);
    console.log('');
  }

  runBenchmarks().catch(console.error);
}

