import { vi, describe, beforeEach, test, expect } from 'vitest'

const mockGetToken = vi.fn()
const mockDropToken = vi.fn()
vi.mock('../../../src/auth/service-token-cache.js', () => ({
  getToken: mockGetToken,
  dropToken: mockDropToken
}))

const { withAuthRetry } = await import('../../../src/api/with-auth-retry.js')

describe('withAuthRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('Bearer mock-token')
    mockDropToken.mockResolvedValue(undefined)
  })

  test('should call fn with the token from cache', async () => {
    const fn = vi.fn().mockResolvedValue({ res: { statusCode: 200 }, payload: {} })

    await withAuthRetry(fn)

    expect(fn).toHaveBeenCalledWith('Bearer mock-token')
  })

  test('should return the result from fn on success', async () => {
    const expected = { res: { statusCode: 200 }, payload: { data: 'test' } }
    const fn = vi.fn().mockResolvedValue(expected)

    const result = await withAuthRetry(fn)

    expect(result).toEqual(expected)
  })

  test('should not call dropToken on a successful response', async () => {
    const fn = vi.fn().mockResolvedValue({ res: { statusCode: 200 }, payload: {} })

    await withAuthRetry(fn)

    expect(mockDropToken).not.toHaveBeenCalled()
  })

  test('should call dropToken and retry fn when response is 401 and token was present', async () => {
    const freshToken = 'Bearer fresh-token'
    mockGetToken
      .mockResolvedValueOnce('Bearer mock-token')
      .mockResolvedValueOnce(freshToken)

    const fn = vi.fn()
      .mockResolvedValueOnce({ res: { statusCode: 401 }, payload: null })
      .mockResolvedValueOnce({ res: { statusCode: 200 }, payload: {} })

    await withAuthRetry(fn)

    expect(mockDropToken).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(2, freshToken)
  })

  test('should return the retry result after a 401', async () => {
    const retryResult = { res: { statusCode: 200 }, payload: { ok: true } }
    mockGetToken
      .mockResolvedValueOnce('Bearer mock-token')
      .mockResolvedValueOnce('Bearer fresh-token')

    const fn = vi.fn()
      .mockResolvedValueOnce({ res: { statusCode: 401 }, payload: null })
      .mockResolvedValueOnce(retryResult)

    const result = await withAuthRetry(fn)

    expect(result).toEqual(retryResult)
  })

  test('should not retry when response is 401 but token was null', async () => {
    mockGetToken.mockResolvedValue(null)

    const unauthorizedResult = { res: { statusCode: 401 }, payload: null }
    const fn = vi.fn().mockResolvedValue(unauthorizedResult)

    const result = await withAuthRetry(fn)

    expect(mockDropToken).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalledOnce()
    expect(result).toEqual(unauthorizedResult)
  })

  test('should not retry on non-401 error status codes', async () => {
    const errorResult = { res: { statusCode: 500 }, payload: null }
    const fn = vi.fn().mockResolvedValue(errorResult)

    const result = await withAuthRetry(fn)

    expect(mockDropToken).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalledOnce()
    expect(result).toEqual(errorResult)
  })
})
