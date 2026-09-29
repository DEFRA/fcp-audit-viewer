import { SNSClient } from '@aws-sdk/client-sns'
import { publishAuditEvent } from '@defra/fcp-audit-publisher'
import { config } from '../../../config/config.js'
import { createLogger } from '../logging/logger.js'
import { buildAuthEvent, mapEnvironment } from './audit-event.js'

const logger = createLogger()

let snsClient
let publisherConfig

function getPublisherConfig () {
  if (publisherConfig) {
    return publisherConfig
  }

  snsClient = new SNSClient()
  publisherConfig = {
    snsClient,
    sns: { topicArn: config.get('aws.sns.topicArn') },
    application: 'Audit Service',
    component: 'fcp-audit-viewer',
    environment: mapEnvironment(config.get('cdpEnvironment')),
    generateCorrelationId: true
  }

  return publisherConfig
}

/**
 * Publish a login or logout audit event to the fcp-audit SNS topic.
 * Publishing errors are logged and not rethrown, so auditing never blocks the auth flow.
 *
 * @param {import('@hapi/hapi').Request} request - Used for the client IP
 * @param {'login'|'logout'} action - The auth action being audited
 * @param {object} credentials - Entra token claims / session credentials for the user
 * @param {string} [credentials.oid] - Entra object id, sent as `AAD/<oid>`
 * @param {string} [credentials.sessionId] - Session id, sent as `sessionid`
 * @param {string} [credentials.email] - Preferred claim for the audit `entityid`
 * @param {string} [credentials.unique_name] - Fallback claim for the audit `entityid`
 * @param {string} [credentials.upn] - Last fallback claim for the audit `entityid`
 * @param {object} [options]
 * @param {'success'|'failure'} [options.status='success'] - Outcome of the action
 * @param {string} [options.reason] - Failure reason, sent as `audit.details.reason`
 * @returns {Promise<void>}
 */
async function sendAuthEvent (request, action, credentials, options) {
  try {
    const event = buildAuthEvent(request, action, credentials, options)
    const { messageId } = await publishAuditEvent(event, getPublisherConfig())
    logger.info(`Audit event published: messageId=${messageId}, action=${action}, status=${event.audit.status}`)
  } catch (err) {
    logger.error(err, `Failed to publish ${action} audit event`)
  }
}

export { sendAuthEvent }
