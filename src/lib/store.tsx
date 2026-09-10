import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { buildSeed } from './seed'
import { uid } from './format'
import type { LifeRecord, ModuleKey, Modules } from './types'

const STORAGE_KEY = 'memolife.records.v1'

type Action =
  | { type: 'upsert'; record: LifeRecord }
  | { type: 'remove'; id: string }
  | { type: 'reset' }

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
    case 'reset':
      return buildSeed()
  }
}

function load(): LifeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildSeed()
    const parsed = JSON.parse(raw) as LifeRecord[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildSeed()
  } catch {
    // 저장 데이터를 읽지 못해도 앱은 열려야 한다
    return buildSeed()
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
  resetToSeed(): void
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
      resetToSeed: () => dispatch({ type: 'reset' }),
    }
  }, [records, get, update])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): RecordStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
