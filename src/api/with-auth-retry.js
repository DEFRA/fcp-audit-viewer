import { constants as httpConstants } from 'node:http2'
import { getToken, dropToken } from '../auth/service-token-cache.js'

const { HTTP_STATUS_UNAUTHORIZED } = httpConstants

export async function withAuthRetry (fn) {
  const token = await getToken()
  const { res, payload } = await fn(token)

  if (res.statusCode === HTTP_STATUS_UNAUTHORIZED && token) {
    await dropToken()
    const freshToken = await getToken()
    return fn(freshToken)
  }

  return { res, payload }
}
