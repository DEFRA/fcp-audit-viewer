import Inert from '@hapi/inert'
import { health } from '../routes/health.js'
import { auth } from '../routes/auth.js'
import { start } from '../routes/start.js'
import { serveStaticFiles } from '../common/helpers/serve-static-files.js'
import { audit } from '../routes/audit.js'
import { results } from '../routes/results.js'
import { query } from '../routes/query.js'

export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([Inert])
      await server.route(health)
      await server.route(auth)
      await server.route(start)
      await server.route(audit)
      await server.route(results)
      await server.route(query)
      await server.register([serveStaticFiles])
    }
  }
}
