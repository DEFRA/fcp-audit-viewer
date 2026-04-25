import { constants as httpConstants } from 'node:http2'
import { vi, describe, beforeEach, test, expect } from 'vitest'

const { HTTP_STATUS_OK, HTTP_STATUS_BAD_REQUEST } = httpConstants

const mockWreckPost = vi.fn()
vi.mock('@hapi/wreck', () => ({
  default: {
    post: mockWreckPost
  }
}))

const mockConfigGet = vi.fn()
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

const { getServiceToken } = await import('../../../src/auth/get-service-token.js')

describe('getServiceToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockImplementation((key) => {
      switch (key) {
        case 'entra.tenantId': return 'mock-tenant-id'
        case 'entra.clientId': return 'mock-client-id'
        case 'entra.clientSecret': return 'mock-client-secret'
        default: return null
      }
    })
    mockWreckPost.mockResolvedValue({
      res: { statusCode: HTTP_STATUS_OK },
      payload: { token_type: 'Bearer', access_token: 'mock-access-token' }
    })
  })

  test('should return a Bearer token string on success', async () => {
    const result = await getServiceToken()
    expect(result).toBe('Bearer mock-access-token')
  })

  test('should post to the correct Entra token endpoint', async () => {
    await getServiceToken()
    const url = mockWreckPost.mock.calls[0][0]
    expect(url).toBe('https://login.microsoftonline.com/mock-tenant-id/oauth2/v2.0/token')
  })

  test('should post with client_credentials grant and correct form fields', async () => {
    await getServiceToken()
    const body = mockWreckPost.mock.calls[0][1].payload
    const params = new URLSearchParams(body)
    expect(params.get('grant_type')).toBe('client_credentials')
    expect(params.get('client_id')).toBe('mock-client-id')
    expect(params.get('client_secret')).toBe('mock-client-secret')
    expect(params.get('scope')).toBe('mock-client-id/.default')
  })

  test('should post with correct content type header and json option', async () => {
    await getServiceToken()
    const opts = mockWreckPost.mock.calls[0][1]
    expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(opts.json).toBe(true)
  })

  test('should return null when tenantId is not configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'entra.tenantId') return null
      if (key === 'entra.clientId') return 'mock-client-id'
      if (key === 'entra.clientSecret') return 'mock-client-secret'
      return null
    })
    const result = await getServiceToken()
    expect(result).toBeNull()
    expect(mockWreckPost).not.toHaveBeenCalled()
  })

  test('should return null when clientId is not configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'entra.tenantId') return 'mock-tenant-id'
      if (key === 'entra.clientId') return null
      if (key === 'entra.clientSecret') return 'mock-client-secret'
      return null
    })
    const result = await getServiceToken()
    expect(result).toBeNull()
    expect(mockWreckPost).not.toHaveBeenCalled()
  })

  test('should return null when clientSecret is not configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'entra.tenantId') return 'mock-tenant-id'
      if (key === 'entra.clientId') return 'mock-client-id'
      if (key === 'entra.clientSecret') return null
      return null
    })
    const result = await getServiceToken()
    expect(result).toBeNull()
    expect(mockWreckPost).not.toHaveBeenCalled()
  })

  test('should propagate error when Wreck post fails', async () => {
    mockWreckPost.mockRejectedValue(new Error('network error'))
    await expect(getServiceToken()).rejects.toThrow('network error')
  })

  test('should throw when response status is not 200', async () => {
    mockWreckPost.mockResolvedValue({
      res: { statusCode: HTTP_STATUS_BAD_REQUEST },
      payload: { error: 'invalid_client' }
    })
    await expect(getServiceToken()).rejects.toThrow('Failed to acquire service token: invalid_client')
  })

  test('should throw when token_type is missing from successful response', async () => {
    mockWreckPost.mockResolvedValue({
      res: { statusCode: HTTP_STATUS_OK },
      payload: { access_token: 'some-token' }
    })
    await expect(getServiceToken()).rejects.toThrow('Failed to acquire service token: 200')
  })

  test('should throw when access_token is missing from successful response', async () => {
    mockWreckPost.mockResolvedValue({
      res: { statusCode: HTTP_STATUS_OK },
      payload: { token_type: 'Bearer' }
    })
    await expect(getServiceToken()).rejects.toThrow('Failed to acquire service token: 200')
  })
})
