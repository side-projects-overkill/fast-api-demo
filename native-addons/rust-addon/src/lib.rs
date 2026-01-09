/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RUST NATIVE ADDON FOR NODE.JS (using napi-rs)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This demonstrates how to create high-performance native addons in Rust.
 * Rust provides memory safety + near-C performance.
 * 
 * Build: npm run build (or cargo build --release)
 * Use:   const { countPrimes } = require('./rust-prime-counter.node');
 */

use napi_derive::napi;

/// Count prime numbers up to a given maximum
/// This is ~25-50x faster than the equivalent JavaScript implementation
#[napi]
pub fn count_primes(max: u32) -> u32 {
    (2..=max).filter(|&n| is_prime(n)).count() as u32
}

/// Check if a number is prime
#[napi]
pub fn is_prime(n: u32) -> bool {
    if n < 2 {
        return false;
    }
    if n == 2 {
        return true;
    }
    if n % 2 == 0 {
        return false;
    }
    let sqrt = (n as f64).sqrt() as u32;
    !(3..=sqrt).step_by(2).any(|i| n % i == 0)
}

/// Fibonacci calculation (recursive with memoization would be even faster)
#[napi]
pub fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    let mut a: u64 = 0;
    let mut b: u64 = 1;
    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}

/// Hash a password using a simple (demo) algorithm
/// In production, use argon2 or bcrypt crate
#[napi]
pub fn hash_password(password: String, iterations: u32) -> String {
    let mut hash: u64 = 0;
    let bytes = password.as_bytes();
    
    for _ in 0..iterations {
        for (i, &byte) in bytes.iter().enumerate() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u64).wrapping_add(i as u64);
        }
    }
    
    format!("{:016x}", hash)
}

/// Process an array of numbers (demonstrates working with JS arrays)
#[napi]
pub fn sum_array(numbers: Vec<f64>) -> f64 {
    numbers.iter().sum()
}

/// Parallel prime counting using Rayon (uncomment and add rayon to Cargo.toml)
/// This demonstrates multi-threaded Rust code
// use rayon::prelude::*;
// 
// #[napi]
// pub fn count_primes_parallel(max: u32) -> u32 {
//     (2..=max).into_par_iter().filter(|&n| is_prime(n)).count() as u32
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_primes() {
        assert_eq!(count_primes(10), 4);  // 2, 3, 5, 7
        assert_eq!(count_primes(100), 25);
    }

    #[test]
    fn test_is_prime() {
        assert!(!is_prime(0));
        assert!(!is_prime(1));
        assert!(is_prime(2));
        assert!(is_prime(3));
        assert!(!is_prime(4));
        assert!(is_prime(5));
    }

    #[test]
    fn test_fibonacci() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
        assert_eq!(fibonacci(10), 55);
        assert_eq!(fibonacci(20), 6765);
    }
}

