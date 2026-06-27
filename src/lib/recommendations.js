export function generateRecommendations(campaigns) {
  const recs = []
  const active = campaigns.filter(c => c.status === 'active')
  const avgROAS = active.length > 0
    ? active.reduce((s, c) => s + c.roas, 0) / active.length
    : 10
  const campaignsWithCpo = active.filter(c => c.cpo > 0)
  const avgCPO = campaignsWithCpo.length > 0
    ? campaignsWithCpo.reduce((s, c) => s + c.cpo, 0) / campaignsWithCpo.length
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
        const best = campaigns
          .filter(x => x.status === 'active' && x.roas > avgROAS)
          .sort((a, b) => b.roas - a.roas)[0]

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
        title: 'Пауза на высокоэффективной кампании',
        message: `«${c.name}» на паузе, но её ROAS ${c.roas}x выше среднего. Возобнови для улучшения общих показателей портфеля.`,
        action: 'resume',
        delta: Math.round(c.budget * 0.2),
        applied: false,
      })
    }
  })

  return recs
}
