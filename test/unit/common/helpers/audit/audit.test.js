import { vi, describe, beforeEach, test, expect } from 'vitest'
import { config } from '../../../../../src/config/config.js'

const mockPublishAuditEvent = vi.fn()
const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('@defra/fcp-audit-publisher', () => ({
  publishAuditEvent: (...args) => mockPublishAuditEvent(...args)
}))

vi.mock('../../../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ info: (...args) => mockLoggerInfo(...args), error: (...args) => mockLoggerError(...args) })
}))

const { sendAuthEvent } = await import('../../../../../src/common/helpers/audit/audit.js')

const request = { headers: {}, info: { remoteAddress: '127.0.0.1' } }
const credentials = { oid: 'user-oid-123', sessionId: 'session-id-456' }

describe('sendAuthEvent', () => {
  beforeEach(() => {
    config.set('aws.sns.topicArn', 'arn:aws:sns:eu-west-2:000000000000:test-topic')
  })

  test('publishes the event with the configured publisher config', async () => {
    mockPublishAuditEvent.mockResolvedValue({ messageId: 'message-id' })

    await sendAuthEvent(request, 'login', credentials)

    expect(mockPublishAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: { entities: [{ entity: 'user', action: 'login' }] }
      }),
      expect.objectContaining({
        sns: { topicArn: 'arn:aws:sns:eu-west-2:000000000000:test-topic' },
        application: 'Audit Service',
        component: 'fcp-audit-viewer',
      })
    )
  })

  test('logs the message id on success', async () => {
    mockPublishAuditEvent.mockResolvedValue({ messageId: 'message-id' })

    await sendAuthEvent(request, 'logout', credentials)

    expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('message-id'))
  })

  test('logs an error and does not throw when publishing fails', async () => {
    const error = new Error('publish failed')
    mockPublishAuditEvent.mockRejectedValue(error)

    await expect(sendAuthEvent(request, 'login', credentials)).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalledWith(error, expect.stringContaining('login'))
  })
})
