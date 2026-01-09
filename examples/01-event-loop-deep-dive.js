/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE EVENT LOOP DEEP DIVE: Understanding Every Phase
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This is the DEFINITIVE demonstration of how Node.js event loop works.
 * Watch the console output carefully - the ORDER reveals everything.
 * 
 * Run: node examples/01-event-loop-deep-dive.js
 */

import fs from 'fs';
import crypto from 'crypto';

// Configure thread pool size for crypto operations
process.env.UV_THREADPOOL_SIZE = 4;

const start = Date.now();
const elapsed = () => `[${String(Date.now() - start).padStart(4)}ms]`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgRed: '\x1b[41m',
};

const log = (phase, msg, color = colors.white) => {
  console.log(`${colors.dim}${elapsed()}${colors.reset} ${color}${phase.padEnd(20)}${colors.reset} ${msg}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL INTRODUCTION
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗
║                    THE EVENT LOOP DEEP DIVE                                   ║
╠═══════════════════════════════════════════════════════════════════════════════╣${colors.reset}
${colors.dim}║                                                                               ║
║   Watch the execution order carefully - it reveals the event loop phases:     ║
║                                                                               ║
║   ${colors.yellow}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.yellow}│  1. SYNCHRONOUS CODE    │ Runs first, blocks everything            │${colors.reset}${colors.dim}     ║
║   ${colors.yellow}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                     ↓                                         ║
║   ${colors.magenta}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.magenta}│  2. process.nextTick()  │ Microtask queue (highest priority)       │${colors.reset}${colors.dim}     ║
║   ${colors.magenta}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                     ↓                                         ║
║   ${colors.blue}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.blue}│  3. Promise.then()       │ Microtask queue (after nextTick)         │${colors.reset}${colors.dim}     ║
║   ${colors.blue}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                     ↓                                         ║
║   ${colors.green}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.green}│  4. TIMERS PHASE         │ setTimeout, setInterval callbacks        │${colors.reset}${colors.dim}     ║
║   ${colors.green}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                     ↓                                         ║
║   ${colors.cyan}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.cyan}│  5. I/O CALLBACKS         │ fs, network, etc (from thread pool)      │${colors.reset}${colors.dim}     ║
║   ${colors.cyan}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                     ↓                                         ║
║   ${colors.red}┌─────────────────────────────────────────────────────────────────────┐${colors.reset}${colors.dim}     ║
║   ${colors.red}│  6. setImmediate()        │ Check phase (after I/O)                  │${colors.reset}${colors.dim}     ║
║   ${colors.red}└─────────────────────────────────────────────────────────────────────┘${colors.reset}${colors.dim}     ║
║                                                                               ║${colors.reset}
${colors.cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Starting execution...${colors.reset}
${'─'.repeat(80)}
`);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SYNCHRONOUS CODE (Runs immediately, blocks event loop)
// ═══════════════════════════════════════════════════════════════════════════════

log('SYNC', '🟡 Top-level code starts executing...', colors.yellow);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SCHEDULE TIMERS (Will run in Timers Phase)
// ═══════════════════════════════════════════════════════════════════════════════

setTimeout(() => {
  log('TIMER', '⏱️  setTimeout(0ms) - Timer phase', colors.green);
}, 0);

setTimeout(() => {
  log('TIMER', '⏱️  setTimeout(100ms) - Timer phase', colors.green);
}, 100);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SCHEDULE setImmediate (Will run in Check Phase, AFTER I/O)
// ═══════════════════════════════════════════════════════════════════════════════

setImmediate(() => {
  log('IMMEDIATE', '⚡ setImmediate() - Check phase (top-level)', colors.red);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. MICROTASKS (Run between EVERY phase)
// ═══════════════════════════════════════════════════════════════════════════════

process.nextTick(() => {
  log('NEXTTICK', '🔥 process.nextTick() - Microtask (top-level)', colors.magenta);
});

Promise.resolve().then(() => {
  log('PROMISE', '📦 Promise.then() - Microtask (top-level)', colors.blue);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. I/O OPERATION (This is where the magic happens!)
// ═══════════════════════════════════════════════════════════════════════════════

log('SYNC', '📁 Scheduling file read...', colors.yellow);

// Create test file if it doesn't exist
fs.writeFileSync('test-file.txt', 'Hello from Node.js! This demonstrates async I/O.');

fs.readFile('test-file.txt', () => {
  log('I/O CALLBACK', '📁 File read complete! Now inside I/O callback...', colors.cyan);
  
  console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}Inside I/O callback - watch the order change!${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);

  // GENIUS MOVE: Inside I/O callback, setImmediate runs BEFORE setTimeout(0)!
  // This is because we're in the I/O phase, and setImmediate is in the NEXT phase (check)
  // while setTimeout(0) has to wait for the NEXT loop iteration's timer phase
  
  setTimeout(() => {
    log('TIMER', '⏱️  setTimeout(0) - AFTER setImmediate inside I/O!', colors.green);
  }, 0);
  
  setImmediate(() => {
    log('IMMEDIATE', '⚡ setImmediate() - BEFORE setTimeout inside I/O! 🎯', colors.red);
  });

  // Microtasks still run first!
  process.nextTick(() => {
    log('NEXTTICK', '🔥 process.nextTick() - Still runs first!', colors.magenta);
  });

  Promise.resolve().then(() => {
    log('PROMISE', '📦 Promise.then() - After nextTick, before phases', colors.blue);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // 6. CPU-BOUND CRYPTO OPERATIONS (Uses libuv thread pool!)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Starting 4 crypto operations (thread pool size = 4)...${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);

  // These run in parallel in the libuv thread pool!
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    log('CRYPTO', `🔐 Password hash #1 complete`, colors.yellow);
  });
  
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    log('CRYPTO', `🔐 Password hash #2 complete`, colors.yellow);
  });
  
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    log('CRYPTO', `🔐 Password hash #3 complete`, colors.yellow);
  });
  
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    log('CRYPTO', `🔐 Password hash #4 complete`, colors.yellow);
    
    // After all crypto operations
    setTimeout(() => {
      console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
      showInsights();
    }, 100);
  });
  
  // This timer will fire while crypto is running!
  setTimeout(() => {
    log('TIMER', '⏱️  Timer during crypto - event loop NOT blocked!', colors.green);
  }, 50);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MORE SYNC CODE (Still runs before any async!)
