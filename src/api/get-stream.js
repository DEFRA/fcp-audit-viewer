import { constants as httpConstants } from 'node:http2'
import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { getToken, dropToken } from '../auth/service-token-cache.js'

const { HTTP_STATUS_UNAUTHORIZED } = httpConstants

export async function getStream (path) {
  const backendUrl = buildBackendUrl(path)

  const token = await getToken()
  const headers = token ? { Authorization: token } : {}

  const res = await Wreck.request('GET', backendUrl, { headers })

  if (res.statusCode === HTTP_STATUS_UNAUTHORIZED && token) {
    await dropToken()
    const freshToken = await getToken()
    const freshHeaders = freshToken ? { Authorization: freshToken } : {}
    return Wreck.request('GET', backendUrl, { headers: freshHeaders })
  }

  return res
}
