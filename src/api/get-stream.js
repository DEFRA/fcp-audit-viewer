import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { getToken, dropToken } from '../auth/service-token-cache.js'

export async function getStream (path) {
  const backendUrl = buildBackendUrl(path)

  const token = await getToken()
  const headers = token ? { Authorization: token } : {}

  const { res } = await Wreck.request('GET', backendUrl, { headers })

  if (res.statusCode === 401 && token) {
    await dropToken()
    const freshToken = await getToken()
    const freshHeaders = freshToken ? { Authorization: freshToken } : {}
    const { res: retryRes } = await Wreck.request('GET', backendUrl, { headers: freshHeaders })
    return retryRes
  }

  return res
}
