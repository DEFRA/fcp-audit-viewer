import { constants as httpConstants } from 'node:http2'
import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import '../helpers/setup-server-mocks.js'

const { HTTP_STATUS_OK } = httpConstants

const { createServer } = await import('../../../../src/server.js')

describe('Health route', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response and return status code 200', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/health'
    })

    expect(result).toEqual({ message: 'success' })
    expect(statusCode).toBe(HTTP_STATUS_OK)
  })
})
