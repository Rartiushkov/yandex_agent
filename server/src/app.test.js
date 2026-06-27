import { describe, expect, it, vi } from 'vitest'

vi.mock('./direct/service.js', () => ({
  getCampaignSnapshot: vi.fn(async () => ({ campaigns: [{ id: '1' }] })),
  suspendCampaigns: vi.fn(async () => ({ result: { processed: [1] } })),
  resumeCampaigns: vi.fn(async () => ({ result: { processed: [1] } })),
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
