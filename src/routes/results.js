import { get } from '../api/get.js'

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
    const response = await get('/audit/search?' + queryString)

    const currentPage = parseInt(page)
    const currentPageSize = parseInt(pageSize)
    const total = response.meta ? response.meta.total : 0
    const baseParams = { ...params }
    delete baseParams.page

    const prevUrl = currentPage > 1
      ? '/results?' + new URLSearchParams({ ...baseParams, page: currentPage - 1 }).toString()
      : null

    const nextUrl = currentPage * currentPageSize < total
      ? '/results?' + new URLSearchParams({ ...baseParams, page: currentPage + 1 }).toString()
      : null

    return h.view('results', {
      events: response.data.events,
      meta: response.meta,
      currentQuery: request.query,
      prevUrl,
      nextUrl
    })
  }
}
