import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Today } from './screens/Today'
import { CalendarScreen } from './screens/CalendarScreen'
import { Insight } from './screens/Insight'
import { My } from './screens/My'
import { SavedRecords } from './screens/SavedRecords'
import { Search } from './screens/Search'
import { RecordDetail } from './screens/RecordDetail'
import { FoodRecord } from './screens/FoodRecord'
import { QuickRecord } from './screens/QuickRecord'
import { AiAnalysis } from './screens/AiAnalysis'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/my" element={<My />} />
          <Route path="/my/saved" element={<SavedRecords />} />
          <Route path="/search" element={<Search />} />
          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/record/:id/food" element={<FoodRecord />} />
          {/* 하단 + → 원문 입력 → AI 제안 확인 → 저장 */}
          <Route path="/quick-record" element={<QuickRecord />} />
          <Route path="/quick-record/analysis" element={<AiAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
