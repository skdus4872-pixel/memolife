import { useEffect, useState, type ReactNode } from 'react'

const FIRST_LAUNCH_KEY = 'memolife.launched.v1'
/** 앱을 처음 여는 순간에만 보여주는 시간 */
const FIRST_LAUNCH_MS = 2000
/** 그 뒤에는 화면이 준비될 때까지만. 깜빡임처럼 보이지 않을 최소 시간. */
const LOADING_MS = 400

/**
 * 00 스플래시. 목업 이미지를 그대로 쓴다.
 * 앱을 닫을 때(/exit)도 같은 화면을 보여준다.
 */
export function Splash({ leaving = false, children }: { leaving?: boolean; children?: ReactNode }) {
  return (
    <div className={`splash${leaving ? ' leaving' : ''}`} role="img" aria-label="Memo Life">
      <img src="/splash.png" alt="" />
      {children && <div className="note">{children}</div>}
    </div>
  )
}

function isFirstLaunch(): boolean {
  try {
    if (localStorage.getItem(FIRST_LAUNCH_KEY)) return false
    localStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString())
    return true
  } catch {
    // 저장을 못 하는 환경이면 로딩용 짧은 표시로 취급한다
    return false
  }
}

/**
 * 최초 실행이면 2초, 그 뒤로는 화면이 준비될 때까지만 보여준다.
 * 반환값: 'showing' | 'leaving' | 'done'
 */
export function useSplash(enabled: boolean) {
  const [first] = useState(() => (enabled ? isFirstLaunch() : false))
  const [phase, setPhase] = useState<'showing' | 'leaving' | 'done'>(enabled ? 'showing' : 'done')

  useEffect(() => {
    if (!enabled) return
    const duration = first ? FIRST_LAUNCH_MS : LOADING_MS
    const toLeaving = window.setTimeout(() => setPhase('leaving'), duration)
    const toDone = window.setTimeout(() => setPhase('done'), duration + 450)
    return () => {
      window.clearTimeout(toLeaving)
      window.clearTimeout(toDone)
    }
  }, [enabled, first])

  return phase
}
