import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { TypeBadge, StatusBadge } from '../components/CampaignBadge'
import CreateCampaignModal from '../components/CreateCampaignModal'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function fmtRub(n) {
  return new Intl.NumberFormat('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
}

function ProgressBar({ value, max, color = 'bg-yandex-red' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function CampaignRow({ campaign, expanded, onToggle }) {
  const spentPct = Math.round((campaign.spent / campaign.budget) * 100)
  const isHighCPO = campaign.cpo > 200

  return (
    <>
      <tr
        className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{campaign.name}</span>
          </div>
        </td>
        <td className="px-4 py-4"><TypeBadge type={campaign.type} /></td>
        <td className="px-4 py-4"><StatusBadge status={campaign.status} /></td>
        <td className="px-4 py-4">
          <div className="text-sm text-white">{fmtRub(campaign.spent)}</div>
          <div className="text-xs text-gray-500">из {fmtRub(campaign.budget)}</div>
          <ProgressBar value={campaign.spent} max={campaign.budget} color={spentPct > 90 ? 'bg-yellow-500' : 'bg-yandex-red'} />
        </td>
        <td className="px-4 py-4">
          <span className={`text-sm font-medium ${isHighCPO ? 'text-red-400' : 'text-gray-300'}`}>
            {campaign.cpc} ₽
          </span>
        </td>
        <td className="px-4 py-4">
          <span className={`text-sm font-medium ${isHighCPO ? 'text-red-400' : 'text-gray-300'}`}>
            {campaign.cpo} ₽
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm text-gray-300">{campaign.cpm} ₽</span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1">
            {campaign.roas >= 10
              ? <TrendingUp size={14} className="text-green-400" />
              : <TrendingDown size={14} className="text-red-400" />
            }
            <span className={`text-sm font-semibold ${campaign.roas >= 10 ? 'text-green-400' : 'text-red-400'}`}>
              {campaign.roas}x
            </span>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="text-sm text-white">{campaign.conversions}</div>
          <div className="text-xs text-gray-500">CR {campaign.cr}%</div>
        </td>
        <td className="px-4 py-4 text-gray-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>
      {expanded && campaign.history?.length > 0 && (
        <tr className="bg-gray-900/50">
          <td colSpan={10} className="px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Динамика кликов и конверсий</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={campaign.history.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#e5e7eb' }} />
                    <Line type="monotone" dataKey="clicks" stroke="#FC3F1D" dot={false} strokeWidth={2} name="Клики" />
                    <Line type="monotone" dataKey="conversions" stroke="#22c55e" dot={false} strokeWidth={2} name="Конверсии" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Динамика CPC</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={campaign.history.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#e5e7eb' }} />
                    <Line type="monotone" dataKey="cpc" stroke="#a855f7" dot={false} strokeWidth={2} name="CPC ₽" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Campaigns({ campaigns, isCreating, setIsCreating, createCampaign, selectedCampaign, setSelectedCampaign }) {
  const [expanded, setExpanded] = useState(selectedCampaign || null)

  const toggle = (id) => {
    setExpanded(prev => prev === id ? null : id)
    setSelectedCampaign(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Кампании</h1>
          <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} кампаний в портфеле</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-yandex-red text-white text-sm font-medium hover:bg-red-600 transition-all glow-red"
        >
          + Новая кампания
        </button>
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Кампания', 'Тип', 'Статус', 'Бюджет / Расход', 'CPC', 'CPO', 'CPM', 'ROAS', 'Конверсии', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium first:px-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  expanded={expanded === c.id}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && (
        <CreateCampaignModal
          onClose={() => setIsCreating(false)}
          onCreate={createCampaign}
        />
      )}
    </div>
  )
}
