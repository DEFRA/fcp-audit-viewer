import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { withAuthRetry } from './with-auth-retry.js'

export async function get (path) {
  const backendUrl = buildBackendUrl(path)

  return requestPromise(
    backendUrl,
    withAuthRetry((token) => {
      const headers = token ? { Authorization: token } : {}
      return Wreck.get(backendUrl, { headers })
    })
  )
}
