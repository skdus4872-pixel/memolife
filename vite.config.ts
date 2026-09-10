import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { createAnalyzeMiddleware } from './server/http'

/**
 * /api/analyze 를 개발 서버(및 preview)에 붙인다.
 * OPENAI_API_KEY 는 여기(Node 쪽)에서만 읽히고 클라이언트 번들에는 들어가지 않는다.
 */
function analyzeApi(env: Record<string, string | undefined>): PluginOption {
  const middleware = createAnalyzeMiddleware(env)
  return {
    name: 'memolife-analyze-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  // 세 번째 인자를 ''로 두면 VITE_ 접두사 없는 변수까지 읽는다(서버 전용).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), analyzeApi(env)],
    server: { port: 5173, open: true },
  }
})
