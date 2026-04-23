import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock crypto.randomUUID for Node.js environment
if (typeof crypto === 'undefined' || !('randomUUID' in crypto)) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    writable: true,
  })
}
