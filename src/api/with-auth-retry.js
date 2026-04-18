import { getToken, dropToken } from '../auth/service-token-cache.js'

export async function withAuthRetry (fn) {
  const token = await getToken()
  const { res, payload } = await fn(token)

  if (res.statusCode === 401 && token) {
    await dropToken()
    const freshToken = await getToken()
    return fn(freshToken)
  }

  return { res, payload }
}
