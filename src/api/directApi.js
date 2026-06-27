const DIRECT_API_BASE_URL = import.meta.env.VITE_DIRECT_API_BASE_URL?.replace(/\/+$/, '') || ''
const DIRECT_CLIENT_LOGIN = import.meta.env.VITE_DIRECT_CLIENT_LOGIN || ''
export const DIRECT_ENVIRONMENTS = ['sandbox', 'production']

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (DIRECT_CLIENT_LOGIN) {
    headers['X-Direct-Client-Login'] = DIRECT_CLIENT_LOGIN
  }

  return headers
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Не удалось получить данные из Direct connector')
  }

  return payload
}

export function hasDirectConnector() {
  return Boolean(DIRECT_API_BASE_URL)
}

export async function fetchDirectConnectUrl(mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/auth/direct/url?mode=${encodeURIComponent(mode)}`, {
    method: 'GET',
    credentials: 'include',
  })

  return parseJsonResponse(response)
}

export async function fetchDirectAuthStatus() {
  if (!DIRECT_API_BASE_URL) {
    return {
      connected: false,
      mode: 'sandbox',
      statuses: {
        sandbox: { connected: false, source: 'none' },
        production: { connected: false, source: 'none' },
      },
    }
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/auth/direct/status`, {
    method: 'GET',
    credentials: 'include',
  })

  return parseJsonResponse(response)
}

export async function exchangeDirectVerificationCode(code, mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/auth/direct/exchange`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, mode }),
  })

  return parseJsonResponse(response)
}

export async function logoutDirectSession(mode) {
  if (!DIRECT_API_BASE_URL) {
    return { ok: true }
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/auth/direct/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mode ? { mode } : {}),
  })

  return parseJsonResponse(response)
}

export async function setActiveDirectMode(mode) {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/auth/direct/active-mode`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  })

  return parseJsonResponse(response)
}

function withMode(url, mode) {
  return `${url}${url.includes('?') ? '&' : '?'}mode=${encodeURIComponent(mode)}`
}

export async function fetchDirectCampaigns(token, mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(withMode(`${DIRECT_API_BASE_URL}/campaigns`, mode), {
    method: 'GET',
    headers: {
      ...getHeaders(token),
      'X-Direct-Environment': mode,
    },
    credentials: 'include',
  })

  return parseJsonResponse(response)
}

export async function syncDirectCampaigns(token, mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(withMode(`${DIRECT_API_BASE_URL}/campaigns/sync`, mode), {
    method: 'POST',
    headers: {
      ...getHeaders(token),
      'X-Direct-Environment': mode,
    },
    credentials: 'include',
  })

  return parseJsonResponse(response)
}

export async function suspendDirectCampaign(token, campaignId, mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(withMode(`${DIRECT_API_BASE_URL}/campaigns/${campaignId}/suspend`, mode), {
    method: 'POST',
    headers: {
      ...getHeaders(token),
      'X-Direct-Environment': mode,
    },
    credentials: 'include',
  })

  return parseJsonResponse(response)
}

export async function resumeDirectCampaign(token, campaignId, mode = 'sandbox') {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(withMode(`${DIRECT_API_BASE_URL}/campaigns/${campaignId}/resume`, mode), {
    method: 'POST',
    headers: {
      ...getHeaders(token),
      'X-Direct-Environment': mode,
    },
    credentials: 'include',
  })

  return parseJsonResponse(response)
}
