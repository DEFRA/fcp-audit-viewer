import { getTraceId } from '@defra/hapi-tracing'

const MAX_IP_LENGTH = 20

function getClientIp (request) {
  const forwardedFor = request.headers['x-forwarded-for']
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.info.remoteAddress
  return ip.slice(0, MAX_IP_LENGTH)
}

function mapEnvironment (cdpEnvironment) {
  return cdpEnvironment === 'local' ? 'local' : `cdp-${cdpEnvironment}`
}

function buildAuthEvent (request, action, credentials) {
  return {
    datetime: new Date().toISOString(),
    ip: getClientIp(request),
    ...(getTraceId() && { correlationid: getTraceId() }),
    user: `AAD/${credentials.oid}`,
    sessionid: credentials.sessionId,
    audit: {
      entities: [{ entity: 'user', action }]
    }
  }
}

export { buildAuthEvent, mapEnvironment }
