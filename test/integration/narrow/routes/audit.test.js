import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import '../helpers/setup-server-mocks.js'
import { getOptions } from '../../../utils/helpers.js'
import { expectPageTitle } from '../../../utils/page-title-expect.js'
import { expectHeader } from '../../../utils/header-expect.js'
import { expectFooter } from '../../../utils/footer-expect.js'

const mockGet = vi.fn()
vi.mock('../../../../src/api/get.js', () => ({ get: mockGet }))

const mockSummary = {
  total: 42,
  applications: [
    {
      application: 'FCP001',
      total: 30,
      components: [
        { component: 'fcp-audit', total: 20 },
        { component: 'fcp-portal', total: 10 }
      ]
    },
    {
      application: 'FCP002',
      total: 12,
      components: [
        { component: 'fcp-service', total: 12 }
      ]
    }
  ]
}

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../src/server.js')

describe('Audit route', () => {
  let server
  let response
  let $

  beforeAll(async () => {
    mockGet.mockResolvedValue({ data: { summary: mockSummary } })

    server = await createServer()
    await server.initialize()

    if (response) { return }

    const options = getOptions('audit', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200 when hitting the audit page', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Should render expected content', () => {
    expectPageTitle($, '')
    expectHeader($)
    expectFooter($)
  })

  test('unauthenticated request redirects', async () => {
    const unauthResponse = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(unauthResponse.statusCode).toBe(302)
  })

  test('renders total count', () => {
    expect($('[data-testid="app-page-body"]').text()).toContain('42')
  })

  test('renders application name', () => {
    expect(response.payload).toContain('FCP001')
  })

  test('total link points to /results', () => {
    const link = $('a[href="/results"]')
    expect(link.text().trim()).toBe('42')
  })

  test('application link points to /results with filter', () => {
    const link = $('a[href*="/results?application=FCP001"]')
    expect(link.length).toBeGreaterThan(0)
  })

  test('Query builder link present', () => {
    const link = $('a[href="/query"]')
    expect(link.text().trim()).toBe('Query builder')
  })
})

