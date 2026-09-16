import { vi, describe, test, expect } from 'vitest'

const mockGetTraceId = vi.fn()
vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => mockGetTraceId()
}))

const { buildAuthEvent, mapEnvironment } = await import('../../../../../src/common/helpers/audit/audit-event.js')

function buildRequest ({ headers = {}, remoteAddress = '127.0.0.1' } = {}) {
  return {
    headers,
    info: { remoteAddress }
  }
}

describe('buildAuthEvent', () => {
  const credentials = { oid: 'user-oid-123', sessionId: 'session-id-456', upn: 'test.user@defra.gov.uk' }

  test('builds a user/login audit event', () => {
    mockGetTraceId.mockReturnValue('trace-id-789')

    const event = buildAuthEvent(buildRequest(), 'login', credentials)

    expect(event.audit.entities).toEqual([{ entity: 'user', action: 'login', entityid: 'test.user@defra.gov.uk' }])
    expect(event.user).toBe('AAD/user-oid-123')
    expect(event.sessionid).toBe('session-id-456')
    expect(event.correlationid).toBe('trace-id-789')
    expect(event.datetime).toBeDefined()
  })

  test('builds a user/logout audit event', () => {
    const event = buildAuthEvent(buildRequest(), 'logout', credentials)

    expect(event.audit.entities).toEqual([{ entity: 'user', action: 'logout', entityid: 'test.user@defra.gov.uk' }])
  })

  test('sets entityid to an empty string when upn is not present', () => {
    const event = buildAuthEvent(buildRequest(), 'login', { oid: 'user-oid-123', sessionId: 'session-id-456' })

    expect(event.audit.entities).toEqual([{ entity: 'user', action: 'login', entityid: '' }])
  })

  test('omits correlationid when there is no trace id', () => {
    mockGetTraceId.mockReturnValue(undefined)

    const event = buildAuthEvent(buildRequest(), 'login', credentials)

    expect(event).not.toHaveProperty('correlationid')
  })

  test('uses the remote address when there is no x-forwarded-for header', () => {
    const event = buildAuthEvent(buildRequest({ remoteAddress: '192.168.1.100' }), 'login', credentials)

    expect(event.ip).toBe('192.168.1.100')
  })

  test('uses the first x-forwarded-for entry when present', () => {
    const request = buildRequest({ headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' } })
    const event = buildAuthEvent(request, 'login', credentials)

    expect(event.ip).toBe('10.0.0.1')
  })

  test('truncates the ip to the schema limit of 20 characters', () => {
    const request = buildRequest({ headers: { 'x-forwarded-for': '1234:5678:9abc:def0:1234:5678:9abc:def0' } })
    const event = buildAuthEvent(request, 'login', credentials)

    expect(event.ip.length).toBe(20)
  })
})

describe('mapEnvironment', () => {
  test('leaves local unchanged', () => {
    expect(mapEnvironment('local')).toBe('local')
  })

  test('prefixes other environments with cdp-', () => {
    expect(mapEnvironment('prod')).toBe('cdp-prod')
  })
})
