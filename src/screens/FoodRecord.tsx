import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useStore } from '../lib/store'
import { estimateKcal, PORTION_LABEL, suggestIngredients } from '../lib/kcal'
import { kcalRange } from '../lib/format'
import type { Portion } from '../lib/types'

const PORTIONS: Portion[] = ['small', 'normal', 'large']

/**
 * 계획 → 실제 기록으로 넘어가는 유일한 경로.
 * 먹었다고 확인한 정보만 음식 통계에 들어간다. — 기획서 07
 */
export function FoodRecord() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const toast = useToast()
  const record = store.get(id)

  const food = record?.modules.food
  const initialName = food?.actualName ?? food?.plannedName ?? record?.title ?? ''

  // 이미 확인한 기록을 다시 여는 경우에는 확인 질문을 건너뛴다
  const [step, setStep] = useState(food?.status === 'confirmed' ? 2 : 1)
  const [name, setName] = useState(initialName)
  const [ingredients, setIngredients] = useState<string[]>(food?.ingredients ?? [])
  const [portion, setPortion] = useState<Portion>(food?.portion ?? 'normal')
  const [custom, setCustom] = useState('')

  const options = useMemo(() => {
    const base = suggestIngredients(name)
    return [...new Set([...base, ...ingredients])]
  }, [name, ingredients])

  const estimate = useMemo(() => estimateKcal(ingredients, portion), [ingredients, portion])

  if (!record) {
    return (
      <main className="screen">
        <div className="topbar">
          <button type="button" onClick={() => navigate('/')} aria-label="뒤로">
            <Icon name="i-back" />
          </button>
        </div>
        <div className="empty">기록을 찾을 수 없어요</div>
      </main>
    )
  }

  const consumedAt = record.modules.schedule?.startDate ?? record.eventDate

  const setStatus = (status: 'skipped' | 'pending') => {
    store.updateModules(record.id, (m) => ({
      ...m,
      food: {
        plannedName: m.food?.plannedName ?? initialName,
        actualName: m.food?.actualName,
        status,
        ingredients: m.food?.ingredients ?? [],
        portion: m.food?.portion ?? 'normal',
        consumedAt: undefined,
        kcalMin: undefined,
        kcalMax: undefined,
        estimateBasis: undefined,
      },
    }))
    toast(status === 'skipped' ? '먹지 않은 것으로 남겼어요' : '나중에 다시 물어볼게요')
    navigate(`/record/${record.id}`, { replace: true })
  }

  const save = () => {
    store.updateModules(record.id, (m) => ({
      ...m,
      food: {
        plannedName: m.food?.plannedName ?? initialName,
        actualName: name.trim() || initialName,
        consumedAt,
        status: 'confirmed',
        ingredients,
        portion,
        kcalMin: estimate?.min,
        kcalMax: estimate?.max,
        estimateBasis: estimate?.basis,
      },
    }))
    toast('기록했어요')
    navigate(`/record/${record.id}`, { replace: true })
  }

  return (
    <main className="screen">
      <div className="topbar">
        <button
          type="button"
          onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
          aria-label="뒤로"
        >
          <Icon name="i-back" />
        </button>
        <span className="muted">{record.title}</span>
      </div>

      <div className="prog">
        <div className="bar">
          <i style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <span className="num">{step} / 3</span>
      </div>

      {step === 1 && (
        <>
          <div className="h-lg">{initialName}을(를) 실제로 드셨나요?</div>
          <p className="h-sub">확인하기 전에는 음식 통계에 넣지 않아요.</p>
          <div className="choice">
            <button type="button" onClick={() => setStep(2)}>
              먹었어요
              <span className="n">무엇을 얼마나 먹었는지 이어서 적어요</span>
            </button>
            <button type="button" onClick={() => setStatus('skipped')}>
              먹지 않았어요
              <span className="n">미섭취로 남기고 집계에서 빼요</span>
            </button>
            <button type="button" onClick={() => setStatus('pending')}>
              나중에
              <span className="n">확인 대기로 두고 다시 물어봐요</span>
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="h-lg">무엇을 드셨나요?</div>
          <p className="h-sub">예정과 다르게 먹었다면 실제로 먹은 것으로 고쳐주세요.</p>

          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="음식 이름"
            aria-label="음식 이름"
          />

          <div className="lbl">주요 재료</div>
          <div className="chips">
            {options.map((ing) => {
              const on = ingredients.includes(ing)
              return (
                <button
                  type="button"
                  key={ing}
                  className={`c${on ? ' on' : ''}`}
                  onClick={() =>
                    setIngredients(on ? ingredients.filter((x) => x !== ing) : [...ingredients, ing])
                  }
                >
                  {ing}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="input"
              value={custom}
              placeholder="재료 직접 추가"
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && custom.trim()) {
                  setIngredients([...new Set([...ingredients, custom.trim()])])
                  setCustom('')
                }
              }}
            />
            <button
              type="button"
              className="chip"
              disabled={!custom.trim()}
              onClick={() => {
                setIngredients([...new Set([...ingredients, custom.trim()])])
                setCustom('')
              }}
            >
              추가
            </button>
          </div>

          <div className="lbl">양</div>
          <div className="seg">
            {PORTIONS.map((p) => (
              <button type="button" key={p} className={portion === p ? 'on' : ''} onClick={() => setPortion(p)}>
                {PORTION_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="push" style={{ paddingTop: 20 }}>
            <button type="button" className="btn" onClick={() => setStep(3)} disabled={!name.trim()}>
              다음
            </button>
            <p className="center-note">재료를 고르지 않아도 먹은 사실은 기록할 수 있어요.</p>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="h-lg">이렇게 기록할게요</div>
          <p className="h-sub">정확한 칼로리가 아니라, 고른 재료와 양을 기준으로 한 예상 범위예요.</p>

          <div className="selrow">
            <Icon name="i-bowl" size="sm" style={{ color: 'var(--ink-2)' }} />
            {name}
            <span className="r num">{PORTION_LABEL[portion]}</span>
          </div>

          {ingredients.length > 0 && (
            <>
              <div className="lbl">재료</div>
              <div className="chips">
                {ingredients.map((i) => (
                  <span className="c on" key={i}>
                    {i}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="est">
            <div className="k">예상 칼로리</div>
            {estimate ? (
              <>
                <div className="v num">{kcalRange(estimate.min, estimate.max)}</div>
                <div className="n">재료와 양에 따라 달라질 수 있어요 · {estimate.basis}</div>
              </>
            ) : (
              <>
                <div className="v none">추정하지 않았어요</div>
                <div className="n">재료 정보가 없어 임의의 숫자를 만들지 않습니다. 먹은 사실만 기록돼요.</div>
              </>
            )}
          </div>

          <div className="push" style={{ paddingTop: 20 }}>
            <button type="button" className="btn brand" onClick={save}>
              기록하기
            </button>
            <div className="center-note">
              <button type="button" className="textlink" onClick={() => setStatus('skipped')}>
                먹지 않았어요
              </button>
              {' · '}
              <button type="button" className="textlink" onClick={() => setStatus('pending')}>
                나중에 하기
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
