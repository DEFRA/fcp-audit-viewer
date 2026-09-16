import { constants as httpConstants } from 'node:http2'
import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'
import { config } from '../config/config.js'
import { buildBackendUrl } from './build-backend-url.js'
import { getToken, dropToken } from '../auth/service-token-cache.js'

const { HTTP_STATUS_UNAUTHORIZED } = httpConstants

export async function getStream (path, userId) {
  const backendUrl = buildBackendUrl(path)
  const userIdHeader = userId ? { 'X-Audit-User-Id': userId } : {}
  const tracingHeader = config.get('tracing.header')

  const token = await getToken()
  const headers = withTraceId(tracingHeader, { ...(token ? { Authorization: token } : {}), ...userIdHeader })

  const res = await Wreck.request('GET', backendUrl, { headers })

  if (res.statusCode === HTTP_STATUS_UNAUTHORIZED && token) {
    await dropToken()
    const freshToken = await getToken()
    const freshHeaders = withTraceId(tracingHeader, { ...(freshToken ? { Authorization: freshToken } : {}), ...userIdHeader })
    return Wreck.request('GET', backendUrl, { headers: freshHeaders })
  }

  return res
}
