# Rust Native Addon for Node.js

High-performance prime counter and utilities written in Rust using [napi-rs](https://napi.rs).

## Prerequisites

1. **Rust toolchain**: Install from [rustup.rs](https://rustup.rs)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js**: v14+ recommended

## Build

```bash
# Install dependencies
npm install

# Build the native addon (release mode)
npm run build

# Or build in debug mode
npm run build:debug
```

## Usage

```javascript
const { 
  countPrimes, 
  isPrime, 
  fibonacci, 
  hashPassword, 
  sumArray 
} = require('./index.js');

// Count primes up to 1 million (~25-50x faster than JS)
const count = countPrimes(1000000);
console.log(`Found ${count} primes`);

// Check if a number is prime
console.log(isPrime(17)); // true

// Fibonacci
console.log(fibonacci(50)); // 12586269025

// Hash password (demo - use argon2 in production)
const hash = hashPassword('mypassword', 10000);

// Sum array of numbers
const sum = sumArray([1.5, 2.5, 3.0]);
```

## Test & Benchmark

```bash
npm test
```

## Performance

Typical speedup vs JavaScript:

| Function | Speedup |
|----------|---------|
| countPrimes | 25-50x |
| fibonacci | 10-20x |
| hashPassword | 15-30x |

## Project Structure

```
├── Cargo.toml      # Rust dependencies
├── src/
│   └── lib.rs      # Rust source code
├── build.rs        # napi-rs build script
├── package.json    # Node.js package config
├── index.js        # JavaScript interface
└── test.js         # Test & benchmark script
```

