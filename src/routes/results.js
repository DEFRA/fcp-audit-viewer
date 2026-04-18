import Joi from 'joi'
import qs from 'qs'
import { createLogger } from '../common/helpers/logging/logger.js'
import { get } from '../api/get.js'
import { conditionSchema } from '../common/helpers/condition-schema.js'

const logger = createLogger()

function buildPaginationItems (currentPage, totalPages, baseConditions, basePageSize) {
  if (totalPages <= 1) {
    return []
  }

  const pageUrl = (p) => '/results?' + qs.stringify({ conditions: baseConditions, pageSize: basePageSize, page: p })

  const visiblePages = new Set([1, totalPages])
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i >= 1 && i <= totalPages) {
      visiblePages.add(i)
    }
  }

  const sorted = [...visiblePages].sort((a, b) => a - b)
  const items = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push({ ellipsis: true })
    }
    items.push({
      number: sorted[i],
      href: pageUrl(sorted[i]),
      current: sorted[i] === currentPage
    })
  }

  return items
}

export const results = {
  method: 'GET',
  path: '/results',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    },
    validate: {
      query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
        conditions: Joi.array().items(conditionSchema).default([])
      })
    }
  },
  handler: async function (request, h) {
    const { page, pageSize } = request.query
    let conditions = request.query.conditions

    // no-JS custom property fallback: conditions[N][customField] -> details.<customField>
    // Strip customField from all conditions before forwarding to the API
    conditions = conditions.map((c) => {
      const { customField, field, ...rest } = c
      const resolvedField = (!field && customField) ? `details.${customField}` : field
      return { field: resolvedField, ...rest }
    }).filter((c) => c.field && c.operator && c.value !== undefined)

    try {
      const queryString = qs.stringify({ conditions, page, pageSize })
      const response = await get('/search?' + queryString)

      const total = response?.meta?.total ?? 0
      const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1

      const prevUrl = page > 1
        ? '/results?' + qs.stringify({ conditions, pageSize, page: page - 1 })
        : null

      const nextUrl = page * pageSize < total
        ? '/results?' + qs.stringify({ conditions, pageSize, page: page + 1 })
        : null

      const pages = buildPaginationItems(page, totalPages, conditions, pageSize)

      const referrer = request.info.referrer
      let backUrl = '/'
      if (referrer) {
        try {
          backUrl = new URL(referrer).pathname
        } catch {
          backUrl = '/'
        }
      }

      return h.view('results', {
        events: response?.data?.events ?? [],
        meta: response?.meta ?? null,
        conditions,
        prevUrl,
        nextUrl,
        pages,
        totalPages,
        backUrl
      })
    } catch (err) {
      logger.error('Failed to fetch search results', err)
      return h.view('results', {
        events: [],
        meta: null,
        conditions,
        prevUrl: null,
        nextUrl: null,
        pages: [],
        totalPages: 1,
        backUrl: '/'
      })
    }
  }
}
