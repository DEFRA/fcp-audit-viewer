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
    const conditions = request.query.conditions
    return h.view('query', { conditions: (conditions && conditions.length) ? conditions : [{}] })
  }
}
