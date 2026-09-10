/**
 * 배포용 서버리스 함수 (Vercel 등). 개발 중에는 vite.config.ts 의 미들웨어가 같은 일을 한다.
 * 두 경로 모두 server/analyze.ts 의 runAnalysis 를 쓴다 — 키는 서버에만 있다.
 */
import { AnalyzeError, isConfigured, modelName, runAnalysis } from '../server/analyze'
import type { AnalyzeRequest } from '../src/lib/analysis'

interface Req {
  method?: string
  body?: unknown
}

interface Res {
  status(code: number): Res
  json(body: unknown): void
}

export default async function handler(req: Req, res: Res) {
  const env = process.env as Record<string, string | undefined>

  if (req.method === 'GET') {
    res.status(200).json({
      configured: isConfigured(env),
      model: isConfigured(env) ? modelName(env) : null,
    })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: '허용되지 않은 메서드입니다.', code: 'method' })
    return
  }

  try {
    const input = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as AnalyzeRequest
    const result = await runAnalysis(input, env)
    res.status(200).json(result)
  } catch (error) {
    if (error instanceof AnalyzeError) {
      res.status(error.status).json({ error: error.message, code: error.code })
      return
    }
    console.error('[analyze]', error)
    res.status(500).json({ error: '분석 중 문제가 생겼습니다.', code: 'unknown' })
  }
}
