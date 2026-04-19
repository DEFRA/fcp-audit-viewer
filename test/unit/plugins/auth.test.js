import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/auth/get-oidc-config.js', () => ({
  getOidcConfig: vi.fn()
}))

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

vi.mock('@hapi/jwt', () => ({
  default: {
    token: {
      decode: vi.fn(),
      verifyTime: vi.fn()
    }
  }
}))

vi.mock('../../../src/auth/refresh-tokens.js', () => ({
  refreshTokens: vi.fn()
}))

const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
const { config } = await import('../../../src/config/config.js')
const Jwt = (await import('@hapi/jwt')).default
const { refreshTokens } = await import('../../../src/auth/refresh-tokens.js')
const { auth, getCookieOptions } = await import('../../../src/plugins/auth.js')

describe('auth', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://login.microsoftonline.com/authorize',
    token_endpoint: 'https://login.microsoftonline.com/token',
    end_session_endpoint: 'https://login.microsoftonline.com/logout',
    jwks_uri: 'https://login.microsoftonline.com/jwks'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getOidcConfig.mockResolvedValue(mockOidcConfig)
    config.get.mockImplementation((key) => {
      const configMap = {
        'entra.clientId': 'test-client-id',
        'entra.clientSecret': 'test-client-secret',
        'cookie.password': 'password-must-be-at-least-32-characters-long',
        'cookie.secure': true,
        'cache.name': 'session',
        'cache.segment': 'test-cache'
      }
      return configMap[key]
    })
  })

  test('should export auth plugin object', () => {
    expect(auth).toBeDefined()
    expect(auth.plugin).toBeDefined()
    expect(auth.plugin.name).toBe('auth')
    expect(typeof auth.plugin.register).toBe('function')
  })

  test('should have correct plugin name', () => {
    expect(auth.plugin.name).toBe('auth')
  })

  test('should register function be defined', () => {
    expect(auth.plugin.register).toBeDefined()
    expect(typeof auth.plugin.register).toBe('function')
  })

  test('should call getOidcConfig during registration', async () => {
    const mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    await auth.plugin.register(mockServer)

    expect(getOidcConfig).toHaveBeenCalledTimes(1)
  })

  test('should register entra and session strategies', async () => {
    const mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    await auth.plugin.register(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledWith('entra', 'bell', expect.any(Object))
    expect(mockServer.auth.strategy).toHaveBeenCalledWith('session', 'cookie', expect.any(Object))
  })

  test('should set session as default strategy', async () => {
    const mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    await auth.plugin.register(mockServer)

    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  test('should configure Bell with correct OAuth endpoints', async () => {
    const mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    await auth.plugin.register(mockServer)

    const bellOptions = mockServer.auth.strategy.mock.calls.find(
      call => call[0] === 'entra'
    )[2]

    expect(bellOptions.provider.auth).toBe(mockOidcConfig.authorization_endpoint)
    expect(bellOptions.provider.token).toBe(mockOidcConfig.token_endpoint)
  })

  test('should configure Bell with correct client credentials', async () => {
    const mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    await auth.plugin.register(mockServer)

    const bellOptions = mockServer.auth.strategy.mock.calls.find(
      call => call[0] === 'entra'
    )[2]

    expect(bellOptions.clientId).toBe('test-client-id')
    expect(bellOptions.clientSecret).toBe('test-client-secret')
    expect(config.get).toHaveBeenCalledWith('entra.clientId')
    expect(config.get).toHaveBeenCalledWith('entra.clientSecret')
  })
})

describe('validateToken', () => {
  let validate
  let mockCache
  let mockRequest

  const userSession = {
    token: 'valid-token',
    refreshToken: 'refresh-token',
    sessionId: 'session-id'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockImplementation((key) => {
      const configMap = {
        'cookie.password': 'password-must-be-at-least-32-characters-long',
        'cookie.secure': false,
        'entra.refreshTokens': false
      }
      return configMap[key]
    })

    mockCache = {
      get: vi.fn(),
      set: vi.fn()
    }

    mockRequest = {
      server: {
        app: { cache: mockCache },
        logger: { info: vi.fn() }
      }
    }

    validate = getCookieOptions().validate
  })

  test('should return isValid false when session not found in cache', async () => {
    mockCache.get.mockResolvedValue(null)

    const result = await validate(mockRequest, { sessionId: 'missing-session' })

    expect(result).toEqual({ isValid: false })
  })

  test('should return isValid true when session exists and token is valid', async () => {
    mockCache.get.mockResolvedValue(userSession)
    Jwt.token.decode.mockReturnValue({ decoded: { payload: {} } })
    Jwt.token.verifyTime.mockReturnValue(undefined)

    const result = await validate(mockRequest, { sessionId: 'session-id' })

    expect(result).toEqual({ isValid: true, credentials: userSession })
  })

  test('should return isValid false when token is expired and refreshTokens is disabled', async () => {
    mockCache.get.mockResolvedValue(userSession)
    Jwt.token.decode.mockReturnValue({ decoded: { payload: {} } })
    Jwt.token.verifyTime.mockImplementation(() => { throw new Error('Token expired') })
    config.get.mockImplementation((key) => key === 'entra.refreshTokens' ? false : undefined)

    const result = await validate(mockRequest, { sessionId: 'session-id' })

    expect(result).toEqual({ isValid: false })
    expect(mockRequest.server.logger.info).toHaveBeenCalledWith('Token expired')
  })

  test('should refresh token and return isValid true when token is expired and refreshTokens is enabled', async () => {
    const updatedSession = { ...userSession, token: 'new-token', refreshToken: 'new-refresh-token' }
    mockCache.get.mockResolvedValue({ ...userSession })
    Jwt.token.decode.mockReturnValue({ decoded: { payload: {} } })
    Jwt.token.verifyTime.mockImplementation(() => { throw new Error('Token expired') })
    config.get.mockImplementation((key) => key === 'entra.refreshTokens' ? true : undefined)
    refreshTokens.mockResolvedValue({ access_token: 'new-token', refresh_token: 'new-refresh-token' })
    mockCache.set.mockResolvedValue(undefined)

    const result = await validate(mockRequest, { sessionId: 'session-id' })

    expect(refreshTokens).toHaveBeenCalledWith(userSession.refreshToken)
    expect(mockCache.set).toHaveBeenCalledWith('session-id', expect.objectContaining({
      token: 'new-token',
      refreshToken: 'new-refresh-token'
    }))
    expect(result).toEqual({ isValid: true, credentials: updatedSession })
  })

  test('should propagate error when refreshTokens throws', async () => {
    mockCache.get.mockResolvedValue({ ...userSession })
    Jwt.token.decode.mockReturnValue({ decoded: { payload: {} } })
    Jwt.token.verifyTime.mockImplementation(() => { throw new Error('Token expired') })
    config.get.mockImplementation((key) => key === 'entra.refreshTokens' ? true : undefined)
    refreshTokens.mockRejectedValue(new Error('Refresh failed'))

    await expect(validate(mockRequest, { sessionId: 'session-id' })).rejects.toThrow('Refresh failed')
  })
})
