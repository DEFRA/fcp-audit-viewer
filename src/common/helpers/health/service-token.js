import { getServiceToken } from '../../../auth/get-service-token.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

/**
 * Checks that a service-to-service token for fcp-audit can be acquired from Entra
 * (client credentials grant), i.e. the tenant id, client id and client secret are valid.
 */
export const healthCheck = async () => {
  try {
    const token = await getServiceToken()

    if (!token) {
      logger.info('Skipping service token health check: Entra service credentials are not configured')
      return
    }

    logger.info('SUCCESS: Acquired Entra service token')
  } catch (err) {
    logger.error(err, 'Health check failed: unable to acquire Entra service token')
    throw err
  }
}
