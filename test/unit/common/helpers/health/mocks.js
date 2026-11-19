import { vi } from 'vitest'

export const mockLogger = { info: vi.fn(), error: vi.fn() }

export function mockConfig (values) {
  return { get: vi.fn((key) => values[key] ?? null) }
}
