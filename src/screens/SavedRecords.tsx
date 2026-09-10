import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { primaryIcon } from '../components/RecordItem'
import { useStore } from '../lib/store'
import { summaryLine } from '../lib/derive'
import { shortDate } from '../lib/date'

export function SavedRecords() {
  const { records } = useStore()
  const navigate = useNavigate()
  const pinned = records.filter((r) => r.pinned).sort((a, b) => b.eventDate.localeCompare(a.eventDate))

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로">
          <Icon name="i-back" />
        </button>
        <span className="title">저장된 기록</span>
        <span style={{ width: 20 }} />
      </div>

      {pinned.length === 0 ? (
        <div className="empty">
          <b>고정한 기록이 없어요</b>
          기록 상세의 더보기에서 고정하면 여기에 모입니다.
        </div>
      ) : (
        pinned.map((r) => (
          <button type="button" className="res" key={r.id} onClick={() => navigate(`/record/${r.id}`)}>
            <div className="d num">{shortDate(r.eventDate)}</div>
            <div className="row">
              <div style={{ minWidth: 0 }}>
                <div className="ttl">{r.title}</div>
                <div className="sub">{summaryLine(r)}</div>
              </div>
              <Icon name={primaryIcon(r)} size="sm" style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />
            </div>
          </button>
        ))
      )}
    </main>
  )
}
