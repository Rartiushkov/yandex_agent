import cors from 'cors'
import express from 'express'
import { buildDirectAuthorizeUrl, DIRECT_ENVIRONMENTS, exchangeVerificationCode, getDirectOauthMatrix } from './auth/yandexDirectOAuth.js'
import { clearSession, createSession, getSession, setSessionCookie, updateSession } from './auth/sessions.js'
import { normalizeDirectMode } from './direct/config.js'
import { getCampaignSnapshot, resumeCampaigns, suspendCampaigns } from './direct/service.js'

function emptyDirectState() {
  return {
    activeMode: 'sandbox',
    sandbox: null,
    production: null,
  }
}

function getRequestedMode(req, fallback = 'sandbox') {
  const bodyMode = req.body?.mode
  const queryMode = req.query?.mode
  const headerMode = req.headers['x-direct-environment']
  const candidate = bodyMode || queryMode || headerMode || fallback
  return normalizeDirectMode(candidate)
}

function getMasterToken(mode) {
  if (mode === 'production') {
    return process.env.YANDEX_DIRECT_MASTER_TOKEN_PRODUCTION || process.env.YANDEX_DIRECT_MASTER_TOKEN || ''
  }

  return process.env.YANDEX_DIRECT_MASTER_TOKEN_SANDBOX || process.env.YANDEX_DIRECT_MASTER_TOKEN || ''
}

function readDirectState(req) {
  const session = getSession(req)
  if (!session) {
    return {
      session: null,
      direct: emptyDirectState(),
    }
  }

  const direct = {
    ...emptyDirectState(),
    ...(session.direct || {}),
  }
  return { session, direct }
}

function persistDirectState(res, session, direct) {
  if (session?.id) {
    updateSession(session.id, { direct })
    setSessionCookie(res, session.id)
    return session.id
  }

  const sessionId = createSession({ direct })
  setSessionCookie(res, sessionId)
  return sessionId
}

function getToken(req, mode) {
  const masterToken = getMasterToken(mode)
  if (masterToken) {
    return masterToken
  }

  const { direct } = readDirectState(req)
  const sessionToken = direct?.[mode]?.accessToken
  if (sessionToken) {
    return sessionToken
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
    const oauthApps = getDirectOauthMatrix()
    res.json({
      ok: true,
      environments: DIRECT_ENVIRONMENTS,
      defaultMode: normalizeDirectMode(process.env.YANDEX_DIRECT_DEFAULT_MODE || 'sandbox'),
      hasDefaultClientLogin: Boolean(process.env.YANDEX_DIRECT_CLIENT_LOGIN),
      hasMasterToken: Boolean(process.env.YANDEX_DIRECT_MASTER_TOKEN),
      hasMasterTokenSandbox: Boolean(getMasterToken('sandbox')),
      hasMasterTokenProduction: Boolean(getMasterToken('production')),
      hasOauthApp: Object.values(oauthApps).some(item => item.configured),
      oauthApps,
      readOnly: isReadOnlyMode(),
    })
  })

  app.get('/auth/direct/url', (req, res) => {
    try {
      const mode = getRequestedMode(req, process.env.YANDEX_DIRECT_DEFAULT_MODE || 'sandbox')
      res.json({
        mode,
        authorizeUrl: buildDirectAuthorizeUrl(mode),
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  app.get('/auth/direct/status', (req, res) => {
    const { direct } = readDirectState(req)
    const statuses = DIRECT_ENVIRONMENTS.reduce((acc, mode) => {
      acc[mode] = {
        connected: Boolean(getMasterToken(mode) || direct?.[mode]?.accessToken),
        source: getMasterToken(mode) ? 'master' : (direct?.[mode]?.accessToken ? 'session' : 'none'),
      }
      return acc
    }, {})
    res.json({
      connected: statuses[direct.activeMode]?.connected || false,
      mode: direct.activeMode || 'sandbox',
      statuses,
    })
  })

  app.post('/auth/direct/exchange', async (req, res) => {
    const code = req.body?.code?.trim()
    const mode = getRequestedMode(req, process.env.YANDEX_DIRECT_DEFAULT_MODE || 'sandbox')
    if (!code) {
      res.status(400).json({ error: 'Missing verification code' })
      return
    }

    try {
      const payload = await exchangeVerificationCode(code, mode)
      const { session, direct } = readDirectState(req)
      const nextDirect = {
        ...direct,
        activeMode: mode,
        [mode]: {
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token || null,
          connectedAt: new Date().toISOString(),
        },
      }
      persistDirectState(res, session, nextDirect)
      res.json({
        ok: true,
        connected: true,
        mode,
      })
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        detail: error.detail || null,
      })
    }
  })

  app.post('/auth/direct/logout', (req, res) => {
    const requestedMode = req.body?.mode ? getRequestedMode(req) : null
    const { session, direct } = readDirectState(req)

    if (!session) {
      res.json({ ok: true })
      return
    }

    if (!requestedMode) {
      clearSession(req, res)
      res.json({ ok: true, cleared: 'all' })
      return
    }

    const nextDirect = {
      ...direct,
      [requestedMode]: null,
    }
    if (nextDirect.activeMode === requestedMode) {
      nextDirect.activeMode = requestedMode === 'sandbox' ? 'production' : 'sandbox'
    }

    persistDirectState(res, session, nextDirect)
    res.json({ ok: true, cleared: requestedMode, mode: nextDirect.activeMode })
  })

  app.post('/auth/direct/active-mode', (req, res) => {
    const mode = getRequestedMode(req, process.env.YANDEX_DIRECT_DEFAULT_MODE || 'sandbox')
    const { session, direct } = readDirectState(req)
    const nextDirect = {
      ...direct,
      activeMode: mode,
    }
    persistDirectState(res, session, nextDirect)
    res.json({ ok: true, mode })
  })

  async function handleCampaignSnapshot(req, res) {
    const mode = getRequestedMode(req, readDirectState(req).direct.activeMode)
    const token = getToken(req, mode)
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
        mode,
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

    const mode = getRequestedMode(req, readDirectState(req).direct.activeMode)
    const token = getToken(req, mode)
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
        ? await suspendCampaigns({ token, clientLogin: getClientLogin(req), ids: [campaignId], mode })
        : await resumeCampaigns({ token, clientLogin: getClientLogin(req), ids: [campaignId], mode })

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
