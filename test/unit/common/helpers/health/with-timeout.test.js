import { describe, test, expect } from 'vitest'
import { withTimeout } from '../../../../../src/common/helpers/health/with-timeout.js'

describe('withTimeout', () => {
  test('should resolve with the promise value when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50, 'Thing')).resolves.toBe('ok')
  })

  test('should reject with the promise error when it rejects in time', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 50, 'Thing')).rejects.toThrow('boom')
  })

  test('should reject when the promise does not settle in time', async () => {
    await expect(withTimeout(new Promise(() => {}), 10, 'Thing')).rejects.toThrow('Thing timed out after 10ms')
  })
})
