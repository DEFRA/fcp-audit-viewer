import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../src/config/config.js'
import { get } from '../../../src/api/get.js'

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.AUDIT_ENDPOINT = endpoint
const path = process.env.AUDIT_PATH

vi.mock('../../../src/common/helpers/logging/logging.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn()
  })
}))

const { mockWithAuthRetry } = vi.hoisted(() => ({
  mockWithAuthRetry: vi.fn((fn) => fn('Bearer mock-token'))
}))

vi.mock('../../../src/api/with-auth-retry.js', () => ({
  withAuthRetry: mockWithAuthRetry
}))

const { createLogger } = await import('../../../src/common/helpers/logging/logger.js')
const mockLogger = createLogger()

describe('get', () => {
  const route = '/__TEST_ROUTE__'

  beforeEach(() => {
    vi.clearAllMocks()
    mockWithAuthRetry.mockImplementation((fn) => fn('Bearer mock-token'))

    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should use env variable to connect to backend service', async () => {
    const mockGet = vi.fn()
    vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

    await get(route)

    expect(mockGet).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token' } }
    )
  })

  test('should not include Authorization header when no token is available', async () => {
    mockWithAuthRetry.mockImplementationOnce((fn) => fn(null))

    const mockGet = vi.fn()
    vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

    await get(route)

    expect(mockGet).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: {} }
    )
  })

  test('should handle error when request fails', async () => {
    const mockLoggerError = vi.fn()
    mockLogger.error = mockLoggerError

    const mockGet = vi.fn().mockRejectedValue(null)
    vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

    await expect(get(route)).rejects.toThrow()

    expect(mockLoggerError).toHaveBeenCalled()
  })
})
