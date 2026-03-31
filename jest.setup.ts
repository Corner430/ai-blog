/**
 * Jest global setup: fail tests on unexpected console.error / console.warn.
 *
 * Known harmless messages (e.g. punycode deprecation from upstream deps)
 * are allowlisted and silently ignored.
 */

const IGNORED_PATTERNS = [/The `punycode` module is deprecated/, /Use `node --trace-deprecation/]

function shouldIgnore(message: string): boolean {
  return IGNORED_PATTERNS.some((p) => p.test(message))
}

const originalError = console.error
const originalWarn = console.warn

beforeEach(() => {
  console.error = (...args: unknown[]) => {
    const message = args.map(String).join(' ')
    if (shouldIgnore(message)) return
    originalError(...args)
    throw new Error(`console.error called during test:\n${message}`)
  }

  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(' ')
    if (shouldIgnore(message)) return
    originalWarn(...args)
    throw new Error(`console.warn called during test:\n${message}`)
  }
})

afterEach(() => {
  console.error = originalError
  console.warn = originalWarn
})
