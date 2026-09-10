import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

/**
 * Firebase 설정.
 *
 * 이 값들은 비밀이 아니다 — 웹 앱에서는 어차피 브라우저 번들에 실려 나간다.
 * 실제 보호는 Firebase 콘솔의 보안 규칙이 한다. (README의 "클라우드 저장" 참고)
 * 서버에서만 써야 하는 키(OpenAI 등)와는 성격이 다르다.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyBXeCvQE_iTejvUjAAt1M4M1egkmVVp83M',
  authDomain: 'memo-life-d30e0.firebaseapp.com',
  databaseURL: 'https://memo-life-d30e0-default-rtdb.firebaseio.com',
  projectId: 'memo-life-d30e0',
  storageBucket: 'memo-life-d30e0.firebasestorage.app',
  messagingSenderId: '929313659428',
  appId: '1:929313659428:web:9e2ca63500d890c7b696b1',
  measurementId: 'G-HD4PKLG0MP',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getDatabase(firebaseApp)
