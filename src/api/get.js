import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { withAuthRetry } from './with-auth-retry.js'

export async function get (path, userId) {
  const backendUrl = buildBackendUrl(path)

  const { payload } = await requestPromise(
    backendUrl,
    withAuthRetry((token) => {
      const headers = {
        ...(token ? { Authorization: token } : {}),
        ...(userId ? { 'X-Audit-User-Id': userId } : {})
      }
      return Wreck.get(backendUrl, { headers, json: true })
    })
  )

  return payload
}
