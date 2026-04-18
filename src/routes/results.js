import { get } from '../api/get.js'

function buildPaginationItems (currentPage, totalPages, baseParams) {
  if (totalPages <= 1) return []

  const pageUrl = (p) => '/results?' + new URLSearchParams({ ...baseParams, page: p }).toString()

  const visiblePages = new Set([1, totalPages])
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i >= 1 && i <= totalPages) visiblePages.add(i)
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

const filterParams = [
  'user',
  'sessionid',
  'correlationid',
  'environment',
  'version',
  'application',
  'component',
  'ip',
  'auditStatus',
  'entityEntity',
  'entityAction',
  'entityId',
  'accountSbi',
  'accountFrn',
  'accountVendor',
  'accountOrganisationId',
  'customField',
  'customValue',
  'dateFrom',
  'dateTo'
]

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

    const params = { page, pageSize }

    for (const param of filterParams) {
      const value = request.query[param]
      if (value !== null && value !== undefined) {
        params[param] = value
      }
    }

    const queryString = new URLSearchParams(params).toString()
    const response = await get('/search?' + queryString)

    const currentPage = parseInt(page)
    const currentPageSize = parseInt(pageSize)
    const total = response.meta ? response.meta.total : 0
    const baseParams = { ...params }
    delete baseParams.page

    const totalPages = total > 0 ? Math.ceil(total / currentPageSize) : 1

    const prevUrl = currentPage > 1
      ? '/results?' + new URLSearchParams({ ...baseParams, page: currentPage - 1 }).toString()
      : null

    const nextUrl = currentPage * currentPageSize < total
      ? '/results?' + new URLSearchParams({ ...baseParams, page: currentPage + 1 }).toString()
      : null

    const pages = buildPaginationItems(currentPage, totalPages, baseParams)

    const referrer = request.info.referrer
    const backUrl = (referrer && !referrer.includes('/results'))
      ? referrer
      : '/query?' + new URLSearchParams(baseParams).toString()

    return h.view('results', {
      events: response.data.events,
      meta: response.meta,
      currentQuery: request.query,
      prevUrl,
      nextUrl,
      pages,
      totalPages,
      backUrl
    })
  }
}
