import { SubHeader, ToggleRow } from '../../components/SubHeader'
import { useSettings, type ThemeChoice } from '../../lib/settings'

const CHOICES: { value: ThemeChoice; label: string; desc: string }[] = [
  { value: 'light', label: '라이트', desc: '항상 밝게' },
  { value: 'dark', label: '다크', desc: '항상 어둡게' },
  { value: 'system', label: '시스템', desc: '기기 설정을 따라감' },
]

export function ThemeSettings() {
  const { settings, update, resolvedTheme } = useSettings()

  return (
    <main className="screen">
      <SubHeader title="테마" />

      <div className="seg" style={{ marginTop: 8 }}>
        {CHOICES.map((c) => (
          <button
            type="button"
            key={c.value}
            className={settings.theme === c.value ? 'on' : ''}
            onClick={() => update({ theme: c.value })}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="center-note">
        {CHOICES.find((c) => c.value === settings.theme)?.desc} · 지금은 {resolvedTheme === 'dark' ? '다크' : '라이트'}로
        보고 있어요
      </p>

      <div className="section-title">시작 화면</div>
      <ToggleRow
        label="앱을 열 때 로고 화면 보여주기"
        desc="2초 동안 보이고 사라집니다"
        value={settings.splash}
        onChange={(v) => update({ splash: v })}
      />

      <div className="info-card">
        색은 정보의 종류를 나타내지 않습니다. 일정·지출·음식은 아이콘과 레이블로 구분하기 때문에 어느 테마에서도
        읽는 방식이 같아요.
      </div>
    </main>
  )
}
