import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { SubHeader } from '../../components/SubHeader'
import { useToast } from '../../components/Toast'
import { useStore } from '../../lib/store'
import { useSettings } from '../../lib/settings'
import { categoryUsage } from '../../lib/derive'
import { won } from '../../lib/format'

/**
 * 지출 카테고리 관리.
 * 이름을 바꾸면 그 카테고리를 쓰던 모든 거래가 함께 바뀐다 — 화면별 사본을 만들지 않는다.
 */
export function Categories() {
  const store = useStore()
  const { settings, update } = useSettings()
  const toast = useToast()

  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const usage = useMemo(() => categoryUsage(store.records), [store.records])
  const used = new Set(usage.map((u) => u.name))
  const unused = settings.customCategories.filter((c) => !used.has(c))

  const renameEverywhere = (from: string, to: string) => {
    for (const record of store.records) {
      const txs = record.modules.money?.transactions
      if (!txs?.some((t) => t.category === from)) continue
      store.updateModules(record.id, (m) => ({
        ...m,
        money: {
          transactions: (m.money?.transactions ?? []).map((t) =>
            t.category === from ? { ...t, category: to } : t,
          ),
        },
      }))
    }
    update({
      customCategories: settings.customCategories.map((c) => (c === from ? to : c)),
    })
  }

  const removeCategory = (name: string, count: number) => {
    const ok = window.confirm(
      count > 0
        ? `"${name}" 을 지우면 거래 ${count}건의 분류가 "기타" 로 바뀝니다. 기록 자체는 지워지지 않아요.`
        : `"${name}" 을 목록에서 지울까요?`,
    )
    if (!ok) return
    if (count > 0) renameEverywhere(name, '기타')
    else update({ customCategories: settings.customCategories.filter((c) => c !== name) })
    toast('카테고리를 정리했어요')
  }

  const rows = [
    ...usage.map((u) => ({ ...u, unused: false })),
    ...unused.map((name) => ({ name, count: 0, total: 0, unused: true })),
  ]

  return (
    <main className="screen">
      <SubHeader title="카테고리 관리" />

      <p className="h-sub" style={{ margin: '4px 0 12px' }}>
        AI가 지출을 분류할 때 이 목록을 먼저 봅니다. 맞는 게 없을 때만 새 이름을 제안해요.
      </p>

      {rows.length === 0 ? (
        <div className="empty">
          <b>아직 카테고리가 없어요</b>
          지출을 기록하면 자동으로 쌓이고, 여기서 직접 만들 수도 있어요.
        </div>
      ) : (
        rows.map((row) => (
          <div className="setting" key={row.name}>
            <span style={{ color: 'var(--ink-2)', display: 'flex' }}>
              <Icon name="i-tag" size="sm" />
            </span>
            <div className="txt">
              <b>{row.name}</b>
              <span>
                {row.unused ? '아직 쓰지 않음' : `거래 ${row.count}건 · 확정 ${won(row.total)}`}
              </span>
            </div>
            <div className="ctl">
              <button
                type="button"
                className="textlink"
                style={{ color: 'var(--brand)', fontWeight: 600 }}
                onClick={() => {
                  setEditing(row.name)
                  setDraft(row.name)
                }}
              >
                이름 변경
              </button>
              <button type="button" aria-label={`${row.name} 삭제`} onClick={() => removeCategory(row.name, row.count)}>
                <Icon name="i-trash" size="sm" />
              </button>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        className="add-row"
        style={{ marginTop: 16 }}
        onClick={() => {
          setAdding(true)
          setDraft('')
        }}
      >
        + 카테고리 만들기
      </button>

      {(editing || adding) && (
        <>
          <div className="sheet-backdrop" onClick={() => (setEditing(null), setAdding(false))} />
          <div className="sheet" role="dialog" aria-label={editing ? '카테고리 이름 변경' : '카테고리 만들기'}>
            <div className="handle" />
            <h4>{editing ? '이름 변경' : '새 카테고리'}</h4>
            {editing && <p className="hint">이 이름을 쓰던 거래가 모두 함께 바뀝니다.</p>}
            <div className="form-row">
              <input
                className="input"
                autoFocus
                value={draft}
                placeholder="예) 교통, 취미"
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              disabled={!draft.trim() || (adding && rows.some((r) => r.name === draft.trim()))}
              onClick={() => {
                const name = draft.trim()
                if (editing) {
                  renameEverywhere(editing, name)
                  toast('이름을 바꿨어요')
                } else {
                  update({ customCategories: [...settings.customCategories, name] })
                  toast('카테고리를 만들었어요')
                }
                setEditing(null)
                setAdding(false)
              }}
            >
              {editing ? '바꾸기' : '만들기'}
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={() => (setEditing(null), setAdding(false))}
            >
              닫기
            </button>
          </div>
        </>
      )}
    </main>
  )
}
