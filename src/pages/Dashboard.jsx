import { MousePointerClick, Target, Eye, TrendingUp, Wallet, Zap } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import { TypeBadge, StatusBadge } from '../components/CampaignBadge'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function fmtRub(n) {
  return new Intl.NumberFormat('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
}

export default function Dashboard({
  campaigns, totalBudget, totalSpent, totalClicks, totalConversions,
  totalImpressions, avgCPC, avgCPO, avgCPM, overallROAS, setView, setSelectedCampaign
}) {
  const budgetPct = Math.round((totalSpent / totalBudget) * 100)
  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  const chartData = campaigns[0]?.history?.slice(-14) || []

  const portfolioData = campaigns.map(c => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
    Расходы: c.spent,
    Конверсии: c.conversions * 100,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Дашборд</h1>
          <p className="text-sm text-gray-500 mt-0.5">Обзор портфеля кампаний Яндекс.Директ</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Общий бюджет</div>
          <div className="text-xl font-bold text-white">{fmtRub(totalBudget)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Потрачено: {fmtRub(totalSpent)} ({budgetPct}%)</div>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-yandex-red to-orange-400 transition-all duration-700"
          style={{ width: `${Math.min(budgetPct, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard label="CPC (ср.)" value={`${avgCPC} ₽`} trend={-4.2} icon={MousePointerClick} />
        <MetricCard label="CPO (ср.)" value={`${avgCPO} ₽`} trend={-8.1} icon={Target} />
        <MetricCard label="CPM (ср.)" value={`${avgCPM} ₽`} trend={2.3} icon={Eye} />
        <MetricCard label="ROAS" value={`${overallROAS}x`} trend={12.4} icon={TrendingUp} accent />
        <MetricCard label="Кликов" value={fmt(totalClicks)} sub="за период" trend={6.7} icon={MousePointerClick} />
        <MetricCard label="Конверсий" value={fmt(totalConversions)} sub={`CR ${((totalConversions / totalClicks) * 100).toFixed(1)}%`} trend={3.5} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Динамика расходов (14 дней)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FC3F1D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FC3F1D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#FC3F1D' }}
              />
              <Area type="monotone" dataKey="spend" stroke="#FC3F1D" fill="url(#spendGrad)" strokeWidth={2} name="Расходы ₽" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Портфель кампаний</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={portfolioData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar dataKey="Расходы" fill="#FC3F1D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-glass overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Активные кампании</h3>
          <button onClick={() => setView('campaigns')} className="text-xs text-yandex-red hover:underline">
            Все кампании →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Кампания', 'Тип', 'Статус', 'Бюджет', 'CPC', 'CPO', 'ROAS', 'Конверсии'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCampaigns.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedCampaign(c.id); setView('campaigns') }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3"><TypeBadge type={c.type} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-300">{fmtRub(c.budget)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.cpc} ₽</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.cpo} ₽</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-400">{c.roas}x</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{c.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
