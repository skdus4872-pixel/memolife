import { Outlet, useLocation } from 'react-router-dom'
import { IconSprite } from './Icon'
import { TabBar } from './TabBar'
import { ToastProvider } from './Toast'
import { Splash, useSplash } from './Splash'

const TAB_ROUTES = ['/', '/calendar', '/insight', '/my']

export function Layout() {
  const { pathname } = useLocation()
  const showTab = TAB_ROUTES.includes(pathname)

  // 최초 실행이면 2초, 그 뒤로는 로딩되는 동안만.
  // /exit 에서는 종료 화면이 스플래시를 직접 그린다.
  const splash = useSplash(pathname !== '/exit')

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
