import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend
} from 'recharts'

function fmtRub(n) {
  return new Intl.NumberFormat('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
}

const COLORS = ['#FC3F1D', '#a855f7', '#FFCC00', '#22c55e', '#06b6d4']

export default function Analytics({ campaigns }) {
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)

  const pieData = campaigns.map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name,
    value: c.spent,
  }))

  const scatterData = campaigns.map(c => ({
    name: c.name,
    x: c.cpc,
    y: c.cr,
    z: c.spent / 100,
  }))

  const radarData = campaigns.filter(c => c.status === 'active').map(c => ({
    name: c.name.split('—')[0].trim(),
    ROAS: Math.min(c.roas * 2, 100),
    CR: c.cr * 10,
    CTR: Math.min((c.clicks / c.impressions) * 10000, 100),
    Эффективность: Math.max(0, 100 - c.cpo / 5),
  }))

  const efficiencyRanking = [...campaigns]
    .sort((a, b) => b.roas - a.roas)
    .map((c, i) => ({ ...c, rank: i + 1 }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Аналитика</h1>
        <p className="text-sm text-gray-500 mt-0.5">Глубокий анализ эффективности портфеля</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Распределение бюджета</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v) => fmtRub(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">CPC vs CR% (размер = расход)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="x" name="CPC" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: 'CPC ₽', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 11 }} />
              <YAxis dataKey="y" name="CR%" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: 'CR%', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v, name) => [name === 'x' ? `${v} ₽` : `${v}%`, name === 'x' ? 'CPC' : 'CR']}
              />
              <Scatter data={scatterData} fill="#FC3F1D">
                {scatterData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Радар эффективности</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              {['ROAS', 'CR', 'CTR', 'Эффективность'].map((key, i) => (
                <Radar key={key} name={key} dataKey={key} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Рейтинг по ROAS</h3>
          <div className="space-y-3">
            {efficiencyRanking.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                  {c.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{c.name}</span>
                    <span className={`text-sm font-bold ${c.roas >= 20 ? 'text-green-400' : c.roas >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {c.roas}x
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${c.roas >= 20 ? 'bg-green-400' : c.roas >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min((c.roas / 120) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
