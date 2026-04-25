import { Readable } from 'node:stream'
import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import '../helpers/setup-server-mocks.js'
import { getOptions } from '../../../utils/helpers.js'

const mockGetStream = vi.fn()
vi.mock('../../../../src/api/get-stream.js', () => ({ getStream: mockGetStream }))

const csvPayload = 'application,component\nFCP001,fcp-audit\n'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../src/server.js')

describe('Download route', () => {
  let server

  beforeAll(async () => {
    const readable = new Readable({ read () {} })
    readable.push(csvPayload)
    readable.push(null)
    mockGetStream.mockResolvedValue(readable)

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Returns 200 for authenticated request to /download', async () => {
    const options = getOptions('download', 'GET')
    const response = await server.inject(options)
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Unauthenticated request returns 302 redirect', async () => {
    const response = await server.inject({ method: 'GET', url: '/download' })
    expect(response.statusCode).toBe(302)
  })

  test('Response has text/csv content type', async () => {
    const options = getOptions('download', 'GET')
    const response = await server.inject(options)
    expect(response.headers['content-type']).toMatch(/text\/csv/)
  })

  test('Response has Content-Disposition attachment header', async () => {
    const options = getOptions('download', 'GET')
    const response = await server.inject(options)
    expect(response.headers['content-disposition']).toBe('attachment; filename="audit-events.csv"')
  })

  test('Response body contains CSV content from stream', async () => {
    const readable = new Readable({ read () {} })
    readable.push(csvPayload)
    readable.push(null)
    mockGetStream.mockResolvedValueOnce(readable)

    const options = getOptions('download', 'GET')
    const response = await server.inject(options)
    expect(response.payload).toBe(csvPayload)
  })

  test('Calls getStream with download path including serialised conditions', async () => {
    const readable = new Readable({ read () {} })
    readable.push('')
    readable.push(null)
    mockGetStream.mockResolvedValueOnce(readable)

    const response = await server.inject({
      method: 'GET',
      url: '/download?conditions[0][field]=application&conditions[0][operator]=eq&conditions[0][value]=FCP001',
      auth: {
        strategy: 'session',
        credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' }
      }
    })

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expect(mockGetStream).toHaveBeenCalledWith(
      expect.stringContaining('/download?')
    )
  })
})
