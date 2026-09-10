import { useState } from 'react'
import { authErrorMessage, useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { useToast } from './Toast'

/**
 * 로그인 / 회원가입 시트.
 * 로그인은 선택이다 — 하지 않아도 앱은 그대로 쓸 수 있고, 기록은 이 기기에 남는다.
 */
export function AuthSheet({
  onClose,
  onLater,
}: {
  onClose: () => void
  /** "나중에 하기"를 제공할 때만 넘긴다 (최초 실행 안내) */
  onLater?: () => void
}) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const { update } = useSettings()
  const toast = useToast()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      toast(done)
      onClose()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    if (mode === 'signin') {
      void run(() => signInWithEmail(email, password), '로그인했어요')
    } else {
      void run(async () => {
        await signUpWithEmail(email, password, name)
        // 표시 이름 반영이 늦을 수 있어 여기서 한 번 더 확실히 맞춘다
        update({
          profile: { name: name.trim() || email.trim().split('@')[0], email: email.trim() },
        })
      }, '가입했어요')
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={busy ? undefined : onClose} />
      <div className="sheet" role="dialog" aria-label={mode === 'signin' ? '로그인' : '회원가입'}>
        <div className="handle" />
        <h4>기록을 클라우드에 보관할까요?</h4>
        <p className="hint">
          로그인하면 어느 기기에서든 같은 계정으로 기록을 이어서 볼 수 있어요. 지금 하지 않아도 앱은 그대로 쓸 수
          있고, 기록은 이 기기에 남습니다.
        </p>

        <button
          type="button"
          className="btn line"
          style={{ marginTop: 16 }}
          disabled={busy}
          onClick={() => void run(signInWithGoogle, '로그인했어요')}
        >
          Google 계정으로 계속하기
        </button>

        <div className="divider">
          <span>또는 이메일로</span>
        </div>

        {mode === 'signup' && (
          <div className="form-row">
            <div className="k">이름</div>
            <input
              className="input"
              value={name}
              placeholder="앱에서 부를 이름"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="form-row">
          <div className="k">이메일</div>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="k">비밀번호</div>
          <input
            className="input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            placeholder={mode === 'signup' ? '6자 이상' : ''}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && email.trim() && password) submit()
            }}
          />
        </div>

        {error && (
          <div className="src" style={{ marginTop: 12, background: 'var(--warn-bg)', color: 'var(--warn)' }}>
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn"
          style={{ marginTop: 16 }}
          disabled={busy || !email.trim() || !password}
          onClick={submit}
        >
          {busy ? '처리 중…' : mode === 'signin' ? '로그인' : '가입하고 시작하기'}
        </button>

        <div className="center-note">
          {mode === 'signin' ? (
            <>
              계정이 없으신가요?{' '}
              <button type="button" className="textlink" style={{ color: 'var(--brand)', fontWeight: 600 }} onClick={() => { setMode('signup'); setError(null) }}>
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button type="button" className="textlink" style={{ color: 'var(--brand)', fontWeight: 600 }} onClick={() => { setMode('signin'); setError(null) }}>
                로그인
              </button>
            </>
          )}
        </div>

        <button type="button" className="btn ghost" style={{ marginTop: 12 }} disabled={busy} onClick={onLater ?? onClose}>
          {onLater ? '나중에 하기' : '닫기'}
        </button>
        {onLater && <div className="center-note">나중에 My → 프로필에서 언제든 로그인할 수 있어요</div>}
      </div>
    </>
  )
}
