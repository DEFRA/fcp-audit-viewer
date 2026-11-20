import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const mockGetServiceToken = vi.fn()

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('../../../../../src/auth/get-service-token.js', () => ({ getServiceToken: mockGetServiceToken }))

const { healthCheck } = await import('../../../../../src/common/helpers/health/service-token.js')

describe('service token health check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should pass when a service token is acquired', async () => {
    mockGetServiceToken.mockResolvedValue('Bearer token')

    await healthCheck()

    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: Acquired Entra service token')
  })

  test('should skip when service credentials are not configured', async () => {
    mockGetServiceToken.mockResolvedValue(null)

    await healthCheck()

    expect(mockLogger.info).toHaveBeenCalledWith('Skipping service token health check: Entra service credentials are not configured')
  })

  test('should throw when the service token cannot be acquired', async () => {
    mockGetServiceToken.mockRejectedValue(new Error('Failed to acquire service token: invalid_client'))

    await expect(healthCheck()).rejects.toThrow('invalid_client')
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Health check failed: unable to acquire Entra service token')
  })
})
