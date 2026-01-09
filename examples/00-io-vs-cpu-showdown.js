/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE ULTIMATE SHOWDOWN: I/O vs CPU in Node.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This is the ONE example that demonstrates everything.
 * Watch how Node.js handles I/O beautifully but struggles with CPU tasks.
 * 
 * The genius is in the simplicity - same code, completely different behavior.
 * 
 * Run: node examples/00-io-vs-cpu-showdown.js
 */

import fs from 'fs';
import crypto from 'crypto';

// Thread pool size = 4 (libuv default)
process.env.UV_THREADPOOL_SIZE = 4;

const start = Date.now();
const elapsed = () => `${String(Date.now() - start).padStart(5)}ms`;

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS FOR VISUAL IMPACT
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════════

// Create test file
fs.writeFileSync('test-file.txt', 'Node.js I/O demonstration file content here.');

// Track HTTP request simulation
let requestsBlocked = 0;
let requestsServed = 0;
const requests = [];

// Simulate incoming HTTP requests every 10ms
const httpSimulator = setInterval(() => {
  const requestTime = Date.now();
  requests.push(requestTime);
  
  setImmediate(() => {
    const latency = Date.now() - requestTime;
    requestsServed++;
    
    if (latency > 50) {
      requestsBlocked++;
      console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.bgRed} BLOCKED ${C.reset} Request took ${C.red}${latency}ms${C.reset} - Event loop was stuck!`);
    } else {
      console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.bgGreen} FAST ${C.reset}    Request took ${C.green}${latency}ms${C.reset}`);
    }
  });
}, 50);

// ═══════════════════════════════════════════════════════════════════════════════
// THE SHOWDOWN
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
${C.bold}${C.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗
║              THE ULTIMATE SHOWDOWN: I/O vs CPU in Node.js                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣${C.reset}
${C.dim}║                                                                               ║
║   This demo runs 3 phases while simulating HTTP requests:                     ║
║                                                                               ║
║   ${C.green}PHASE 1: I/O Operations${C.reset}${C.dim}   → Uses thread pool, event loop stays FREE        ║
║   ${C.cyan}PHASE 2: Async Crypto${C.reset}${C.dim}      → Uses thread pool, event loop stays FREE        ║
║   ${C.red}PHASE 3: Sync CPU Work${C.reset}${C.dim}     → BLOCKS the event loop completely!              ║
║                                                                               ║
║   Watch the request latencies - the difference is DRAMATIC!                   ║
║                                                                               ║${C.reset}
${C.cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${C.reset}

${C.bold}Starting HTTP request simulation (1 request every 50ms)...${C.reset}
${'─'.repeat(80)}
`);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: I/O OPERATIONS (Non-blocking - uses thread pool)
// ═══════════════════════════════════════════════════════════════════════════════

setTimeout(() => {
  console.log(`\n${C.bold}${C.green}════════════════════════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.green}PHASE 1: FILE I/O OPERATIONS (5 parallel reads)${C.reset}`);
  console.log(`${C.dim}These use libuv thread pool - event loop stays free!${C.reset}`);
  console.log(`${C.green}════════════════════════════════════════════════════════════════════════════════${C.reset}\n`);

  // 5 parallel file reads - all non-blocking!
  for (let i = 1; i <= 5; i++) {
    const readStart = Date.now();
    fs.readFile('test-file.txt', () => {
      console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.green}📁 File read #${i} complete${C.reset} (${Date.now() - readStart}ms)`);
    });
  }
}, 100);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: ASYNC CRYPTO (Non-blocking - uses thread pool)
// ═══════════════════════════════════════════════════════════════════════════════

setTimeout(() => {
  console.log(`\n${C.bold}${C.cyan}════════════════════════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.cyan}PHASE 2: ASYNC CRYPTO OPERATIONS (4 parallel hashes)${C.reset}`);
  console.log(`${C.dim}pbkdf2 uses thread pool (4 threads) - event loop stays free!${C.reset}`);
  console.log(`${C.cyan}════════════════════════════════════════════════════════════════════════════════${C.reset}\n`);

  // 4 parallel crypto operations - non-blocking!
  for (let i = 1; i <= 4; i++) {
    const cryptoStart = Date.now();
    crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
      console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.cyan}🔐 Crypto hash #${i} complete${C.reset} (${Date.now() - cryptoStart}ms)`);
    });
  }
}, 500);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: SYNC CPU WORK (BLOCKING - the problem!)
// ═══════════════════════════════════════════════════════════════════════════════

