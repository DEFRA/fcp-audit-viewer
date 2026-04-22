import path from 'node:path'
import nunjucks from 'nunjucks'
import hapiVision from '@hapi/vision'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { context } from './context.js'
import * as globals from './globals.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksEnvironment = nunjucks.configure(
  [
    'node_modules/govuk-frontend/dist/',
    path.resolve(dirname, '../../views/'),
    path.resolve(dirname, '../../views/partials'),
    path.resolve(dirname, '../../views/macros')
  ],
  {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
    watch: config.get('nunjucks.watch'),
    noCache: config.get('nunjucks.noCache')
  }
)

export const nunjucksConfig = {
  plugin: hapiVision,
  options: {
    engines: {
      njk: {
        compile (src, options) {
          const template = nunjucks.compile(src, options.environment)
          return (ctx) => template.render(ctx)
        }
      }
    },
    compileOptions: {
      environment: nunjucksEnvironment
    },
    relativeTo: path.resolve(dirname, '../..'),
    path: 'views',
    isCached: config.get('isProduction'),
    context
  }
}

Object.entries(globals).forEach(([name, global]) => {
  nunjucksEnvironment.addGlobal(name, global)
})

// ---------------------------------------------------------------------------
// detailsRows filter helpers
// ---------------------------------------------------------------------------

const escapeHtml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderDetailsHtml = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return escapeHtml(obj ?? '')
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => {
        if (item === null || item === undefined) {
          return ''
        }
        if (typeof item === 'object') {
          return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key"></dt><dd class="govuk-summary-list__value">${renderValueHtml(item, '')}</dd></div>`
        }
        return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key"></dt><dd class="govuk-summary-list__value">${escapeHtml(item)}</dd></div>`
      })
      .join('')
  }

  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) {
          return ''
        }
        return v
          .map((item) => {
            if (item === null || item === undefined) {
              return ''
            }
            const valueHtml =
              typeof item === 'object'
                ? renderValueHtml(item, k)
                : escapeHtml(item)
            return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(k)}</dt><dd class="govuk-summary-list__value">${valueHtml}</dd></div>`
          })
          .join('')
      }
      if (typeof v === 'object') {
        return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(k)}</dt><dd class="govuk-summary-list__value">${renderValueHtml(v, k)}</dd></div>`
      }
      return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(k)}</dt><dd class="govuk-summary-list__value">${escapeHtml(v)}</dd></div>`
    })
    .join('')
}

const renderValueHtml = (value, key) =>
  '<details class="govuk-details">' +
  '<summary class="govuk-details__summary">' +
  `<span class="govuk-details__summary-text">View ${escapeHtml(key)}</span>` +
  '</summary>' +
  '<div class="govuk-details__text">' +
  `<dl class="govuk-summary-list">${renderDetailsHtml(value)}</dl>` +
  '</div>' +
  '</details>'

nunjucksEnvironment.addFilter('detailsRows', (details) => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return []
  }
  const rows = []
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) {
      continue
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue
      }
      for (const item of value) {
        if (item === null || item === undefined) {
          continue
        }
        if (typeof item === 'object') {
          rows.push({ key: { text: key }, value: { html: renderValueHtml(item, key) } })
        } else {
          rows.push({ key: { text: key }, value: { text: String(item) } })
        }
      }
    } else if (typeof value === 'object') {
      rows.push({ key: { text: key }, value: { html: renderValueHtml(value, key) } })
    } else {
      rows.push({ key: { text: key }, value: { text: String(value) } })
    }
  }
  return rows
})

// ---------------------------------------------------------------------------

nunjucksEnvironment.addFilter('titleCase', (value) => {
  if (!value) {
    return ''
  }
  return String(value)
    .replaceAll('-', ' ')
    .replaceAll(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
})

nunjucksEnvironment.addFilter('formatDate', (value) => {
  if (!value) {
    return ''
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return value
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
})
