/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C++ NATIVE ADDON - Test & Benchmark
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const addon = require('./index.js');

console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    C++ NATIVE ADDON - Test & Benchmark                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

// Test basic functions
console.log('📋 Testing synchronous functions:\n');

console.log(`  isPrime(17) = ${addon.isPrime(17)} (expected: true)`);
console.log(`  isPrime(18) = ${addon.isPrime(18)} (expected: false)`);
console.log(`  fibonacci(20) = ${addon.fibonacci(20)} (expected: 6765)`);
console.log(`  sumArray([1,2,3,4,5]) = ${addon.sumArray([1,2,3,4,5])} (expected: 15)`);
console.log(`  hashPassword('test', 1000) = ${addon.hashPassword('test', 1000)}`);

// Test async function
console.log('\n📋 Testing async function (non-blocking):\n');

addon.countPrimesAsync(100000, (err, result) => {
  console.log(`  countPrimesAsync(100000) = ${result} (callback style)`);
});

// Benchmark
console.log('\n📊 Benchmark: Count primes up to 1,000,000\n');

// JavaScript implementation for comparison
function countPrimesJS(max) {
  let count = 0;
  for (let i = 2; i <= max; i++) {
    if (isPrimeJS(i)) count++;
  }
  return count;
}

function isPrimeJS(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const sqrt = Math.sqrt(n);
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

const MAX = 1000000;

// Benchmark JavaScript
console.log('  Running JavaScript implementation...');
const jsStart = Date.now();
const jsResult = countPrimesJS(MAX);
const jsTime = Date.now() - jsStart;
console.log(`  JavaScript: ${jsResult} primes in ${jsTime}ms`);

// Benchmark C++ (sync)
console.log('  Running C++ implementation (sync)...');
const cppStart = Date.now();
const cppResult = addon.countPrimes(MAX);
const cppTime = Date.now() - cppStart;
console.log(`  C++ (sync): ${cppResult} primes in ${cppTime}ms`);

// Results
const speedup = (jsTime / cppTime).toFixed(1);

setTimeout(() => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              RESULTS                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   JavaScript:  ${String(jsTime).padStart(6)}ms                                                  ║
║   C++ (sync):  ${String(cppTime).padStart(6)}ms                                                  ║
║   Speedup:     ${speedup.padStart(6)}x 🚀                                                 ║
║                                                                               ║
║   KEY FEATURE: countPrimesAsync() runs in worker thread!                      ║
║   This means the event loop stays FREE during computation.                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
}, 100);

