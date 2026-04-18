import { describe, test, expect, vi, beforeEach } from 'vitest'
import Inert from '@hapi/inert'

vi.mock('../../../src/routes/health.js', () => ({
  health: { method: 'GET', path: '/health' }
}))

vi.mock('../../../src/routes/auth.js', () => ({
  auth: { method: 'GET', path: '/auth' }
}))

vi.mock('../../../src/routes/audit.js', () => ({
  audit: { method: 'GET', path: '/' }
}))

vi.mock('../../../src/routes/results.js', () => ({
  results: { method: 'GET', path: '/results' }
}))

vi.mock('../../../src/routes/query.js', () => ({
  query: { method: 'GET', path: '/query' }
}))

vi.mock('../../../src/common/helpers/serve-static-files.js', () => ({
  serveStaticFiles: { method: 'GET', path: '/assets/{param*}' }
}))

const { router } = await import('../../../src/plugins/router.js')

describe('router', () => {
  let mockServer

  beforeEach(() => {
    vi.clearAllMocks()
    mockServer = {
      register: vi.fn(),
      route: vi.fn()
    }
  })

  test('should export router plugin object', () => {
    expect(router).toBeDefined()
    expect(router.plugin).toBeDefined()
    expect(router.plugin.name).toBe('router')
    expect(typeof router.plugin.register).toBe('function')
  })

  test('should have correct plugin name', () => {
    expect(router.plugin.name).toBe('router')
  })

  test('should register Inert plugin', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.register).toHaveBeenCalledWith([Inert])
  })

  test('should register health route', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/health' })
    )
  })

  test('should register auth routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/auth' })
    )
  })

  test('should register audit route', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/' })
    )
  })

  test('should register all routes after Inert registration', async () => {
    await router.plugin.register(mockServer)

    const registerCall = mockServer.register.mock.invocationCallOrder[0]
    const firstRouteCall = mockServer.route.mock.invocationCallOrder[0]

    expect(registerCall).toBeLessThan(firstRouteCall)
  })

  test('should register expected number of routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route.mock.calls.length).toBe(5)
  })
})
