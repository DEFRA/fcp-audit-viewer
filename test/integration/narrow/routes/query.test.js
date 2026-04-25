import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import '../helpers/setup-server-mocks.js'
import { getOptions } from '../../../utils/helpers.js'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../src/server.js')

describe('Query route', () => {
  let server
  let response
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    const options = getOptions('query', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Returns 200 for authenticated request to /query', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Unauthenticated request returns 302 redirect', async () => {
    const unauthResponse = await server.inject({
      method: 'GET',
      url: '/query'
    })
    expect(unauthResponse.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
  })

  test('Form action attribute is /results', () => {
    const form = $('form')
    expect(form.attr('action')).toBe('/results')
  })

  test('Form method attribute is GET', () => {
    const form = $('form')
    expect(form.attr('method').toLowerCase()).toBe('get')
  })

  test('Condition row field select is present', () => {
    const select = $('select[id^="conditions-"][id$="-field"]')
    expect(select.length).toBeGreaterThan(0)
  })

  test('Condition row operator select is present', () => {
    const select = $('select[id^="conditions-"][id$="-operator"]')
    expect(select.length).toBeGreaterThan(0)
  })

  test('Condition row value input is present', () => {
    const input = $('input[id^="conditions-"][id$="-value"]')
    expect(input.length).toBeGreaterThan(0)
  })

  test('Field select includes application option', () => {
    const option = $('option[value="application"]')
    expect(option.length).toBeGreaterThan(0)
  })

  test('Field select includes audit.entities.entity option', () => {
    const option = $('option[value="audit.entities.entity"]')
    expect(option.length).toBeGreaterThan(0)
  })

  test('Operator select includes equal to option', () => {
    const option = $('option[value="eq"]')
    expect(option.length).toBeGreaterThan(0)
  })

  test('Operator select includes notContains option', () => {
    const option = $('option[value="notContains"]')
    expect(option.length).toBeGreaterThan(0)
  })

  test('Add condition link is present', () => {
    const link = $('#add-condition')
    expect(link.length).toBe(1)
  })

  test('Pre-populates condition field from query param', async () => {
    const url = '/query?conditions[0][field]=application&conditions[0][operator]=eq&conditions[0][value]=FCP001'
    const prePopResponse = await server.inject({
      method: 'GET',
      url,
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })
    const $pp = cheerio.load(prePopResponse.payload)

    const select = $pp('select[id="conditions-0-field"]')
    expect(select.find('option[value="application"]').attr('selected')).toBeDefined()
  })

  test('Pre-populates condition value from query param', async () => {
    const url = '/query?conditions[0][field]=application&conditions[0][operator]=eq&conditions[0][value]=FCP001'
    const prePopResponse = await server.inject({
      method: 'GET',
      url,
      auth: { strategy: 'session', credentials: { scope: ['Audit.View'], sessionId: 'test-session-id' } }
    })
    const $pp = cheerio.load(prePopResponse.payload)

    const input = $pp('input[id="conditions-0-value"]')
    expect(input.attr('value')).toBe('FCP001')
  })
})
