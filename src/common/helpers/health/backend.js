import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

/**
 * Checks that the fcp-audit backend is reachable via its (unauthenticated) CDP health endpoint.
 */
export const healthCheck = async () => {
  const endpoint = config.get('backend.endpoint')

  if (!endpoint) {
    logger.info('Skipping fcp-audit health check: backend endpoint is not configured')
    return
  }

  const healthUrl = `${endpoint}/health`

  try {
    logger.info(`Checking fcp-audit is available on ${healthUrl}`)
    await Wreck.get(healthUrl, { timeout: config.get('healthCheck.timeoutMs') })
    logger.info('SUCCESS: HTTP connection to fcp-audit succeeded')
  } catch (err) {
    logger.error(err, `Health check failed: unable to reach fcp-audit on ${healthUrl}`)
    throw err
  }
}
