import { createLogger } from '../common/helpers/logging/logger.js'
import { get } from '../api/get.js'

const logger = createLogger()

export const audit = {
  method: 'GET',
  path: '/audit',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    }
  },
  handler: async function (_request, h) {
    try {
      const response = await get('/summary')
      return h.view('audit', { summary: response.data.summary })
    } catch (err) {
      logger.error('Failed to fetch audit summary', err)
      return h.view('audit', { summary: null })
    }
  }
}
