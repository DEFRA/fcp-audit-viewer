import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Wreck from '@hapi/wreck'

const mockGetToken = vi.fn()
const mockDropToken = vi.fn()

vi.mock('../../../src/auth/service-token-cache.js', () => ({
  getToken: mockGetToken,
  dropToken: mockDropToken
}))

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn().mockImplementation((key) => {
      if (key === 'backend.endpoint') return 'https://__TEST_ENDPOINT__'
      if (key === 'backend.path') return '/api/v1/audit'
      return undefined
    })
  }
}))

const { getStream } = await import('../../../src/api/get-stream.js')

describe('getStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('requests the correct backend URL', async () => {
    mockGetToken.mockResolvedValue('Bearer mock-token')
    const mockRes = { statusCode: 200 }
    vi.spyOn(Wreck, 'request').mockResolvedValue(mockRes)

    await getStream('/download?conditions=')

    expect(Wreck.request).toHaveBeenCalledWith(
      'GET',
      'https://__TEST_ENDPOINT__/api/v1/audit/download?conditions=',
      expect.any(Object)
    )
  })

  test('includes Authorization header when token is available', async () => {
    mockGetToken.mockResolvedValue('Bearer mock-token')
    const mockRes = { statusCode: 200 }
    vi.spyOn(Wreck, 'request').mockResolvedValue(mockRes)

    await getStream('/download')

    expect(Wreck.request).toHaveBeenCalledWith(
      'GET',
      expect.any(String),
      { headers: { Authorization: 'Bearer mock-token' } }
    )
  })

  test('sends empty headers when no token is available', async () => {
    mockGetToken.mockResolvedValue(null)
    const mockRes = { statusCode: 200 }
    vi.spyOn(Wreck, 'request').mockResolvedValue(mockRes)

    await getStream('/download')

    expect(Wreck.request).toHaveBeenCalledWith(
      'GET',
      expect.any(String),
      { headers: {} }
    )
  })

  test('returns response stream on success', async () => {
    mockGetToken.mockResolvedValue('Bearer mock-token')
    const mockRes = { statusCode: 200, pipe: vi.fn() }
    vi.spyOn(Wreck, 'request').mockResolvedValue(mockRes)

    const result = await getStream('/download')

    expect(result).toBe(mockRes)
  })

  test('drops token and retries once on 401 response', async () => {
    mockGetToken
      .mockResolvedValueOnce('Bearer stale-token')
      .mockResolvedValueOnce('Bearer fresh-token')
    const staleRes = { statusCode: 401 }
    const freshRes = { statusCode: 200 }
    vi.spyOn(Wreck, 'request')
      .mockResolvedValueOnce(staleRes)
      .mockResolvedValueOnce(freshRes)

    const result = await getStream('/download')

    expect(mockDropToken).toHaveBeenCalledOnce()
    expect(Wreck.request).toHaveBeenCalledTimes(2)
    expect(result).toBe(freshRes)
  })

  test('does not retry when no token was used on 401', async () => {
    mockGetToken.mockResolvedValue(null)
    const mockRes = { statusCode: 401 }
    vi.spyOn(Wreck, 'request').mockResolvedValue(mockRes)

    const result = await getStream('/download')

    expect(mockDropToken).not.toHaveBeenCalled()
    expect(Wreck.request).toHaveBeenCalledTimes(1)
    expect(result).toBe(mockRes)
  })
})
