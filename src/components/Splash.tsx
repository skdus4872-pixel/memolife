import { useEffect, useState, type ReactNode } from 'react'

/**
 * 00 스플래시. 목업 이미지를 그대로 쓴다.
 * 앱을 열 때 2초 동안 보이고, 앱을 닫을 때도 같은 화면을 보여준다.
 */
export function Splash({ leaving = false, children }: { leaving?: boolean; children?: ReactNode }) {
  return (
    <div className={`splash${leaving ? ' leaving' : ''}`} role="img" aria-label="Memo Life">
      <img src="/splash.png" alt="" />
      {children && <div className="note">{children}</div>}
    </div>
  )
}

/**
 * 시작 스플래시의 상태. duration 동안 보여주고, 사라지는 애니메이션 뒤에 언마운트한다.
 * 반환값: 'showing' | 'leaving' | 'done'
 */
export function useSplash(enabled: boolean, duration = 2000) {
  const [phase, setPhase] = useState<'showing' | 'leaving' | 'done'>(enabled ? 'showing' : 'done')

  useEffect(() => {
    if (!enabled) return
    const toLeaving = window.setTimeout(() => setPhase('leaving'), duration)
    const toDone = window.setTimeout(() => setPhase('done'), duration + 450)
    return () => {
      window.clearTimeout(toLeaving)
      window.clearTimeout(toDone)
    }
  }, [enabled, duration])

  return phase
}
