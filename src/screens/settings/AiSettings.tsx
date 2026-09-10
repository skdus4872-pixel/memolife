import { useEffect, useState } from 'react'
import { SubHeader, ToggleRow } from '../../components/SubHeader'
import { useSettings } from '../../lib/settings'
import { useStore } from '../../lib/store'
import { getAiStatus } from '../../lib/ai'
import { allCategories } from '../../lib/derive'
import type { AiStatus } from '../../lib/analysis'

export function AiSettings() {
  const { settings, update } = useSettings()
  const { records } = useStore()
  const [ai, setAi] = useState<AiStatus | null>(null)

  useEffect(() => {
    let alive = true
    getAiStatus().then((s) => alive && setAi(s))
    return () => {
      alive = false
    }
  }, [])

  const categories = allCategories(records, settings.customCategories)

  return (
    <main className="screen">
      <SubHeader title="AI 설정" />

      <div className="kv">
        <span className="k">서버 연결</span>
        <span className="v">{ai == null ? '확인 중…' : ai.configured ? '연결됨' : '키 없음'}</span>
      </div>
      <div className="kv">
        <span className="k">모델</span>
        <span className="v">{ai?.model ?? '—'}</span>
      </div>

      <div className="section-title">동작</div>
      <ToggleRow
        label="AI 제안 받기"
        desc="빠른 기록에서 문장을 분석해 일정·지출·음식 후보를 제안합니다"
        value={settings.aiSuggestions}
        onChange={(v) => update({ aiSuggestions: v })}
      />

      <div className="info-card">
        AI는 <b>제안만</b> 합니다. 확인 화면에서 체크한 정보만 저장되고, 값은 저장 전에 직접 고칠 수 있어요.
        원문은 언제나 함께 저장됩니다.
      </div>

      <div className="section-title">분류에 쓰는 카테고리</div>
      <p className="h-sub" style={{ marginTop: 0 }}>
        분석할 때 아래 목록을 함께 보냅니다. 맞는 게 있으면 그대로 쓰고, 없을 때만 새 이름을 제안해요.
      </p>
      <div className="chips">
        {categories.length === 0 ? (
          <span className="c dash">아직 없음</span>
        ) : (
          categories.map((c) => (
            <span className="c" key={c}>
              {c}
            </span>
          ))
        )}
      </div>

      {ai && !ai.configured && (
        <div className="info-card" style={{ marginTop: 20 }}>
          서버에 <b>OPENAI_API_KEY</b> 가 없어서 분석을 켤 수 없어요. 로컬은 <b>.env</b>, 배포는 Vercel 환경 변수에
          넣고 다시 배포하면 됩니다. 그동안에도 <b>AI 없이 저장</b>으로 기록은 남길 수 있어요.
        </div>
      )}
    </main>
  )
}
