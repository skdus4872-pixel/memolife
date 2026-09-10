import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { uid } from './format'
import type { LifeRecord, ModuleKey, Modules } from './types'

const STORAGE_KEY = 'memolife.records.v1'

type Action =
  | { type: 'upsert'; record: LifeRecord }
  | { type: 'remove'; id: string }
  | { type: 'replaceAll'; records: LifeRecord[] }

function reducer(state: LifeRecord[], action: Action): LifeRecord[] {
  switch (action.type) {
    case 'upsert': {
      const exists = state.some((r) => r.id === action.record.id)
      return exists
        ? state.map((r) => (r.id === action.record.id ? action.record : r))
        : [...state, action.record]
    }
    case 'remove':
      return state.filter((r) => r.id !== action.id)
    case 'replaceAll':
      return action.records
  }
}

/** 앱은 빈 상태로 시작한다. 사용자가 쓴 기록만 남는다. */
function load(): LifeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LifeRecord[]
    if (!Array.isArray(parsed)) return []
    // 예전 버전에서 깔려 있던 예시 기록은 걷어낸다. 사용자가 쓴 기록은 그대로 둔다.
    return parsed.filter((r) => !String(r?.id ?? '').startsWith('seed_'))
  } catch {
    // 저장 데이터를 읽지 못해도 앱은 열려야 한다
    return []
  }
}

export interface RecordStore {
  records: LifeRecord[]
  get(id: string): LifeRecord | undefined
  create(input: {
    title: string
    eventDate: string
    eventTime?: string
    modules: Modules
    source?: LifeRecord['source']
  }): LifeRecord
  /** Record 하나를 통째로 바꾼다. updatedAt은 여기서만 갱신한다. */
  update(id: string, patch: (record: LifeRecord) => LifeRecord): void
  updateModules(id: string, patch: (modules: Modules) => Modules): void
  removeModule(id: string, key: ModuleKey): void
  remove(id: string): void
  togglePin(id: string): void
  /** 가져오기 — 기록 전체를 교체한다 */
  replaceAll(records: LifeRecord[]): void
  /** 전체 삭제 */
  clear(): void
}

const StoreContext = createContext<RecordStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [records, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch {
      console.warn('기록을 저장하지 못했습니다.')
    }
  }, [records])

  const get = useCallback((id: string) => records.find((r) => r.id === id), [records])

  const update = useCallback(
    (id: string, patch: (record: LifeRecord) => LifeRecord) => {
      const current = records.find((r) => r.id === id)
      if (!current) return
      const next = patch(current)
      dispatch({ type: 'upsert', record: { ...next, updatedAt: new Date().toISOString() } })
    },
    [records],
  )

  const value = useMemo<RecordStore>(() => {
    const updateModules = (id: string, patch: (modules: Modules) => Modules) =>
      update(id, (r) => ({ ...r, modules: patch(r.modules) }))

    return {
      records,
      get,
      create: ({ title, eventDate, eventTime, modules, source = 'manual' }) => {
        const stamp = new Date().toISOString()
        const record: LifeRecord = {
          id: uid('rec'),
          title,
          eventDate,
          eventTime,
          createdAt: stamp,
          updatedAt: stamp,
          source,
          modules,
        }
        dispatch({ type: 'upsert', record })
        return record
      },
      update,
      updateModules,
      removeModule: (id, key) =>
        updateModules(id, (modules) => {
          const next = { ...modules }
          delete next[key]
          return next
        }),
      remove: (id) => dispatch({ type: 'remove', id }),
      togglePin: (id) => update(id, (r) => ({ ...r, pinned: !r.pinned })),
      replaceAll: (next) => dispatch({ type: 'replaceAll', records: next }),
      clear: () => dispatch({ type: 'replaceAll', records: [] }),
    }
  }, [records, get, update])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): RecordStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
