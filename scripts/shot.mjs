/**
 * 실제 브라우저에서 화면을 찍고 레이아웃 수치를 재는 도구.
 * 눈으로 확인해야 하는 문제(여백·잘림·겹침)를 추측 대신 측정으로 잡기 위해 둔다.
 *
 *   npm run dev                                  # 먼저 개발 서버를 띄우고
 *   npm run shot                                 # 모바일(390x844) 기본
 *   npm run shot -- http://localhost:5173/#/my out.png 1200 900
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const out = process.argv[3] ?? 'shot.png'
const width = Number(process.argv[4] ?? 390)
const height = Number(process.argv[5] ?? 844)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2600) // 스플래시가 지나가길 기다린다

const metrics = await page.evaluate(() => {
  const device = document.querySelector('.device')?.getBoundingClientRect()
  const tab = document.querySelector('.tab')?.getBoundingClientRect()
  return {
    viewport: { w: innerWidth, h: innerHeight },
    bodyScrollHeight: document.body.scrollHeight,
    deviceHeight: device ? Math.round(device.height) : null,
    tabHeight: tab ? Math.round(tab.height) : null,
    navItemHeights: [...document.querySelectorAll('.tab .nav-item')].map((el) =>
      Math.round(el.getBoundingClientRect().height),
    ),
    spaceBelowTabInsideDevice: device && tab ? Math.round(device.bottom - tab.bottom) : null,
    spaceBelowDeviceInWindow: device ? Math.round(innerHeight - device.bottom) : null,
  }
})

console.log(JSON.stringify(metrics, null, 2))
await page.screenshot({ path: out })
console.log(`saved ${out}`)
await browser.close()
