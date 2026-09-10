import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Splash } from '../components/Splash'

/**
 * 앱 종료. 나갈 때도 같은 스플래시를 보여준다.
 * 2초 뒤 창을 닫아보고, 브라우저가 막으면 안내를 남긴다.
 * (스크립트로 연 창이 아니면 window.close() 는 대부분 무시된다.)
 */
export function Exit() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.close()
      setDone(true)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main className="screen flush" style={{ padding: 0, overflow: 'hidden' }}>
      <Splash>
        {done && (
          <>
            오늘 기록은 저장해 뒀어요. 이제 창을 닫으셔도 됩니다.
            <br />
            <button type="button" onClick={() => navigate('/', { replace: true })}>
              다시 열기
            </button>
          </>
        )}
      </Splash>
    </main>
  )
}
