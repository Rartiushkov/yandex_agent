import { describe, expect, it, vi } from 'vitest'

vi.mock('./direct/service.js', () => ({
  getCampaignSnapshot: vi.fn(async () => ({ campaigns: [{ id: '1' }] })),
  suspendCampaigns: vi.fn(async () => ({ result: { processed: [1] } })),
  resumeCampaigns: vi.fn(async () => ({ result: { processed: [1] } })),
}))

vi.mock('./auth/yandexDirectOAuth.js', () => ({
  buildDirectAuthorizeUrl: vi.fn(() => 'https://oauth.yandex.ru/authorize?client_id=test'),
  exchangeVerificationCode: vi.fn(async () => ({ access_token: 'direct-access-token' })),
  getDirectOauthConfig: vi.fn(() => ({ clientId: 'id', clientSecret: 'secret' })),
}))

import { createApp } from './app.js'

describe('server app', () => {
  it('returns health response', async () => {
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/health`)
      const json = await response.json()
      expect(json.ok).toBe(true)
    } finally {
      server.close()
    }
  })

  it('requires token for campaigns', async () => {
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/campaigns`)
      expect(response.status).toBe(401)
    } finally {
      server.close()
    }
  })

  it('uses master token mode in health response when configured', async () => {
    process.env.YANDEX_DIRECT_MASTER_TOKEN = 'test-token'
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/health`)
      const json = await response.json()
      expect(json.hasMasterToken).toBe(true)
    } finally {
      delete process.env.YANDEX_DIRECT_MASTER_TOKEN
      server.close()
    }
  })

  it('returns direct auth url', async () => {
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/auth/direct/url`)
      const json = await response.json()
      expect(json.authorizeUrl).toContain('oauth.yandex.ru/authorize')
    } finally {
      server.close()
    }
  })

  it('exchanges verification code into session', async () => {
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/auth/direct/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: 'test-code' }),
      })
      const json = await response.json()
      expect(response.status).toBe(200)
      expect(json.connected).toBe(true)
      expect(response.headers.get('set-cookie')).toContain('ya_direct_sid=')
    } finally {
      server.close()
    }
  })

  it('allows suspend route with token', async () => {
    const app = createApp()
    const server = app.listen()

    try {
      const address = server.address()
      const response = await fetch(`http://127.0.0.1:${address.port}/campaigns/1/suspend`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
        },
      })
      expect(response.status).toBe(200)
    } finally {
      server.close()
    }
  })
})
