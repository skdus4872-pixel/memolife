import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { useStore } from '../lib/store'
import { useSettings, type ThemeChoice } from '../lib/settings'
import { useAuth } from '../lib/auth'
import { useCloud } from '../lib/cloud'
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
  const { settings } = useSettings()
  const { user } = useAuth()
  const cloud = useCloud()
  const navigate = useNavigate()
  const [ai, setAi] = useState<AiStatus | null>(null)

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
      <button type="button" className="prof" onClick={() => navigate('/my/account')}>
        <div className="avt" />
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div className="n">{user ? (user.displayName ?? settings.profile.name) : settings.profile.name}</div>
          <div className="e">
            {user ? user.email : '클라우드 저장을 위해 로그인을 권해요'}
          </div>
        </div>
        <Icon name="i-chev" size="sm" style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />
      </button>

      {!user && (
        <button
          type="button"
          className="btn line"
          style={{ marginBottom: 4 }}
          onClick={() => navigate('/my/account')}
        >
          로그인하고 어디서든 이어보기
        </button>
      )}

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
        icon="i-cloud"
        label="계정과 클라우드"
        desc={user ? '로그인한 계정에 기록이 저장됩니다' : '로그인하면 어느 기기에서든 이어서 볼 수 있어요'}
        hint={
          user
            ? cloud.status === 'synced'
              ? '최신 상태'
              : cloud.status === 'syncing'
                ? '맞추는 중'
                : cloud.status === 'error'
                  ? '문제 발생'
                  : '연결됨'
            : '로그인 안 함'
        }
        onClick={() => navigate('/my/account')}
      />
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
        desc="화면 밝기"
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
