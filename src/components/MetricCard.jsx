import clsx from 'clsx'

export default function MetricCard({ label, value, sub, trend, icon: Icon, accent }) {
  const isPositive = trend > 0
  const isNegative = trend < 0

  return (
    <div className={clsx('card-glass p-5 flex flex-col gap-3', accent && 'border-yandex-red/30')}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accent ? 'bg-yandex-red/20' : 'bg-gray-800')}>
            <Icon size={16} className={accent ? 'text-yandex-red' : 'text-gray-400'} />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={clsx('text-xs font-medium', isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-500')}>
          {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(trend)}% к прошлой неделе
        </div>
      )}
    </div>
  )
}
