import { REPORT_POLL_LIMIT } from './config.js'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildHeaders({ token, clientLogin, extraHeaders = {} }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Accept-Language': 'en',
    ...extraHeaders,
  }

  if (clientLogin) {
    headers['Client-Login'] = clientLogin
  }

  return headers
}

export async function directJsonRequest(url, { token, clientLogin, payload }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders({
      token,
      clientLogin,
      extraHeaders: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }),
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let parsed = {}

  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = { raw: text }
  }

  if (!response.ok) {
    const error = new Error(parsed?.error?.error_string || parsed?.error?.error_detail || `Direct API request failed with ${response.status}`)
    error.statusCode = response.status
    error.detail = parsed
    throw error
  }

  return parsed
}

export async function directReportRequest(url, { token, clientLogin, payload }) {
  let attempt = 0

  while (attempt < REPORT_POLL_LIMIT) {
    attempt += 1

    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders({
        token,
        clientLogin,
        extraHeaders: {
          'Content-Type': 'application/json; charset=utf-8',
          processingMode: 'auto',
          returnMoneyInMicros: 'false',
          skipReportHeader: 'true',
          skipColumnHeader: 'false',
          skipReportSummary: 'true',
        },
      }),
      body: JSON.stringify({ params: payload }),
    })

    if (response.status === 200) {
      return response.text()
    }

    if (response.status === 201 || response.status === 202) {
      const retryInSeconds = Number(response.headers.get('retryIn') || 2)
      await sleep(retryInSeconds * 1000)
      continue
    }

    const text = await response.text()
    const error = new Error(`Direct report request failed with ${response.status}`)
    error.statusCode = response.status
    error.detail = text
    throw error
  }

  const error = new Error('Direct report polling limit exceeded')
  error.statusCode = 504
  throw error
}
