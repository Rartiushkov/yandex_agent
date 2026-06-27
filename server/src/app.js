import cors from 'cors'
import express from 'express'
import { buildDirectAuthorizeUrl, exchangeVerificationCode, getDirectOauthConfig } from './auth/yandexDirectOAuth.js'
import { clearSession, createSession, getSession, setSessionCookie } from './auth/sessions.js'
import { getCampaignSnapshot, resumeCampaigns, suspendCampaigns } from './direct/service.js'

function getToken(req) {
  if (process.env.YANDEX_DIRECT_MASTER_TOKEN) {
    return process.env.YANDEX_DIRECT_MASTER_TOKEN
  }

  const session = getSession(req)
  if (session?.directToken) {
    return session.directToken
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice('Bearer '.length).trim()
}

function getClientLogin(req) {
  return req.headers['x-direct-client-login'] || process.env.YANDEX_DIRECT_CLIENT_LOGIN || null
}

function isReadOnlyMode() {
  return process.env.YANDEX_DIRECT_READ_ONLY !== 'false'
}

export function createApp() {
  const app = express()

  app.use(cors({
    origin: true,
    credentials: true,
  }))
  app.use(express.json())

  app.get('/health', (_req, res) => {
    const oauthConfig = getDirectOauthConfig()
    res.json({
      ok: true,
      sandbox: process.env.YANDEX_DIRECT_USE_SANDBOX === 'true',
      hasDefaultClientLogin: Boolean(process.env.YANDEX_DIRECT_CLIENT_LOGIN),
      hasMasterToken: Boolean(process.env.YANDEX_DIRECT_MASTER_TOKEN),
      hasOauthApp: Boolean(oauthConfig.clientId && oauthConfig.clientSecret),
      readOnly: isReadOnlyMode(),
    })
  })

  app.get('/auth/direct/url', (_req, res) => {
    try {
      res.json({
        authorizeUrl: buildDirectAuthorizeUrl(),
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  app.get('/auth/direct/status', (req, res) => {
    const session = getSession(req)
    res.json({
      connected: Boolean(process.env.YANDEX_DIRECT_MASTER_TOKEN || session?.directToken),
      mode: process.env.YANDEX_DIRECT_MASTER_TOKEN ? 'master' : (session?.directToken ? 'session' : 'none'),
    })
  })

  app.post('/auth/direct/exchange', async (req, res) => {
    const code = req.body?.code?.trim()
    if (!code) {
      res.status(400).json({ error: 'Missing verification code' })
      return
    }

    try {
      const payload = await exchangeVerificationCode(code)
      const sessionId = createSession({
        directToken: payload.access_token,
        refreshToken: payload.refresh_token || null,
      })
      setSessionCookie(res, sessionId)
      res.json({
        ok: true,
        connected: true,
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        detail: error.detail || null,
      })
    }
  })

  app.post('/auth/direct/logout', (req, res) => {
    clearSession(req, res)
    res.json({ ok: true })
  })

  async function handleCampaignSnapshot(req, res) {
    const token = getToken(req)
    if (!token) {
      res.status(401).json({ error: 'Missing Direct API token' })
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

  async function handleCampaignAction(req, res, action) {
    if (isReadOnlyMode()) {
      res.status(403).json({ error: 'Direct connector is running in read-only mode' })
      return
    }

    const token = getToken(req)
    if (!token) {
      res.status(401).json({ error: 'Missing Direct API token' })
      return
    }

    const campaignId = Number(req.params.id)
    if (!Number.isFinite(campaignId)) {
      res.status(400).json({ error: 'Invalid campaign id' })
      return
    }

    try {
      const result = action === 'suspend'
        ? await suspendCampaigns({ token, clientLogin: getClientLogin(req), ids: [campaignId] })
        : await resumeCampaigns({ token, clientLogin: getClientLogin(req), ids: [campaignId] })

      res.json({ ok: true, result })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        detail: error.detail || null,
      })
    }
  }

  app.post('/campaigns/:id/suspend', (req, res) => handleCampaignAction(req, res, 'suspend'))
  app.post('/campaigns/:id/resume', (req, res) => handleCampaignAction(req, res, 'resume'))

  return app
}
