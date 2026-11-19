/**
 * Rejects if the promise does not settle within the timeout.
 *
 * @param {Promise} promise
 * @param {number} timeoutMs
 * @param {string} label - Used in the timeout error message
 */
export async function withTimeout (promise, timeoutMs, label) {
  let timer
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}
