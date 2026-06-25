import clsx from 'clsx'

const TYPE_MAP = {
  search: { label: 'Поиск', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  display: { label: 'РСЯ', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  smart: { label: 'Смарт', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  media: { label: 'Медийная', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
}

const STATUS_MAP = {
  active: { label: 'Активна', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Пауза', color: 'bg-gray-500/20 text-gray-400' },
  stopped: { label: 'Остановлена', color: 'bg-red-500/20 text-red-400' },
}

export function TypeBadge({ type }) {
  const t = TYPE_MAP[type] || TYPE_MAP.search
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', t.color)}>
      {t.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.paused
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', s.color)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-500')} />
      {s.label}
    </span>
  )
}
