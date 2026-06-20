import { useState } from 'react'
import { ToastProvider } from './components/Toast'
import HomeScreen from './screens/HomeScreen'
import ReceiptScreen from './screens/ReceiptScreen'
import RecommendScreen from './screens/RecommendScreen'
import ConsumeScreen from './screens/ConsumeScreen'
import ReportScreen from './screens/ReportScreen'

const TABS = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'receipt', label: '영수증', icon: '🧾' },
  { id: 'recommend', label: '추천', icon: '🍳' },
  { id: 'consume', label: '먹기', icon: '🍽️' },
  { id: 'report', label: '리포트', icon: '📊' },
]

export default function App() {
  const [tab, setTab] = useState('home')
  // Bumping this key forces data-loading screens to refetch after a mutation.
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  const screenProps = { refreshKey, bump }

  return (
    <ToastProvider>
      <div className="phone-shell">
        <header className="flex items-center justify-between bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧊</span>
            <div>
              <h1 className="text-base font-extrabold leading-none text-brand-700">
                냉장고를 부탁해
              </h1>
              <p className="text-[10px] text-slate-400">먹은 것까지 추적하는 냉장고</p>
            </div>
          </div>
        </header>

        <main className="scroll-area">
          {tab === 'home' && <HomeScreen {...screenProps} />}
          {tab === 'receipt' && <ReceiptScreen {...screenProps} />}
          {tab === 'recommend' && <RecommendScreen {...screenProps} />}
          {tab === 'consume' && <ConsumeScreen {...screenProps} />}
          {tab === 'report' && <ReportScreen {...screenProps} />}
        </main>

        <nav className="flex items-stretch justify-around border-t border-black/5 bg-white/90 px-2 pb-1.5 pt-1 backdrop-blur">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors ${
                  active ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                <span className={`text-xl ${active ? 'scale-110' : ''} transition-transform`}>
                  {t.icon}
                </span>
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </ToastProvider>
  )
}
