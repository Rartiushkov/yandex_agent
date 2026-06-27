const DIRECT_OAUTH_AUTHORIZE_URL = 'https://oauth.yandex.ru/authorize'
const DIRECT_OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token'

export const DIRECT_ENVIRONMENTS = ['sandbox', 'production']

function normalizeMode(mode) {
  return mode === 'production' ? 'production' : 'sandbox'
}

function pickConfig(mode) {
  if (mode === 'production') {
    return {
      clientId: process.env.YANDEX_DIRECT_OAUTH_CLIENT_ID_PRODUCTION || process.env.YANDEX_DIRECT_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_DIRECT_OAUTH_CLIENT_SECRET_PRODUCTION || process.env.YANDEX_DIRECT_OAUTH_CLIENT_SECRET || '',
    }
  }

  return {
    clientId: process.env.YANDEX_DIRECT_OAUTH_CLIENT_ID_SANDBOX || process.env.YANDEX_DIRECT_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.YANDEX_DIRECT_OAUTH_CLIENT_SECRET_SANDBOX || process.env.YANDEX_DIRECT_OAUTH_CLIENT_SECRET || '',
  }
}

export function getDirectOauthConfig(mode) {
  const normalized = normalizeMode(mode)
  return {
    mode: normalized,
    ...pickConfig(normalized),
  }
}

export function getDirectOauthMatrix() {
  return DIRECT_ENVIRONMENTS.reduce((acc, mode) => {
    const config = getDirectOauthConfig(mode)
    acc[mode] = {
      clientId: config.clientId,
      configured: Boolean(config.clientId && config.clientSecret),
    }
    return acc
  }, {})
}

export function buildDirectAuthorizeUrl(mode) {
  const { clientId, mode: normalized } = getDirectOauthConfig(mode)
  if (!clientId) {
    const error = new Error(`Direct OAuth app is not configured on backend for ${normalized}`)
    error.statusCode = 500
    throw error
  }

  const url = new URL(DIRECT_OAUTH_AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('force_confirm', 'yes')
  return url.toString()
}

export async function exchangeVerificationCode(code, mode) {
  const { clientId, clientSecret, mode: normalized } = getDirectOauthConfig(mode)
  if (!clientId || !clientSecret) {
    const error = new Error(`Direct OAuth app is not configured on backend for ${normalized}`)
    error.statusCode = 500
    throw error
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(DIRECT_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.error) {
    const error = new Error(payload.error_description || payload.error || `Failed to exchange Yandex Direct verification code for ${normalized}`)
    error.statusCode = response.status || 400
    error.detail = payload
    throw error
  }

  return payload
}
