import { vi, describe, beforeEach, test, expect } from 'vitest'
import { mockLogger } from './mocks.js'

const mockPublishAuditEvent = vi.fn()
const mockConfigGet = vi.fn()
const mockPublisherConfig = { snsClient: {}, sns: { topicArn: 'arn:topic' } }

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({ createLogger: () => mockLogger }))
vi.mock('@defra/fcp-audit-publisher', () => ({ publishAuditEvent: mockPublishAuditEvent }))
vi.mock('../../../../../src/common/helpers/audit/audit.js', () => ({ getPublisherConfig: () => mockPublisherConfig }))
vi.mock('../../../../../src/config/config.js', () => ({ config: { get: mockConfigGet } }))

const { healthCheck } = await import('../../../../../src/common/helpers/health/audit.js')

describe('audit SNS health check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockImplementation((key) => ({ 'aws.sns.topicArn': 'arn:topic' })[key])
  })

  test('should publish a start-up audit event', async () => {
    mockPublishAuditEvent.mockResolvedValue({ messageId: 'message-1' })

    await healthCheck()

    expect(mockPublishAuditEvent).toHaveBeenCalledWith({
      ip: '127.0.0.1',
      user: 'startup-healthcheck',
      audit: {
        entities: [{ entity: 'audit', action: 'created', entityid: 'fcp-audit-viewer start-up healthcheck' }],
        status: 'success'
      }
    }, mockPublisherConfig)
    expect(mockLogger.info).toHaveBeenCalledWith('SUCCESS: Published start-up audit event to SNS: messageId=message-1')
  })

  test('should skip when no SNS topic is configured', async () => {
    mockConfigGet.mockReturnValue(null)

    await healthCheck()

    expect(mockPublishAuditEvent).not.toHaveBeenCalled()
  })

  test('should throw when the start-up audit event cannot be published', async () => {
    mockPublishAuditEvent.mockRejectedValue(new Error('AuthorizationError'))

    await expect(healthCheck()).rejects.toThrow('AuthorizationError')
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Health check failed: unable to publish start-up audit event to SNS')
  })
})
