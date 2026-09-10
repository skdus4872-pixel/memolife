import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

const TABS = [
  { to: '/', label: 'Today', icon: 'i-today' },
  { to: '/calendar', label: 'Calendar', icon: 'i-cal' },
  { to: '/insight', label: 'Insight', icon: 'i-insight' },
  { to: '/my', label: 'My', icon: 'i-user' },
] as const

/**
 * 하단 내비게이션.
 * + 는 탭이 아니라 현재 화면 위에서 기록을 시작하는 공통 액션이다. — 기획서 08
 */
export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="tab">
      {TABS.slice(0, 2).map((t) => (
        <Tab key={t.to} {...t} />
      ))}

      <button
        type="button"
        className="nav-item"
        aria-label="기록 추가"
        onClick={() => navigate('/quick-record', { state: { from: location.pathname } })}
      >
        <span className="fab">
          <Icon name="i-plus" />
        </span>
      </button>

      {TABS.slice(2).map((t) => (
        <Tab key={t.to} {...t} />
      ))}
    </nav>
  )
}

function Tab({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' on' : ''}`}>
      <Icon name={icon as never} />
      {label}
    </NavLink>
  )
}
