import { vi, describe, test, expect, beforeAll } from 'vitest'
import { detailsRows } from '../../../../src/config/nunjucks/details-rows.js'

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
    const expected = `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
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
    const expected = `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
    expect(value).toBe(expected)
  })
})

describe('nunjucks detailsRows filter', () => {
  test('returns empty array for empty object', () => {
    expect(detailsRows({})).toEqual([])
  })

  test('returns empty array for null', () => {
    expect(detailsRows(null)).toEqual([])
  })

  test('returns empty array for undefined', () => {
    expect(detailsRows(undefined)).toEqual([])
  })

  test('returns empty array for a non-object value', () => {
    expect(detailsRows('not an object')).toEqual([])
  })

  test('returns empty array for an array (not a details object)', () => {
    expect(detailsRows([])).toEqual([])
  })

  test('maps a primitive string value to a text row', () => {
    const rows = detailsRows({ status: 'offered' })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ key: { text: 'status' }, value: { text: 'offered' } })
  })

  test('maps a primitive number value to a text row', () => {
    const rows = detailsRows({ count: 42 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ key: { text: 'count' }, value: { text: '42' } })
  })

  test('skips null values', () => {
    const rows = detailsRows({ present: 'yes', missing: null })
    expect(rows).toHaveLength(1)
    expect(rows[0].key.text).toBe('present')
  })

  test('skips undefined values', () => {
    const rows = detailsRows({ present: 'yes', missing: undefined })
    expect(rows).toHaveLength(1)
    expect(rows[0].key.text).toBe('present')
  })

  test('maps a simple object value to an html row with a details element', () => {
    const rows = detailsRows({ address: { line1: '123 Street', city: 'London' } })
    expect(rows).toHaveLength(1)
    const { key, value } = rows[0]
    expect(key).toEqual({ text: 'address' })
    expect(value.html).toContain('<details class="govuk-details">')
    expect(value.html).toContain('View address')
    expect(value.html).toContain('line1')
    expect(value.html).toContain('123 Street')
    expect(value.html).toContain('city')
    expect(value.html).toContain('London')
  })

  test('renders nested objects recursively', () => {
    const rows = detailsRows({
      applicant: {
        business: {
          name: 'Acme Ltd',
          address: { line1: '1 Road', city: 'York' }
        }
      }
    })
    expect(rows).toHaveLength(1)
    const html = rows[0].value.html
    expect(html).toContain('View applicant')
    expect(html).toContain('View business')
    expect(html).toContain('View address')
    expect(html).toContain('1 Road')
    expect(html).toContain('York')
  })

  test('maps an array of primitives to repeated text rows with the same key', () => {
    const rows = detailsRows({ tags: ['a', 'b', 'c'] })
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.key).toEqual({ text: 'tags' })
      expect(row.value.text).toBeDefined()
    }
    expect(rows.map((r) => r.value.text)).toEqual(['a', 'b', 'c'])
  })

  test('maps an array of objects to repeated html rows with the same key', () => {
    const rows = detailsRows({
      payments: [
        { amount: 100, date: '2026-01-01' },
        { amount: 200, date: '2026-04-01' }
      ]
    })
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.key).toEqual({ text: 'payments' })
      expect(row.value.html).toContain('<details class="govuk-details">')
      expect(row.value.html).toContain('View payments')
    }
    expect(rows[0].value.html).toContain('100')
    expect(rows[1].value.html).toContain('200')
  })

  test('skips empty array values', () => {
    const rows = detailsRows({ items: [], name: 'test' })
    expect(rows).toHaveLength(1)
    expect(rows[0].key.text).toBe('name')
  })

  test('skips null and undefined items within array values', () => {
    const rows = detailsRows({ tags: [null, 'a', undefined, 'b'] })
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.value.text)).toEqual(['a', 'b'])
  })

  test('maps boolean values to text rows', () => {
    const rows = detailsRows({ active: true, deleted: false })
    expect(rows).toHaveLength(2)
    expect(rows[0].value.text).toBe('true')
    expect(rows[1].value.text).toBe('false')
  })

  test('escapes HTML special characters in primitive values within array items', () => {
    const rows = detailsRows({ tags: ['<b>bold</b>', 'normal'] })
    expect(rows[0].value.text).toBe('<b>bold</b>')
  })

  test('escapes HTML special characters in nested object keys within html output', () => {
    const rows = detailsRows({ meta: { '<script>': 'xss' } })
    expect(rows[0].value.html).toContain('&lt;script&gt;')
    expect(rows[0].value.html).not.toContain('<script>')
  })

  test('renders a nested array inside an object value as a details element', () => {
    // outer.inner is an array — renderDetailsHtml is called with an array when
    // a deeply nested array is encountered as an object property's value
    const rows = detailsRows({ outer: { inner: [{ x: 1 }, { x: 2 }] } })
    expect(rows).toHaveLength(1)
    const html = rows[0].value.html
    expect(html).toContain('View outer')
    expect(html).toContain('View inner')
    expect(html).toContain('1')
    expect(html).toContain('2')
  })

  test('renders a nested array-of-arrays via renderDetailsHtml array branch', () => {
    // Passing an array as the value of a nested object property causes
    // renderDetailsHtml to enter the Array.isArray branch
    const rows = detailsRows({ outer: { tags: [['a', 'b']] } })
    expect(rows).toHaveLength(1)
    const html = rows[0].value.html
    expect(html).toContain('View outer')
    expect(html).toContain('View tags')
  })

  test('escapes HTML special characters in keys', () => {
    const rows = detailsRows({ '<script>': 'value' })
    expect(rows[0].key.text).toBe('<script>')
  })

  test('escapes HTML special characters in primitive values within nested objects', () => {
    const rows = detailsRows({ meta: { msg: '<b>bold</b>' } })
    expect(rows[0].value.html).toContain('&lt;b&gt;bold&lt;/b&gt;')
    expect(rows[0].value.html).not.toContain('<b>bold</b>')
  })

  test('handles mixed details with primitives, objects, and arrays', () => {
    const rows = detailsRows({
      code: 'GRANT-001',
      status: 'active',
      identifiers: { sbi: '123456789', frn: '9876543210' },
      tags: ['alpha', 'beta'],
      payment: { amount: 5000, currency: 'GBP' }
    })
    // code, status → 2 text rows
    // identifiers → 1 html row
    // tags → 2 text rows
    // payment → 1 html row
    expect(rows).toHaveLength(6)
    expect(rows.find((r) => r.key.text === 'code').value.text).toBe('GRANT-001')
    expect(rows.find((r) => r.key.text === 'identifiers').value.html).toContain('<details')
    expect(rows.filter((r) => r.key.text === 'tags')).toHaveLength(2)
    expect(rows.find((r) => r.key.text === 'payment').value.html).toContain('5000')
  })

  test('renders the real-world complex event details structure', () => {
    const details = {
      notificationmessageid: 'b1ea9651-907f-47e5-981d-cfc68be946c2',
      code: 'frps-private-beta',
      identifiers: { sbi: '106284736', frn: '7282807759' },
      status: 'offered',
      payment: {
        agreementstartdate: '2026-05-01',
        parcelitems: {
          1: { code: 'CMOR1', description: 'Assess moorland', rateinpence: 1060 },
          2: { code: 'UPL3', description: 'Limited livestock', rateinpence: 11100 }
        },
        payments: [
          { totalpaymentpence: 23741, paymentdate: '2026-08-15' },
          { totalpaymentpence: 23736, paymentdate: '2026-11-15' }
        ]
      },
      actionapplications: [],
      consentobjects: []
    }

    const rows = detailsRows(details)

    // Primitives
    expect(rows.find((r) => r.key.text === 'notificationmessageid').value.text).toBe(
      'b1ea9651-907f-47e5-981d-cfc68be946c2'
    )
    expect(rows.find((r) => r.key.text === 'code').value.text).toBe('frps-private-beta')
    expect(rows.find((r) => r.key.text === 'status').value.text).toBe('offered')

    // Object → details element
    const identifiersRow = rows.find((r) => r.key.text === 'identifiers')
    expect(identifiersRow.value.html).toContain('View identifiers')
    expect(identifiersRow.value.html).toContain('106284736')

    // Nested object with nested object and array
    const paymentRow = rows.find((r) => r.key.text === 'payment')
    expect(paymentRow.value.html).toContain('View payment')
    expect(paymentRow.value.html).toContain('2026-05-01')
    // parcelitems is a nested object
    expect(paymentRow.value.html).toContain('View parcelitems')
    expect(paymentRow.value.html).toContain('CMOR1')
    // payments is an array of objects inside payment
    expect(paymentRow.value.html).toContain('View payments')
    expect(paymentRow.value.html).toContain('23741')

    // Empty arrays are skipped
    expect(rows.find((r) => r.key.text === 'actionapplications')).toBeUndefined()
    expect(rows.find((r) => r.key.text === 'consentobjects')).toBeUndefined()
  })
})
