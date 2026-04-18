import Joi from 'joi'
import { conditionSchema } from '../common/helpers/condition-schema.js'

export const query = {
  method: 'GET',
  path: '/query',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    },
    validate: {
      query: Joi.object({
        conditions: Joi.array().items(conditionSchema).optional()
      })
    }
  },
  handler: function (request, h) {
    const conditions = request.query.conditions
    return h.view('query', { conditions: conditions?.length ? conditions : [{}] })
  }
}
