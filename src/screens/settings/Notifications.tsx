import { SubHeader, ToggleRow } from '../../components/SubHeader'
import { useSettings } from '../../lib/settings'
import { useStore } from '../../lib/store'
import { pendingFoodRecords } from '../../lib/derive'

export function Notifications() {
  const { settings, update } = useSettings()
  const { records } = useStore()
  const pending = pendingFoodRecords(records).length

  return (
    <main className="screen">
      <SubHeader title="알림과 제안" />

      <div className="section-title">앱 안에서</div>
      <ToggleRow
        label="식사 확인 제안"
        desc="일정이 끝난 식사를 Today 상단에서 확인하도록 안내합니다"
        value={settings.foodCheck}
        onChange={(v) => update({ foodCheck: v })}
      />

      <div className="kv">
        <span className="k">지금 확인 대기</span>
        <span className="v num">{pending}건</span>
      </div>

      <div className="info-card">
        끄면 확인 제안이 사라질 뿐, 기록은 그대로 남습니다. 예정 상태의 식사는 어느 쪽이든 실제 식사로 세지 않아요.
      </div>

      <div className="section-title">기기 알림</div>
      <div className="info-card" style={{ marginTop: 0 }}>
        앱을 닫아 둔 사이에 오는 푸시 알림은 아직 없습니다. 확인 제안은 앱을 열었을 때 Today 화면에서 보여줍니다.
      </div>
    </main>
  )
}
