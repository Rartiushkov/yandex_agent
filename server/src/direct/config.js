const isSandbox = process.env.YANDEX_DIRECT_USE_SANDBOX === 'true'

export const DIRECT_API_BASE = isSandbox
  ? 'https://api-sandbox.direct.yandex.com/json/v5'
  : 'https://api.direct.yandex.com/json/v5'

export const REPORTS_ENDPOINT = `${DIRECT_API_BASE}/reports`
export const CAMPAIGNS_ENDPOINT = `${DIRECT_API_BASE}/campaigns`
export const REPORT_POLL_LIMIT = Number(process.env.YANDEX_DIRECT_REPORT_POLL_LIMIT || 6)
