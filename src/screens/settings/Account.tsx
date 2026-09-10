import { useState } from 'react'
import { SubHeader } from '../../components/SubHeader'
import { AuthSheet } from '../../components/AuthSheet'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../lib/auth'
import { useCloud } from '../../lib/cloud'
import { useSettings } from '../../lib/settings'
import { useStore } from '../../lib/store'

const STATUS_LABEL = {
  off: '로그인 전',
  syncing: '맞추는 중…',
  synced: '최신 상태',
  error: '문제 발생',
} as const

export function Account() {
  const { user, signOut } = useAuth()
  const cloud = useCloud()
  const { settings, update } = useSettings()
  const { records } = useStore()
  const toast = useToast()

  const [sheet, setSheet] = useState(false)
  const [name, setName] = useState(settings.profile.name)

  const provider = user?.providerData?.[0]?.providerId
  const providerLabel =
    provider === 'google.com' ? 'Google 계정' : provider === 'password' ? '이메일 · 비밀번호' : '—'

  return (
    <main className="screen">
      <SubHeader title="계정" />

      {user ? (
        <>
          <div className="kv">
            <span className="k">이메일</span>
            <span className="v">{user.email ?? '—'}</span>
          </div>
          <div className="kv">
            <span className="k">로그인 방식</span>
            <span className="v">{providerLabel}</span>
          </div>
          <div className="kv">
            <span className="k">클라우드 상태</span>
            <span className="v">{STATUS_LABEL[cloud.status]}</span>
          </div>
          <div className="kv">
            <span className="k">보관 중인 기록</span>
            <span className="v num">{records.length}개</span>
          </div>
          {cloud.error && (
            <div className="src" style={{ marginTop: 12, background: 'var(--warn-bg)', color: 'var(--warn)' }}>
              {cloud.error}
            </div>
          )}

          <div className="section-title">이름</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button
              type="button"
              className="chip"
              disabled={!name.trim() || name.trim() === settings.profile.name}
              onClick={() => {
                update({ profile: { ...settings.profile, name: name.trim() } })
                toast('이름을 바꿨어요')
              }}
            >
              저장
            </button>
          </div>

          <div className="info-card">
            기록과 설정은 로그인한 계정에 함께 저장됩니다. 다른 기기에서 같은 계정으로 로그인하면 그대로 이어서 볼 수
            있어요. 로그아웃해도 이 기기의 기록은 남습니다.
          </div>

          <div className="push" style={{ paddingTop: 24, paddingBottom: 8 }}>
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                if (!window.confirm('로그아웃할까요? 이 기기의 기록은 그대로 남습니다.')) return
                await signOut()
                toast('로그아웃했어요')
              }}
            >
              로그아웃
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="empty" style={{ paddingBottom: 16 }}>
            <b>아직 로그인하지 않았어요</b>
            지금은 기록이 이 기기에만 저장됩니다.
          </div>

          <div className="info-card" style={{ marginTop: 0 }}>
            로그인하면 기록과 설정이 계정에 저장돼서, <b>다른 기기에서 같은 계정으로 열면 그대로 이어서</b> 볼 수
            있어요. 브라우저 데이터를 지워도 기록이 사라지지 않습니다.
          </div>

          <div className="kv" style={{ marginTop: 12 }}>
            <span className="k">이 기기에 있는 기록</span>
            <span className="v num">{records.length}개</span>
          </div>
          <p className="center-note" style={{ textAlign: 'left', marginTop: 8 }}>
            지금 로그인하면 이 기록들도 함께 계정으로 올라갑니다.
          </p>

          <div className="push" style={{ paddingTop: 24, paddingBottom: 8 }}>
            <button type="button" className="btn" onClick={() => setSheet(true)}>
              로그인 / 회원가입
            </button>
          </div>
        </>
      )}

      {sheet && <AuthSheet onClose={() => setSheet(false)} />}
    </main>
  )
}
