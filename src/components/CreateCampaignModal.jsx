import { useState } from 'react'
import { X } from 'lucide-react'

const TYPES = [
  { value: 'search', label: 'Поисковая', desc: 'Объявления в поиске Яндекса' },
  { value: 'display', label: 'РСЯ', desc: 'Рекламная сеть Яндекса' },
  { value: 'smart', label: 'Смарт-баннеры', desc: 'Динамическая персонализация' },
  { value: 'media', label: 'Медийная', desc: 'Охватные имиджевые кампании' },
]

const STRATEGIES = [
  { value: 'max_clicks', label: 'Максимум кликов' },
  { value: 'target_cpa', label: 'Целевая цена конверсии' },
  { value: 'target_roas', label: 'Целевой ROAS' },
  { value: 'max_conversions', label: 'Максимум конверсий' },
]

export default function CreateCampaignModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    type: 'search',
    budget: '',
    strategy: 'max_clicks',
    targetCPA: '',
    geo: 'Москва',
    keywords: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.budget) return
    onCreate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Новая кампания</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Название</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Например: Поиск — Категория обуви"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yandex-red transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Тип кампании</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('type', t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.type === t.value
                      ? 'border-yandex-red bg-yandex-red/10 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Бюджет (₽/день)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="5000"
                min="300"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yandex-red transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Гео</label>
              <input
                value={form.geo}
                onChange={e => set('geo', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yandex-red transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Стратегия</label>
            <select
              value={form.strategy}
              onChange={e => set('strategy', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yandex-red transition-colors"
            >
              {STRATEGIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {form.type === 'search' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Ключевые слова</label>
              <textarea
                value={form.keywords}
                onChange={e => set('keywords', e.target.value)}
                placeholder="купить кроссовки&#10;кроссовки москва&#10;недорогие кроссовки"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yandex-red transition-colors resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-sm font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-yandex-red text-white font-medium text-sm hover:bg-red-600 transition-all glow-red"
            >
              Запустить кампанию
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
