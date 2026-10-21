import { afterEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ handler: vi.fn(() => new Response('ok')), createHandler: vi.fn() }))
vi.mock('@lovable.dev/email-js', () => ({
  createAuthEmailHandler: mocks.createHandler,
  EmailAPIError: class extends Error {},
  sendLovableEmail: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => options }))

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

it('uses the requested managed domain and retains every account email action', async () => {
  vi.stubEnv('LOVABLE_API_KEY', 'synthetic-test-key')
  mocks.createHandler.mockReturnValue(mocks.handler)
  const { Route } = await import('../routes/lovable/email/auth/webhook')
  const route = Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Response } } }
  const request = new Request('https://pelicantoursandsafari.com/lovable/email/auth/webhook', { method: 'POST' })
  route.server.handlers.POST({ request })
  expect(mocks.createHandler).toHaveBeenCalledWith(expect.objectContaining({
    senderDomain: 'notify.pelicantoursandsafari.com',
    from: { name: 'Pelican Tours and Safari', address: 'noreply@pelicantoursandsafari.com' },
  }))
  const options = mocks.createHandler.mock.calls[0]?.[0]
  expect(Object.keys(options.emails).sort()).toEqual(['email_change', 'invite', 'magiclink', 'reauthentication', 'recovery', 'signup'])
  expect(mocks.handler).toHaveBeenCalledWith(request)
})
it('renders all six managed account previews with their typed sample data', async () => {
  vi.stubEnv('LOVABLE_API_KEY', 'synthetic-test-key')
  const { Route } = await import('../routes/lovable/email/auth/preview')
  const route = Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }
  for (const type of ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'reauthentication']) {
    const response = await route.server.handlers.POST({ request: new Request('https://pelicantoursandsafari.com/lovable/email/auth/preview', {
      method: 'POST', headers: { Authorization: 'Bearer synthetic-test-key', 'Content-Type': 'application/json' }, body: JSON.stringify({ type }),
    }) })
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('pelicantoursandsafari.com/pelican-logo.png')
    expect(html).not.toContain('undefined')
  }
})
