/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C++ NATIVE ADDON - JavaScript Interface
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file provides the JavaScript interface to the C++ native addon.
 * After building with `npm run build`, the .node file will be generated.
 */

const path = require('path');

// Try to load the native addon
let nativeAddon;

try {
  // Try to load the release build
  nativeAddon = require('./build/Release/prime_counter.node');
} catch (e1) {
  try {
    // Try debug build
    nativeAddon = require('./build/Debug/prime_counter.node');
  } catch (e2) {
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('Native addon not found! Build it first:');
    console.error('');
    console.error('  cd native-addons/cpp-addon');
    console.error('  npm install');
    console.error('  npm run build');
    console.error('');
    console.error('Requirements:');
    console.error('  - Python 3.x');
    console.error('  - C++ compiler (gcc, clang, or MSVC)');
    console.error('  - node-gyp: npm install -g node-gyp');
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
        let a = 0n, b = 1n;
        for (let i = 2; i <= n; i++) {
          [a, b] = [b, a + b];
        }
        return Number(b);
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
      sumArray: (numbers) => numbers.reduce((a, b) => a + b, 0),
      countPrimesAsync: (max, callback) => {
        console.warn('Using JavaScript fallback (slower)');
        setImmediate(() => {
          let count = 0;
          for (let i = 2; i <= max; i++) {
            if (isPrimeFallback(i)) count++;
          }
          callback(null, count);
        });
      },
      countPrimesPromise: async (max) => {
        console.warn('Using JavaScript fallback (slower)');
        let count = 0;
        for (let i = 2; i <= max; i++) {
          if (isPrimeFallback(i)) count++;
        }
        return count;
      }
    };
  }
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

// Promisify the async callback version
nativeAddon.countPrimesPromisified = (max) => {
  return new Promise((resolve, reject) => {
    nativeAddon.countPrimesAsync(max, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

module.exports = nativeAddon;

