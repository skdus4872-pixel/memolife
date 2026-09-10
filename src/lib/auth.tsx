import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

/**
 * 로그인은 선택이다. 로그인하지 않아도 앱은 그대로 쓸 수 있고,
 * 기록은 이 기기에만 남는다. 로그인하면 같은 계정으로 어디서든 이어서 볼 수 있다.
 */

export interface AuthState {
  /** 로그인한 사용자. 로그인 전이면 null */
  user: User | null
  /** 첫 인증 상태 확인이 끝났는지 */
  ready: boolean
  signInWithGoogle(): Promise<void>
  signInWithEmail(email: string, password: string): Promise<void>
  signUpWithEmail(email: string, password: string, name?: string): Promise<void>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** Firebase 오류 코드를 사람이 읽을 수 있는 문장으로 */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return '이메일 주소 형식이 올바르지 않아요.'
    case 'auth/missing-password':
      return '비밀번호를 입력해주세요.'
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 해요.'
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일이에요. 로그인으로 들어가 주세요.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일이나 비밀번호가 맞지 않아요.'
    case 'auth/too-many-requests':
      return '시도가 너무 잦아요. 잠시 후 다시 해주세요.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '로그인 창이 닫혔어요. 다시 시도해 주세요.'
    case 'auth/popup-blocked':
      return '브라우저가 로그인 창을 막았어요. 팝업을 허용하고 다시 시도해 주세요.'
    case 'auth/unauthorized-domain':
      return '이 주소에서는 아직 로그인할 수 없어요. Firebase 콘솔의 승인된 도메인에 추가가 필요합니다.'
    case 'auth/operation-not-allowed':
      return '이 로그인 방식이 아직 켜져 있지 않아요. Firebase 콘솔에서 사용 설정이 필요합니다.'
    case 'auth/network-request-failed':
      return '네트워크에 연결하지 못했어요. 연결을 확인해 주세요.'
    default:
      return `로그인에 실패했어요. (${code || (error as Error)?.message || '알 수 없는 오류'})`
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      setReady(true)
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() })
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, ready, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }),
    [user, ready, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
