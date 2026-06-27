import cors from 'cors'
import express from 'express'
import { getCampaignSnapshot } from './direct/service.js'

function getToken(req) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice('Bearer '.length).trim()
}

function getClientLogin(req) {
  return req.headers['x-direct-client-login'] || process.env.YANDEX_DIRECT_CLIENT_LOGIN || null
}

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      sandbox: process.env.YANDEX_DIRECT_USE_SANDBOX === 'true',
      hasDefaultClientLogin: Boolean(process.env.YANDEX_DIRECT_CLIENT_LOGIN),
    })
  })

  async function handleCampaignSnapshot(req, res) {
    const token = getToken(req)
    if (!token) {
      res.status(401).json({ error: 'Missing Bearer token' })
      return
    }

    try {
      const snapshot = await getCampaignSnapshot({
        token,
        clientLogin: getClientLogin(req),
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      })

      res.json(snapshot)
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        detail: error.detail || null,
      })
    }
  }

  app.get('/campaigns', handleCampaignSnapshot)
  app.post('/campaigns/sync', handleCampaignSnapshot)

  return app
}
