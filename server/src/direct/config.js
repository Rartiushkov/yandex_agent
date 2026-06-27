export function normalizeDirectMode(mode) {
  return mode === 'production' ? 'production' : 'sandbox'
}

export function resolveDirectApiBase(mode) {
  const normalized = normalizeDirectMode(mode)
  return normalized === 'production'
    ? 'https://api.direct.yandex.com/json/v5'
    : 'https://api-sandbox.direct.yandex.com/json/v5'
}

export function getDirectEndpoints(mode) {
  const base = resolveDirectApiBase(mode)
  return {
    apiBase: base,
    reportsEndpoint: `${base}/reports`,
    campaignsEndpoint: `${base}/campaigns`,
  }
}

export const REPORT_POLL_LIMIT = Number(process.env.YANDEX_DIRECT_REPORT_POLL_LIMIT || 6)
