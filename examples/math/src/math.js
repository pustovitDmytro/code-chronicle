/**
 * calculate facorial of the number
 * @param {number} num
 * @returns {number} facorial of the number
 */
export function factorial(n) {
    return (n > 1) ? n * factorial(n - 1) : 1;
}

/**
 * calculate Fibonacci Sequence
 * @param {number} num
 * @returns {number} Fibonacci number
 */
export function fibonacci(n) {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}
