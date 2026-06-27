const DIRECT_API_BASE_URL = import.meta.env.VITE_DIRECT_API_BASE_URL?.replace(/\/+$/, '') || ''
const DIRECT_CLIENT_LOGIN = import.meta.env.VITE_DIRECT_CLIENT_LOGIN || ''

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
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

export async function fetchDirectCampaigns(token) {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/campaigns`, {
    method: 'GET',
    headers: getHeaders(token),
  })

  return parseJsonResponse(response)
}

export async function syncDirectCampaigns(token) {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/campaigns/sync`, {
    method: 'POST',
    headers: getHeaders(token),
  })

  return parseJsonResponse(response)
}

export async function suspendDirectCampaign(token, campaignId) {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/campaigns/${campaignId}/suspend`, {
    method: 'POST',
    headers: getHeaders(token),
  })

  return parseJsonResponse(response)
}

export async function resumeDirectCampaign(token, campaignId) {
  if (!DIRECT_API_BASE_URL) {
    throw new Error('Direct connector is not configured')
  }

  const response = await fetch(`${DIRECT_API_BASE_URL}/campaigns/${campaignId}/resume`, {
    method: 'POST',
    headers: getHeaders(token),
  })

  return parseJsonResponse(response)
}
