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

async function sendAuthEvent (request, action, credentials) {
  try {
    const event = buildAuthEvent(request, action, credentials)
    const { messageId } = await publishAuditEvent(event, getPublisherConfig())
    logger.info(`Audit event published: messageId=${messageId}, action=${action}`)
  } catch (err) {
    logger.error(err, `Failed to publish ${action} audit event`)
  }
}

export { sendAuthEvent }
