import qs from 'qs'
import { get } from '../api/get.js'

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
      items.push({ type: 'ellipsis' })
    }
    items.push({
      type: 'number',
      page: sorted[i],
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
    }
  },
  handler: async function (request, h) {
    const { page = 1, pageSize = 20 } = request.query
    let conditions = request.query.conditions || []

    // no-JS custom property fallback: conditions[N][customField] -> details.<customField>
    // Strip customField from all conditions before forwarding to the API
    conditions = conditions.map((c) => {
      const { customField, field, ...rest } = c
      const resolvedField = (!field && customField) ? `details.${customField}` : field
      return { field: resolvedField, ...rest }
    }).filter((c) => c.field && c.operator && c.value !== undefined)

    const queryString = qs.stringify({ conditions, page, pageSize })
    const response = await get('/search?' + queryString)

    const currentPage = Number.parseInt(page)
    const currentPageSize = Number.parseInt(pageSize)
    const total = response.meta ? response.meta.total : 0

    const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 1

    const prevUrl = currentPage > 1
      ? '/results?' + qs.stringify({ conditions, pageSize: currentPageSize, page: currentPage - 1 })
      : null

    const nextUrl = currentPage * currentPageSize < total
      ? '/results?' + qs.stringify({ conditions, pageSize: currentPageSize, page: currentPage + 1 })
      : null

    const pages = buildPaginationItems(currentPage, totalPages, conditions, currentPageSize)

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
      events: response.data.events,
      meta: response.meta,
      conditions,
      prevUrl,
      nextUrl,
      pages,
      totalPages,
      backUrl
    })
  }
}
