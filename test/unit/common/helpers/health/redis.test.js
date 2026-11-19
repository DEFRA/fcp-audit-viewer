import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const mockClient = { ping: vi.fn(), disconnect: vi.fn() }

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('../../../../../src/common/helpers/redis-client.js', () => ({ buildRedisClient: () => mockClient }))
vi.mock('../../../../../src/config/config.js', () => ({
  config: {
    get: (key) => ({ redis: { host: 'redis' }, 'healthCheck.timeoutMs': 50 })[key]
  }
}))

const { healthCheck } = await import('../../../../../src/common/helpers/health/redis.js')

describe('redis health check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should pass and disconnect when Redis responds to PING', async () => {
    mockClient.ping.mockResolvedValue('PONG')

    await healthCheck()

    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: Connected to Redis')
    expect(mockClient.disconnect).toHaveBeenCalled()
  })

  test('should throw and disconnect when PING fails', async () => {
    mockClient.ping.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(healthCheck()).rejects.toThrow('ECONNREFUSED')
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Health check failed: unable to connect to Redis')
    expect(mockClient.disconnect).toHaveBeenCalled()
  })

  test('should throw when PING does not respond within the timeout', async () => {
    mockClient.ping.mockReturnValue(new Promise(() => {}))

    await expect(healthCheck()).rejects.toThrow('Redis PING timed out after 50ms')
    expect(mockClient.disconnect).toHaveBeenCalled()
  })
})
