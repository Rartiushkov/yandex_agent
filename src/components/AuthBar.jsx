import { useAuth } from '../context/AuthContext'
import { LogIn, LogOut, User, Wifi, WifiOff } from 'lucide-react'

export default function AuthBar() {
  const { user, loading, error, login, logout, isDemo } = useAuth()

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
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
          title="Выйти"
        >
          <LogOut size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isDemo && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          <WifiOff size={12} />
          Demo-режим
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
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
