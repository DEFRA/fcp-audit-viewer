import { config } from '../../../config/config.js'
import { buildRedisClient } from '../redis-client.js'
import { createLogger } from '../logging/logger.js'
import { withTimeout } from './with-timeout.js'

const logger = createLogger()

/**
 * Checks that Redis (session cache and service token cache) is reachable by sending a PING.
 */
export const healthCheck = async () => {
  const redisConfig = config.get('redis')
  const client = buildRedisClient(redisConfig)

  try {
    logger.info(`Connecting to Redis on ${redisConfig.host}`)
    await withTimeout(client.ping(), config.get('healthCheck.timeoutMs'), 'Redis PING')
    logger.info('SUCCESS: Connected to Redis')
  } catch (err) {
    logger.error(err, 'Health check failed: unable to connect to Redis')
    throw err
  } finally {
    client.disconnect()
  }
}
