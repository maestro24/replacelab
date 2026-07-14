# 교체알리미 (ReplaceLab)

소모품 교체주기 정보 DB + 마지막 교체일 기반 **D-day 계산기** + **우리집 교체 대시보드**(localStorage)를 제공하는 순수 정적 웹사이트.

- 라이브: https://maestro24.github.io/replacelab/
- 빌드도구 0 · Vanilla ES module · 라이트 테마 · 모바일 우선

## 기능

1. **교체주기 DB 표** — 정수기/공기청정기/에어컨 필터, 칫솔·면도날·렌즈, 수세미·행주·도마·프라이팬 등 19개 품목의 권장 교체주기 + 출처 + 재구매 CTA.
2. **D-day 계산기** — 품목 선택 + 마지막 교체일 → 다음 교체 권장일과 남은 날짜(D-day). 과거일·미래일·잘못된 날짜 방어.
3. **우리집 대시보드** — 여러 품목을 localStorage에 저장 → 교체 임박 순 정렬, "교체 필요/임박" 배지, 재구매 링크. 서버 전송 없음.

## 데이터

- 품목 DB: `data/items.json` (권장 주기 · 출처 · 방치 시 문제 · 쿠팡 품목키). 유지보수 시 이 파일만 수정.
- 권장 주기는 제조사·공신력 기관(ADA, FDA, 질레트, IQAir, MSU Extension, RO 정수기 유지관리 가이드) 안내 근거. 임의 추정 아님.

## 구조

```
replacelab/
├── index.html          # 허브(DB표+계산기+대시보드+품목상세+SEO)
├── 404.html
├── css/style.css
├── data/items.json     # 품목 DB (단일 출처)
├── js/
│   ├── coupang.js      # 쿠팡 파트너스 CTA 설정(품목키→딥링크, TODO)
│   ├── dday.js         # 순수 날짜 계산(UTC 자정 기준)
│   └── app.js          # 계산기 + 대시보드(localStorage)
├── tests/dday.test.mjs # D-day 계산 단위 테스트
├── robots.txt · sitemap.xml · llms.txt
```

## 로컬 실행 / 테스트

```bash
# 로컬 서버 (items.json fetch 때문에 file:// 대신 http 필요)
python -m http.server 8080
# → http://localhost:8080

# D-day 단위 테스트
node tests/dday.test.mjs
```

## 수익화

- GA4 `G-2P73L29BH7`, 쿠팡 파트너스 배너/캐러셀.
- 품목별 CTA 딥링크는 `js/coupang.js`에서 관리. 현재 모두 제네릭 딥링크 사용, 품목별 전용 딥링크는 TODO(파트너스에서 발급 후 교체).
