import { config } from '../../../config/config.js'
import { createLogger } from '../logging/logger.js'
import { healthCheck as audit } from './audit.js'
import { healthCheck as backend } from './backend.js'
import { healthCheck as entra } from './entra.js'
import { healthCheck as redis } from './redis.js'
import { healthCheck as serviceToken } from './service-token.js'

const logger = createLogger()

const healthChecks = [redis, entra, serviceToken, backend, audit]

/**
 * Runs all start-up health checks against the services this app depends on.
 *
 * Each check logs its own failure at error level. Any failure is rethrown so that
 * start-up fails and the process exits, rather than serving requests it cannot fulfil.
 */
export async function runHealthChecks () {
  if (!config.get('healthCheck.enabled')) {
    logger.info('Skipping start-up health checks: disabled by configuration')
    return
  }

  await Promise.all(healthChecks.map((check) => check()))
  logger.info('SUCCESS: All start-up health checks passed')
}
