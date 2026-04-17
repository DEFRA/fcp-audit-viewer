export const query = {
  method: 'GET',
  path: '/query',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    }
  },
  handler: function (request, h) {
    return h.view('query', { currentQuery: request.query })
  }
}
