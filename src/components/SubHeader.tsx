import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

/** 설정 하위 화면의 공통 헤더 */
export function SubHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="topbar">
      <button type="button" onClick={() => navigate(-1)} aria-label="뒤로">
        <Icon name="i-back" />
      </button>
      <span className="title">{title}</span>
      <span style={{ minWidth: 20, display: 'flex', justifyContent: 'flex-end' }}>{right}</span>
    </div>
  )
}

/** 켜기/끄기 한 줄 */
export function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string
  desc?: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button type="button" className="setting" onClick={() => onChange(!value)} aria-pressed={value}>
      <div className="txt">
        <b>{label}</b>
        {desc && <span>{desc}</span>}
      </div>
      <div className="ctl">
        <span className={`switch${value ? ' on' : ''}`} />
      </div>
    </button>
  )
}
