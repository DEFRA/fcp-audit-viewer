import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const mockWreckGet = vi.fn()
const mockConfigGet = vi.fn()

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('@hapi/wreck', () => ({ default: { get: mockWreckGet } }))
vi.mock('../../../../../src/config/config.js', () => ({ config: { get: mockConfigGet } }))

const { healthCheck } = await import('../../../../../src/common/helpers/health/backend.js')

describe('fcp-audit backend health check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockImplementation((key) => ({ 'backend.endpoint': 'http://fcp-audit:3004', 'healthCheck.timeoutMs': 5000 })[key])
  })

  test('should pass when the fcp-audit health endpoint responds', async () => {
    mockWreckGet.mockResolvedValue({ res: { statusCode: 200 } })

    await healthCheck()

    expect(mockWreckGet).toHaveBeenCalledWith('http://fcp-audit:3004/health', { timeout: 5000 })
    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: HTTP connection to fcp-audit succeeded')
  })

  test('should skip when the backend endpoint is not configured', async () => {
    mockConfigGet.mockReturnValue(null)

    await healthCheck()

    expect(mockWreckGet).not.toHaveBeenCalled()
  })

  test('should throw when the fcp-audit health endpoint fails', async () => {
    mockWreckGet.mockRejectedValue(new Error('Response Error: 503 Service Unavailable'))

    await expect(healthCheck()).rejects.toThrow('503')
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Health check failed: unable to reach fcp-audit on http://fcp-audit:3004/health')
  })
})
