import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { allCategories, confirmedSpendOn, scheduleCountOn } from '../lib/derive'
import { useSettings } from '../lib/settings'
import { dayOfMonth, monthEn, today, weekdayEn } from '../lib/date'
import { won } from '../lib/format'
import { analyzeText } from '../lib/ai'

/** 원문에서 기록 제목을 만든다. AI 없이 저장할 때 쓴다. */
function titleFromText(text: string): string {
  const line = text.trim().split('\n')[0].trim()
  return line.length > 18 ? `${line.slice(0, 18)}…` : line || '메모'
}

/**
 * 빠른 기록 — 하단 + 의 목적지.
 * 종류를 고르지 않고 문장으로 남기면, AI가 정보 후보를 찾아 다음 화면에서 확인받는다.
 */
export function QuickRecord() {
  const navigate = useNavigate()
  const toast = useToast()
  const store = useStore()
  const { records } = store
  const { settings } = useSettings()

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const date = today()

  const close = () => navigate(-1)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeText({
        text,
        categories: allCategories(records, settings.customCategories),
        today: date,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      // 분석 결과는 저장이 아니라 "확인 화면"으로 넘어간다. 여기서 저장되는 것은 없다.
      navigate('/quick-record/analysis', { state: { result }, replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const saveTextOnly = () => {
    const record = store.create({
      title: titleFromText(text),
      eventDate: date,
      modules: { text: { originalText: text.trim() } },
    })
    toast('기록했어요')
    navigate(`/record/${record.id}`, { replace: true })
  }

  return (
    <main className="screen flush" style={{ overflow: 'hidden' }}>
      {/* 뒤에 남아 있는 오늘 화면 (흐리게) */}
      <div className="date-hd" style={{ opacity: 0.28 }} aria-hidden="true">
        <div className="mon">{monthEn(date)}</div>
        <div className="day num">{dayOfMonth(date)}</div>
        <div className="wd">{weekdayEn(date)}</div>
        <div className="pills">
          <span className="pill">
            일정 <b className="num">{scheduleCountOn(records, date)}</b>
          </span>
          <span className="pill">
            지출 <b className="num">{won(confirmedSpendOn(records, date))}</b>
          </span>
        </div>
      </div>

      <div className="sheet-backdrop" onClick={close} />

      <div className="sheet" role="dialog" aria-label="빠른 기록">
        <div className="handle" />
        <h4>무엇을 기록할까요?</h4>
        <p className="hint">일정, 지출, 생각, 식사 — 나눠 적지 말고 그대로 적어주세요.</p>

        <textarea
          className="field"
          style={{ marginTop: 16, minHeight: 104 }}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예) 내일 12시 반에 수진이랑 마라탕 먹기로 했고 예약금 2만원 결제했어."
          aria-label="기록 원문"
          disabled={loading}
        />

        <div className="aux">
          <button type="button" className="chip" disabled onClick={() => toast('사진 첨부는 준비 중이에요')}>
            <Icon name="i-img" size="sm" />
            사진 추가
          </button>
          <button type="button" className="chip" disabled onClick={() => toast('음성 입력은 준비 중이에요')}>
            <Icon name="i-mic" size="sm" />
            음성 입력
          </button>
          <button
            type="button"
            className="chip"
            style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}
            disabled={!text.trim() || loading}
            onClick={saveTextOnly}
          >
            AI 없이 저장
          </button>
        </div>

        {error && (
          <div className="src" style={{ marginTop: 12, color: 'var(--warn)', background: 'var(--warn-bg)' }}>
            {error}
            <br />
            원문은 그대로 남아 있어요. 다시 시도하거나 AI 없이 저장할 수 있어요.
          </div>
        )}

        {settings.aiSuggestions ? (
          <>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              disabled={!text.trim() || loading}
              onClick={analyze}
            >
              {loading ? '분석 중…' : '분석하기'}
            </button>
            <p className="center-note">
              {loading
                ? '원문에서 날짜·금액·음식 같은 정보를 찾는 중이에요'
                : '찾은 정보는 다음 화면에서 고르고 고친 뒤에 저장돼요'}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              disabled={!text.trim()}
              onClick={saveTextOnly}
            >
              기록하기
            </button>
            <p className="center-note">AI 제안을 꺼 두었어요 · My → AI 설정에서 다시 켤 수 있어요</p>
          </>
        )}

        <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={close} disabled={loading}>
          닫기
        </button>
      </div>
    </main>
  )
}
