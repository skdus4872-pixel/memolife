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
import { Categories } from './screens/settings/Categories'
import { DataManage } from './screens/settings/DataManage'
import { AiSettings } from './screens/settings/AiSettings'
import { Notifications } from './screens/settings/Notifications'
import { ThemeSettings } from './screens/settings/ThemeSettings'
import { Help } from './screens/settings/Help'
import { Exit } from './screens/Exit'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/search" element={<Search />} />

          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/record/:id/food" element={<FoodRecord />} />

          {/* 하단 + → 원문 입력 → AI 제안 확인 → 저장 */}
          <Route path="/quick-record" element={<QuickRecord />} />
          <Route path="/quick-record/analysis" element={<AiAnalysis />} />

          <Route path="/my" element={<My />} />
          <Route path="/my/saved" element={<SavedRecords />} />
          <Route path="/my/categories" element={<Categories />} />
          <Route path="/my/data" element={<DataManage />} />
          <Route path="/my/ai" element={<AiSettings />} />
          <Route path="/my/notifications" element={<Notifications />} />
          <Route path="/my/theme" element={<ThemeSettings />} />
          <Route path="/my/help" element={<Help />} />

          <Route path="/exit" element={<Exit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