setTimeout(() => {
  console.log(`\n${C.bold}${C.red}════════════════════════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.red}PHASE 3: SYNCHRONOUS CPU WORK (Pure JavaScript)${C.reset}`);
  console.log(`${C.dim}This runs on the MAIN THREAD - event loop will be BLOCKED!${C.reset}`);
  console.log(`${C.red}════════════════════════════════════════════════════════════════════════════════${C.reset}\n`);

  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.red}⚠️  Starting CPU-intensive work...${C.reset}`);
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.red}🔴 EVENT LOOP IS NOW BLOCKED!${C.reset}\n`);
  
  // Sync CPU work - BLOCKS everything!
  const cpuStart = Date.now();
  
  // Count primes (CPU-intensive)
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
  
  let primeCount = 0;
  for (let i = 2; i <= 1000000; i++) {
    if (isPrime(i)) primeCount++;
  }
  
  const cpuDuration = Date.now() - cpuStart;
  
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.red}🔴 CPU work done: ${primeCount} primes found in ${cpuDuration}ms${C.reset}`);
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.green}🟢 Event loop is free again!${C.reset}\n`);

}, 1500);

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

setTimeout(() => {
  clearInterval(httpSimulator);
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`
${C.bold}${C.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗
║                              FINAL ANALYSIS                                   ║
╠═══════════════════════════════════════════════════════════════════════════════╣${C.reset}
${C.dim}║                                                                               ║
║   ${C.bold}Requests Served:${C.reset}${C.dim}  ${String(requestsServed).padStart(3)}                                                    ║
║   ${C.bold}${C.red}Requests Blocked:${C.reset}${C.dim} ${String(requestsBlocked).padStart(3)} ${requestsBlocked > 0 ? '← These waited during CPU work!' : ''}                                                    ║
║                                                                               ║${C.reset}
${C.cyan}╠═══════════════════════════════════════════════════════════════════════════════╣${C.reset}
${C.dim}║                                                                               ║
║   ${C.bold}THE GENIUS INSIGHT:${C.reset}${C.dim}                                                            ║
║                                                                               ║
║   ┌──────────────────────────────────────────────────────────────────────┐    ║
║   │  ${C.green}ASYNC I/O + CRYPTO${C.reset}${C.dim}  │  Uses thread pool → Event loop FREE ✅     │    ║
║   │  ${C.red}SYNC CPU (JS)${C.reset}${C.dim}        │  Runs on main thread → Event loop BLOCKED ❌│   ║
║   └──────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
║   ${C.bold}Node.js thread pool handles:${C.reset}${C.dim}                                               ║
║     • fs.readFile, fs.writeFile (file I/O)                                    ║
║     • crypto.pbkdf2, crypto.scrypt (async crypto)                             ║
║     • dns.lookup (DNS resolution)                                             ║
║     • zlib compression                                                        ║
║                                                                               ║
║   ${C.bold}But YOUR JavaScript code runs on main thread:${C.reset}${C.dim}                             ║
║     • for loops, while loops, recursion                                       ║
║     • JSON.parse/stringify (large objects)                                    ║
║     • Image processing in JS                                                  ║
║     • Any compute-heavy algorithm                                             ║
║                                                                               ║${C.reset}
${C.cyan}╠═══════════════════════════════════════════════════════════════════════════════╣${C.reset}
${C.dim}║                                                                               ║
║   ${C.bold}${C.yellow}SOLUTIONS:${C.reset}${C.dim}                                                                     ║
║                                                                               ║
║   1. ${C.bold}Worker Threads${C.reset}${C.dim} - Move JS CPU work to separate threads                   ║
║      const { Worker } = require('worker_threads');                            ║
║                                                                               ║
║   2. ${C.bold}Native Modules${C.reset}${C.dim} - Use Rust/C++ for 10-100x speedup                       ║
║      sharp, bcrypt, better-sqlite3, etc.                                      ║
║                                                                               ║
║   3. ${C.bold}WebAssembly${C.reset}${C.dim} - Portable near-native performance                          ║
║      @ffmpeg/ffmpeg, @duckdb/duckdb-wasm, etc.                                ║
║                                                                               ║${C.reset}
${C.cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${C.reset}

${C.bold}Run the next examples:${C.reset}
   node examples/01-event-loop-deep-dive.js   ${C.dim}# Understand every event loop phase${C.reset}
   node examples/02-worker-threads-solution.js  ${C.dim}# See Worker Threads in action${C.reset}
   npm run benchmark                          ${C.dim}# Compare all approaches${C.reset}
`);

  // Cleanup
  fs.unlinkSync('test-file.txt');
  
}, 2500);

