import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { primaryIcon } from '../components/RecordItem'
import { useStore } from '../lib/store'
import { searchRecords, summaryLine, timeOf, type SearchFilter } from '../lib/derive'
import { shortDate } from '../lib/date'
import { won } from '../lib/format'
import type { LifeRecord } from '../lib/types'

const FILTERS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'schedule', label: '일정' },
  { value: 'money', label: '지출' },
  { value: 'food', label: '음식' },
  { value: 'text', label: '메모' },
]

export function Search() {
  const { records } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchFilter>('all')

  const results = useMemo(() => searchRecords(records, query, filter), [records, query, filter])
  const searching = query.trim().length > 0

  return (
    <main className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
        <div className="sbar">
          <Icon name="i-search" size="sm" style={{ color: 'var(--ink-3)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기록 검색"
            aria-label="기록 검색"
          />
          {query && (
            <button type="button" className="x" onClick={() => setQuery('')} aria-label="지우기">
              <Icon name="i-x" size="xs" />
            </button>
          )}
        </div>
        <button type="button" className="textlink" onClick={() => navigate(-1)}>
          취소
        </button>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.value}
            className={`c${filter === f.value ? ' on' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!searching ? (
        <div className="empty">
          <b>무엇을 찾고 있나요?</b>
          음식 이름, 함께한 사람, 장소, 메모 내용으로 찾을 수 있어요.
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          <b>‘{query}’ 결과가 없어요</b>
          다른 단어로 찾거나 필터를 넓혀보세요.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', padding: '12px 0 0' }}>
            기록 {results.length}개
          </div>
          {results.map((r) => (
            <button
              type="button"
              className="res"
              key={r.id}
              onClick={() => navigate(`/record/${r.id}`)}
            >
              <div className="d num">{shortDate(r.eventDate)}</div>
              <div className="row">
                <div style={{ minWidth: 0 }}>
                  <div className="ttl">
                    <Highlight text={r.title} query={query} />
                  </div>
                  <div className="sub num">{subline(r)}</div>
                </div>
                <Icon name={primaryIcon(r)} size="sm" style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />
              </div>
            </button>
          ))}
          <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '16px 0' }}>
            기간 · 사람 · 장소 필터는 다음 단계에서 붙입니다
          </div>
        </>
      )}
    </main>
  )
}

function subline(record: LifeRecord): string {
  const parts: string[] = []
  const time = timeOf(record)
  if (time) parts.push(time)

  const confirmed = (record.modules.money?.transactions ?? []).filter((t) => t.status === 'confirmed')
  if (confirmed.length) parts.push(won(confirmed.reduce((s, t) => s + t.amount, 0)))

  const food = record.modules.food
  if (food?.status === 'confirmed') parts.push(food.actualName ?? '식사 확인됨')

  const summary = summaryLine(record)
  if (parts.length === 0 && summary) return summary
  return parts.join(' · ')
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}
