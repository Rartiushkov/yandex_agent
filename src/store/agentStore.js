import { useState, useCallback } from 'react'
import { INITIAL_CAMPAIGNS, TOTAL_BUDGET } from '../data/mockData'

export function useAgentStore() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [recommendations, setRecommendations] = useState([])
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentLog, setAgentLog] = useState([])
  const [totalBudget] = useState(TOTAL_BUDGET)
  const [view, setView] = useState('dashboard')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const log = useCallback((msg, type = 'info') => {
    setAgentLog(prev => [
      { id: Date.now() + Math.random(), msg, type, time: new Date().toLocaleTimeString('ru') },
      ...prev.slice(0, 49),
    ])
  }, [])

  const runAgentCycle = useCallback(async () => {
    if (agentRunning) return
    setAgentRunning(true)
    log('Агент запущен. Анализирую портфель кампаний...', 'info')

    await sleep(800)
    log('Получаю данные из Яндекс.Директ API...', 'info')
    await sleep(600)

    let updatedCampaigns = []

    setCampaigns(prev => {
      const next = prev.map(c => {
        const noise = () => 1 + (Math.random() - 0.5) * 0.08
        if (c.status !== 'active') {
          return c
        }
        const isNew = c.clicks === 0
        const baseClicks = isNew ? Math.floor(c.budget / 8) : c.clicks
        const baseImpressions = isNew ? baseClicks * 25 : c.impressions
        const baseConversions = isNew ? Math.floor(baseClicks * 0.04) : c.conversions
        const baseSpent = isNew ? Math.round(c.budget * 0.3) : c.spent

        const newClicks = Math.round(baseClicks * noise())
        const newImpressions = Math.round(baseImpressions * noise())
        const newConversions = Math.round(baseConversions * noise())
        const newSpent = Math.min(c.budget, Math.round(baseSpent * noise()))
        const newRevenue = isNew ? newConversions * 3000 : Math.round((c.revenue || 0) * noise())

        const today = new Date().toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })
        const lastEntry = c.history[c.history.length - 1]
        const dailySpent = Math.round(newSpent * 0.05)
        const dailyClicks = Math.floor(dailySpent / (newClicks > 0 ? newSpent / newClicks : 5))
        const dailyConversions = Math.floor(dailyClicks * (newClicks > 0 ? newConversions / newClicks : 0.04))
        const newHistory = lastEntry?.date === today
          ? c.history
          : [...c.history.slice(-59), {
              date: today,
              spend: dailySpent,
              clicks: dailyClicks,
              conversions: dailyConversions,
              cpc: dailyClicks > 0 ? +(dailySpent / dailyClicks).toFixed(2) : 0,
            }]

        return {
          ...c,
          clicks: newClicks,
          impressions: newImpressions,
          conversions: newConversions,
          spent: newSpent,
          revenue: newRevenue,
          cpc: newClicks > 0 ? +(newSpent / newClicks).toFixed(2) : c.cpc,
          cpm: newImpressions > 0 ? +((newSpent / newImpressions) * 1000).toFixed(2) : c.cpm,
          cpo: newConversions > 0 ? +(newSpent / newConversions).toFixed(2) : c.cpo,
          cr: newClicks > 0 ? +((newConversions / newClicks) * 100).toFixed(2) : c.cr,
          roas: newSpent > 0 ? +(newRevenue / newSpent).toFixed(2) : c.roas,
          history: newHistory,
        }
      })
      updatedCampaigns = next
      return next
    })

    await sleep(400)
    log('Данные обновлены. Вычисляю KPI...', 'success')
    await sleep(500)
    log('Оцениваю эффективность кампаний по CPC / CPO / ROAS...', 'info')
    await sleep(600)

    const newRecs = generateRecommendations(updatedCampaigns)
    setRecommendations(newRecs)

    const anomalies = newRecs.filter(r => r.type === 'warning' || r.type === 'danger').length
    if (anomalies > 0) {
      log(`Выявлено ${anomalies} аномали${anomalies === 1 ? 'я' : 'и'}. Генерирую рекомендации...`, 'warning')
    } else {
      log('Аномалий не выявлено. Портфель в норме.', 'success')
    }
    await sleep(400)
    log(`Сформировано ${newRecs.length} рекомендаций. Цикл завершён.`, 'success')

    setAgentRunning(false)
  }, [agentRunning, log])

  const applyRecommendation = useCallback((recId) => {
    const rec = recommendations.find(r => r.id === recId)
    if (!rec || rec.applied) return

    setCampaigns(prev => prev.map(c => {
      if (c.id === rec.campaignId) {
        if (rec.action === 'pause') return { ...c, status: 'paused' }
        if (rec.action === 'resume') return { ...c, status: 'active', budget: c.budget + rec.delta }
        if (rec.action === 'redistribute') return { ...c, budget: Math.max(0, c.budget + rec.delta) }
        if (rec.action === 'increase') return { ...c, budget: c.budget + rec.delta }
      }
      if (rec.targetCampaignId && c.id === rec.targetCampaignId) {
        return { ...c, budget: c.budget + Math.abs(rec.delta) }
      }
      return c
    }))

    setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, applied: true } : r))
    log(`Применена рекомендация: "${rec.title}"`, 'success')
  }, [recommendations, log])

  const createCampaign = useCallback((formData) => {
    const newCampaign = {
      id: 'c' + Date.now(),
      name: formData.name,
      type: formData.type,
      status: 'active',
      budget: Number(formData.budget),
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cpc: 0,
      cpm: 0,
      cpo: 0,
      cr: 0,
      roas: 0,
      history: [],
    }
    setCampaigns(prev => [...prev, newCampaign])
    log(`Кампания "${formData.name}" создана и запущена.`, 'success')
    setIsCreating(false)
  }, [log])

  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const avgCPC = totalClicks > 0 ? +(totalSpent / totalClicks).toFixed(2) : 0
  const avgCPO = totalConversions > 0 ? +(totalSpent / totalConversions).toFixed(2) : 0
  const avgCPM = totalImpressions > 0 ? +((totalSpent / totalImpressions) * 1000).toFixed(2) : 0
  const overallROAS = totalSpent > 0 ? +(totalRevenue / totalSpent).toFixed(2) : 0

  return {
    campaigns, recommendations, agentRunning, agentLog,
    totalBudget, totalSpent, totalClicks, totalConversions,
    totalImpressions, totalRevenue, avgCPC, avgCPO, avgCPM, overallROAS,
    view, setView, selectedCampaign, setSelectedCampaign,
    isCreating, setIsCreating,
    runAgentCycle, applyRecommendation, createCampaign,
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateRecommendations(campaigns) {
  const recs = []
  const active = campaigns.filter(c => c.status === 'active')
  const avgROAS = active.length > 0
    ? active.reduce((s, c) => s + c.roas, 0) / active.length
    : 10
  const avgCPO = active.filter(c => c.cpo > 0).length > 0
    ? active.filter(c => c.cpo > 0).reduce((s, c) => s + c.cpo, 0) / active.filter(c => c.cpo > 0).length
    : 150

  campaigns.forEach(c => {
    if (c.status === 'active') {
      if (c.roas > avgROAS * 1.5 && c.spent < c.budget * 0.9) {
        recs.push({
          id: `rec_${c.id}_roas`,
          campaignId: c.id,
          type: 'success',
          title: `Высокий ROAS: ${c.name}`,
          message: `ROAS ${c.roas}x значительно выше среднего (${avgROAS.toFixed(1)}x). Увеличь бюджет на 30-40% для масштабирования.`,
          action: 'increase',
          delta: Math.round(c.budget * 0.35),
          applied: false,
        })
      }
      if (c.cpo > avgCPO * 1.8 && c.cpo > 0) {
        const best = campaigns.filter(x => x.status === 'active' && x.roas > avgROAS).sort((a, b) => b.roas - a.roas)[0]
        recs.push({
          id: `rec_${c.id}_cpo`,
          campaignId: c.id,
          type: 'warning',
          title: `Высокий CPO: ${c.name}`,
          message: `CPO ${c.cpo} ₽ — в ${(c.cpo / avgCPO).toFixed(1)}x выше среднего (${avgCPO.toFixed(0)} ₽). Снизь бюджет на 25%${best ? ` и перенаправь в «${best.name}»` : ''}.`,
          action: 'redistribute',
          delta: -Math.round(c.budget * 0.25),
          targetCampaignId: best?.id || null,
          applied: false,
        })
      }
      if (c.roas < avgROAS * 0.4 && c.spent > c.budget * 0.7) {
        recs.push({
          id: `rec_${c.id}_low_roas`,
          campaignId: c.id,
          type: 'danger',
          title: `Низкий ROAS: ${c.name}`,
          message: `ROAS ${c.roas}x критически ниже среднего (${avgROAS.toFixed(1)}x). Бюджет почти исчерпан. Рекомендую приостановить и пересмотреть стратегию.`,
          action: 'pause',
          delta: 0,
          applied: false,
        })
      }
      if (c.spent >= c.budget * 0.95) {
        recs.push({
          id: `rec_${c.id}_budget`,
          campaignId: c.id,
          type: 'info',
          title: `Бюджет исчерпан: ${c.name}`,
          message: `Потрачено ${Math.round((c.spent / c.budget) * 100)}% бюджета. Кампания скоро остановится. Пополни бюджет для сохранения трафика.`,
          action: 'increase',
          delta: Math.round(c.budget * 0.5),
          applied: false,
        })
      }
    }
    if (c.status === 'paused' && c.roas > avgROAS) {
      recs.push({
        id: `rec_${c.id}_resume`,
        campaignId: c.id,
        type: 'info',
        title: `Пауза на высокоэффективной кампании`,
        message: `«${c.name}» на паузе, но её ROAS ${c.roas}x выше среднего. Возобнови для улучшения общих показателей портфеля.`,
        action: 'resume',
        delta: Math.round(c.budget * 0.2),
        applied: false,
      })
    }
  })

  return recs
}
