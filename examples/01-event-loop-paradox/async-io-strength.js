/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                  THE NODE.JS STRENGTH - ASYNC I/O OPERATIONS              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Node.js shines when handling I/O: file operations, network requests,     ║
 * ║  database queries - all run outside the main thread via libuv!           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 *  VISUAL: The Healthy Event Loop (I/O Operations)
 *  ════════════════════════════════════════════════════════════════════════════
 * 
 *     ┌─────────────────────────────────────────────────────────────────────┐
 *     │                         MAIN THREAD                                  │
 *     │  ┌─────────────────────────────────────────────────────────────────┐ │
 *     │  │                      EVENT LOOP                                 │ │
 *     │  │   ╔═════════════════════════════════════════════════════════╗   │ │
 *     │  │   ║  🟢 READY - Processing callbacks instantly!             ║   │ │
 *     │  │   ╚═════════════════════════════════════════════════════════╝   │ │
 *     │  │                          ⬇️                                      │ │
 *     │  │   [callback] → [callback] → [callback] → [callback]            │ │
 *     │  │        ↓            ↓            ↓            ↓                 │ │
 *     │  │    PROCESS      PROCESS      PROCESS      PROCESS              │ │
 *     │  └─────────────────────────────────────────────────────────────────┘ │
 *     └────────────────────────────┬────────────────────────────────────────┘
 *                                  │
 *                     ┌────────────┴────────────┐
 *                     ▼                         ▼
 *     ┌─────────────────────────┐  ┌─────────────────────────┐
 *     │    LIBUV THREAD POOL    │  │     OS KERNEL (epoll)   │
 *     │  ┌───────────────────┐  │  │  ┌───────────────────┐  │
 *     │  │ 🔄 File Read      │  │  │  │ 🌐 Network I/O    │  │
 *     │  │ 🔄 DNS Lookup     │  │  │  │ 🌐 TCP/UDP        │  │
 *     │  │ 🔄 Crypto ops     │  │  │  │ 🌐 Sockets        │  │
 *     │  │ 🔄 Compression    │  │  │  │ 🌐 Pipes          │  │
 *     │  └───────────────────┘  │  │  └───────────────────┘  │
 *     └─────────────────────────┘  └─────────────────────────┘
 *          (4 threads default)           (Non-blocking)
 * 
 *     ✅ I/O operations run OUTSIDE main thread - event loop stays free!
 * 
 *  ════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          🟢 DEMO: ASYNC I/O - NODE.JS DOING WHAT IT DOES BEST            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// SIMULATED I/O OPERATIONS
// ============================================================================

// Simulate database query (I/O bound)
async function simulateDatabaseQuery(queryName, delayMs) {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return {
        query: queryName,
        duration: Date.now() - start,
        rows: Math.floor(Math.random() * 1000)
    };
}

// Simulate HTTP API call (I/O bound)  
async function simulateApiCall(endpoint, delayMs) {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return {
        endpoint,
        status: 200,
        duration: Date.now() - start,
        data: { success: true }
    };
}

// Simulate file operation (I/O bound)
async function simulateFileOperation(filename, delayMs) {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return {
        file: filename,
        size: Math.floor(Math.random() * 10000),
        duration: Date.now() - start
    };
}

// ============================================================================
// DEMONSTRATION: Concurrent I/O Operations
// ============================================================================

