import { describe, expect, it } from 'vitest'
import { buildHistoryMap, buildStatsMap, parseTsv } from './reportParser.js'

describe('reportParser', () => {
  it('parses TSV rows into objects', () => {
    const rows = parseTsv('CampaignId\tClicks\tCost\n123\t10\t55.5')
    expect(rows).toEqual([{ CampaignId: 123, Clicks: 10, Cost: 55.5 }])
  })

  it('builds history map keyed by campaign id', () => {
    const map = buildHistoryMap([
      { Date: '2026-06-27', CampaignId: 123, Cost: 100, Clicks: 10, Conversions: 1, AvgCpc: 10 },
    ])

    expect(map.get('123')).toEqual([
      { date: '2026-06-27', spend: 100, clicks: 10, conversions: 1, cpc: 10 },
    ])
  })

  it('builds summary stats map', () => {
    const map = buildStatsMap([
      { CampaignId: 123, Cost: 10, Impressions: 200, Clicks: 5, Conversions: 2, Revenue: 90 },
    ])

    expect(map.get('123')).toEqual({
      spent: 10,
      impressions: 200,
      clicks: 5,
      conversions: 2,
      revenue: 90,
    })
  })
})
