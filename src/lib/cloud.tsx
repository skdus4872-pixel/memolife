import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { get, onValue, ref, set } from 'firebase/database'
import { db } from './firebase'
import { useAuth } from './auth'
import { useStore } from './store'
import { useSettings, type Settings } from './settings'
import type { LifeRecord } from './types'

/**
 * 클라우드 동기화.
 *
 * 로그인하면 이 계정의 기록과 설정을 Realtime Database 에 올리고, 바뀔 때마다 맞춘다.
 * 로그인하지 않으면 아무것도 올라가지 않고 이 기기에만 남는다.
 *
 * 규칙
 *  - 로그인 순간에는 기기에 있던 기록과 클라우드 기록을 합친다(같은 id 는 updatedAt 이 최신인 쪽).
 *  - 그 뒤에는 클라우드가 기준이다. 기기에서 바뀌면 올리고, 다른 기기에서 바뀌면 내려받는다.
 *  - 삭제도 그대로 반영되도록 목록 전체를 쓴다.
 */

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

interface CloudState {
  status: SyncStatus
  lastSyncedAt: number | null
  error: string | null
}

const CloudContext = createContext<CloudState>({ status: 'off', lastSyncedAt: null, error: null })

interface CloudPayload {
  records: Record<string, LifeRecord> | null
  settings: Partial<Settings> | null
  updatedAt: number | null
}

const userPath = (uid: string) => `users/${uid}`

function toMap(records: LifeRecord[]): Record<string, LifeRecord> {
  const out: Record<string, LifeRecord> = {}
  for (const r of records) out[r.id] = r
  return out
}

function toList(map: Record<string, LifeRecord> | null | undefined): LifeRecord[] {
  if (!map) return []
  return Object.values(map).filter((r) => r && typeof r.id === 'string')
}

/** 같은 id 는 updatedAt 이 최신인 쪽을 남긴다 */
export function mergeRecords(local: LifeRecord[], remote: LifeRecord[]): LifeRecord[] {
  const byId = new Map<string, LifeRecord>()
  for (const r of remote) byId.set(r.id, r)
  for (const r of local) {
    const other = byId.get(r.id)
    if (!other || (r.updatedAt ?? '') > (other.updatedAt ?? '')) byId.set(r.id, r)
  }
  return [...byId.values()].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
}

