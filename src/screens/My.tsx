import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { useStore } from '../lib/store'
import { useSettings, type ThemeChoice } from '../lib/settings'
import { getAiStatus } from '../lib/ai'
import { allCategories, pendingFoodRecords } from '../lib/derive'
import type { AiStatus } from '../lib/analysis'

const THEME_LABEL: Record<ThemeChoice, string> = {
  light: '라이트',
  dark: '다크',
  system: '시스템',
}

export function My() {
  const { records } = useStore()
  const { settings, update } = useSettings()
  const navigate = useNavigate()
  const [ai, setAi] = useState<AiStatus | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let alive = true
    getAiStatus().then((s) => alive && setAi(s))
    return () => {
      alive = false
    }
  }, [])

  const pinned = records.filter((r) => r.pinned).length
  const categories = allCategories(records, settings.customCategories).length
  const pending = pendingFoodRecords(records).length

  return (
    <main className="screen">
      <button type="button" className="prof" onClick={() => setEditing(true)}>
        <div className="avt" />
        <div style={{ textAlign: 'left' }}>
          <div className="n">{settings.profile.name}</div>
          <div className="e">{settings.profile.email}</div>
        </div>
        <Icon name="i-chev" size="sm" style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />
      </button>

      <div className="section-title">기록</div>
      <Row
        icon="i-book"
        label="저장된 기록"
        desc="고정해 둔 기록을 모아 봅니다"
        hint={`${pinned}개`}
        onClick={() => navigate('/my/saved')}
      />
      <Row icon="i-search" label="기록 검색" desc="사람·장소·내용으로 찾기" onClick={() => navigate('/search')} />
      <Row
        icon="i-tag"
        label="카테고리 관리"
        desc="지출 분류를 고치거나 새로 만들기"
        hint={`${categories}개`}
        onClick={() => navigate('/my/categories')}
      />
      <Row
        icon="i-bowl"
        label="확인 대기 식사"
        desc="먹었는지 아직 확인하지 않은 기록"
        hint={`${pending}건`}
        onClick={() => navigate('/')}
      />

      <div className="section-title">설정</div>
      <Row
        icon="i-ai"
        label="AI 설정"
        desc="빠른 기록의 자연어 분석"
        hint={ai == null ? '확인 중' : !settings.aiSuggestions ? '끔' : ai.configured ? '켬' : '키 없음'}
        onClick={() => navigate('/my/ai')}
      />
      <Row
        icon="i-bell"
        label="알림과 제안"
        desc="식사 확인 제안을 받을지"
        hint={settings.foodCheck ? '켬' : '끔'}
        onClick={() => navigate('/my/notifications')}
      />
      <Row
        icon="i-theme"
        label="테마"
        desc="화면 밝기와 시작 화면"
        hint={THEME_LABEL[settings.theme]}
        onClick={() => navigate('/my/theme')}
      />
      <Row
        icon="i-cloud"
        label="데이터 관리"
        desc="내보내기 · 가져오기 · 초기화"
        hint={`${records.length}개`}
        onClick={() => navigate('/my/data')}
      />
      <Row icon="i-help" label="도움말" desc="이 앱이 기록을 다루는 방식" onClick={() => navigate('/my/help')} />

      <div className="push" style={{ paddingTop: 24, paddingBottom: 8 }}>
        <button type="button" className="btn ghost" onClick={() => navigate('/exit')}>
          앱 종료
        </button>
        <div className="center-note">Memo Life 2.0 · 기록 {records.length}개</div>
      </div>

      {editing && (
        <ProfileSheet
          name={settings.profile.name}
          email={settings.profile.email}
          onClose={() => setEditing(false)}
          onSave={(profile) => {
            update({ profile })
            setEditing(false)
          }}
        />
      )}
    </main>
  )
}

function Row({
  icon,
  label,
  desc,
  hint,
  onClick,
}: {
  icon: IconName
  label: string
  desc?: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button type="button" className="setting" onClick={onClick}>
      <span style={{ color: 'var(--ink-2)', display: 'flex' }}>
        <Icon name={icon} size="sm" />
      </span>
      <div className="txt">
        <b>{label}</b>
        {desc && <span>{desc}</span>}
      </div>
      <div className="ctl">
        {hint}
        <Icon name="i-chev" size="sm" />
      </div>
    </button>
  )
}

function ProfileSheet({
  name,
  email,
  onClose,
  onSave,
}: {
  name: string
  email: string
  onClose: () => void
  onSave: (profile: { name: string; email: string }) => void
}) {
  const [n, setN] = useState(name)
  const [e, setE] = useState(email)

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="프로필 수정">
        <div className="handle" />
        <h4>프로필</h4>
        <p className="hint">이 기기에만 저장돼요. 계정 로그인은 없습니다.</p>
        <div className="form-row">
          <div className="k">이름</div>
          <input className="input" value={n} onChange={(ev) => setN(ev.target.value)} />
        </div>
        <div className="form-row">
          <div className="k">이메일</div>
          <input className="input" value={e} onChange={(ev) => setE(ev.target.value)} />
        </div>
        <button
          type="button"
          className="btn"
          style={{ marginTop: 16 }}
          disabled={!n.trim()}
          onClick={() => onSave({ name: n.trim(), email: e.trim() })}
        >
          저장하기
        </button>
        <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={onClose}>
          닫기
        </button>
      </div>
    </>
  )
}
