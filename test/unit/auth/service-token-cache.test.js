import { vi, describe, beforeEach, test, expect } from 'vitest'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}

vi.mock('../../../src/common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn(() => mockRedis)
}))

const mockGetServiceToken = vi.fn()
vi.mock('../../../src/auth/get-service-token.js', () => ({
  getServiceToken: mockGetServiceToken
}))

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn(() => ({}))
  }
}))

const { getToken, dropToken } = await import('../../../src/auth/service-token-cache.js')

const CACHE_KEY = 'service-token'
const TTL_SECONDS = 3480

describe('service-token-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.del.mockResolvedValue(1)
    mockGetServiceToken.mockResolvedValue('Bearer new-token')
  })

  describe('getToken', () => {
    test('should return cached token when present in Redis', async () => {
      mockRedis.get.mockResolvedValue('Bearer cached-token')

      const result = await getToken()

      expect(result).toBe('Bearer cached-token')
      expect(mockGetServiceToken).not.toHaveBeenCalled()
    })

    test('should check Redis with the correct cache key', async () => {
      mockRedis.get.mockResolvedValue('Bearer cached-token')

      await getToken()

      expect(mockRedis.get).toHaveBeenCalledWith(CACHE_KEY)
    })

    test('should call getServiceToken on cache miss', async () => {
      await getToken()

      expect(mockGetServiceToken).toHaveBeenCalled()
    })

    test('should store token in Redis with correct TTL on cache miss', async () => {
      await getToken()

      expect(mockRedis.set).toHaveBeenCalledWith(CACHE_KEY, 'Bearer new-token', 'EX', TTL_SECONDS)
    })

    test('should return the newly fetched token on cache miss', async () => {
      const result = await getToken()

      expect(result).toBe('Bearer new-token')
    })

    test('should return null when getServiceToken returns null', async () => {
      mockGetServiceToken.mockResolvedValue(null)

      const result = await getToken()

      expect(result).toBeNull()
    })

    test('should not store in Redis when getServiceToken returns null', async () => {
      mockGetServiceToken.mockResolvedValue(null)

      await getToken()

      expect(mockRedis.set).not.toHaveBeenCalled()
    })
  })

  describe('dropToken', () => {
    test('should delete the token from Redis', async () => {
      await dropToken()

      expect(mockRedis.del).toHaveBeenCalledWith(CACHE_KEY)
    })
  })
})
