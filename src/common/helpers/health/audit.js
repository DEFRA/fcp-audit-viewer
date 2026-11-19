import { publishAuditEvent } from '@defra/fcp-audit-publisher'
import { config } from '../../../config/config.js'
import { getPublisherConfig } from '../audit/audit.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

const STARTUP_ENTITY_ID = 'fcp-audit-viewer start-up healthcheck'

/**
 * Checks that audit events can be published to the fcp-audit SNS topic by publishing a
 * start-up event, so a missing topic or IAM permission is caught before users sign in.
 */
export const healthCheck = async () => {
  if (!config.get('aws.sns.topicArn')) {
    logger.info('Skipping audit health check: SNS topic is not configured')
    return
  }

  const event = {
    ip: '127.0.0.1',
    user: 'startup-healthcheck',
    audit: {
      entities: [{ entity: 'audit', action: 'created', entityid: STARTUP_ENTITY_ID }],
      status: 'success'
    }
  }

  try {
    const { messageId } = await publishAuditEvent(event, getPublisherConfig())
    logger.info(`SUCCESS: Published start-up audit event to SNS: messageId=${messageId}`)
  } catch (err) {
    logger.error(err, 'Health check failed: unable to publish start-up audit event to SNS')
    throw err
  }
}
