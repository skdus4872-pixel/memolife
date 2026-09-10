import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { existingCategories } from '../lib/derive'
import { koreanDate, today } from '../lib/date'
import { uid, won } from '../lib/format'
import {
  SUGGESTION_ICON,
  SUGGESTION_LABEL,
  type AnalysisResult,
  type Suggestion,
  type SuggestionKind,
} from '../lib/analysis'
import type { Modules, TaskItem, Transaction, TransactionKind } from '../lib/types'

/**
 * 03 AI 분석 — 제안을 고르고 고치는 화면.
 * 여기서 사용자가 확인하기 전에는 아무것도 저장되지 않는다. — 기획서 05
 */
export function AiAnalysis() {
  const navigate = useNavigate()
  const toast = useToast()
  const store = useStore()
  const location = useLocation()
  const incoming = (location.state as { result?: AnalysisResult } | null)?.result

  const [title, setTitle] = useState(incoming?.title ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>(incoming?.suggestions ?? [])
  const [editing, setEditing] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [adding, setAdding] = useState(false)

  const categories = useMemo(() => existingCategories(store.records), [store.records])
  const selected = suggestions.filter((s) => s.selected)

  // 원문 없이 이 화면에 직접 들어온 경우 (새로고침 등)
  if (!incoming) return <Navigate to="/quick-record" replace />

  const patch = (id: string, next: Partial<Suggestion>) =>
    setSuggestions((list) =>
      list.map((s) => (s.id === id ? ({ ...s, ...next } as Suggestion) : s)),
    )

  const save = () => {
    const modules = buildModules(selected, incoming.originalText)
    const schedule = selected.find((s) => s.kind === 'schedule')
    const money = selected.find((s) => s.kind === 'money')

    const record = store.create({
      title: title.trim() || incoming.title || '기록',
      eventDate:
        (schedule?.kind === 'schedule' ? schedule.date : undefined) ??
        (money?.kind === 'money' ? money.occurredAt : undefined) ??
        today(),
      eventTime: schedule?.kind === 'schedule' ? schedule.startTime : undefined,
      modules,
      source: 'ai',
    })

    toast('기록했어요')
    navigate(`/record/${record.id}`, { replace: true })
  }

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" onClick={() => navigate('/quick-record', { replace: true })} aria-label="뒤로">
          <Icon name="i-back" />
        </button>
        <span className="muted">분석 완료</span>
      </div>

      <div className="h-lg">
        기록에서
        <br />
        정보를 찾았어요
      </div>
      <p className="h-sub">저장할 정보만 남기고 나머지는 체크를 해제하세요. 값은 눌러서 고칠 수 있어요.</p>

      <div className="src">
        원문 · <Marked text={incoming.originalText} spans={selected.map((s) => s.sourceSpan)} />
      </div>

      {/* 제목 — Core */}
      <div className="sug">
        <span className="box" aria-hidden="true">
          <Icon name="i-check" size="xs" />
        </span>
        <div>
          <div className="k">
            <Icon name="i-note" size="xs" />
            제목
            <button type="button" className="edit" onClick={() => setEditingTitle((v) => !v)}>
              {editingTitle ? '완료' : '수정'}
              <Icon name={editingTitle ? 'i-check' : 'i-chev'} size="xs" />
            </button>
          </div>
          {editingTitle ? (
            <input
              className="input"
              style={{ marginTop: 6 }}
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              aria-label="기록 제목"
            />
          ) : (
            <div className="v">{title || '제목 없음'}</div>
          )}
        </div>
      </div>

      {suggestions.length === 0 && (
        <div className="empty">
          <b>구조화할 정보를 찾지 못했어요</b>
          원문은 그대로 저장할 수 있어요. 아래에서 직접 정보를 추가해도 됩니다.
        </div>
      )}

      {suggestions.map((s) => (
        <SuggestionRow
          key={s.id}
          suggestion={s}
          categories={categories}
          open={editing === s.id}
          onToggleOpen={() => setEditing(editing === s.id ? null : s.id)}
          onToggleSelect={() => patch(s.id, { selected: !s.selected })}
          onPatch={(next) => patch(s.id, next)}
          onRemove={() => setSuggestions((list) => list.filter((x) => x.id !== s.id))}
        />
      ))}

      {adding ? (
        <div className="chips" style={{ marginTop: 4 }}>
          {(['place', 'person', 'task', 'money', 'food', 'schedule'] as SuggestionKind[]).map((kind) => (
            <button
              type="button"
              key={kind}
              className="c"
              onClick={() => {
                const created = emptySuggestion(kind, today())
                setSuggestions((list) => [...list, created])
                setEditing(created.id)
                setAdding(false)
              }}
            >
              {SUGGESTION_LABEL[kind]}
            </button>
          ))}
          <button type="button" className="c dash" onClick={() => setAdding(false)}>
            취소
          </button>
        </div>
      ) : (
        <button type="button" className="add-row" onClick={() => setAdding(true)}>
          + 직접 정보 추가하기
        </button>
      )}

      <div className="push" style={{ paddingTop: 20 }}>
        <button type="button" className="btn" onClick={save}>
          선택한 정보 기록하기
        </button>
        <div className="center-note">
          {selected.length}개 선택됨 · 원문은 항상 함께 저장돼요
        </div>
      </div>
    </main>
  )
}

