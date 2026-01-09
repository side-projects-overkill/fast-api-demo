/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RUST NATIVE ADDON - JavaScript Interface
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file provides the JavaScript interface to the Rust native addon.
 * After building with `npm run build`, the .node file will be generated.
 */

const path = require('path');

// Try to load the native addon
let nativeAddon;

try {
  // Try platform-specific binary first (created by napi-rs)
  nativeAddon = require('./rust-prime-counter.node');
} catch (e) {
  console.error('═══════════════════════════════════════════════════════════════════');
  console.error('Native addon not found! Build it first:');
  console.error('');
  console.error('  cd native-addons/rust-addon');
  console.error('  npm install');
  console.error('  npm run build');
  console.error('');
  console.error('Requirements: Rust toolchain (https://rustup.rs)');
  console.error('═══════════════════════════════════════════════════════════════════');
  
  // Provide fallback JavaScript implementations
  nativeAddon = {
    countPrimes: (max) => {
      console.warn('Using JavaScript fallback (slower)');
      let count = 0;
      for (let i = 2; i <= max; i++) {
        if (isPrimeFallback(i)) count++;
      }
      return count;
    },
    isPrime: (n) => isPrimeFallback(n),
    fibonacci: (n) => {
      if (n <= 1) return n;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
      }
      return b;
    },
    hashPassword: (password, iterations) => {
      console.warn('Using JavaScript fallback (slower)');
      let hash = 0n;
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < password.length; i++) {
          hash = (hash * 31n + BigInt(password.charCodeAt(i)) + BigInt(i)) % (2n ** 64n);
        }
      }
      return hash.toString(16).padStart(16, '0');
    },
    sumArray: (numbers) => numbers.reduce((a, b) => a + b, 0)
  };
}

function isPrimeFallback(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const sqrt = Math.sqrt(n);
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

module.exports = nativeAddon;

