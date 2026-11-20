import { ecsFormat } from '@elastic/ecs-pino-format'
import pretty from 'pino-pretty'
import { getTraceId } from '@defra/hapi-tracing'
import { config } from '../../../config/config.js'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  // A stream in the main thread, not a `transport` (worker thread): under `node --watch`
  // the worker posts `watch:import` messages that thread-stream rejects as fatal errors.
  // Synchronous, so the error logged just before a failed start-up's process.exit is not lost.
  'pino-pretty': { stream: pretty({ sync: true }) }
}

export const loggerOptions = {
  enabled: logConfig.enabled,
  ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin () {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
