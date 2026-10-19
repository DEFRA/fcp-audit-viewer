import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'

const importConfig = async () => {
  const { config } = await import('../../../src/config/config.js')
  return config
}

const stubProxyEnv = () => {
  vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:3128')
  vi.stubEnv('NODE_USE_ENV_PROXY', '1')
  vi.stubEnv('NO_PROXY', 'sns.eu-west-2.amazonaws.com')
}

describe('config proxy settings', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('COOKIE_PASSWORD', 'this-is-a-secret-that-must-be-at-least-32-characters')
    vi.stubEnv('REDIS_HOST', 'redis')
    vi.stubEnv('AUDIT_INTERNAL_PUBLISH_SNS_TOPIC_ARN', 'arn:aws:sns:eu-west-2:000000000000:topic')
    vi.stubEnv('HTTPS_PROXY', undefined)
    vi.stubEnv('NODE_USE_ENV_PROXY', undefined)
    vi.stubEnv('NO_PROXY', undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('should allow proxy settings to be missing when ENVIRONMENT is not set', async () => {
    vi.stubEnv('ENVIRONMENT', undefined)

    const config = await importConfig()

    expect(config.get('proxy')).toEqual({ httpsProxy: null, useEnvProxy: null, noProxy: null })
  })

  test('should allow proxy settings to be missing when ENVIRONMENT is local', async () => {
    vi.stubEnv('ENVIRONMENT', 'local')

    const config = await importConfig()

    expect(config.get('proxy')).toEqual({ httpsProxy: null, useEnvProxy: null, noProxy: null })
  })

  test('should fail validation when proxy settings are missing in a CDP environment', async () => {
    vi.stubEnv('ENVIRONMENT', 'dev')

    await expect(importConfig()).rejects.toThrow(/proxy\.httpsProxy/)
  })

  test('should load proxy settings in a CDP environment', async () => {
    vi.stubEnv('ENVIRONMENT', 'dev')
    stubProxyEnv()

    const config = await importConfig()

    expect(config.get('proxy')).toEqual({
      httpsProxy: 'http://proxy.example.com:3128',
      useEnvProxy: '1',
      noProxy: 'sns.eu-west-2.amazonaws.com'
    })
  })

  test('should reject a NODE_USE_ENV_PROXY value other than 1', async () => {
    vi.stubEnv('ENVIRONMENT', 'dev')
    stubProxyEnv()
    vi.stubEnv('NODE_USE_ENV_PROXY', 'true')

    await expect(importConfig()).rejects.toThrow(/proxy\.useEnvProxy/)
  })
})
