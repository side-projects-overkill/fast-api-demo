# Native Addons Examples

This folder contains complete, working examples of Node.js native addons in both **Rust** and **C++**.

## Quick Comparison

| Aspect | Rust (napi-rs) | C++ (node-addon-api) |
|--------|----------------|----------------------|
| **Memory Safety** | ✅ Guaranteed at compile time | ⚠️ Manual management |
| **Performance** | 🚀 Excellent | 🚀 Excellent |
| **Build Tool** | cargo + @napi-rs/cli | node-gyp |
| **Error Handling** | Result<T, E> types | Exceptions |
| **Learning Curve** | Moderate | Steeper |
| **Ecosystem** | Growing rapidly | Mature |
| **Cross-compile** | Easy with napi-rs | Complex |

## Rust Addon (Recommended for new projects)

```bash
cd rust-addon
npm install
npm run build
npm test
```

**Key files:**
- `src/lib.rs` - Rust source code
- `Cargo.toml` - Rust dependencies
- `index.js` - JavaScript interface

## C++ Addon

```bash
cd cpp-addon
npm install  # This also builds
npm test
```

**Key files:**
- `src/prime_counter.cpp` - C++ source code
- `binding.gyp` - node-gyp build config
- `index.js` - JavaScript interface

## Usage in Your Project

```javascript
// After building, use like any npm package
const rustAddon = require('./rust-addon');
const cppAddon = require('./cpp-addon');

// Both provide the same interface
console.log(rustAddon.countPrimes(1000000));
console.log(cppAddon.countPrimes(1000000));

// C++ addon also has async version (non-blocking!)
cppAddon.countPrimesAsync(1000000, (err, result) => {
  console.log('Event loop stayed free!', result);
});
```

## When to Use Native Addons

✅ **Use native addons when:**
- CPU-intensive algorithms (image processing, crypto, compression)
- Need to use existing C/C++/Rust libraries
- Performance is critical (10-100x speedup possible)
- Working with binary data or system APIs

❌ **Don't use when:**
- Simple I/O operations (Node.js already handles these efficiently)
- Quick prototyping (development overhead)
- Need to run in browser (use WebAssembly instead)

## Real-World Examples

| Library | Language | Use Case |
|---------|----------|----------|
| **sharp** | C++ | Image processing |
| **bcrypt** | C++ | Password hashing |
| **better-sqlite3** | C++ | SQLite database |
| **@napi-rs/canvas** | Rust | 2D graphics |
| **swc** | Rust | TypeScript compiler |
| **lightningcss** | Rust | CSS parser |

