import type { IncomingMessage, ServerResponse } from 'node:http'
import { AnalyzeError, isConfigured, modelName, runAnalysis } from './analyze'
import type { AnalyzeRequest } from '../src/lib/analysis'

const MAX_BODY = 20_000

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(json)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > MAX_BODY) {
        reject(new AnalyzeError('기록이 너무 깁니다.', 413, 'too_large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * /api/analyze
 *   GET  → { configured, model }  (키가 꽂혀 있는지 확인용)
 *   POST → 분석 결과
 */
export function createAnalyzeMiddleware(env: Record<string, string | undefined>) {
  return async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/analyze')) return next()

    if (req.method === 'GET') {
      return send(res, 200, {
        configured: isConfigured(env),
        model: isConfigured(env) ? modelName(env) : null,
      })
    }

    if (req.method !== 'POST') {
      return send(res, 405, { error: '허용되지 않은 메서드입니다.', code: 'method' })
    }

    try {
      const raw = await readBody(req)
      const input = JSON.parse(raw || '{}') as AnalyzeRequest
      const result = await runAnalysis(input, env)
      return send(res, 200, result)
    } catch (error) {
      if (error instanceof AnalyzeError) {
        return send(res, error.status, { error: error.message, code: error.code })
      }
      console.error('[analyze]', error)
      return send(res, 500, { error: '분석 중 문제가 생겼습니다.', code: 'unknown' })
    }
  }
}
