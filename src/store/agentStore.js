import { useState, useCallback, useEffect } from 'react'
import { INITIAL_CAMPAIGNS, TOTAL_BUDGET } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import {
  fetchDirectCampaigns,
  hasDirectConnector,
  syncDirectCampaigns,
} from '../api/directApi'
import { adaptDirectCampaigns, getPortfolioBudget } from '../lib/directAdapter'
import { generateRecommendations } from '../lib/recommendations'

export function useAgentStore() {
  const { token, user, directConnected } = useAuth()
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [recommendations, setRecommendations] = useState([])
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentLog, setAgentLog] = useState([])
  const [totalBudget, setTotalBudget] = useState(TOTAL_BUDGET)
  const [view, setView] = useState('dashboard')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [dataSource, setDataSource] = useState('demo')
  const [syncError, setSyncError] = useState(null)

  const log = useCallback((msg, type = 'info') => {
    setAgentLog(prev => [
      { id: Date.now() + Math.random(), msg, type, time: new Date().toLocaleTimeString('ru') },
      ...prev.slice(0, 49),
    ])
  }, [])

  const loadDirectCampaigns = useCallback(async ({ sync = false } = {}) => {
    if (!hasDirectConnector()) {
      return null
    }

    const response = sync
      ? await syncDirectCampaigns(token)
      : await fetchDirectCampaigns(token)

    const nextCampaigns = adaptDirectCampaigns(response)
    setCampaigns(nextCampaigns)
    setTotalBudget(getPortfolioBudget(nextCampaigns))
    setDataSource('direct')
    setSyncError(null)
    return nextCampaigns
  }, [token])

  useEffect(() => {
    if (!hasDirectConnector() || !user || !directConnected) {
      setDataSource('demo')
      return
    }

    loadDirectCampaigns()
      .then(nextCampaigns => {
        if (nextCampaigns) {
          log(`Подключен Direct connector. Загружено кампаний: ${nextCampaigns.length}.`, 'success')
        }
      })
      .catch(error => {
        setSyncError(error.message)
        setDataSource('demo')
        log(`Не удалось загрузить кампании из Direct connector: ${error.message}`, 'warning')
      })
  }, [directConnected, loadDirectCampaigns, log, user])

  const runAgentCycle = useCallback(async () => {
    if (agentRunning) return
    setAgentRunning(true)
    log('Агент запущен. Анализирую портфель кампаний...', 'info')

    try {
      let updatedCampaigns = []

      if (hasDirectConnector() && user && directConnected) {
        log('Получаю данные из Direct connector...', 'info')
        updatedCampaigns = await loadDirectCampaigns({ sync: true }) || []
      } else {
        await sleep(800)
        log('Direct connector не подключён для текущего пользователя. Работаю в demo-режиме на mock-данных.', 'warning')
        await sleep(600)

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
      }

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
    } catch (error) {
      setSyncError(error.message)
      log(`Ошибка синхронизации с Direct connector: ${error.message}`, 'danger')
    } finally {
      setAgentRunning(false)
    }
  }, [agentRunning, directConnected, loadDirectCampaigns, log, user])

  const applyRecommendation = useCallback(async (recId) => {
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
    log(`Рекомендация сохранена как сценарий: "${rec.title}". Боевые изменения в Direct отключены.`, 'success')
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
    dataSource, syncError,
    runAgentCycle, applyRecommendation, createCampaign,
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
