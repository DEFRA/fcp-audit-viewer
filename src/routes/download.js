import Joi from 'joi'
import qs from 'qs'
import { getStream } from '../api/get-stream.js'
import { conditionSchema } from '../common/helpers/condition-schema.js'

export const download = {
  method: 'GET',
  path: '/download',
  options: {
    auth: {
      strategy: 'session',
      scope: ['Audit.View']
    },
    validate: {
      query: Joi.object({
        conditions: Joi.array().items(conditionSchema).default([])
      })
    }
  },
  handler: async function (request, h) {
    let conditions = request.query.conditions

    // no-JS custom property fallback: conditions[N][customField] -> details.<customField>
    conditions = conditions.map((c) => {
      const { customField, field, ...rest } = c
      const resolvedField = (!field && customField) ? `details.${customField}` : field
      return { field: resolvedField, ...rest }
    }).filter((c) => c.field && c.operator && c.value !== undefined)

    const queryString = qs.stringify({ conditions })
    const stream = await getStream('/download?' + queryString)

    return h.response(stream)
      .type('text/csv')
      .header('Content-Disposition', 'attachment; filename="audit-events.csv"')
  }
}
