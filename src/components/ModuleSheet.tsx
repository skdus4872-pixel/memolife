import { useState } from 'react'
import { Icon } from './Icon'
import { useStore } from '../lib/store'
import { uid } from '../lib/format'
import type {
  LifeRecord,
  ModuleKey,
  ScheduleStatus,
  Transaction,
  TransactionKind,
  TransactionStatus,
} from '../lib/types'

export type EditTarget = ModuleKey | 'core'

const TITLE: Record<EditTarget, string> = {
  core: '기록 기본 정보',
  text: '메모',
  schedule: '일정',
  money: '지출',
  food: '음식',
  place: '장소',
  person: '함께한 사람',
  task: '할 일',
  media: '첨부',
}

/** 모듈 하나를 고치는 바텀 시트. 모듈 삭제와 Record 삭제는 분명히 구분한다. */
export function ModuleSheet({
  record,
  target,
  onClose,
}: {
  record: LifeRecord
  target: EditTarget
  onClose: () => void
}) {
  const store = useStore()

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={`${TITLE[target]} 수정`}>
        <div className="handle" />
        <h4>{TITLE[target]}</h4>

        {target === 'core' && <CoreForm record={record} onClose={onClose} />}
        {target === 'text' && <TextForm record={record} onClose={onClose} />}
        {target === 'schedule' && <ScheduleForm record={record} onClose={onClose} />}
        {target === 'money' && <MoneyForm record={record} onClose={onClose} />}
        {target === 'place' && <PlaceForm record={record} onClose={onClose} />}
        {target === 'person' && <PersonForm record={record} onClose={onClose} />}
        {target === 'task' && <TaskForm record={record} onClose={onClose} />}
        {target === 'media' && (
          <p className="hint" style={{ marginTop: 16 }}>
            사진·음성 첨부는 입력 경로만 설계해 두었습니다. 실제 저장은 다음 단계입니다.
          </p>
        )}

        {target !== 'core' && record.modules[target] && (
          <button
            type="button"
            className="btn danger"
            style={{ marginTop: 10 }}
            onClick={() => {
              store.removeModule(record.id, target)
              onClose()
            }}
          >
            이 정보만 지우기
          </button>
        )}

        <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={onClose}>
          닫기
        </button>
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-row">
      <div className="k">{label}</div>
      {children}
    </div>
  )
}

function CoreForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState(record.title)
  const [date, setDate] = useState(record.eventDate)
  const [time, setTime] = useState(record.eventTime ?? '')

  return (
    <>
      <Row label="제목">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Row>
      <Row label="대표 날짜">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Row>
      <Row label="대표 시간 (비우면 시간 미정)">
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Row>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        disabled={!title.trim()}
        onClick={() => {
          store.update(record.id, (r) => ({
            ...r,
            title: title.trim(),
            eventDate: date,
            eventTime: time || undefined,
          }))
          onClose()
        }}
      >
        저장하기
      </button>
    </>
  )
}

function TextForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const text = record.modules.text
  const [value, setValue] = useState(text?.editedText ?? text?.originalText ?? '')

  return (
    <>
      {text?.originalText && text.editedText !== undefined && (
        <div className="src" style={{ marginTop: 14 }}>
          원문 · {text.originalText}
        </div>
      )}
      <Row label="메모">
        <textarea
          className="field"
          rows={5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="기록할 내용을 적어주세요"
        />
      </Row>
      <p className="hint">원문은 지워지지 않습니다. 고친 내용만 따로 저장돼요.</p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        onClick={() => {
          store.updateModules(record.id, (m) => ({
            ...m,
            text: m.text
              ? { ...m.text, editedText: value }
              : { originalText: value },
          }))
          onClose()
        }}
      >
        저장하기
      </button>
    </>
  )
}

const SCHEDULE_STATUS: { value: ScheduleStatus; label: string }[] = [
  { value: 'planned', label: '예정' },
  { value: 'done', label: '완료' },
  { value: 'canceled', label: '취소' },
]

function ScheduleForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const s = record.modules.schedule
  const [startDate, setStartDate] = useState(s?.startDate ?? record.eventDate)
  const [startTime, setStartTime] = useState(s?.startTime ?? record.eventTime ?? '')
  const [endTime, setEndTime] = useState(s?.endTime ?? '')
  const [status, setStatus] = useState<ScheduleStatus>(s?.status ?? 'planned')

  return (
    <>
      <Row label="날짜">
        <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Row>
      <Row label="시작 시각">
        <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </Row>
      <Row label="종료 시각 (식사 확인 시점의 기준이 됩니다)">
        <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </Row>
      <Row label="상태">
        <div className="seg">
          {SCHEDULE_STATUS.map((o) => (
            <button
              type="button"
              key={o.value}
              className={status === o.value ? 'on' : ''}
              onClick={() => setStatus(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Row>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        onClick={() => {
          store.updateModules(record.id, (m) => ({
            ...m,
            schedule: {
              startDate,
              startTime: startTime || undefined,
              endTime: endTime || undefined,
              status,
            },
          }))
          onClose()
        }}
      >
        저장하기
      </button>
    </>
  )
}

const TX_KIND: { value: TransactionKind; label: string }[] = [
  { value: 'payment', label: '결제' },
  { value: 'deposit', label: '예약금' },
  { value: 'balance', label: '잔금' },
  { value: 'refund', label: '환불' },
]

function MoneyForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const transactions = record.modules.money?.transactions ?? []

  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(record.eventDate)
  const [kind, setKind] = useState<TransactionKind>('payment')
  const [status, setStatus] = useState<TransactionStatus>('confirmed')
  const [category, setCategory] = useState('음식')

  const setTx = (next: Transaction[]) =>
    store.updateModules(record.id, (m) => ({ ...m, money: { transactions: next } }))

  return (
    <>
      {transactions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {transactions.map((t) => (
            <div className="dmod" key={t.id} style={{ gridTemplateColumns: '1fr' }}>
              <div className="flex">
                <div>
                  <div className="k">
                    {TX_KIND.find((k) => k.value === t.kind)?.label} · {t.occurredAt}
                  </div>
                  <div className="v num">
                    {t.label} ₩{t.amount.toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className="side" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`tag ${t.status === 'confirmed' ? 'done' : 'warn'}`}
                    onClick={() =>
                      setTx(
                        transactions.map((x) =>
                          x.id === t.id
                            ? { ...x, status: x.status === 'confirmed' ? 'planned' : 'confirmed' }
                            : x,
                        ),
                      )
                    }
                  >
                    {t.status === 'confirmed' ? '확정' : '예정'}
                  </button>
                  <button
                    type="button"
                    aria-label="거래 삭제"
                    onClick={() => setTx(transactions.filter((x) => x.id !== t.id))}
                  >
                    <Icon name="i-trash" size="sm" style={{ color: 'var(--ink-3)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p className="hint">확정된 거래만 지출 통계에 들어갑니다.</p>
        </div>
      )}

      <Row label="내용">
        <input
          className="input"
          value={label}
          placeholder="예약금, 점심 …"
          onChange={(e) => setLabel(e.target.value)}
        />
      </Row>
      <Row label="금액">
        <input
          className="input num"
          inputMode="numeric"
          value={amount}
          placeholder="20000"
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        />
      </Row>
      <Row label="거래일 (대표 날짜와 달라도 됩니다)">
        <input
          className="input"
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </Row>
      <Row label="분류">
        <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
      </Row>
      <Row label="종류">
        <div className="chips">
          {TX_KIND.map((k) => (
            <button
              type="button"
              key={k.value}
              className={`c${kind === k.value ? ' on' : ''}`}
              onClick={() => setKind(k.value)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </Row>
      <Row label="상태">
        <div className="seg">
          <button type="button" className={status === 'confirmed' ? 'on' : ''} onClick={() => setStatus('confirmed')}>
            실제 결제
          </button>
          <button type="button" className={status === 'planned' ? 'on' : ''} onClick={() => setStatus('planned')}>
            예상 비용
          </button>
        </div>
      </Row>

      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        disabled={!label.trim() || !amount}
        onClick={() => {
          setTx([
            ...transactions,
            {
              id: uid('tx'),
              label: label.trim(),
              amount: Number(amount),
              currency: 'KRW',
              kind,
              occurredAt,
              status,
              category: category.trim() || undefined,
            },
          ])
          setLabel('')
          setAmount('')
          onClose()
        }}
      >
        거래 추가하기
      </button>
    </>
  )
}

function PlaceForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState(record.modules.place?.name ?? '')

  return (
    <>
      <Row label="장소">
        <input
          className="input"
          value={name}
          placeholder="가게 이름이나 동네"
          onChange={(e) => setName(e.target.value)}
        />
      </Row>
      <p className="hint">확인한 장소만 저장합니다. 비슷한 이름을 자동으로 묶지 않아요.</p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        disabled={!name.trim()}
        onClick={() => {
          store.updateModules(record.id, (m) => ({ ...m, place: { name: name.trim() } }))
          onClose()
        }}
      >
        저장하기
      </button>
    </>
  )
}

function PersonForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const [value, setValue] = useState((record.modules.person?.names ?? []).join(', '))

  return (
    <>
      <Row label="함께한 사람 (쉼표로 구분)">
        <input className="input" value={value} placeholder="수진, 엄마" onChange={(e) => setValue(e.target.value)} />
      </Row>
      <p className="hint">이름이 같아도 다른 사람일 수 있어 자동으로 연결하지 않습니다.</p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        onClick={() => {
          const names = value
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
          store.updateModules(record.id, (m) => ({ ...m, person: names.length ? { names } : undefined }))
          onClose()
        }}
      >
        저장하기
      </button>
    </>
  )
}

function TaskForm({ record, onClose }: { record: LifeRecord; onClose: () => void }) {
  const store = useStore()
  const items = record.modules.task?.items ?? []
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')

  return (
    <>
      {items.length > 0 && (
        <div className="tasklist" style={{ marginTop: 14 }}>
          {items.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={t.completed ? 'done' : ''} style={{ fontSize: 13.5 }}>
                {t.title}
              </span>
              <button
                type="button"
                style={{ marginLeft: 'auto' }}
                aria-label="할 일 삭제"
                onClick={() =>
                  store.updateModules(record.id, (m) => ({
                    ...m,
                    task: { items: items.filter((x) => x.id !== t.id) },
                  }))
                }
              >
                <Icon name="i-trash" size="sm" style={{ color: 'var(--ink-3)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Row label="할 일">
        <input className="input" value={title} placeholder="예약 확인하기" onChange={(e) => setTitle(e.target.value)} />
      </Row>
      <Row label="기한 (선택)">
        <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Row>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 16 }}
        disabled={!title.trim()}
        onClick={() => {
          store.updateModules(record.id, (m) => ({
            ...m,
            task: {
              items: [
                ...items,
                { id: uid('t'), title: title.trim(), dueAt: due || undefined, completed: false },
              ],
            },
          }))
          setTitle('')
          setDue('')
          onClose()
        }}
      >
        할 일 추가하기
      </button>
    </>
  )
}
