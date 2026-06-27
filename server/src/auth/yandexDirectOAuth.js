const DIRECT_OAUTH_AUTHORIZE_URL = 'https://oauth.yandex.ru/authorize'
const DIRECT_OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token'

export function getDirectOauthConfig() {
  return {
    clientId: process.env.YANDEX_DIRECT_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.YANDEX_DIRECT_OAUTH_CLIENT_SECRET || '',
  }
}

export function buildDirectAuthorizeUrl() {
  const { clientId } = getDirectOauthConfig()
  const url = new URL(DIRECT_OAUTH_AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('force_confirm', 'yes')
  return url.toString()
}

export async function exchangeVerificationCode(code) {
  const { clientId, clientSecret } = getDirectOauthConfig()
  if (!clientId || !clientSecret) {
    const error = new Error('Direct OAuth app is not configured on backend')
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
    const error = new Error(payload.error_description || payload.error || 'Failed to exchange Yandex Direct verification code')
    error.statusCode = response.status || 400
    error.detail = payload
    throw error
  }

  return payload
}
