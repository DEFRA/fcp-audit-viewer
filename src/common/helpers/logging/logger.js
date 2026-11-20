import { pino } from 'pino'
import { loggerOptions } from './logger-options.js'

const logger = pino(loggerOptions, loggerOptions.stream)

function createLogger () {
  return logger
}

export { createLogger }