export function CloudSync({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const store = useStore()
  const settingsStore = useSettings()

  const [state, setState] = useState<CloudState>({ status: 'off', lastSyncedAt: null, error: null })

  // 최신 값을 effect 안에서 읽기 위한 참조 (effect 를 매 렌더 다시 걸지 않으려고)
  const recordsRef = useRef(store.records)
  recordsRef.current = store.records
  const settingsRef = useRef(settingsStore.settings)
  settingsRef.current = settingsStore.settings

  const applyingRemote = useRef(false)
  const lastPushed = useRef<string>('')
  const uid = user?.uid ?? null

  // 프로필은 언제나 로그인한 계정을 따른다. 로그아웃하면 비운다.
  useEffect(() => {
    const current = settingsRef.current.profile
    if (!user) {
      if (current.name || current.email) settingsStore.update({ profile: { name: '', email: '' } })
      return
    }
    const email = user.email ?? ''
    const name = user.displayName?.trim() || current.name.trim() || email.split('@')[0] || '나'
    if (current.email !== email || current.name !== name) {
      settingsStore.update({ profile: { name, email } })
    }
    // settingsStore 는 매 렌더 새 객체라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, user?.displayName, user?.email])

  // 로그인 / 로그아웃
  useEffect(() => {
    if (!uid) {
      setState({ status: 'off', lastSyncedAt: null, error: null })
      lastPushed.current = ''
      return
    }

    let cancelled = false
    let unsubscribe = () => {}

    /** 계정 기준 프로필. 이름은 계정 표시 이름 → 저장된 이름 → 이메일 앞부분 순으로 고른다. */
    const accountProfile = (savedName?: string) => {
      const email = user?.email ?? ''
      return {
        name: user?.displayName?.trim() || savedName?.trim() || email.split('@')[0] || '나',
        email,
      }
    }

    const run = async () => {
      setState((s) => ({ ...s, status: 'syncing', error: null }))
      try {
        const snapshot = await get(ref(db, userPath(uid)))
        if (cancelled) return
        const cloud = (snapshot.val() ?? {}) as CloudPayload

        const merged = mergeRecords(recordsRef.current, toList(cloud.records))
        const settings: Settings = { ...settingsRef.current, ...(cloud.settings ?? {}) }
        // 프로필은 계정 정보로 덮어쓴다 (예전에 올라간 값이 남아 있어도 계정 기준으로 맞춘다)
        settings.profile = accountProfile(cloud.settings?.profile?.name)

        applyingRemote.current = true
        store.replaceAll(merged)
        settingsStore.replaceAll(settings)
        // 다음 렌더까지 로컬 변경 감지를 막아 되돌아 올라가는 일을 없앤다
        window.setTimeout(() => {
          applyingRemote.current = false
        }, 0)

        const payload = { records: toMap(merged), settings, updatedAt: Date.now() }
        lastPushed.current = JSON.stringify({ records: payload.records, settings })
        await set(ref(db, userPath(uid)), payload)
        if (cancelled) return
        setState({ status: 'synced', lastSyncedAt: Date.now(), error: null })

        // 다른 기기의 변경 받기
        unsubscribe = onValue(
          ref(db, userPath(uid)),
          (snap) => {
            const value = (snap.val() ?? {}) as CloudPayload
            const incoming = JSON.stringify({
              records: value.records ?? {},
              settings: value.settings ?? {},
            })
            if (incoming === lastPushed.current) return // 내가 올린 것이 돌아온 경우

            applyingRemote.current = true
            lastPushed.current = incoming
            store.replaceAll(toList(value.records))
            if (value.settings) {
              settingsStore.replaceAll({
                ...settingsRef.current,
                ...value.settings,
                profile: accountProfile(value.settings.profile?.name),
              })
            }
            window.setTimeout(() => {
              applyingRemote.current = false
            }, 0)
            setState({ status: 'synced', lastSyncedAt: Date.now(), error: null })
          },
          (error) => setState({ status: 'error', lastSyncedAt: null, error: error.message }),
        )
      } catch (error) {
        if (cancelled) return
        setState({
          status: 'error',
          lastSyncedAt: null,
          error: (error as Error)?.message ?? '동기화에 실패했어요',
        })
      }
    }

    void run()
    return () => {
      cancelled = true
      unsubscribe()
    }
    // store/settingsStore 는 매 렌더 새 객체라 의존성에 넣지 않는다 (위의 ref 로 최신 값을 읽는다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // 기기에서 바뀌면 올리기 (연달아 바뀌면 마지막 것만)
  useEffect(() => {
    if (!uid || applyingRemote.current) return
    const payloadKey = JSON.stringify({
      records: toMap(store.records),
      settings: settingsStore.settings,
    })
    if (payloadKey === lastPushed.current) return

    const timer = window.setTimeout(async () => {
      try {
        setState((s) => (s.status === 'synced' ? { ...s, status: 'syncing' } : s))
        lastPushed.current = payloadKey
        await set(ref(db, userPath(uid)), {
          records: toMap(store.records),
          settings: settingsStore.settings,
          updatedAt: Date.now(),
        })
        setState({ status: 'synced', lastSyncedAt: Date.now(), error: null })
      } catch (error) {
        setState({
          status: 'error',
          lastSyncedAt: null,
          error: (error as Error)?.message ?? '저장에 실패했어요',
        })
      }
    }, 600)

    return () => window.clearTimeout(timer)
  }, [uid, store.records, settingsStore.settings])

  const value = useMemo(() => state, [state])
  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
}

export function useCloud(): CloudState {
  return useContext(CloudContext)
}
