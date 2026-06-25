import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || 'YOUR_CLIENT_ID'
const REDIRECT_URI = window.location.origin

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('ya_token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    }
  }, [token])

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
    url.searchParams.set('scope', 'login:info login:email direct:api')
    url.searchParams.set('force_confirm', 'yes')
    window.location.href = url.toString()
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ya_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isDemo: !token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
