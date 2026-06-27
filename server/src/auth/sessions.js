import crypto from 'crypto'

const SESSION_COOKIE = 'ya_direct_sid'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const sessions = new Map()

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split('=')
      acc[key] = decodeURIComponent(rest.join('='))
      return acc
    }, {})
}

function buildCookieValue(sessionId) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`
}

export function createSession(payload) {
  const id = crypto.randomUUID()
  sessions.set(id, {
    ...payload,
    createdAt: Date.now(),
  })
  return id
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.cookie)
  const sessionId = cookies[SESSION_COOKIE]

  if (!sessionId) return null

  const session = sessions.get(sessionId)
  if (!session) return null

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId)
    return null
  }

  return { id: sessionId, ...session }
}

export function setSessionCookie(res, sessionId) {
  res.setHeader('Set-Cookie', buildCookieValue(sessionId))
}

export function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie)
  const sessionId = cookies[SESSION_COOKIE]
  if (sessionId) {
    sessions.delete(sessionId)
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`)
}
