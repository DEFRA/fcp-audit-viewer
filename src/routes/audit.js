export const audit = {
  method: 'GET',
  path: '/audit',
  handler: function (_request, h) {
    return h.view('audit')
  }
}
