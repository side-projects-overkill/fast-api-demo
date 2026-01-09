/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RUST NATIVE ADDON - Test & Benchmark
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { countPrimes, isPrime, fibonacci, hashPassword, sumArray } = require('./index.js');

console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    RUST NATIVE ADDON - Test & Benchmark                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

// Test basic functions
console.log('📋 Testing functions:\n');

console.log(`  isPrime(17) = ${isPrime(17)} (expected: true)`);
console.log(`  isPrime(18) = ${isPrime(18)} (expected: false)`);
console.log(`  fibonacci(20) = ${fibonacci(20)} (expected: 6765)`);
console.log(`  sumArray([1,2,3,4,5]) = ${sumArray([1,2,3,4,5])} (expected: 15)`);
console.log(`  hashPassword('test', 1000) = ${hashPassword('test', 1000)}`);

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

// Benchmark Rust
console.log('  Running Rust implementation...');
const rustStart = Date.now();
const rustResult = countPrimes(MAX);
const rustTime = Date.now() - rustStart;
console.log(`  Rust:       ${rustResult} primes in ${rustTime}ms`);

// Results
const speedup = (jsTime / rustTime).toFixed(1);
console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              RESULTS                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   JavaScript:  ${String(jsTime).padStart(6)}ms                                                  ║
║   Rust:        ${String(rustTime).padStart(6)}ms                                                  ║
║   Speedup:     ${speedup.padStart(6)}x 🚀                                                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

