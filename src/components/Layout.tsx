import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { IconSprite } from './Icon'
import { TabBar } from './TabBar'
import { ToastProvider } from './Toast'
import { nowClock } from '../lib/date'

// 시트가 화면 전체를 덮는 /quick-record 에서는 탭을 함께 그리지 않는다
const TAB_ROUTES = ['/', '/calendar', '/insight', '/my']

export function Layout() {
  const { pathname } = useLocation()
  const showTab = TAB_ROUTES.includes(pathname)

  return (
    <div className="device-stage">
      <IconSprite />
      <div className="device">
        <ToastProvider>
          <StatusBar />
          <Outlet />
          {showTab && <TabBar />}
        </ToastProvider>
      </div>
    </div>
  )
}

function StatusBar() {
  const [clock, setClock] = useState(nowClock)

  useEffect(() => {
    const id = window.setInterval(() => setClock(nowClock()), 20000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="statusbar">
      <span className="num">{clock}</span>
      <span className="dots" aria-hidden="true">
        <i style={{ height: 7 }} />
        <i style={{ height: 10 }} />
        <i style={{ height: 13 }} />
        <i style={{ height: 6, opacity: 0.3 }} />
      </span>
    </div>
  )
}
