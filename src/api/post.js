import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'
import { config } from '../config/config.js'
import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { withAuthRetry } from './with-auth-retry.js'

export async function post (path, payload, userId) {
  const backendUrl = buildBackendUrl(path)

  return requestPromise(
    backendUrl,
    withAuthRetry((token) => {
      const headers = withTraceId(config.get('tracing.header'), {
        ...(token ? { Authorization: token } : {}),
        ...(userId ? { 'X-Audit-User-Id': userId } : {})
      })
      return Wreck.post(backendUrl, { headers, payload })
    })
  )
}
