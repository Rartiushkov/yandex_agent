import { LayoutDashboard, Megaphone, Bot, PlusCircle, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Кампании', icon: Megaphone },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'agent', label: 'Агент', icon: Bot },
]

export default function Sidebar({ view, setView, setIsCreating }) {
  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yandex-red flex items-center justify-center font-bold text-white text-lg glow-red">
            Я
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Директ Агент</div>
            <div className="text-xs text-gray-500">Marketing AI</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              view === id
                ? 'bg-yandex-red text-white glow-red'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => { setView('campaigns'); setIsCreating(true) }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-all border border-gray-700"
        >
          <PlusCircle size={18} className="text-yandex-red" />
          Новая кампания
        </button>
      </div>
    </aside>
  )
}
