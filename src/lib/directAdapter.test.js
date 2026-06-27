import { describe, expect, it } from 'vitest'
import { adaptDirectCampaigns, getPortfolioBudget } from './directAdapter'

describe('directAdapter', () => {
  it('adapts direct connector payload to UI shape', () => {
    const campaigns = adaptDirectCampaigns({
      campaigns: [
        {
          id: 123,
          name: 'Search campaign',
          type: 'search',
          status: 'active',
          budget: 15000,
          stats: {
            spent: 3000,
            impressions: 10000,
            clicks: 200,
            conversions: 10,
            revenue: 24000,
          },
          history: [
            { date: '01.01', spend: 500, clicks: 25, conversions: 2, cpc: 20 },
          ],
        },
      ],
    })

    expect(campaigns).toHaveLength(1)
    expect(campaigns[0]).toMatchObject({
      id: '123',
      name: 'Search campaign',
      cpc: 15,
      cpo: 300,
      cr: 5,
      roas: 8,
    })
  })

  it('computes portfolio budget', () => {
    const budget = getPortfolioBudget([
      { budget: 1000 },
      { budget: 2500 },
    ])

    expect(budget).toBe(3500)
  })
})
