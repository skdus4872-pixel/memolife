import { SubHeader } from '../../components/SubHeader'

const RULES: { title: string; body: string }[] = [
  {
    title: '하나의 사건은 하나의 기록',
    body: '일정·지출·음식이 함께 있어도 기록을 나누지 않습니다. 필요한 정보만 모듈로 붙여서 한 기록 안에 둡니다.',
  },
  {
    title: '분류보다 입력을 먼저',
    body: '메모인지 일정인지 고르지 않고 그대로 적으면 됩니다. 하단 + 에서 문장으로 남기면 필요한 정보를 찾아 제안합니다.',
  },
  {
    title: '확인한 것만 저장됩니다',
    body: 'AI가 찾은 정보는 제안일 뿐입니다. 확인 화면에서 체크한 것만 저장되고, 값은 저장 전에 고칠 수 있어요.',
  },
  {
    title: '대표 날짜와 거래일은 다릅니다',
    body: '9월 7일에 결제하고 10일에 만나기로 했다면, 지출은 7일에 집계되고 일정은 10일에 표시됩니다.',
  },
  {
    title: '예상 비용은 통계에 넣지 않습니다',
    body: '실제 결제로 표시한 거래만 지출 합계에 들어갑니다. 앞으로 낼 돈은 기록에는 남지만 집계에서는 빠집니다.',
  },
  {
    title: '먹은 뒤에 확인합니다',
    body: '식사 예정은 실제 식사로 세지 않습니다. 일정이 끝나면 확인 제안이 뜨고, 먹었다고 확인한 기록만 남습니다. 칼로리는 다루지 않아요.',
  },
  {
    title: '자동으로 묶지 않습니다',
    body: '이름이나 장소가 같다는 이유로 다른 기록을 합치지 않습니다. 연결은 사용자가 정합니다.',
  },
]

export function Help() {
  return (
    <main className="screen">
      <SubHeader title="도움말" />

      <div className="h-lg" style={{ marginBottom: 4 }}>
        기록을 다루는 방식
      </div>
      <p className="h-sub">이 앱이 지키는 약속입니다.</p>

      {RULES.map((rule) => (
        <div className="setting" key={rule.title} style={{ alignItems: 'flex-start' }}>
          <div className="txt">
            <b>{rule.title}</b>
            <span>{rule.body}</span>
          </div>
        </div>
      ))}

      <div className="section-title">화면 안내</div>
      <div className="kv">
        <span className="k">Today</span>
        <span className="v">오늘 요약과 시간순 기록</span>
      </div>
      <div className="kv">
        <span className="k">Calendar</span>
        <span className="v">날짜별로 다시 찾기</span>
      </div>
      <div className="kv">
        <span className="k">+</span>
        <span className="v">문장으로 빠르게 기록</span>
      </div>
      <div className="kv">
        <span className="k">Insight</span>
        <span className="v">확인된 기록만 모아 보기</span>
      </div>
      <div className="kv">
        <span className="k">My</span>
        <span className="v">기록 관리와 설정</span>
      </div>

      <div className="center-note" style={{ paddingBottom: 8 }}>
        Memo Life 2.0 · 기록은 이 기기에만 저장됩니다
      </div>
    </main>
  )
}
