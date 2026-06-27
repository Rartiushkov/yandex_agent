import { useAuth } from '../context/AuthContext'
import { LogIn, Bot, BarChart3, Zap, Shield } from 'lucide-react'

export default function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-yandex-red flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4 glow-red">
            Я
          </div>
          <h1 className="text-2xl font-bold text-white">Яндекс Маркетинг Агент</h1>
          <p className="text-gray-500 mt-2 text-sm">
            AI-агент для управления рекламой в Яндекс.Директ
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BarChart3, label: 'CPC / CPO / CPM', desc: 'Автоматический расчёт метрик' },
            { icon: Bot, label: 'AI-агент', desc: 'Анализ и рекомендации' },
            { icon: Zap, label: 'Оптимизация', desc: 'Перераспределение бюджета' },
            { icon: Shield, label: 'Read-only', desc: 'Безопасный режим' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card-glass p-4">
              <Icon size={18} className="text-yandex-red mb-2" />
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <div className="card-glass p-6 space-y-4">
          <div className="text-sm text-gray-400 text-center leading-relaxed">
            Войдите через Яндекс, затем подключите свой аккаунт Яндекс.Директ — Sandbox или Production
          </div>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-yandex-red text-white font-semibold text-sm hover:bg-red-600 transition-all glow-red"
          >
            <LogIn size={18} />
            Войти через Яндекс
          </button>
          <div className="text-xs text-gray-600 text-center">
            После входа вы сможете подключить Sandbox или Production аккаунт Директа
          </div>
        </div>
      </div>
    </div>
  )
}
