import { useRef, useState } from 'react'
import { SubHeader } from '../../components/SubHeader'
import { useToast } from '../../components/Toast'
import { useStore } from '../../lib/store'
import { useSettings } from '../../lib/settings'
import type { LifeRecord } from '../../lib/types'

function looksLikeRecord(value: unknown): value is LifeRecord {
  if (!value || typeof value !== 'object') return false
  const r = value as Partial<LifeRecord>
  return typeof r.id === 'string' && typeof r.title === 'string' && typeof r.eventDate === 'string'
}

function storageSize(): string {
  try {
    const bytes = new Blob([localStorage.getItem('memolife.records.v1') ?? '']).size
    return bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
  } catch {
    return '알 수 없음'
  }
}

export function DataManage() {
  const store = useStore()
  const settings = useSettings()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.records, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memolife-records-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('기록을 파일로 내보냈어요')
  }

  const importJson = async (file: File) => {
    setBusy(true)
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed) || !parsed.every(looksLikeRecord)) {
        toast('이 파일에서는 기록을 찾지 못했어요')
        return
      }
      const ok = window.confirm(
        `기록 ${parsed.length}개를 가져옵니다. 지금 저장된 ${store.records.length}개는 사라져요. 계속할까요?`,
      )
      if (!ok) return
      store.replaceAll(parsed as LifeRecord[])
      toast(`기록 ${parsed.length}개를 가져왔어요`)
    } catch {
      toast('파일을 읽지 못했어요')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <main className="screen">
      <SubHeader title="데이터 관리" />

      <div className="kv">
        <span className="k">저장된 기록</span>
        <span className="v num">{store.records.length}개</span>
      </div>
      <div className="kv">
        <span className="k">차지하는 공간</span>
        <span className="v num">{storageSize()}</span>
      </div>
      <div className="kv">
        <span className="k">저장 위치</span>
        <span className="v">이 브라우저</span>
      </div>

      <div className="info-card">
        기록은 서버가 아니라 <b>이 기기의 브라우저</b>에 저장됩니다. 브라우저 데이터를 지우면 함께 사라지니,
        중요한 기록은 내보내기로 백업해 두세요.
      </div>

      <div className="section-title">백업</div>
      <button type="button" className="btn line" onClick={exportJson} disabled={store.records.length === 0}>
        JSON 으로 내보내기
      </button>
      <button
        type="button"
        className="btn line"
        style={{ marginTop: 8 }}
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? '가져오는 중…' : 'JSON 에서 가져오기'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importJson(file)
        }}
      />

      <div className="section-title">초기화</div>
      <button
        type="button"
        className="btn danger"
        disabled={store.records.length === 0}
        onClick={() => {
          if (!window.confirm(`기록 ${store.records.length}개를 모두 지웁니다. 되돌릴 수 없어요.`)) return
          store.clear()
          toast('기록을 모두 지웠어요')
        }}
      >
        기록 전체 삭제
      </button>
      <button
        type="button"
        className="btn danger"
        style={{ marginTop: 8 }}
        onClick={() => {
          if (!window.confirm('프로필·테마·AI 설정을 처음 상태로 되돌릴까요? 기록은 그대로 남습니다.')) return
          settings.reset()
          toast('설정을 되돌렸어요')
        }}
      >
        설정만 초기화
      </button>

      <div className="center-note" style={{ paddingBottom: 8 }}>
        내보낸 파일은 그대로 다시 가져올 수 있어요
      </div>
    </main>
  )
}
