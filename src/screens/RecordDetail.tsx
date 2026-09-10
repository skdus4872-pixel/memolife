import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ModuleSheet, type EditTarget } from '../components/ModuleSheet'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { needsFoodCheck } from '../lib/derive'
import { koreanDate, shortDate } from '../lib/date'
import { won } from '../lib/format'
import { PORTION_LABEL } from '../lib/food'
import { MODULE_ICON, MODULE_LABEL, type ModuleKey } from '../lib/types'

const ADDABLE: ModuleKey[] = ['schedule', 'money', 'food', 'place', 'person', 'task', 'text']

export function RecordDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const toast = useToast()
  const record = store.get(id)

  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [menu, setMenu] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!record) {
    return (
      <main className="screen">
        <div className="topbar">
          <button type="button" onClick={() => navigate('/')} aria-label="뒤로">
            <Icon name="i-back" />
          </button>
        </div>
        <div className="empty">
          <b>기록을 찾을 수 없어요</b>
          지워졌거나 다른 기기에서 만든 기록일 수 있어요.
        </div>
      </main>
    )
  }

  const m = record.modules
  const missing = ADDABLE.filter((k) => !m[k])

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로">
          <Icon name="i-back" />
        </button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {record.source === 'ai' && <span className="tag">AI 제안에서 저장됨</span>}
          <button type="button" onClick={() => setMenu(true)} aria-label="더보기">
            <Icon name="i-more" />
          </button>
        </div>
      </div>

      <button type="button" className="det-hd" style={{ textAlign: 'left', width: '100%' }} onClick={() => setEditing('core')}>
        <div className="m num">
          {shortDate(record.eventDate)}
          {record.eventTime ? ` · ${record.eventTime}` : ' · 시간 미정'}
        </div>
        <h4>{record.title}</h4>
      </button>

      {m.schedule && (
        <Row target="schedule" onEdit={setEditing}>
          <div className="flex">
            <div>
              <div className="k">일정</div>
              <div className="v num">
                {koreanDate(m.schedule.startDate)}
                {m.schedule.startTime ? ` ${m.schedule.startTime}` : ''}
                {m.schedule.endTime ? ` – ${m.schedule.endTime}` : ''}
              </div>
            </div>
            <span className="side">
              {m.schedule.status === 'done' ? '완료' : m.schedule.status === 'canceled' ? '취소' : '예정'}
            </span>
          </div>
        </Row>
      )}

      {m.person && (
        <Row target="person" onEdit={setEditing}>
          <div>
            <div className="k">함께</div>
            <div className="v">{m.person.names.join(', ')}</div>
          </div>
        </Row>
      )}

      {m.place && (
        <Row target="place" onEdit={setEditing}>
          <div>
            <div className="k">장소</div>
            <div className="v">{m.place.name}</div>
          </div>
        </Row>
      )}

      {m.money && (
        <Row target="money" onEdit={setEditing}>
          <div style={{ width: '100%' }}>
            <div className="k">지출</div>
            {m.money.transactions.map((t) => (
              <div key={t.id}>
                <div className="v num">
                  {t.label} {won(t.amount)}
                  {t.status === 'planned' && <span className="tag warn" style={{ marginLeft: 6 }}>예상</span>}
                </div>
                <div className="side2">
                  {koreanDate(t.occurredAt)} 거래
                  {t.occurredAt !== record.eventDate && ` · 사건 날짜는 ${koreanDate(record.eventDate)}`}
                </div>
              </div>
            ))}
          </div>
        </Row>
      )}

      {m.food && (
        <div className="dmod">
          <span className="ico">
            <Icon name="i-bowl" size="sm" />
          </span>
          <div className="flex">
            <div>
              <div className="k">음식</div>
              <div className="v">{m.food.actualName ?? m.food.plannedName ?? '음식'}</div>
              {m.food.status === 'confirmed' && (
                <div className="side2">
                  {PORTION_LABEL[m.food.portion]}
                  {m.food.ingredients.length > 0 ? ` · ${m.food.ingredients.join(', ')}` : ''}
                </div>
              )}
              {m.food.status === 'skipped' && <div className="side2">먹지 않았어요 · 통계에 넣지 않아요</div>}
            </div>
            {needsFoodCheck(record) ? (
              <button
                type="button"
                className="tag"
                style={{ marginLeft: 'auto' }}
                onClick={() => navigate(`/record/${record.id}/food`)}
              >
                식사 확인
              </button>
            ) : m.food.status === 'planned' ? (
              <span className="side">예정</span>
            ) : (
              <button
                type="button"
                className="side"
                style={{ marginLeft: 'auto', color: 'var(--brand-ink)', fontWeight: 600 }}
                onClick={() => navigate(`/record/${record.id}/food`)}
              >
                다시 기록
              </button>
            )}
          </div>
        </div>
      )}

      {m.task && (
        <Row target="task" onEdit={setEditing}>
          <div style={{ width: '100%' }}>
            <div className="k">할 일</div>
            <div className="tasklist">
              {m.task.items.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    store.updateModules(record.id, (mods) => ({
                      ...mods,
                      task: {
                        items: (mods.task?.items ?? []).map((x) =>
                          x.id === t.id ? { ...x, completed: !x.completed } : x,
                        ),
                      },
                    }))
                  }}
                >
                  <span className={`box${t.completed ? ' on' : ''}`}>
                    <Icon name="i-check" size="xs" />
                  </span>
                  <span className={t.completed ? 'done' : ''}>{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        </Row>
      )}

      {m.text && (
        <Row target="text" onEdit={setEditing}>
          <div>
            <div className="k">{m.text.editedText ? '메모' : '원문'}</div>
            <div className="v body">{m.text.editedText ?? m.text.originalText}</div>
            {m.text.editedText && <div className="side2">원문 · {m.text.originalText}</div>}
          </div>
        </Row>
      )}

      <div className="push" style={{ paddingTop: 20 }}>
        <button type="button" className="btn ghost" onClick={() => setAdding(true)} disabled={missing.length === 0}>
          + 정보 추가
        </button>
      </div>

      {editing && <ModuleSheet record={record} target={editing} onClose={() => setEditing(null)} />}

      {adding && (
        <>
          <div className="sheet-backdrop" onClick={() => setAdding(false)} />
          <div className="sheet" role="dialog" aria-label="정보 추가">
            <div className="handle" />
            <h4>어떤 정보를 붙일까요?</h4>
            <p className="hint">필요한 것만 고르세요. 빈 모듈은 만들지 않습니다.</p>
            <div className="chips" style={{ marginTop: 16 }}>
              {missing.map((k) => (
                <button
                  type="button"
                  key={k}
                  className="c"
                  onClick={() => {
                    setAdding(false)
                    if (k === 'food') {
                      navigate(`/record/${record.id}/food`)
                      return
                    }
                    setEditing(k)
                  }}
                >
                  {MODULE_LABEL[k]}
                </button>
              ))}
            </div>
            <button type="button" className="btn ghost" style={{ marginTop: 20 }} onClick={() => setAdding(false)}>
              닫기
            </button>
          </div>
        </>
      )}

      {menu && (
        <>
          <div className="sheet-backdrop" onClick={() => setMenu(false)} />
          <div className="sheet" role="dialog" aria-label="기록 메뉴">
            <div className="handle" />
            <button
              type="button"
              className="btn line"
              onClick={() => {
                store.togglePin(record.id)
                setMenu(false)
                toast(record.pinned ? '고정을 해제했어요' : '기록을 고정했어요')
              }}
            >
              {record.pinned ? '고정 해제' : '기록 고정하기'}
            </button>
            <button
              type="button"
              className="btn danger"
              style={{ marginTop: 8 }}
              onClick={() => {
                const ok = window.confirm(
                  `"${record.title}" 기록 전체를 지울까요?\n연결된 일정·지출·음식 정보가 함께 사라집니다.`,
                )
                if (!ok) return
                store.remove(record.id)
                setMenu(false)
                navigate('/')
              }}
            >
              기록 전체 삭제
            </button>
            <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={() => setMenu(false)}>
              닫기
            </button>
          </div>
        </>
      )}
    </main>
  )
}

function Row({
  target,
  onEdit,
  children,
}: {
  target: ModuleKey
  onEdit: (t: EditTarget) => void
  children: React.ReactNode
}) {
  // 안쪽에 체크박스 같은 버튼이 들어올 수 있어 div + role로 만든다(버튼 중첩 방지)
  return (
    <div
      className="dmod"
      role="button"
      tabIndex={0}
      aria-label={`${MODULE_LABEL[target]} 수정`}
      onClick={() => onEdit(target)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(target)
        }
      }}
    >
      <span className="ico">
        <Icon name={MODULE_ICON[target] as never} size="sm" />
      </span>
      {children}
    </div>
  )
}
