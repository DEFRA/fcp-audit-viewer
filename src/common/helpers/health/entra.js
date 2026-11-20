import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { getOidcConfig } from '../../../auth/get-oidc-config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

/**
 * Checks that the Entra OIDC configuration and its JWKS signing keys can be fetched,
 * as both are needed to sign users in and to verify their tokens.
 */
export const healthCheck = async () => {
  try {
    logger.info(`Fetching Entra OIDC configuration from ${config.get('entra.wellKnownUrl')}`)
    const { jwks_uri: jwksUri } = await getOidcConfig()

    if (!jwksUri) {
      throw new Error('Entra OIDC configuration does not contain a jwks_uri')
    }

    const { payload } = await Wreck.get(jwksUri, {
      json: true,
      timeout: config.get('healthCheck.timeoutMs')
    })

    if (!Array.isArray(payload?.keys) || !payload.keys[0]?.kid) {
      throw new Error('Entra JWKS response does not contain any signing keys')
    }

    logger.info(`SUCCESS: Resolved Entra JWKS signing keys from ${jwksUri}`)
  } catch (err) {
    logger.error(err, 'Health check failed: unable to resolve Entra OIDC configuration and JWKS keys')
    throw err
  }
}
