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
    expect(unauthResponse.statusCode).toBe(302)
  })

  test('Form action attribute is /results', () => {
    const form = $('form')
    expect(form.attr('action')).toBe('/results')
  })

  test('Form method attribute is GET', () => {
    const form = $('form')
    expect(form.attr('method').toLowerCase()).toBe('get')
  })

  test('Input with name="application" is present', () => {
    const input = $('input[name="application"]')
    expect(input.length).toBeGreaterThan(0)
  })

  test('Input with name="component" is present', () => {
    const input = $('input[name="component"]')
    expect(input.length).toBeGreaterThan(0)
  })

  test('Input with name="customField" is present', () => {
    const input = $('input[name="customField"]')
    expect(input.length).toBeGreaterThan(0)
  })

  test('Input with name="customValue" is present', () => {
    const input = $('input[name="customValue"]')
    expect(input.length).toBeGreaterThan(0)
  })

  test('Pre-populates application input from query param', async () => {
    const options = getOptions('query', 'GET', { application: 'FCP001' })
    const prePopResponse = await server.inject(options)
    const $prePopulated = cheerio.load(prePopResponse.payload)

    const input = $prePopulated('input[name="application"]')
    expect(input.attr('value')).toBe('FCP001')
  })
})
