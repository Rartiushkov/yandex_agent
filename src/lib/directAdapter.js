function num(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function percent(numerator, denominator) {
  if (!denominator) return 0
  return +((numerator / denominator) * 100).toFixed(2)
}

function perUnit(total, denominator) {
  if (!denominator) return 0
  return +(total / denominator).toFixed(2)
}

function toHistoryItem(point) {
  return {
    date: point.date || '',
    spend: num(point.spend),
    clicks: num(point.clicks),
    conversions: num(point.conversions),
    cpc: num(point.cpc),
  }
}

export function adaptDirectCampaign(rawCampaign) {
  const stats = rawCampaign.stats || {}
  const budget = num(rawCampaign.budget)
  const spent = num(stats.spent)
  const impressions = num(stats.impressions)
  const clicks = num(stats.clicks)
  const conversions = num(stats.conversions)
  const revenue = num(stats.revenue)

  return {
    id: String(rawCampaign.id),
    name: rawCampaign.name || `Campaign ${rawCampaign.id}`,
    type: rawCampaign.type || 'search',
    status: rawCampaign.status || 'active',
    budget,
    spent,
    impressions,
    clicks,
    conversions,
    revenue,
    cpc: perUnit(spent, clicks),
    cpm: impressions > 0 ? +((spent / impressions) * 1000).toFixed(2) : 0,
    cpo: perUnit(spent, conversions),
    cr: percent(conversions, clicks),
    roas: revenue > 0 && spent > 0 ? +(revenue / spent).toFixed(2) : 0,
    history: Array.isArray(rawCampaign.history) ? rawCampaign.history.map(toHistoryItem) : [],
  }
}

export function adaptDirectCampaigns(response) {
  const campaigns = Array.isArray(response?.campaigns) ? response.campaigns : []
  return campaigns.map(adaptDirectCampaign)
}

export function getPortfolioBudget(campaigns) {
  return campaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
}
