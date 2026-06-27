import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, LogOut, User, Wifi, WifiOff } from 'lucide-react'

export default function AuthBar() {
  const {
    user,
    loading,
    error,
    login,
    logout,
    isDemo,
    directConnected,
    directMode,
    getDirectConnectUrl,
    connectDirectWithCode,
  } = useAuth()
  const [isConnectingDirect, setIsConnectingDirect] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [directError, setDirectError] = useState(null)

  const openDirectConnect = async () => {
    try {
      const url = await getDirectConnectUrl()
      window.open(url, '_blank', 'noopener,noreferrer')
      setDirectError(null)
      setIsConnectingDirect(true)
    } catch (connectError) {
      setDirectError(connectError.message)
    }
  }

  const submitDirectCode = async () => {
    if (!verificationCode.trim()) return

    try {
      await connectDirectWithCode(verificationCode.trim())
      setVerificationCode('')
      setDirectError(null)
      setIsConnectingDirect(false)
    } catch (connectError) {
      setDirectError(connectError.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 text-sm text-gray-400">
        <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
        Подключение...
      </div>
    )
  }

  if (user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
            ) : (
              <User size={14} className="text-green-400" />
            )}
            <div className="text-xs">
              <div className="text-white font-medium leading-tight">{user.name}</div>
              <div className="text-green-400 leading-tight flex items-center gap-1">
                <Wifi size={10} />
                Яндекс подключён
              </div>
              <div className={`leading-tight flex items-center gap-1 ${directConnected ? 'text-green-300' : 'text-yellow-400'}`}>
                <Wifi size={10} />
                {directConnected ? `Direct API подключён (${directMode}, read-only)` : 'Direct API не подключён'}
              </div>
            </div>
          </div>
          {!directConnected && (
            <button
              onClick={openDirectConnect}
              className="px-3 py-2 rounded-xl bg-yandex-red text-white text-sm font-medium hover:bg-red-600 transition-all glow-red"
            >
              Подключить Директ
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
            title="Выйти"
          >
            <LogOut size={14} />
          </button>
        </div>

        {isConnectingDirect && !directConnected && (
          <div className="absolute top-16 right-6 z-50 w-[360px] rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl">
            <div className="text-sm font-semibold text-white mb-2">Подключение Яндекс.Директ</div>
            <div className="text-xs text-gray-400 leading-relaxed mb-3">
              1. В новой вкладке откроется страница Яндекса.
              2. Разрешите доступ Direct API.
              3. Скопируйте verification code.
              4. Вставьте его сюда.
            </div>
            <input
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="Вставьте verification code"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yandex-red"
            />
            {directError && (
              <div className="mt-2 text-xs text-red-400">{directError}</div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={submitDirectCode}
                className="flex-1 rounded-xl bg-yandex-red px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Подключить
              </button>
              <button
                onClick={() => setIsConnectingDirect(false)}
                className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-300"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex flex-col items-end mr-1">
        {isDemo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
            <WifiOff size={12} />
            Demo-режим
          </div>
        )}
        {!user && (
          <div className="text-[11px] text-gray-500 mt-1">
            Для запуска рекламы пользователь сначала входит на сайт, затем отдельно подключает Direct API
          </div>
        )}
        {error && (
          <div className="text-xs text-red-400 mt-1">{error}</div>
        )}
      </div>
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yandex-red text-white text-sm font-medium hover:bg-red-600 transition-all glow-red"
      >
        <LogIn size={14} />
        Войти через Яндекс
      </button>
    </div>
  )
}
