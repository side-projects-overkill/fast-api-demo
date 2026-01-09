# C++ Native Addon for Node.js

High-performance prime counter and utilities written in C++ using [node-addon-api](https://github.com/nodejs/node-addon-api).

## Prerequisites

1. **Python 3.x**: Required by node-gyp
2. **C++ Compiler**:
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Linux**: GCC (`sudo apt install build-essential`)
   - **Windows**: Visual Studio Build Tools

3. **node-gyp** (global install recommended):
   ```bash
   npm install -g node-gyp
   ```

## Build

```bash
# Install dependencies and build
npm install

# Or just rebuild
npm run build

# Debug build
npm run build:debug

# Clean build artifacts
npm run clean
```

## Usage

```javascript
const addon = require('./index.js');

// Synchronous functions
const count = addon.countPrimes(1000000);  // ~25-50x faster than JS
console.log(`Found ${count} primes`);

console.log(addon.isPrime(17));            // true
console.log(addon.fibonacci(50));          // 12586269025
console.log(addon.sumArray([1, 2, 3]));    // 6
console.log(addon.hashPassword('pass', 1000));

// Async function (NON-BLOCKING - runs in worker thread!)
addon.countPrimesAsync(1000000, (err, result) => {
  console.log(`Found ${result} primes (event loop stayed free!)`);
});

// Promise-based
const result = await addon.countPrimesPromisified(1000000);
```

## Key Feature: Non-Blocking Async

The `countPrimesAsync` function demonstrates how to run CPU-intensive code in a **worker thread**, keeping the Node.js event loop free:

```cpp
class CountPrimesWorker : public Napi::AsyncWorker {
    void Execute() override {
        // This runs in a SEPARATE THREAD!
        for (uint32_t i = 2; i <= max_; i++) {
            if (IsPrimeInternal(i)) result_++;
        }
    }
    
    void OnOK() override {
        // This runs in the main thread after Execute completes
        Callback().Call({Env().Null(), Napi::Number::New(Env(), result_)});
    }
};
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
├── binding.gyp          # node-gyp build configuration
├── src/
│   └── prime_counter.cpp  # C++ source code
├── package.json         # Node.js package config
├── index.js             # JavaScript interface
└── test.js              # Test & benchmark script
```

## Comparison: C++ vs Rust

| Aspect | C++ (node-addon-api) | Rust (napi-rs) |
|--------|---------------------|----------------|
| Performance | Excellent | Excellent |
| Memory Safety | Manual | Guaranteed |
| Build System | node-gyp | cargo + napi |
| Learning Curve | Steeper | Moderate |
| Ecosystem | Mature | Growing |

