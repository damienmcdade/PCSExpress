# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scripts/onboarding-step1-labels.spec.cjs >> Onboarding step-1 labels translate on live Vercel
- Location: scripts/onboarding-step1-labels.spec.cjs:3:1

# Error details

```
Error: Missing Korean labels: 출발일
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]: PCS EXPRESS
    - generic [ref=e7]: 이동 준비를 간단하게.
  - generic [ref=e13]:
    - generic [ref=e14]: 기지 정보
    - generic [ref=e15]:
      - generic [ref=e16]: 출발지 (이전 기지)
      - textbox "기지 이름 입력..." [ref=e17]
    - generic [ref=e18]:
      - generic [ref=e19]: 도착지 (새 기지)
      - textbox "기지 이름 입력..." [ref=e20]
    - generic [ref=e21]:
      - generic [ref=e22]: 보고 기한 (NLT)
      - textbox [ref=e23]
      - generic [ref=e24]: 명령서에 명시된 "늦어도" 도착 일자입니다. T-Minus 마일스톤이 이 날짜를 기준으로 계산됩니다.
    - generic [ref=e25]:
      - button "← 뒤로" [ref=e26] [cursor=pointer]
      - button "계속 →" [disabled] [ref=e27]
```

# Test source

```ts
  1  | const { test } = require('@playwright/test');
  2  | 
  3  | test('Onboarding step-1 labels translate on live Vercel', async ({ page }) => {
  4  |   test.setTimeout(60_000);
  5  |   const logs = [];
  6  |   page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  7  |   page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message }));
  8  | 
  9  |   await page.goto('https://pcs-express.vercel.app/', { waitUntil: 'networkidle' });
  10 |   await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  11 |   await page.reload({ waitUntil: 'networkidle' });
  12 |   await page.waitForTimeout(800);
  13 | 
  14 |   // Find the language <select> (the one with 한국어 option)
  15 |   const selectCount = await page.locator('select').count();
  16 |   let langIdx = -1;
  17 |   for (let i = 0; i < selectCount; i++) {
  18 |     const opts = await page.locator('select').nth(i).locator('option').allTextContents();
  19 |     if (opts.some(o => /한국어/.test(o))) { langIdx = i; break; }
  20 |   }
  21 |   if (langIdx === -1) throw new Error('language select not found');
  22 | 
  23 |   // Pick Korean
  24 |   await page.locator('select').nth(langIdx).selectOption('ko');
  25 |   await page.waitForTimeout(800);
  26 | 
  27 |   // Click the Continue button at the bottom of step 0
  28 |   const continueBtn = page.locator('button').filter({ hasText: /계속|Continue/ }).first();
  29 |   await continueBtn.click();
  30 |   await page.waitForTimeout(1500);
  31 | 
  32 |   const visibleText = await page.locator('body').innerText();
  33 | 
  34 |   const expectedKo = ['출발지 (이전 기지)', '도착지 (새 기지)', '출발일'];
  35 |   const englishFlags = ['DEPARTING FROM (LOSING INSTALLATION)', 'REPORTING TO (GAINING INSTALLATION)', 'DEPARTING DATE'];
  36 | 
  37 |   const koreanResults = expectedKo.map(s => ({ frag: s, found: visibleText.includes(s) }));
  38 |   const englishLeakage = englishFlags.filter(s => visibleText.includes(s));
  39 | 
  40 |   console.log(JSON.stringify({
  41 |     url: page.url(),
  42 |     htmlLang: await page.locator('html').getAttribute('lang'),
  43 |     expectedKoreanLabels: koreanResults,
  44 |     englishLeakage,
  45 |     consoleErrors: logs.filter(l => l.type === 'error' || l.type === 'pageerror').length,
  46 |     sample: visibleText.substring(0, 600),
  47 |   }, null, 2));
  48 | 
  49 |   if (englishLeakage.length) throw new Error(`English labels still showing: ${englishLeakage.join(', ')}`);
  50 |   const missing = koreanResults.filter(r => !r.found);
> 51 |   if (missing.length) throw new Error(`Missing Korean labels: ${missing.map(m => m.frag).join(', ')}`);
     |                             ^ Error: Missing Korean labels: 출발일
  52 | });
  53 | 
```