/* ---------------- 제안 한 줄 ---------------- */

function SuggestionRow({
  suggestion,
  categories,
  open,
  onToggleOpen,
  onToggleSelect,
  onPatch,
  onRemove,
}: {
  suggestion: Suggestion
  categories: string[]
  open: boolean
  onToggleOpen: () => void
  onToggleSelect: () => void
  onPatch: (next: Partial<Suggestion>) => void
  onRemove: () => void
}) {
  const s = suggestion

  return (
    <div className={`sug${s.selected ? '' : ' off'}`}>
      <button
        type="button"
        className={`box${s.selected ? '' : ' empty'}`}
        onClick={onToggleSelect}
        aria-pressed={s.selected}
        aria-label={`${SUGGESTION_LABEL[s.kind]} 선택`}
      >
        {s.selected && <Icon name="i-check" size="xs" />}
      </button>

      <div style={{ minWidth: 0 }}>
        <div className="k">
          <Icon name={SUGGESTION_ICON[s.kind] as never} size="xs" />
          {SUGGESTION_LABEL[s.kind]}
          <button type="button" className="edit" onClick={onToggleOpen}>
            {open ? '완료' : '수정'}
            <Icon name={open ? 'i-check' : 'i-chev'} size="xs" />
          </button>
        </div>

        <div className="v" style={{ color: s.selected ? undefined : 'var(--ink-2)' }}>
          {mainLine(s)}
        </div>
        <div className="m">
          {metaLine(s)}
          {s.needsCheck && (
            <span className="tag warn" style={{ marginLeft: 6 }}>
              확인 필요
            </span>
          )}
          {s.kind === 'money' && s.categoryIsNew && (
            <span className="tag" style={{ marginLeft: 6 }}>
              새 카테고리
            </span>
          )}
        </div>

        {open && (
          <div style={{ marginTop: 10 }}>
            <Editor suggestion={s} categories={categories} onPatch={onPatch} />
            <button
              type="button"
              className="textlink"
              style={{ marginTop: 10, color: 'var(--danger)' }}
              onClick={onRemove}
            >
              이 제안 지우기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function mainLine(s: Suggestion): string {
  switch (s.kind) {
    case 'schedule':
      return `${koreanDate(s.date)}${s.startTime ? ` · ${s.startTime}` : ''}`
    case 'money':
      return `${s.label} ${won(s.amount)}`
    case 'food':
      return s.name
    case 'place':
      return s.name
    case 'person':
      return s.names.join(', ')
    case 'task':
      return s.title
  }
}

function metaLine(s: Suggestion): string {
  switch (s.kind) {
    case 'schedule':
      return s.endTime ? `${s.startTime ?? ''} – ${s.endTime}` : s.startTime ? '' : '시간 미정'
    case 'money':
      return `${koreanDate(s.occurredAt)} · ${s.paid ? '실제 결제' : '예상 비용'} · ${s.category}`
    case 'food':
      return s.eaten ? '먹은 것으로 보여요 · 확인 대기로 저장돼요' : '식사 후에 확인할게요'
    case 'place':
      return '확인한 장소만 저장돼요'
    case 'person':
      return '이름이 같아도 자동으로 묶지 않아요'
    case 'task':
      return s.dueAt ? `${koreanDate(s.dueAt)}까지` : '기한 없음'
  }
}

/* ---------------- 값 고치기 ---------------- */

const TX_KIND: { value: TransactionKind; label: string }[] = [
  { value: 'payment', label: '결제' },
  { value: 'deposit', label: '예약금' },
  { value: 'balance', label: '잔금' },
  { value: 'refund', label: '환불' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-row">
      <div className="k">{label}</div>
      {children}
    </div>
  )
}

function Editor({
  suggestion: s,
  categories,
  onPatch,
}: {
  suggestion: Suggestion
  categories: string[]
  onPatch: (next: Partial<Suggestion>) => void
}) {
  // 사용자가 고친 값은 확인 완료로 본다
  const edit = (next: Record<string, unknown>) => onPatch({ ...next, needsCheck: false } as Partial<Suggestion>)

  switch (s.kind) {
    case 'schedule':
      return (
        <>
          <Field label="날짜">
            <input className="input" type="date" value={s.date} onChange={(e) => edit({ date: e.target.value })} />
          </Field>
          <Field label="시작 시각">
            <input
              className="input"
              type="time"
              value={s.startTime ?? ''}
              onChange={(e) => edit({ startTime: e.target.value || undefined })}
            />
          </Field>
          <Field label="종료 시각 (식사 확인 기준)">
            <input
              className="input"
              type="time"
              value={s.endTime ?? ''}
              onChange={(e) => edit({ endTime: e.target.value || undefined })}
            />
          </Field>
        </>
      )

    case 'money':
      return (
        <>
          <Field label="내용">
            <input className="input" value={s.label} onChange={(e) => edit({ label: e.target.value })} />
          </Field>
          <Field label="금액">
            <input
              className="input num"
              inputMode="numeric"
              value={String(s.amount)}
              onChange={(e) => edit({ amount: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })}
            />
          </Field>
          <Field label="거래일">
            <input
              className="input"
              type="date"
              value={s.occurredAt}
              onChange={(e) => edit({ occurredAt: e.target.value })}
            />
          </Field>
          <Field label="종류">
            <div className="chips">
              {TX_KIND.map((k) => (
                <button
                  type="button"
                  key={k.value}
                  className={`c${s.transactionKind === k.value ? ' on' : ''}`}
                  onClick={() => edit({ transactionKind: k.value })}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="상태">
            <div className="seg">
              <button type="button" className={s.paid ? 'on' : ''} onClick={() => edit({ paid: true })}>
                실제 결제
              </button>
              <button type="button" className={s.paid ? '' : 'on'} onClick={() => edit({ paid: false })}>
                예상 비용
              </button>
            </div>
          </Field>
          <Field label="카테고리">
            <div className="chips">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`c${s.category === c ? ' on' : ''}`}
                  onClick={() => edit({ category: c, categoryIsNew: false })}
                >
                  {c}
                </button>
              ))}
              {s.categoryIsNew && s.category && !categories.includes(s.category) && (
                <span className="c on">{s.category} · 새로 만듦</span>
              )}
            </div>
            <input
              className="input"
              style={{ marginTop: 8 }}
              value={s.category}
              placeholder="직접 입력"
              onChange={(e) =>
                edit({
                  category: e.target.value,
                  categoryIsNew: !categories.includes(e.target.value),
                })
              }
            />
          </Field>
        </>
      )

    case 'food':
      return (
        <>
          <Field label="음식">
            <input className="input" value={s.name} onChange={(e) => edit({ name: e.target.value })} />
          </Field>
          <Field label="이미 먹었나요?">
            <div className="seg">
              <button type="button" className={s.eaten ? 'on' : ''} onClick={() => edit({ eaten: true })}>
                먹었어요
              </button>
              <button type="button" className={s.eaten ? '' : 'on'} onClick={() => edit({ eaten: false })}>
                먹을 예정
              </button>
            </div>
          </Field>
          <p className="hint">칼로리와 재료는 음식 확인 화면에서 직접 고릅니다.</p>
        </>
      )

    case 'place':
      return (
        <Field label="장소">
          <input className="input" value={s.name} onChange={(e) => edit({ name: e.target.value })} />
        </Field>
      )

    case 'person':
      return (
        <Field label="함께한 사람 (쉼표로 구분)">
          <input
            className="input"
            value={s.names.join(', ')}
            onChange={(e) =>
              edit({
                names: e.target.value
                  .split(',')
                  .map((n) => n.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      )

    case 'task':
      return (
        <>
          <Field label="할 일">
            <input className="input" value={s.title} onChange={(e) => edit({ title: e.target.value })} />
          </Field>
          <Field label="기한 (선택)">
            <input
              className="input"
              type="date"
              value={s.dueAt ?? ''}
              onChange={(e) => edit({ dueAt: e.target.value || undefined })}
            />
          </Field>
        </>
      )
  }
}

/* ---------------- 저장 ---------------- */

function buildModules(selected: Suggestion[], originalText: string): Modules {
  const modules: Modules = { text: { originalText } }

  const schedule = selected.find((s) => s.kind === 'schedule')
  if (schedule?.kind === 'schedule') {
    modules.schedule = {
      startDate: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: 'planned',
    }
  }

  const money = selected.filter((s): s is Extract<Suggestion, { kind: 'money' }> => s.kind === 'money')
  if (money.length) {
    const transactions: Transaction[] = money.map((m) => ({
      id: uid('tx'),
      label: m.label,
      amount: m.amount,
      currency: 'KRW',
      kind: m.transactionKind,
      occurredAt: m.occurredAt,
      // 실제 결제만 확정으로 저장한다. 예상 비용은 집계에 들어가지 않는다.
      status: m.paid ? 'confirmed' : 'planned',
      category: m.category,
    }))
    modules.money = { transactions }
  }

  const food = selected.find((s) => s.kind === 'food')
  if (food?.kind === 'food') {
    modules.food = {
      plannedName: food.name,
      // 먹었다고 해도 섭취로 확정하지 않는다. 확인 화면을 거쳐야 통계에 들어간다.
      status: food.eaten ? 'pending' : 'planned',
      ingredients: [],
      portion: 'normal',
    }
  }

  const place = selected.find((s) => s.kind === 'place')
  if (place?.kind === 'place') modules.place = { name: place.name }

  const names = selected.flatMap((s) => (s.kind === 'person' ? s.names : []))
  if (names.length) modules.person = { names: [...new Set(names)] }

  const tasks = selected.filter((s): s is Extract<Suggestion, { kind: 'task' }> => s.kind === 'task')
  if (tasks.length) {
    const items: TaskItem[] = tasks.map((t) => ({
      id: uid('t'),
      title: t.title,
      dueAt: t.dueAt,
      completed: false,
    }))
    modules.task = { items }
  }

  return modules
}

function emptySuggestion(kind: SuggestionKind, date: string): Suggestion {
  const base = { id: uid('m'), selected: true }
  switch (kind) {
    case 'schedule':
      return { ...base, kind, date }
    case 'money':
      return {
        ...base,
        kind,
        label: '지출',
        amount: 0,
        occurredAt: date,
        transactionKind: 'payment',
        paid: true,
        category: '기타',
        categoryIsNew: false,
      }
    case 'food':
      return { ...base, kind, name: '', eaten: false }
    case 'place':
      return { ...base, kind, name: '' }
    case 'person':
      return { ...base, kind, names: [] }
    case 'task':
      return { ...base, kind, title: '' }
  }
}

/* ---------------- 원문 근거 표시 ---------------- */

function Marked({ text, spans }: { text: string; spans: (string | undefined)[] }) {
  const ranges = useMemo(() => {
    const found: { start: number; end: number }[] = []
    for (const span of spans) {
      const needle = span?.trim()
      if (!needle) continue
      const start = text.indexOf(needle)
      if (start < 0) continue
      const end = start + needle.length
      // 이미 표시한 구간과 겹치면 건너뛴다
      if (found.some((r) => start < r.end && end > r.start)) continue
      found.push({ start, end })
    }
    return found.sort((a, b) => a.start - b.start)
  }, [text, spans])

  if (ranges.length === 0) return <>{text}</>

  const parts: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach((r, i) => {
    if (cursor < r.start) parts.push(text.slice(cursor, r.start))
    parts.push(<b key={i}>{text.slice(r.start, r.end)}</b>)
    cursor = r.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))

  return <>{parts}</>
}
