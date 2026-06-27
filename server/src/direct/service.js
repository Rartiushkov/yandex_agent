import { CAMPAIGNS_ENDPOINT, REPORTS_ENDPOINT } from './config.js'
import { directJsonRequest, directReportRequest } from './http.js'
import { buildHistoryMap, buildStatsMap, parseTsv } from './reportParser.js'

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function defaultDateRange() {
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - 13)

  return {
    dateFrom: formatDate(from),
    dateTo: formatDate(today),
  }
}

function mapStatus(state) {
  const normalized = String(state || '').toUpperCase()
  if (normalized === 'ON' || normalized === 'SUSPENDED') {
    return 'active'
  }
  if (normalized === 'OFF' || normalized === 'ENDED') {
    return 'paused'
  }
  return 'active'
}

function mapType(type) {
  const normalized = String(type || '').toUpperCase()

  if (normalized.includes('TEXT')) return 'search'
  if (normalized.includes('SMART')) return 'smart'
  if (normalized.includes('DYNAMIC')) return 'display'
  if (normalized.includes('MOBILE')) return 'display'
  if (normalized.includes('CPM')) return 'media'
  return 'search'
}

async function fetchCampaigns({ token, clientLogin }) {
  const response = await directJsonRequest(CAMPAIGNS_ENDPOINT, {
    token,
    clientLogin,
    payload: {
      method: 'get',
      params: {
        SelectionCriteria: {},
        FieldNames: ['Id', 'Name', 'State', 'Type'],
      },
    },
  })

  return response?.result?.Campaigns || []
}

async function campaignAction({ token, clientLogin, ids, method }) {
  return directJsonRequest(CAMPAIGNS_ENDPOINT, {
    token,
    clientLogin,
    payload: {
      method,
      params: {
        SelectionCriteria: {
          Ids: ids,
        },
      },
    },
  })
}

async function fetchCampaignSummary({ token, clientLogin, dateFrom, dateTo }) {
  const report = await directReportRequest(REPORTS_ENDPOINT, {
    token,
    clientLogin,
    payload: {
      SelectionCriteria: {
        DateFrom: dateFrom,
        DateTo: dateTo,
      },
      FieldNames: ['CampaignId', 'CampaignName', 'CampaignType', 'Impressions', 'Clicks', 'Cost', 'Conversions', 'Revenue'],
      ReportName: `campaign-summary-${dateFrom}-${dateTo}`,
      ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
      DateRangeType: 'CUSTOM_DATE',
      Format: 'TSV',
      IncludeVAT: 'NO',
      IncludeDiscount: 'NO',
    },
  })

  return parseTsv(report)
}

async function fetchCampaignHistory({ token, clientLogin, dateFrom, dateTo }) {
  const report = await directReportRequest(REPORTS_ENDPOINT, {
    token,
    clientLogin,
    payload: {
      SelectionCriteria: {
        DateFrom: dateFrom,
        DateTo: dateTo,
      },
      FieldNames: ['Date', 'CampaignId', 'Clicks', 'Cost', 'Conversions', 'AvgCpc'],
      ReportName: `campaign-history-${dateFrom}-${dateTo}`,
      ReportType: 'CUSTOM_REPORT',
      DateRangeType: 'CUSTOM_DATE',
      Format: 'TSV',
      IncludeVAT: 'NO',
      IncludeDiscount: 'NO',
      OrderBy: [
        { Field: 'Date', SortOrder: 'ASCENDING' },
      ],
    },
  })

  return parseTsv(report)
}

export async function getCampaignSnapshot({ token, clientLogin, dateFrom, dateTo }) {
  const range = {
    ...defaultDateRange(),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }

  const [campaigns, summaryRows, historyRows] = await Promise.all([
    fetchCampaigns({ token, clientLogin }),
    fetchCampaignSummary({ token, clientLogin, ...range }),
    fetchCampaignHistory({ token, clientLogin, ...range }),
  ])

  const statsMap = buildStatsMap(summaryRows)
  const historyMap = buildHistoryMap(historyRows)

  return {
    campaigns: campaigns.map(campaign => {
      const id = String(campaign.Id)
      const stats = statsMap.get(id) || {
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      }

      return {
        id,
        name: campaign.Name,
        type: mapType(campaign.Type),
        status: mapStatus(campaign.State),
        budget: stats.spent > 0 ? Math.round(stats.spent * 1.3) : 0,
        stats,
        history: historyMap.get(id) || [],
      }
    }),
    meta: {
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      source: 'yandex-direct-api',
    },
  }
}

export async function suspendCampaigns({ token, clientLogin, ids }) {
  return campaignAction({ token, clientLogin, ids, method: 'suspend' })
}

export async function resumeCampaigns({ token, clientLogin, ids }) {
  return campaignAction({ token, clientLogin, ids, method: 'resume' })
}
