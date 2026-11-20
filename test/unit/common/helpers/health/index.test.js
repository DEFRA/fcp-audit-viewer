import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const checks = {
  redis: vi.fn(),
  entra: vi.fn(),
  serviceToken: vi.fn(),
  backend: vi.fn(),
  audit: vi.fn()
}
const mockConfigGet = vi.fn()

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('../../../../../src/config/config.js', () => ({ config: { get: mockConfigGet } }))
vi.mock('../../../../../src/common/helpers/health/redis.js', () => ({ healthCheck: checks.redis }))
vi.mock('../../../../../src/common/helpers/health/entra.js', () => ({ healthCheck: checks.entra }))
vi.mock('../../../../../src/common/helpers/health/service-token.js', () => ({ healthCheck: checks.serviceToken }))
vi.mock('../../../../../src/common/helpers/health/backend.js', () => ({ healthCheck: checks.backend }))
vi.mock('../../../../../src/common/helpers/health/audit.js', () => ({ healthCheck: checks.audit }))

const { runHealthChecks } = await import('../../../../../src/common/helpers/health/index.js')

describe('runHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockImplementation((key) => ({ 'healthCheck.enabled': true })[key])
    Object.values(checks).forEach((check) => check.mockResolvedValue())
  })

  test('should run every health check', async () => {
    await runHealthChecks()

    Object.values(checks).forEach((check) => expect(check).toHaveBeenCalledTimes(1))
    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: All start-up health checks passed')
  })

  test('should reject when any health check fails', async () => {
    checks.backend.mockRejectedValue(new Error('fcp-audit unavailable'))

    await expect(runHealthChecks()).rejects.toThrow('fcp-audit unavailable')
  })

  test('should not run any health check when disabled', async () => {
    mockConfigGet.mockReturnValue(false)

    await runHealthChecks()

    Object.values(checks).forEach((check) => expect(check).not.toHaveBeenCalled())
    expect(mockLogger.info).toHaveBeenCalledWith('Skipping start-up health checks: disabled by configuration')
  })
})
