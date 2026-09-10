import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { IconSprite } from './Icon'
import { TabBar } from './TabBar'
import { ToastProvider } from './Toast'
import { Splash, useSplash } from './Splash'
import { AuthSheet } from './AuthSheet'
import { useAuth } from '../lib/auth'

const TAB_ROUTES = ['/', '/calendar', '/insight', '/my']
/** 로그인 안내는 기기당 한 번만 띄운다 */
const AUTH_PROMPT_KEY = 'memolife.authPrompt.v1'

export function Layout() {
  const { pathname } = useLocation()
  const { user, ready } = useAuth()
  const showTab = TAB_ROUTES.includes(pathname)

  // 최초 실행이면 2초, 그 뒤로는 로딩되는 동안만.
  // /exit 에서는 종료 화면이 스플래시를 직접 그린다.
  const splash = useSplash(pathname !== '/exit')
  const [askAuth, setAskAuth] = useState(false)

  useEffect(() => {
    if (!ready || user || splash !== 'done' || pathname === '/exit') return
    try {
      if (localStorage.getItem(AUTH_PROMPT_KEY)) return
      // 띄우는 순간 기록해 둔다 — 어떻게 닫든 다시 뜨지 않게
      localStorage.setItem(AUTH_PROMPT_KEY, new Date().toISOString())
    } catch {
      return
    }
    setAskAuth(true)
  }, [ready, user, splash, pathname])

  return (
    <div className="device-stage">
      <IconSprite />
      <div className="device">
        <ToastProvider>
          <Outlet />
          {showTab && <TabBar />}
          {askAuth && <AuthSheet onClose={() => setAskAuth(false)} onLater={() => setAskAuth(false)} />}
          {splash !== 'done' && <Splash leaving={splash === 'leaving'} />}
        </ToastProvider>
      </div>
    </div>
  )
}
