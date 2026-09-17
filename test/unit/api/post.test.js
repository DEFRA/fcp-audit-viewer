import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../src/config/config.js'
import { post } from '../../../src/api/post.js'

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

const mockGetTraceId = vi.fn()
vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => mockGetTraceId(),
  withTraceId: (headerName, headers = {}) => {
    const traceId = mockGetTraceId()
    if (traceId) {
      headers[headerName] = traceId
    }
    return headers
  }
}))

const { createLogger } = await import('../../../src/common/helpers/logging/logger.js')
const mockLogger = createLogger()

describe('post', () => {
  const route = '/__TEST_ROUTE__'

  beforeEach(() => {
    vi.clearAllMocks()
    mockWithAuthRetry.mockImplementation((fn) => fn('Bearer mock-token'))
    mockGetTraceId.mockReturnValue(undefined)

    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      if (key === 'tracing.header') return 'x-cdp-request-id'
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('service uses the env variable to connect to backend service', async () => {
    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {})

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token' }, payload: {} }
    )
  })

  test('should not include Authorization header when no token is available', async () => {
    mockWithAuthRetry.mockImplementationOnce((fn) => fn(null))

    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {})

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: {}, payload: {} }
    )
  })

  test('should include X-Audit-User-Id header when userId is provided', async () => {
    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {}, 'user-oid-123')

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token', 'X-Audit-User-Id': 'user-oid-123' }, payload: {} }
    )
  })

  test('should not include X-Audit-User-Id header when userId is not provided', async () => {
    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {})

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token' }, payload: {} }
    )
  })

  test('should include the tracing header when a trace id is available', async () => {
    mockGetTraceId.mockReturnValue('trace-id-789')

    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {})

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token', 'x-cdp-request-id': 'trace-id-789' }, payload: {} }
    )
  })

  test('should not include the tracing header when there is no trace id', async () => {
    const mockPost = vi.fn()
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await post(route, {})

    expect(mockPost).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { headers: { Authorization: 'Bearer mock-token' }, payload: {} }
    )
  })

  test('post function handles error', async () => {
    const mockLoggerError = vi.fn()
    mockLogger.error = mockLoggerError

    const mockPost = vi.fn().mockRejectedValue(new Error('Test error'))
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    await expect(post(route, {})).rejects.toThrow('Test error')

    expect(mockLoggerError).toHaveBeenCalled()
  })
})
