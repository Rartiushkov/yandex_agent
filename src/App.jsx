import Sidebar from './components/Sidebar'
import AuthBar from './components/AuthBar'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import Agent from './pages/Agent'
import { useAgentStore } from './store/agentStore'

export default function App() {
  const store = useAgentStore()

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar view={store.view} setView={store.setView} setIsCreating={store.setIsCreating} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-800 bg-gray-900/80 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="text-sm text-gray-500">
            Яндекс.Директ — Marketing Agent
          </div>
          <AuthBar />
        </header>
        <main className="flex-1 overflow-auto">
        {store.view === 'dashboard' && (
          <Dashboard
            campaigns={store.campaigns}
            totalBudget={store.totalBudget}
            totalSpent={store.totalSpent}
            totalClicks={store.totalClicks}
            totalConversions={store.totalConversions}
            totalImpressions={store.totalImpressions}
            totalRevenue={store.totalRevenue}
            avgCPC={store.avgCPC}
            avgCPO={store.avgCPO}
            avgCPM={store.avgCPM}
            overallROAS={store.overallROAS}
            setView={store.setView}
            setSelectedCampaign={store.setSelectedCampaign}
          />
        )}
        {store.view === 'campaigns' && (
          <Campaigns
            campaigns={store.campaigns}
            isCreating={store.isCreating}
            setIsCreating={store.setIsCreating}
            createCampaign={store.createCampaign}
            selectedCampaign={store.selectedCampaign}
            setSelectedCampaign={store.setSelectedCampaign}
          />
        )}
        {store.view === 'analytics' && (
          <Analytics campaigns={store.campaigns} />
        )}
        {store.view === 'agent' && (
          <Agent
            recommendations={store.recommendations}
            agentRunning={store.agentRunning}
            agentLog={store.agentLog}
            runAgentCycle={store.runAgentCycle}
            applyRecommendation={store.applyRecommendation}
            campaigns={store.campaigns}
          />
        )}
        </main>
      </div>
    </div>
  )
}
