function parseValue(value) {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : value
}

export function parseTsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map(row => row.trim())
    .filter(Boolean)

  if (rows.length === 0) {
    return []
  }

  const headers = rows[0].split('\t')

  return rows.slice(1).map(row => {
    const values = row.split('\t')
    return headers.reduce((acc, header, index) => {
      acc[header] = parseValue(values[index])
      return acc
    }, {})
  })
}

export function buildHistoryMap(rows) {
  return rows.reduce((acc, row) => {
    const campaignId = String(row.CampaignId)
    const historyPoint = {
      date: row.Date || '',
      spend: Number(row.Cost || 0),
      clicks: Number(row.Clicks || 0),
      conversions: Number(row.Conversions || 0),
      cpc: Number(row.AvgCpc || 0),
    }

    if (!acc.has(campaignId)) {
      acc.set(campaignId, [])
    }

    acc.get(campaignId).push(historyPoint)
    return acc
  }, new Map())
}

export function buildStatsMap(rows) {
  return rows.reduce((acc, row) => {
    acc.set(String(row.CampaignId), {
      spent: Number(row.Cost || 0),
      impressions: Number(row.Impressions || 0),
      clicks: Number(row.Clicks || 0),
      conversions: Number(row.Conversions || 0),
      revenue: Number(row.Revenue || 0),
    })
    return acc
  }, new Map())
}
