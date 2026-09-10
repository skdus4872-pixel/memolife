export type IconName =
  | 'i-cal'
  | 'i-bowl'
  | 'i-note'
  | 'i-run'
  | 'i-money'
  | 'i-people'
  | 'i-pin'
  | 'i-search'
  | 'i-plus'
  | 'i-chev'
  | 'i-chev-left'
  | 'i-back'
  | 'i-more'
  | 'i-check'
  | 'i-today'
  | 'i-insight'
  | 'i-user'
  | 'i-mic'
  | 'i-img'
  | 'i-bell'
  | 'i-tag'
  | 'i-cloud'
  | 'i-ai'
  | 'i-theme'
  | 'i-help'
  | 'i-book'
  | 'i-clock'
  | 'i-trash'
  | 'i-pinned'
  | 'i-x'

export function Icon({
  name,
  size = 'md',
  style,
}: {
  name: IconName
  size?: 'md' | 'sm' | 'xs'
  style?: React.CSSProperties
}) {
  const cls = size === 'md' ? 'ic' : `ic ${size}`
  return (
    <svg className={cls} style={style} aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  )
}

/** 앱에 한 번만 그려두는 아이콘 스프라이트 */
export function IconSprite() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <symbol id="i-cal" viewBox="0 0 24 24">
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
      </symbol>
      <symbol id="i-bowl" viewBox="0 0 24 24">
        <path d="M3 11h18a9 9 0 0 1-18 0Z" />
        <path d="M12 11c0-2.5-2.5-2.8-2.5-4.6C9.5 4.9 10.6 4 12 4" />
      </symbol>
      <symbol id="i-note" viewBox="0 0 24 24">
        <path d="M4 20.5 4.6 16 15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8 19.4Z" />
        <path d="M14 7l3 3" />
      </symbol>
      <symbol id="i-run" viewBox="0 0 24 24">
        <path d="M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path d="M7 21l3-6 3.5-2-1-5-3.5 2L7 12" />
        <path d="m12.5 8 3 2 3-.5" />
        <path d="m13 13 2.5 3 .5 5" />
      </symbol>
      <symbol id="i-money" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M3 10.5h18" />
      </symbol>
      <symbol id="i-people" viewBox="0 0 24 24">
        <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z" />
        <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.8c2 .6 3.2 2.3 3.2 4.7" />
      </symbol>
      <symbol id="i-pin" viewBox="0 0 24 24">
        <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z" />
        <circle cx="12" cy="10" r="2.4" />
      </symbol>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeWidth="2" />
      </symbol>
      <symbol id="i-chev" viewBox="0 0 24 24">
        <path d="m9 5 7 7-7 7" />
      </symbol>
      <symbol id="i-chev-left" viewBox="0 0 24 24">
        <path d="m15 5-7 7 7 7" />
      </symbol>
      <symbol id="i-back" viewBox="0 0 24 24">
        <path d="m15 5-7 7 7 7" />
      </symbol>
      <symbol id="i-more" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <path d="m5 12.5 4.5 4.5L19 7" strokeWidth="2.6" />
      </symbol>
      <symbol id="i-today" viewBox="0 0 24 24">
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M8 3v4M16 3v4" />
        <circle cx="12" cy="14" r="2.2" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="i-insight" viewBox="0 0 24 24">
        <path d="M5 20V12M12 20V5M19 20v-5" />
      </symbol>
      <symbol id="i-user" viewBox="0 0 24 24">
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M4.5 20c0-3.6 3.4-5.8 7.5-5.8s7.5 2.2 7.5 5.8" />
      </symbol>
      <symbol id="i-mic" viewBox="0 0 24 24">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
      </symbol>
      <symbol id="i-img" viewBox="0 0 24 24">
        <rect x="3.5" y="5" width="17" height="14" rx="3" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m5 17 4.5-4 4 3.2L17 13l2.5 2.4" />
      </symbol>
      <symbol id="i-bell" viewBox="0 0 24 24">
        <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </symbol>
      <symbol id="i-tag" viewBox="0 0 24 24">
        <path d="M4 11V5a1 1 0 0 1 1-1h6l8.5 8.5a1.5 1.5 0 0 1 0 2.1l-5.9 5.9a1.5 1.5 0 0 1-2.1 0L4 11Z" />
        <circle cx="8.5" cy="8.5" r="1.3" />
      </symbol>
      <symbol id="i-cloud" viewBox="0 0 24 24">
        <path d="M7 18.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.4 11a3.8 3.8 0 0 1-.4 7.5Z" />
        <path d="M12 12v5m0 0-2-2m2 2 2-2" />
      </symbol>
      <symbol id="i-ai" viewBox="0 0 24 24">
        <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.8L12 18l-1.7-5.5L5 10.7 10.3 9Z" />
        <path d="M18.5 16.5 19.2 19l2.3.8-2.3.7-.7 2.2" />
      </symbol>
      <symbol id="i-theme" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v17" />
        <path d="M12 20.5a8.5 8.5 0 0 0 0-17" fill="currentColor" stroke="none" opacity=".25" />
      </symbol>
      <symbol id="i-help" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.7 9.6A2.4 2.4 0 0 1 14.4 10c0 1.6-2.4 1.9-2.4 3.4" />
        <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="i-book" viewBox="0 0 24 24">
        <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 1.8" />
      </symbol>
      <symbol id="i-trash" viewBox="0 0 24 24">
        <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
        <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      </symbol>
      <symbol id="i-pinned" viewBox="0 0 24 24">
        <path d="M9 3.5h6l-.8 5.2 3.3 3.1H6.5l3.3-3.1Z" />
        <path d="M12 11.8V20.5" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <path d="m6 6 12 12M18 6 6 18" />
      </symbol>
    </svg>
  )
}
