import { describe, expect, it } from 'vitest'
import { generateRecommendations } from './recommendations'

describe('generateRecommendations', () => {
  it('creates scale recommendation for strong campaign', () => {
    const campaigns = [
      { id: '1', name: 'Best', status: 'active', budget: 10000, spent: 5000, roas: 50, cpo: 50 },
      { id: '2', name: 'Base', status: 'active', budget: 10000, spent: 9000, roas: 10, cpo: 120 },
    ]

    const recs = generateRecommendations(campaigns)
    expect(recs.some(rec => rec.campaignId === '1' && rec.action === 'increase')).toBe(true)
  })

  it('creates pause recommendation for weak campaign', () => {
    const campaigns = [
      { id: '1', name: 'Weak', status: 'active', budget: 10000, spent: 8000, roas: 1, cpo: 500 },
      { id: '2', name: 'Base', status: 'active', budget: 10000, spent: 7000, roas: 12, cpo: 100 },
    ]

    const recs = generateRecommendations(campaigns)
    expect(recs.some(rec => rec.campaignId === '1' && rec.action === 'pause')).toBe(true)
  })
})
