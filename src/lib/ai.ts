import type { AiStatus, AnalysisResult, AnalyzeRequest } from './analysis'

/**
 * 클라이언트에서는 /api/analyze 만 호출한다.
 * API 키는 서버(개발 서버 미들웨어 또는 서버리스 함수)에만 있다.
 */

export class AnalyzeFailure extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'AnalyzeFailure'
  }
}

export async function getAiStatus(): Promise<AiStatus> {
  try {
    const res = await fetch('/api/analyze')
    if (!res.ok) return { configured: false, model: null }
    return (await res.json()) as AiStatus
  } catch {
    return { configured: false, model: null }
  }
}

export async function analyzeText(input: AnalyzeRequest): Promise<AnalysisResult> {
  let res: Response
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch (error) {
    throw new AnalyzeFailure(`분석 서버에 연결하지 못했어요. (${(error as Error).message})`, 'network')
  }

  const raw = await res.text().catch(() => '')
  let payload: (AnalysisResult & { error?: string; code?: string }) | null = null
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = null
  }

  if (payload?.error) throw new AnalyzeFailure(payload.error, payload.code ?? 'unknown')

  // JSON 이 아니면 서버가 아니라 플랫폼이 돌려준 응답이다(404·500 페이지 등).
  // 원인을 찾을 수 있게 상태 코드와 앞부분을 그대로 보여준다.
  if (!res.ok || !payload) {
    const hint = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
    throw new AnalyzeFailure(
      `분석 요청이 실패했어요. (HTTP ${res.status})${hint ? ` ${hint}` : ''}`,
      `http_${res.status}`,
    )
  }

  return payload
}
