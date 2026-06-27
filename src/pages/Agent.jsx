import { Bot, Play, CheckCircle, AlertTriangle, XCircle, Info, Zap } from 'lucide-react'
import AgentLog from '../components/AgentLog'
import clsx from 'clsx'

const REC_STYLES = {
  success: { icon: CheckCircle, border: 'border-green-500/30 bg-green-500/5', badge: 'bg-green-500/20 text-green-400', iconColor: 'text-green-400' },
  warning: { icon: AlertTriangle, border: 'border-yellow-500/30 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400', iconColor: 'text-yellow-400' },
  danger: { icon: XCircle, border: 'border-red-500/30 bg-red-500/5', badge: 'bg-red-500/20 text-red-400', iconColor: 'text-red-400' },
  info: { icon: Info, border: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400', iconColor: 'text-blue-400' },
}

const ACTION_LABELS = {
  redistribute: 'Перераспределить',
  increase: 'Увеличить бюджет',
  pause: 'Приостановить',
  resume: 'Возобновить',
  review: 'Проверить вручную',
}

function fmtRub(n) {
  if (n === 0) return '—'
  const sign = n > 0 ? '+' : ''
  return sign + new Intl.NumberFormat('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
}

export default function Agent({ recommendations, agentRunning, agentLog, runAgentCycle, applyRecommendation, campaigns }) {
  const pendingCount = recommendations.filter(r => !r.applied).length
  const appliedCount = recommendations.filter(r => r.applied).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Агент-оптимизатор</h1>
          <p className="text-sm text-gray-500 mt-0.5">Автоматический анализ и оптимизация бюджета</p>
        </div>
        <button
          onClick={runAgentCycle}
          disabled={agentRunning}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
            agentRunning
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-yandex-red text-white hover:bg-red-600 glow-red'
          )}
        >
          {agentRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
              Анализирую...
            </>
          ) : (
            <>
              <Play size={16} />
              Запустить агента
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-glass p-4 text-center">
          <div className="text-3xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</div>
          <div className="text-xs text-gray-500 mt-1">Активных кампаний</div>
        </div>
        <div className="card-glass p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-1">Рекомендаций</div>
        </div>
        <div className="card-glass p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{appliedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Применено</div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">
        Агент работает в режиме рекомендаций: реальные данные тянутся из Яндекс.Директа, но боевые изменения в рекламных кампаниях отключены.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-yandex-red" />
            Рекомендации агента
          </h2>
          {recommendations.length === 0 && (
            <div className="card-glass p-8 text-center text-gray-600 text-sm">
              Запустите агента для генерации рекомендаций
            </div>
          )}
          {recommendations.map(rec => {
            const style = REC_STYLES[rec.type] || REC_STYLES.info
            const Icon = style.icon
            const campaignName = campaigns.find(c => c.id === rec.campaignId)?.name || rec.campaignId

            return (
              <div key={rec.id} className={clsx('rounded-2xl border p-5 transition-all', style.border, rec.applied && 'opacity-50')}>
                <div className="flex items-start gap-3">
                  <Icon size={18} className={clsx('mt-0.5 shrink-0', style.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{rec.title}</span>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                        {ACTION_LABELS[rec.action] || rec.action}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 mb-1">{campaignName}</div>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{rec.message}</p>
                    {rec.delta !== 0 && (
                      <div className={clsx('text-sm font-medium mt-2', rec.delta > 0 ? 'text-green-400' : 'text-red-400')}>
                        {fmtRub(rec.delta)}
                      </div>
                    )}
                  </div>
                </div>
                {!rec.applied && (
                  <button
                    onClick={() => applyRecommendation(rec.id)}
                    className="mt-4 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white font-medium transition-all border border-white/10"
                  >
                    Отметить как сценарий
                  </button>
                )}
                {rec.applied && (
                  <div className="mt-4 w-full py-2 rounded-xl bg-green-500/10 text-sm text-green-400 font-medium text-center border border-green-500/20">
                    ✓ Сценарий сохранён
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={16} className="text-yandex-red" />
            <h2 className="text-sm font-semibold text-gray-300">Лог агента</h2>
            {agentRunning && (
              <span className="ml-auto text-xs text-yandex-red flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-yandex-red rounded-full animate-pulse" />
                Работает
              </span>
            )}
          </div>
          <AgentLog logs={agentLog} />
        </div>
      </div>

      <div className="card-glass p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Как работает агент</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Сбор данных', desc: 'Получает статистику из Яндекс.Директ API каждые N минут' },
            { step: '2', title: 'Анализ KPI', desc: 'Вычисляет CPC, CPO, CPM, ROAS, CR для каждой кампании' },
            { step: '3', title: 'Выявление аномалий', desc: 'Сравнивает метрики с целевыми значениями и историей' },
            { step: '4', title: 'Рекомендации', desc: 'Формирует сценарии оптимизации без автоматического изменения боевых кампаний' },
          ].map(item => (
            <div key={item.step} className="text-center p-4 rounded-xl bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-yandex-red/20 text-yandex-red text-sm font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <div className="text-sm font-medium text-white mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
