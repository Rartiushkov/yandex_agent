import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, LogOut, User, Wifi, WifiOff } from 'lucide-react'

const MODE_LABELS = {
  sandbox: 'Sandbox',
  production: 'Real Direct',
}

const SOURCE_LABELS = {
  master: 'master token',
  session: 'user token',
  none: 'not connected',
}

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
    directStatuses,
    directEnvironments,
    getDirectConnectUrl,
    connectDirectWithCode,
    disconnectDirectMode,
    selectDirectMode,
  } = useAuth()
  const [isConnectingDirect, setIsConnectingDirect] = useState(false)
  const [selectedMode, setSelectedMode] = useState('sandbox')
  const [verificationCode, setVerificationCode] = useState('')
  const [directError, setDirectError] = useState(null)

  const connectedCount = useMemo(
    () => directEnvironments.filter(mode => directStatuses?.[mode]?.connected).length,
    [directEnvironments, directStatuses],
  )

  const openDirectConnect = async (mode) => {
    try {
      const url = await getDirectConnectUrl(mode)
      window.open(url, '_blank', 'noopener,noreferrer')
      setSelectedMode(mode)
      setVerificationCode('')
      setDirectError(null)
      setIsConnectingDirect(true)
    } catch (connectError) {
      setDirectError(connectError.message)
    }
  }

  const submitDirectCode = async () => {
    if (!verificationCode.trim()) return

    try {
      await connectDirectWithCode(verificationCode.trim(), selectedMode)
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
        <div className="flex items-start gap-3">
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
                {directConnected ? `Direct API подключён (${MODE_LABELS[directMode] || directMode})` : 'Direct API не подключён'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/90 px-3 py-2 min-w-[320px]">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Direct environments</div>
            <div className="space-y-2">
              {directEnvironments.map(mode => {
                const status = directStatuses?.[mode] || { connected: false, source: 'none' }
                const isActive = directMode === mode

                return (
                  <div key={mode} className={`rounded-xl border px-3 py-2 ${isActive ? 'border-blue-500/30 bg-blue-500/10' : 'border-gray-800 bg-gray-950/60'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-white">{MODE_LABELS[mode]}</div>
                        <div className={`text-[11px] ${status.connected ? 'text-green-400' : 'text-gray-500'}`}>
                          {status.connected ? `Connected via ${SOURCE_LABELS[status.source] || status.source}` : 'Not connected'}
                        </div>
                      </div>
                      {status.connected ? (
                        <div className="flex gap-2">
                          {!isActive && (
                            <button
                              onClick={() => selectDirectMode(mode).catch(err => setDirectError(err.message))}
                              className="rounded-lg border border-blue-500/30 px-2 py-1 text-[11px] text-blue-300"
                            >
                              Сделать активным
                            </button>
                          )}
                          <button
                            onClick={() => disconnectDirectMode(mode).catch(err => setDirectError(err.message))}
                            className="rounded-lg border border-gray-700 px-2 py-1 text-[11px] text-gray-300"
                          >
                            Отключить
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openDirectConnect(mode)}
                          className="rounded-lg bg-yandex-red px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-600"
                        >
                          Подключить
                        </button>
                      )}
                    </div>
                    {isActive && (
                      <div className="mt-2 text-[11px] text-blue-300">Активная среда для аналитики и рекомендаций</div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Подключено сред: {connectedCount} из {directEnvironments.length}
            </div>
            {directError && (
              <div className="mt-2 text-[11px] text-red-400">{directError}</div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
            title="Выйти"
          >
            <LogOut size={14} />
          </button>
        </div>

        {isConnectingDirect && (
          <div className="absolute top-16 right-6 z-50 w-[380px] rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl">
            <div className="text-sm font-semibold text-white mb-2">Подключение {MODE_LABELS[selectedMode]}</div>
            <div className="text-xs text-gray-400 leading-relaxed mb-3">
              1. В новой вкладке откроется страница Яндекса.
              2. Разрешите доступ Direct API именно для выбранной среды.
              3. Скопируйте verification code.
              4. Вставьте code сюда.
            </div>
            <input
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder={`Verification code для ${MODE_LABELS[selectedMode]}`}
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
                Подключить {MODE_LABELS[selectedMode]}
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
            Сначала пользователь входит на сайт, потом отдельно подключает Sandbox или Real Direct
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
