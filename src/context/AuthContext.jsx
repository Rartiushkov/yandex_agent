import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  DIRECT_ENVIRONMENTS,
  exchangeDirectVerificationCode,
  fetchDirectAuthStatus,
  fetchDirectConnectUrl,
  hasDirectConnector,
  logoutDirectSession,
  setActiveDirectMode,
} from '../api/directApi'

const AuthContext = createContext(null)

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || 'c67a37eae4b04ce0bc5507f02d20f2cb'
const YANDEX_SCOPES = import.meta.env.VITE_YANDEX_SCOPES

function buildRedirectUri() {
  const configured = import.meta.env.VITE_YANDEX_REDIRECT_URI

  if (configured) {
    return configured
  }

  const basePath = import.meta.env.BASE_URL || '/'
  return new URL(basePath, window.location.origin).toString()
}

const REDIRECT_URI = buildRedirectUri()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('ya_token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [directConnected, setDirectConnected] = useState(false)
  const [directMode, setDirectMode] = useState('sandbox')
  const [directStatuses, setDirectStatuses] = useState({
    sandbox: { connected: false, source: 'none' },
    production: { connected: false, source: 'none' },
  })

  const refreshDirectStatus = useCallback(async () => {
    if (!hasDirectConnector()) {
      setDirectConnected(false)
      setDirectMode('sandbox')
      setDirectStatuses({
        sandbox: { connected: false, source: 'none' },
        production: { connected: false, source: 'none' },
      })
      return
    }

    try {
      const status = await fetchDirectAuthStatus()
      setDirectConnected(Boolean(status.connected))
      setDirectMode(status.mode || 'sandbox')
      setDirectStatuses(status.statuses || {
        sandbox: { connected: false, source: 'none' },
        production: { connected: false, source: 'none' },
      })
    } catch {
      setDirectConnected(false)
      setDirectMode('sandbox')
      setDirectStatuses({
        sandbox: { connected: false, source: 'none' },
        production: { connected: false, source: 'none' },
      })
    }
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      if (accessToken) {
        localStorage.setItem('ya_token', accessToken)
        setToken(accessToken)
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchUserInfo(token)
    } else {
      setUser(null)
    }
  }, [token])

  useEffect(() => {
    refreshDirectStatus()
  }, [refreshDirectStatus, token])

  const fetchUserInfo = async (accessToken) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: `OAuth ${accessToken}` },
      })
      if (!res.ok) throw new Error('Ошибка авторизации')
      const data = await res.json()
      setUser({
        id: data.id,
        login: data.login,
        name: data.real_name || data.display_name,
        email: data.default_email,
        avatar: data.default_avatar_id
          ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-50`
          : null,
      })
    } catch (e) {
      setError(e.message)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = useCallback(() => {
    const url = new URL('https://oauth.yandex.ru/authorize')
    url.searchParams.set('response_type', 'token')
    url.searchParams.set('client_id', YANDEX_CLIENT_ID)
    url.searchParams.set('redirect_uri', REDIRECT_URI)
    if (YANDEX_SCOPES) {
      url.searchParams.set('scope', YANDEX_SCOPES)
    }
    url.searchParams.set('force_confirm', 'yes')
    window.location.href = url.toString()
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ya_token')
    setToken(null)
    setUser(null)
    logoutDirectSession().catch(() => {})
    setDirectConnected(false)
    setDirectMode('sandbox')
    setDirectStatuses({
      sandbox: { connected: false, source: 'none' },
      production: { connected: false, source: 'none' },
    })
  }, [])

  const getDirectConnectUrl = useCallback(async (mode) => {
    const payload = await fetchDirectConnectUrl(mode)
    return payload.authorizeUrl
  }, [])

  const connectDirectWithCode = useCallback(async (code, mode) => {
    await exchangeDirectVerificationCode(code, mode)
    await refreshDirectStatus()
  }, [refreshDirectStatus])

  const disconnectDirectMode = useCallback(async (mode) => {
    await logoutDirectSession(mode)
    await refreshDirectStatus()
  }, [refreshDirectStatus])

  const selectDirectMode = useCallback(async (mode) => {
    await setActiveDirectMode(mode)
    await refreshDirectStatus()
  }, [refreshDirectStatus])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        isDemo: !token,
        redirectUri: REDIRECT_URI,
        directConnected,
        directMode,
        directStatuses,
        directEnvironments: DIRECT_ENVIRONMENTS,
        getDirectConnectUrl,
        connectDirectWithCode,
        disconnectDirectMode,
        selectDirectMode,
        refreshDirectStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
