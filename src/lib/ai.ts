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

  const payload = (await res.json().catch(() => null)) as
    | (AnalysisResult & { error?: string; code?: string })
    | null

  if (!res.ok || !payload) {
    throw new AnalyzeFailure(
      payload?.error ?? '분석에 실패했어요. 잠시 후 다시 시도해 주세요.',
      payload?.code ?? 'unknown',
    )
  }

  return payload
}
