import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * 앱 설정. My 화면에서 바꾸는 값이 실제 동작에 반영된다.
 * 기록 데이터(store)와는 별도로 저장한다.
 */

export type ThemeChoice = 'light' | 'dark' | 'system'

export interface Settings {
  profile: { name: string; email: string }
  theme: ThemeChoice
  /** 빠른 기록에서 AI 분석을 쓸지 */
  aiSuggestions: boolean
  /** 일정이 끝난 식사에 확인 제안을 띄울지 */
  foodCheck: boolean
  /** 앱을 열 때 스플래시를 보여줄지 */
  splash: boolean
  /** 아직 쓴 기록은 없지만 사용자가 미리 만들어 둔 지출 카테고리 */
  customCategories: string[]
}

const DEFAULTS: Settings = {
  profile: { name: '나연', email: 'nayeon@example.com' },
  theme: 'system',
  aiSuggestions: true,
  foodCheck: true,
  splash: true,
  customCategories: [],
}

const STORAGE_KEY = 'memolife.settings.v1'

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...DEFAULTS,
      ...parsed,
      profile: { ...DEFAULTS.profile, ...parsed.profile },
    }
  } catch {
    return DEFAULTS
  }
}

interface SettingsStore {
  settings: Settings
  update(patch: Partial<Settings>): void
  reset(): void
  /** system 을 실제 화면에 적용한 결과 */
  resolvedTheme: 'light' | 'dark'
}

const SettingsContext = createContext<SettingsStore | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      console.warn('설정을 저장하지 못했습니다.')
    }
  }, [settings])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const value = useMemo<SettingsStore>(
    () => ({
      settings,
      resolvedTheme,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings(DEFAULTS),
    }),
    [settings, resolvedTheme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsStore {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('SettingsProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
