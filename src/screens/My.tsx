import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { getAiStatus } from '../lib/ai'
import type { AiStatus } from '../lib/analysis'

export function My() {
  const { records, resetToSeed } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [ai, setAi] = useState<AiStatus | null>(null)

  useEffect(() => {
    let alive = true
    getAiStatus().then((s) => alive && setAi(s))
    return () => {
      alive = false
    }
  }, [])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memolife-records-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('기록을 파일로 내보냈어요')
  }

  return (
    <main className="screen">
      <div className="prof">
        <div className="avt" />
        <div>
          <div className="n">나연</div>
          <div className="e">nayeon@example.com</div>
        </div>
        <Icon name="i-chev" size="sm" style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />
      </div>

      <div className="menu">
        <MenuRow icon="i-book" label="저장된 기록" onClick={() => navigate('/my/saved')} />
        <MenuRow icon="i-search" label="기록 검색" onClick={() => navigate('/search')} />
        <MenuRow icon="i-tag" label="카테고리 관리" onClick={() => toast('카테고리 관리는 다음 단계예요')} />
        <MenuRow icon="i-cloud" label="데이터 내보내기" hint="JSON" onClick={exportJson} />
        <MenuRow
          icon="i-ai"
          label="AI 설정"
          hint={ai == null ? '확인 중' : ai.configured ? (ai.model ?? '연결됨') : '키 없음'}
          onClick={() =>
            toast(
              ai?.configured
                ? `${ai.model} 로 분석하고 있어요`
                : '.env 에 OPENAI_API_KEY 를 넣고 서버를 다시 켜주세요',
            )
          }
        />
        <MenuRow icon="i-bell" label="알림 설정" onClick={() => toast('알림 설정은 다음 단계예요')} />
        <MenuRow icon="i-theme" label="테마 설정" hint="라이트" onClick={() => toast('지금은 라이트 테마만 있어요')} />
        <MenuRow
          icon="i-help"
          label="샘플 데이터 다시 불러오기"
          onClick={() => {
            if (!window.confirm('지금까지의 기록을 지우고 샘플 데이터로 되돌릴까요?')) return
            resetToSeed()
            toast('샘플 데이터로 되돌렸어요')
          }}
        />
      </div>

      <div className="push" style={{ paddingTop: 20, paddingBottom: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Memo Life 2.0 · 기록 {records.length}개</div>
      </div>
    </main>
  )
}

function MenuRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: IconName
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button type="button" className="row" onClick={onClick}>
      <span className="ico">
        <Icon name={icon} size="sm" />
      </span>
      {label}
      <span className="r">
        {hint}
        <Icon name="i-chev" size="sm" />
      </span>
    </button>
  )
}
