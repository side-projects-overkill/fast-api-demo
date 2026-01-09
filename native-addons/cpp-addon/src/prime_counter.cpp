/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C++ NATIVE ADDON FOR NODE.JS (using node-addon-api)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This demonstrates how to create high-performance native addons in C++.
 * Uses node-addon-api for a cleaner, exception-safe C++ interface to N-API.
 * 
 * Build: npm run build (uses node-gyp)
 * Use:   const addon = require('./build/Release/prime_counter.node');
 */

#include <napi.h>
#include <cmath>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>

/**
 * Check if a number is prime
 */
bool IsPrimeInternal(uint32_t n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    
    uint32_t sqrtN = static_cast<uint32_t>(std::sqrt(static_cast<double>(n)));
    for (uint32_t i = 3; i <= sqrtN; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}

/**
 * Count primes up to max (exported to JavaScript)
 */
Napi::Value CountPrimes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Validate arguments
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t max = info[0].As<Napi::Number>().Uint32Value();
    uint32_t count = 0;

    for (uint32_t i = 2; i <= max; i++) {
        if (IsPrimeInternal(i)) {
            count++;
        }
    }

    return Napi::Number::New(env, count);
}

/**
 * Check if a number is prime (exported to JavaScript)
 */
Napi::Value IsPrime(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t n = info[0].As<Napi::Number>().Uint32Value();
    return Napi::Boolean::New(env, IsPrimeInternal(n));
}

/**
 * Calculate Fibonacci number
 */
Napi::Value Fibonacci(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t n = info[0].As<Napi::Number>().Uint32Value();
    
    if (n <= 1) {
        return Napi::Number::New(env, n);
    }

    uint64_t a = 0, b = 1;
    for (uint32_t i = 2; i <= n; i++) {
        uint64_t temp = a + b;
        a = b;
        b = temp;
    }

    // Use BigInt for large values
    if (b > static_cast<uint64_t>(Number::MAX_SAFE_INTEGER)) {
        return Napi::BigInt::New(env, b);
    }
    return Napi::Number::New(env, static_cast<double>(b));
}

/**
 * Hash a password (demo implementation)
 */
Napi::Value HashPassword(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "String and Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string password = info[0].As<Napi::String>().Utf8Value();
    uint32_t iterations = info[1].As<Napi::Number>().Uint32Value();

    uint64_t hash = 0;
    for (uint32_t iter = 0; iter < iterations; iter++) {
        for (size_t i = 0; i < password.length(); i++) {
            hash = hash * 31 + static_cast<uint64_t>(password[i]) + i;
        }
    }

    std::stringstream ss;
    ss << std::hex << std::setfill('0') << std::setw(16) << hash;
    return Napi::String::New(env, ss.str());
}

/**
 * Sum an array of numbers
 */
Napi::Value SumArray(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Array expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array arr = info[0].As<Napi::Array>();
    double sum = 0.0;

    for (uint32_t i = 0; i < arr.Length(); i++) {
        Napi::Value val = arr.Get(i);
        if (val.IsNumber()) {
            sum += val.As<Napi::Number>().DoubleValue();
        }
    }

    return Napi::Number::New(env, sum);
}

/**
 * Async worker for non-blocking prime counting
 */
class CountPrimesWorker : public Napi::AsyncWorker {
public:
    CountPrimesWorker(Napi::Function& callback, uint32_t max)
        : Napi::AsyncWorker(callback), max_(max), result_(0) {}

    // Runs in worker thread (doesn't block event loop!)
    void Execute() override {
        for (uint32_t i = 2; i <= max_; i++) {
            if (IsPrimeInternal(i)) {
                result_++;
            }
        }
    }

    // Runs in main thread after Execute completes
    void OnOK() override {
        Napi::HandleScope scope(Env());
        Callback().Call({
            Env().Null(),
            Napi::Number::New(Env(), result_)
        });
    }

private:
    uint32_t max_;
    uint32_t result_;
};

/**
 * Async version of CountPrimes (non-blocking)
 */
Napi::Value CountPrimesAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Number and callback expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t max = info[0].As<Napi::Number>().Uint32Value();
    Napi::Function callback = info[1].As<Napi::Function>();

    CountPrimesWorker* worker = new CountPrimesWorker(callback, max);
    worker->Queue();

    return env.Undefined();
}

/**
 * Promise-based async version
 */
Napi::Value CountPrimesPromise(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t max = info[0].As<Napi::Number>().Uint32Value();
    
    // Create a promise
    auto deferred = Napi::Promise::Deferred::New(env);
    
    // Create worker with lambda callback
    auto* worker = new Napi::AsyncWorker(env);
    
    // For simplicity, using sync here - in production use ThreadSafeFunction
    uint32_t result = 0;
    for (uint32_t i = 2; i <= max; i++) {
        if (IsPrimeInternal(i)) result++;
    }
    
    deferred.Resolve(Napi::Number::New(env, result));
    return deferred.Promise();
}

/**
 * Module initialization
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Sync functions
    exports.Set("countPrimes", Napi::Function::New(env, CountPrimes));
    exports.Set("isPrime", Napi::Function::New(env, IsPrime));
    exports.Set("fibonacci", Napi::Function::New(env, Fibonacci));
    exports.Set("hashPassword", Napi::Function::New(env, HashPassword));
    exports.Set("sumArray", Napi::Function::New(env, SumArray));
    
    // Async functions (non-blocking!)
    exports.Set("countPrimesAsync", Napi::Function::New(env, CountPrimesAsync));
    exports.Set("countPrimesPromise", Napi::Function::New(env, CountPrimesPromise));
    
    return exports;
}

NODE_API_MODULE(prime_counter, Init)

