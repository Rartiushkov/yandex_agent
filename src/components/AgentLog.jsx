import clsx from 'clsx'

const TYPE_STYLES = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
}

const TYPE_ICONS = {
  info: '●',
  success: '✓',
  warning: '⚠',
  danger: '✗',
}

export default function AgentLog({ logs }) {
  if (!logs.length) {
    return (
      <div className="text-center text-gray-600 py-8 text-sm">
        Нет записей. Запустите агента для анализа.
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {logs.map(entry => (
        <div key={entry.id} className="flex items-start gap-2 text-sm">
          <span className={clsx('font-mono mt-0.5 text-xs', TYPE_STYLES[entry.type])}>
            {TYPE_ICONS[entry.type]}
          </span>
          <span className="text-xs text-gray-600 font-mono whitespace-nowrap">{entry.time}</span>
          <span className="text-gray-300">{entry.msg}</span>
        </div>
      ))}
    </div>
  )
}
