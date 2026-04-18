import { vi, describe, test, expect, beforeAll } from 'vitest'

vi.mock('../../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn() })
}))

vi.mock('../../../../src/config/nunjucks/context.js', () => ({
  context: vi.fn(() => ({}))
}))

const { nunjucksConfig } = await import('../../../../src/config/nunjucks/nunjucks.js')

const env = nunjucksConfig.options.compileOptions.environment

describe('nunjucks titleCase filter', () => {
  let titleCase

  beforeAll(() => {
    titleCase = env.getFilter('titleCase')
  })

  test('converts hyphenated string to title case', () => {
    expect(titleCase('hello-world')).toBe('Hello World')
  })

  test('converts space-separated string to title case', () => {
    expect(titleCase('fcp audit')).toBe('Fcp Audit')
  })

  test('handles a single word', () => {
    expect(titleCase('application')).toBe('Application')
  })

  test('returns empty string for null', () => {
    expect(titleCase(null)).toBe('')
  })

  test('returns empty string for empty string', () => {
    expect(titleCase('')).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(titleCase(undefined)).toBe('')
  })
})

describe('nunjucks formatDate filter', () => {
  let formatDate

  beforeAll(() => {
    formatDate = env.getFilter('formatDate')
  })

  test('formats a valid ISO date string', () => {
    // Use a fixed UTC date to avoid timezone variance
    const date = new Date('2025-12-01T12:51:41.000Z')
    const d = date
    const pad = (n) => String(n).padStart(2, '0')
    const expected = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    expect(formatDate('2025-12-01T12:51:41.000Z')).toBe(expected)
  })

  test('returns original value for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  test('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  test('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  test('formats date with zero-padded day and month', () => {
    const value = formatDate('2025-01-05T08:03:07.000Z')
    const d = new Date('2025-01-05T08:03:07.000Z')
    const pad = (n) => String(n).padStart(2, '0')
    const expected = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    expect(value).toBe(expected)
  })
})
