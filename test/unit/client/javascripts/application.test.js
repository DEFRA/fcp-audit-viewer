import { describe, beforeEach, test, expect, vi } from 'vitest'

const { mockInitAll, mockInitQueryBuilder } = vi.hoisted(() => ({
  mockInitAll: vi.fn(),
  mockInitQueryBuilder: vi.fn()
}))

vi.mock('govuk-frontend', () => ({
  initAll: mockInitAll
}))

vi.mock('../../../../src/client/javascripts/query.js', () => ({
  initQueryBuilder: mockInitQueryBuilder
}))

describe('application', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    await import('../../../../src/client/javascripts/application.js')
  })

  test('should call init() on all custom client-side javascript modules', () => {
    expect(mockInitAll).toHaveBeenCalled()
  })

  test('should call initQueryBuilder()', () => {
    expect(mockInitQueryBuilder).toHaveBeenCalled()
  })
})
