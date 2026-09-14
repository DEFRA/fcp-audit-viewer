import { constants as httpConstants } from 'node:http2'
import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { getToken, dropToken } from '../auth/service-token-cache.js'

const { HTTP_STATUS_UNAUTHORIZED } = httpConstants

export async function getStream (path, userId) {
  const backendUrl = buildBackendUrl(path)
  const userIdHeader = userId ? { 'X-Audit-User-Id': userId } : {}

  const token = await getToken()
  const headers = { ...(token ? { Authorization: token } : {}), ...userIdHeader }

  const res = await Wreck.request('GET', backendUrl, { headers })

  if (res.statusCode === HTTP_STATUS_UNAUTHORIZED && token) {
    await dropToken()
    const freshToken = await getToken()
    const freshHeaders = { ...(freshToken ? { Authorization: freshToken } : {}), ...userIdHeader }
    return Wreck.request('GET', backendUrl, { headers: freshHeaders })
  }

  return res
}
