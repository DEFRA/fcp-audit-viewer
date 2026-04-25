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
    expect(unauthResponse.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
  })

  test('Page renders event application name', () => {
    expect(response.payload).toContain('FCP001')
  })

  test('Page renders event component name', () => {
    expect(response.payload).toContain('fcp-audit')
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

  test('Shows Previous pagination link when on page 2', async () => {
    const paginatedMock = {
      ...mockResponse,
      data: { ...mockResponse.data },
      meta: { page: 2, pageSize: 20, total: 50 }
    }
    mockGet.mockResolvedValueOnce(paginatedMock)

    const page2Response = await server.inject({
      method: 'GET',
      url: '/results?page=2',
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })
    const $page2 = cheerio.load(page2Response.payload)

    const prevLink = $page2('.govuk-pagination__prev')
    expect(prevLink.length).toBeGreaterThan(0)
  })

  test('No previous pagination link on page 1', () => {
    const prevLink = $(' .govuk-pagination__prev')
    expect(prevLink.length).toBe(0)
  })

  test('Renders "No results found" when events array is empty', async () => {
    const emptyMock = {
      data: { events: [] },
      meta: { page: 1, pageSize: 20, total: 0 }
    }
    mockGet.mockResolvedValueOnce(emptyMock)

    const emptyResponse = await server.inject(getOptions('results', 'GET'))
    expect(emptyResponse.payload).toContain('No results found.')
  })

  test('Back link is present in the page', () => {
    const backLink = $(' .govuk-back-link')
    expect(backLink.length).toBeGreaterThan(0)
  })

  test('customField condition is resolved to details.<customField> before calling API', async () => {
    mockGet.mockResolvedValueOnce(mockResponse)

    await server.inject({
      method: 'GET',
      url: '/results?conditions%5B0%5D%5BcustomField%5D=caseid&conditions%5B0%5D%5Boperator%5D=eq&conditions%5B0%5D%5Bvalue%5D=foo',
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })

    const calledPath = mockGet.mock.calls.at(-1)[0]
    // qs.stringify URL-encodes brackets, so compare on the unambiguous value portion
    expect(calledPath).toContain('details.caseid')
  })

  test('Conditions missing required fields are stripped before calling API', async () => {
    mockGet.mockResolvedValueOnce(mockResponse)

    await server.inject({
      method: 'GET',
      url: '/results?conditions%5B0%5D%5Bfield%5D=application&conditions%5B0%5D%5Boperator%5D=eq',
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })

    const calledPath = mockGet.mock.calls.at(-1)[0]
    expect(calledPath).not.toContain('application')
  })

  test('renders error state when API throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network failure'))

    const errorResponse = await server.inject(getOptions('results', 'GET'))

    expect(errorResponse.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expect(errorResponse.payload).toContain('No results found.')
  })

  test('backUrl falls back to / when referrer is an invalid URL', async () => {
    mockGet.mockResolvedValueOnce(mockResponse)

    const refResponse = await server.inject({
      method: 'GET',
      url: '/results',
      headers: { referer: 'not-a-valid-url' },
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })

    const $ref = cheerio.load(refResponse.payload)
    expect($ref('.govuk-back-link').attr('href')).toBe('/')
  })

  test('pagination includes ellipsis when current page is far from edges', async () => {
    const manyPagesMock = {
      ...mockResponse,
      meta: { page: 5, pageSize: 20, total: 300 }
    }
    mockGet.mockResolvedValueOnce(manyPagesMock)

    const manyPagesResponse = await server.inject({
      method: 'GET',
      url: '/results?page=5&pageSize=20',
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })

    expect(manyPagesResponse.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expect(manyPagesResponse.payload).toContain('govuk-pagination__item--ellipsis')
  })
})
