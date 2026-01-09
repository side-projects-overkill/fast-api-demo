/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     THE NODE.JS PARADOX - BLOCKED EVENT LOOP              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Node.js excels at I/O operations but struggles with CPU-intensive tasks  ║
 * ║  This example demonstrates how CPU work BLOCKS the entire event loop      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 *  VISUAL: The Blocked Event Loop
 *  ════════════════════════════════════════════════════════════════════════════
 * 
 *     ┌─────────────────────────────────────────────────────────────────────┐
 *     │                         MAIN THREAD                                  │
 *     │  ┌─────────────────────────────────────────────────────────────────┐ │
 *     │  │                      EVENT LOOP                                 │ │
 *     │  │                                                                 │ │
 *     │  │   ╔═══════════════════════════════════════════════════════╗     │ │
 *     │  │   ║  🔴 CPU TASK RUNNING (Fibonacci calculation...)       ║     │ │
 *     │  │   ║     └─→ BLOCKING FOR 3+ SECONDS                       ║     │ │
 *     │  │   ╚═══════════════════════════════════════════════════════╝     │ │
 *     │  │                          ⬇️ BLOCKED                              │ │
 *     │  │   ┌─────────────────────────────────────────────────────────┐   │ │
 *     │  │   │  ⏳ HTTP Request #1     (waiting...)                   │   │ │
 *     │  │   │  ⏳ HTTP Request #2     (waiting...)                   │   │ │
 *     │  │   │  ⏳ Timer callback      (waiting...)                   │   │ │
 *     │  │   │  ⏳ File read complete  (waiting...)                   │   │ │
 *     │  │   │  ⏳ WebSocket message   (waiting...)                   │   │ │
 *     │  │   └─────────────────────────────────────────────────────────┘   │ │
 *     │  │                     CALLBACK QUEUE                              │ │
 *     │  └─────────────────────────────────────────────────────────────────┘ │
 *     └─────────────────────────────────────────────────────────────────────┘
 * 
 *     🚨 PROBLEM: Nothing else can run until CPU task completes!
 * 
 *  ════════════════════════════════════════════════════════════════════════════
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║             🔴 DEMO: CPU-BOUND TASK BLOCKING THE EVENT LOOP               ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// CPU-INTENSIVE FUNCTION: Recursive Fibonacci (intentionally slow)
// ============================================================================
function fibonacciSync(n) {
    if (n <= 1) return n;
    return fibonacciSync(n - 1) + fibonacciSync(n - 2);
}

// ============================================================================
// SIMULATED ASYNC OPERATIONS (These should be fast but will be blocked)
// ============================================================================
function simulateIncomingRequests() {
    console.log('📡 Starting to listen for incoming requests...\n');
    
    // Simulate incoming HTTP requests
    const requestInterval = setInterval(() => {
        const timestamp = new Date().toISOString();
        console.log(`  📨 [${timestamp}] Incoming request received!`);
    }, 100);

    // Simulate a timer that should fire every 500ms
    const timerInterval = setInterval(() => {
        const timestamp = new Date().toISOString();
        console.log(`  ⏰ [${timestamp}] Timer tick!`);
    }, 500);

    return { requestInterval, timerInterval };
}

// ============================================================================
// MAIN DEMONSTRATION
// ============================================================================
async function runBlockingDemo() {
    console.log('─'.repeat(75));
    console.log('PHASE 1: Starting async operations (requests, timers)');
    console.log('─'.repeat(75));
    
    const { requestInterval, timerInterval } = simulateIncomingRequests();

    // Let some async operations run first
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('\n' + '─'.repeat(75));
    console.log('PHASE 2: 🔴 Starting CPU-intensive Fibonacci(42) calculation...');
    console.log('         ⚠️  WATCH: All async operations will FREEZE!');
    console.log('─'.repeat(75) + '\n');
    
    const startTime = Date.now();
    
    // THIS BLOCKS EVERYTHING!
    const result = fibonacciSync(42);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '─'.repeat(75));
    console.log(`PHASE 3: CPU task completed!`);
    console.log(`         Result: fib(42) = ${result}`);
    console.log(`         Duration: ${duration} seconds`);
    console.log('         ✅ Event loop is now unblocked - async ops resume!');
    console.log('─'.repeat(75) + '\n');

    // Let it run a bit more to show recovery
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cleanup
    clearInterval(requestInterval);
    clearInterval(timerInterval);

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                              📊 ANALYSIS                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  • During the ${duration}s CPU task, NO requests/timers were processed     ║
║  • In a real server, this means:                                          ║
║    - All HTTP requests would timeout                                      ║
║    - WebSocket connections would drop                                     ║
║    - Health checks would fail                                             ║
║    - The server appears "dead" to clients                                 ║
║                                                                           ║
║  🔴 This is the Node.js Paradox: Single-threaded means CPU tasks block!  ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

runBlockingDemo();

