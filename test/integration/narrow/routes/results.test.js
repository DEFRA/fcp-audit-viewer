import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import '../helpers/setup-server-mocks.js'
import { getOptions } from '../../../utils/helpers.js'

const mockGet = vi.fn()
vi.mock('../../../../src/api/get.js', () => ({ get: mockGet }))

const mockResponse = {
  data: {
    events: [
      {
        application: 'FCP001',
        component: 'fcp-audit',
        datetime: '2025-12-01T12:51:41.381Z',
        user: 'IDM/user-1',
        sessionid: 'sess-1',
        correlationid: 'corr-1',
        environment: 'prod',
        version: '1.2',
        ip: '192.168.1.1',
        audit: {
          entities: [{ entity: 'application', action: 'created', entityid: 'APP-001' }],
          accounts: { sbi: '123456789' },
          status: 'success',
          details: { caseid: 'CRM-001' }
        }
      }
    ]
  },
  meta: { page: 1, pageSize: 20, total: 1 },
  links: {}
}

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../src/server.js')

describe('Results route', () => {
  let server
  let response
  let $

  beforeAll(async () => {
    mockGet.mockResolvedValue(mockResponse)

    server = await createServer()
    await server.initialize()

    const options = getOptions('results', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Returns 200 for authenticated request to /results', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Unauthenticated request returns 302 redirect', async () => {
    const unauthResponse = await server.inject({
      method: 'GET',
      url: '/results'
    })
    expect(unauthResponse.statusCode).toBe(302)
  })

  test('Page renders event application name', () => {
    expect(response.payload).toContain('FCP001')
  })

  test('Page renders event component name', () => {
    expect(response.payload).toContain('fcp-audit')
  })

  test('Back to dashboard link is present', () => {
    const link = $('a[href="/audit"]')
    expect(link.text().trim()).toBe('Back to dashboard')
  })

  test('Modify search link is present', () => {
    const link = $('a[href^="/query"]')
    expect(link.length).toBeGreaterThan(0)
  })

  test('Shows Next pagination link when more results exist', async () => {
    const paginatedMock = {
      ...mockResponse,
      data: { ...mockResponse.data },
      meta: { page: 1, pageSize: 20, total: 25 }
    }
    mockGet.mockResolvedValueOnce(paginatedMock)

    const options = getOptions('results', 'GET')
    const paginatedResponse = await server.inject(options)
    const $paginated = cheerio.load(paginatedResponse.payload)

    const nextLink = $paginated('.govuk-pagination__next')
    expect(nextLink.length).toBeGreaterThan(0)
  })
})
