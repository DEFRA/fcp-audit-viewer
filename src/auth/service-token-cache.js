import { config } from '../config/config.js'
import { buildRedisClient } from '../common/helpers/redis-client.js'
import { getServiceToken } from './get-service-token.js'

const CACHE_KEY = 'service-token'
const TTL_SECONDS = 3480 // 58 minutes

let redisClient

function getRedisClient () {
  if (!redisClient) {
    redisClient = buildRedisClient(config.get('redis'))
  }
  return redisClient
}

export async function getToken () {
  const redis = getRedisClient()
  const cached = await redis.get(CACHE_KEY)

  if (cached) {
    return cached
  }

  const token = await getServiceToken()

  if (!token) {
    return null
  }

  await redis.set(CACHE_KEY, token, 'EX', TTL_SECONDS)

  return token
}

export async function dropToken () {
  const redis = getRedisClient()
  await redis.del(CACHE_KEY)
}
