import { Outlet, useLocation } from 'react-router-dom'
import { IconSprite } from './Icon'
import { TabBar } from './TabBar'
import { ToastProvider } from './Toast'
import { Splash, useSplash } from './Splash'
import { useSettings } from '../lib/settings'

const TAB_ROUTES = ['/', '/calendar', '/insight', '/my']

export function Layout() {
  const { pathname } = useLocation()
  const { settings } = useSettings()
  const showTab = TAB_ROUTES.includes(pathname)

  // 앱을 열 때 2초. /exit 에서는 종료 화면이 스플래시를 직접 그린다.
  const splash = useSplash(settings.splash && pathname !== '/exit')

  return (
    <div className="device-stage">
      <IconSprite />
      <div className="device">
        <ToastProvider>
          <Outlet />
          {showTab && <TabBar />}
          {splash !== 'done' && <Splash leaving={splash === 'leaving'} />}
        </ToastProvider>
      </div>
    </div>
  )
}