// ═══════════════════════════════════════════════════════════════════════════════

log('SYNC', '🟡 More synchronous code...', colors.yellow);
log('SYNC', '🟡 End of synchronous execution', colors.yellow);

console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
console.log(`${colors.bright}Synchronous code complete. Event loop takes over...${colors.reset}`);
console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

function showInsights() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗
║                              KEY INSIGHTS                                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣${colors.reset}
${colors.dim}║                                                                               ║
║   ${colors.bright}1. EXECUTION ORDER RULES:${colors.reset}${colors.dim}                                                    ║
║      • Synchronous code ALWAYS runs first                                     ║
║      • process.nextTick() runs before Promise.then()                          ║
║      • Microtasks run between EVERY event loop phase                          ║
║                                                                               ║
║   ${colors.bright}2. THE GENIUS INSIGHT: setImmediate vs setTimeout(0)${colors.reset}${colors.dim}                        ║
║      • At top level: order is UNPREDICTABLE (depends on timing)               ║
║      • Inside I/O callback: setImmediate ALWAYS runs first! 🎯               ║
║      • Why? I/O phase → Check phase (immediate) → Timer phase (setTimeout)    ║
║                                                                               ║
║   ${colors.bright}3. THREAD POOL MAGIC:${colors.reset}${colors.dim}                                                        ║
║      • crypto.pbkdf2 uses libuv thread pool (default 4 threads)               ║
║      • 4 operations run in TRUE PARALLEL (not blocking event loop!)           ║
║      • Event loop stays free - timers still fire during crypto!               ║
║                                                                               ║
║   ${colors.bright}4. THE PARADOX:${colors.reset}${colors.dim}                                                              ║
║      • Async I/O (fs, network) → Thread pool → Event loop stays free ✅       ║
║      • Sync CPU work in JS → Blocks event loop entirely ❌                    ║
║      • Solution: Worker Threads or Native Modules                             ║
║                                                                               ║${colors.reset}
${colors.cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Next: See the blocking problem and solutions:${colors.reset}
   → node examples/01-blocking-event-loop.js
   → node examples/02-worker-threads-solution.js
`);
}

