export function generateRecommendations(campaigns) {
  const recs = []
  if (campaigns.length === 0) {
    return [{
      id: 'rec_portfolio_empty',
      campaignId: 'portfolio',
      type: 'info',
      title: 'Нет данных для анализа',
      message: 'В портфеле пока нет кампаний. Создай 2-3 тестовые кампании в песочнице с разными ставками и бюджетами, чтобы агент мог сравнивать их эффективность и давать осмысленные советы.',
      action: 'review',
      delta: 0,
      applied: false,
    }]
  }

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
      if (c.impressions === 0 && c.clicks === 0 && c.spent === 0) {
        recs.push({
          id: `rec_${c.id}_no_delivery`,
          campaignId: c.id,
          type: 'info',
          title: `Нет показов: ${c.name}`,
          message: 'Кампания активна, но не получает трафик. Проверь, опубликованы ли объявления, не слишком ли низкая ставка и созданы ли в песочнице тестовые данные для этой кампании.',
          action: 'review',
          delta: 0,
          applied: false,
        })
      }

      if (c.impressions > 0 && c.clicks === 0) {
        recs.push({
          id: `rec_${c.id}_no_clicks`,
          campaignId: c.id,
          type: 'warning',
          title: `Показы без кликов: ${c.name}`,
          message: `Есть показы (${c.impressions}), но нет кликов. Стоит проверить заголовок, оффер и релевантность объявления запросу: сейчас кампания получает охват, но не цепляет пользователя.`,
          action: 'review',
          delta: 0,
          applied: false,
        })
      }

      if (c.clicks > 0 && c.clicks < 25 && c.history.length < 3) {
        recs.push({
          id: `rec_${c.id}_low_sample`,
          campaignId: c.id,
          type: 'info',
          title: `Мало данных: ${c.name}`,
          message: `Пока собрано только ${c.clicks} кликов. Для уверенной оптимизации лучше накопить хотя бы 25-30 кликов и 3-5 точек истории, иначе выводы по CPC и CR будут слишком шумными.`,
          action: 'review',
          delta: 0,
          applied: false,
        })
      }

      if (c.clicks >= 20 && c.conversions === 0 && c.spent > 0) {
        recs.push({
          id: `rec_${c.id}_no_conversions`,
          campaignId: c.id,
          type: 'warning',
          title: `Нет конверсий: ${c.name}`,
          message: `Кампания уже получила ${c.clicks} кликов и потратила ${Math.round(c.spent)} ₽, но не принесла ни одной конверсии. Проверь настройку целей, посадочную страницу и точность семантики: сейчас трафик идет, но не превращается в результат.`,
          action: 'review',
          delta: 0,
          applied: false,
        })
      }

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

  if (recs.length === 0 && campaigns.length === 1) {
    const [campaign] = campaigns
    recs.push({
      id: `rec_${campaign.id}_single_campaign`,
      campaignId: campaign.id,
      type: 'info',
      title: `Недостаточно данных для сравнения: ${campaign.name}`,
      message: 'Сейчас в портфеле только одна кампания, поэтому агенту не с чем сравнивать эффективность внутри аккаунта. Добавь еще 1-2 тестовые кампании или накопи больше истории, чтобы рекомендации стали точнее.',
      action: 'review',
      delta: 0,
      applied: false,
    })
  }

  return recs
}
