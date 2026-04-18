import qs from 'qs'
import { createLogger } from '../common/helpers/logging/logger.js'
import { get } from '../api/get.js'

const logger = createLogger()

function conditionHref (conditions) {
  return '/results?' + qs.stringify({ conditions })
}

function buildSummaryLinks (summary) {
  if (!summary?.applications) {
    return summary
  }

  return {
    ...summary,
    applications: summary.applications.map((app) => ({
      ...app,
      href: conditionHref([{ field: 'application', operator: 'eq', value: app.application }]),
      components: app.components.map((comp) => ({
        ...comp,
        href: conditionHref([
          { field: 'application', operator: 'eq', value: app.application },
          { field: 'component', operator: 'eq', value: comp.component }
        ])
      }))
    }))
  }
}

export const audit = {
  method: 'GET',
  path: '/',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    }
  },
  handler: async function (_request, h) {
    try {
      const response = await get('/summary')
      return h.view('audit', { summary: buildSummaryLinks(response.data.summary) })
    } catch (err) {
      logger.error('Failed to fetch audit summary', err)
      return h.view('audit', { summary: null })
    }
  }
}
