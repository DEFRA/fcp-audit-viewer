import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const mockGetOidcConfig = vi.fn()
const mockWreckGet = vi.fn()

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('../../../../../src/auth/get-oidc-config.js', () => ({ getOidcConfig: mockGetOidcConfig }))
vi.mock('@hapi/wreck', () => ({ default: { get: mockWreckGet } }))
vi.mock('../../../../../src/config/config.js', () => ({
  config: {
    get: (key) => ({ 'entra.wellKnownUrl': 'https://entra/well-known', 'healthCheck.timeoutMs': 5000 })[key]
  }
}))

const { healthCheck } = await import('../../../../../src/common/helpers/health/entra.js')

describe('entra health check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOidcConfig.mockResolvedValue({ jwks_uri: 'https://entra/jwks' })
    mockWreckGet.mockResolvedValue({ payload: { keys: [{ kid: 'key-1' }] } })
  })

  test('should pass when the OIDC configuration and JWKS keys resolve', async () => {
    await healthCheck()

    expect(mockWreckGet).toHaveBeenCalledWith('https://entra/jwks', { json: true, timeout: 5000 })
    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: Resolved Entra JWKS signing keys from https://entra/jwks')
  })

  test('should throw when the OIDC configuration cannot be fetched', async () => {
    mockGetOidcConfig.mockRejectedValue(new Error('Response Error: 404 Not Found'))

    await expect(healthCheck()).rejects.toThrow('Response Error: 404 Not Found')
    expect(mockLogger.error).toHaveBeenCalled()
  })

  test('should throw when the OIDC configuration has no jwks_uri', async () => {
    mockGetOidcConfig.mockResolvedValue({})

    await expect(healthCheck()).rejects.toThrow('Entra OIDC configuration does not contain a jwks_uri')
  })

  test.each([
    ['no keys property', {}],
    ['an empty keys array', { keys: [] }],
    ['a key without a kid', { keys: [{}] }]
  ])('should throw when the JWKS response has %s', async (_name, payload) => {
    mockWreckGet.mockResolvedValue({ payload })

    await expect(healthCheck()).rejects.toThrow('Entra JWKS response does not contain any signing keys')
  })

  test('should throw when the JWKS keys cannot be fetched', async () => {
    mockWreckGet.mockRejectedValue(new Error('timeout'))

    await expect(healthCheck()).rejects.toThrow('timeout')
  })
})