async function demonstrateAsyncIO() {
    console.log('─'.repeat(75));
    console.log('Starting 15 concurrent I/O operations...');
    console.log('─'.repeat(75) + '\n');

    const startTime = Date.now();

    // Track event loop responsiveness
    let tickCount = 0;
    const tickInterval = setInterval(() => {
        tickCount++;
        console.log(`  ⚡ Event loop tick #${tickCount} - still responsive!`);
    }, 100);

    // Launch many concurrent I/O operations
    const operations = [
        // Database queries
        simulateDatabaseQuery('SELECT * FROM users', 500),
        simulateDatabaseQuery('SELECT * FROM orders', 600),
        simulateDatabaseQuery('SELECT * FROM products', 400),
        simulateDatabaseQuery('INSERT INTO logs', 300),
        simulateDatabaseQuery('UPDATE inventory', 550),
        
        // API calls
        simulateApiCall('/api/users', 450),
        simulateApiCall('/api/payments', 700),
        simulateApiCall('/api/notifications', 350),
        simulateApiCall('/api/analytics', 600),
        simulateApiCall('/api/auth/verify', 250),
        
        // File operations
        simulateFileOperation('config.json', 200),
        simulateFileOperation('data.csv', 800),
        simulateFileOperation('logs/app.log', 400),
        simulateFileOperation('cache/temp.dat', 300),
        simulateFileOperation('uploads/image.png', 500),
    ];

    console.log(`  📊 Launched ${operations.length} concurrent I/O operations\n`);

    // Wait for all to complete
    const results = await Promise.all(operations);
    
    clearInterval(tickInterval);

    const totalTime = Date.now() - startTime;

    console.log('\n' + '─'.repeat(75));
    console.log('                         📊 RESULTS');
    console.log('─'.repeat(75));

    // Group and display results
    console.log('\n  🗄️  DATABASE QUERIES:');
    results.slice(0, 5).forEach(r => {
        console.log(`      └─ ${r.query.padEnd(25)} ${r.duration}ms  (${r.rows} rows)`);
    });

    console.log('\n  🌐 API CALLS:');
    results.slice(5, 10).forEach(r => {
        console.log(`      └─ ${r.endpoint.padEnd(25)} ${r.duration}ms  (status: ${r.status})`);
    });

    console.log('\n  📁 FILE OPERATIONS:');
    results.slice(10, 15).forEach(r => {
        console.log(`      └─ ${r.file.padEnd(25)} ${r.duration}ms  (${r.size} bytes)`);
    });

    // Calculate what sequential would have taken
    const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                              📊 PERFORMANCE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Total Operations:     ${operations.length}                                                 ║
║  Concurrent Time:      ${String(totalTime).padEnd(4)}ms  (actual)                            ║
║  Sequential Time:      ${String(sequentialTime).padEnd(4)}ms  (if run one-by-one)                     ║
║  Speed Improvement:    ${(sequentialTime / totalTime).toFixed(1)}x faster!                                    ║
║  Event Loop Ticks:     ${tickCount} (stayed responsive throughout!)                ║
║                                                                           ║
║  🟢 The event loop remained FREE the entire time!                        ║
║     - All I/O ran in libuv thread pool / OS kernel                       ║
║     - Main thread just dispatched & collected results                    ║
║     - Could have handled 1000s of HTTP requests simultaneously           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

// ============================================================================
// VISUAL COMPARISON
// ============================================================================

function showComparison() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🔄 I/O vs CPU: THE PARADOX EXPLAINED                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   I/O OPERATIONS (Node.js excels!)          CPU OPERATIONS (Blocks!)      ║
║   ─────────────────────────────────         ────────────────────────      ║
║   ✅ File read/write                        ❌ Image processing           ║
║   ✅ Database queries                       ❌ Video encoding             ║
║   ✅ HTTP requests                          ❌ Cryptographic hashing      ║
║   ✅ WebSocket connections                  ❌ Data compression           ║
║   ✅ DNS lookups                            ❌ Machine learning           ║
║   ✅ TCP/UDP sockets                        ❌ Complex calculations       ║
║                                                                           ║
║   ┌─────────────────────┐                   ┌─────────────────────┐       ║
║   │   Main Thread       │                   │   Main Thread       │       ║
║   │   ┌─────────────┐   │                   │   ╔═════════════╗   │       ║
║   │   │ 🟢 FREE     │   │                   │   ║ 🔴 BLOCKED  ║   │       ║
║   │   └─────────────┘   │                   │   ╚═════════════╝   │       ║
║   │        ↓            │                   │        ↓            │       ║
║   │   [callback queue]  │                   │   [queue frozen]    │       ║
║   └─────────────────────┘                   └─────────────────────┘       ║
║           │                                                               ║
║           ▼                                                               ║
║   ┌─────────────────────┐                                                 ║
║   │   libuv / Kernel    │                                                 ║
║   │   (handles I/O)     │                                                 ║
║   └─────────────────────┘                                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

showComparison();
await demonstrateAsyncIO();

