// D-day 계산 단위 테스트 — node tests/dday.test.mjs
import { computeDday, ddayLabel, parseISODate, daysBetween, toISODate } from '../js/dday.js';

let pass = 0, fail = 0;
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; }
  else { fail++; console.error('FAIL:', msg, '\n  expected', e, '\n  actual  ', a); }
}
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } }

// 1) 여유: 오늘 교체, 주기 90일 → D-90, status ok
let r = computeDday('2026-07-14', 90, '2026-07-14');
ok(r.ok, 'valid 1');
eq(r.remaining, 90, 'remaining 90');
eq(r.nextISO, '2026-10-12', 'next date +90');
eq(r.status, 'ok', 'status ok');
eq(r.elapsed, 0, 'elapsed 0');

// 2) 임박: 마지막 85일 전, 주기 90 → 남은 5일 → soon
r = computeDday('2026-04-15', 90, '2026-07-14'); // 2026-04-15 +90 = 2026-07-14; elapsed 90 → remaining 0? check
// 계산: 4-15 → 90일 후. daysBetween 확인
ok(r.ok, 'valid 2');
ok(r.remaining <= 7, 'soon range remaining=' + r.remaining);

// 3) 초과(과거일): 마지막 200일 전, 주기 90 → 초과 → overdue, remaining 음수
r = computeDday('2025-12-01', 90, '2026-07-14');
ok(r.ok, 'valid 3');
ok(r.remaining < 0, 'overdue remaining negative =' + r.remaining);
eq(r.status, 'overdue', 'status overdue');

// 4) 경계: 정확히 교체일 당일 → remaining 0 → overdue(<=0), D-DAY
r = computeDday('2026-04-15', 90, '2026-07-14');
eq(daysBetween(parseISODate('2026-04-15'), parseISODate('2026-07-14')), 90, 'boundary 90 days');
eq(r.remaining, 0, 'remaining exactly 0');
eq(r.status, 'overdue', 'boundary status overdue');
eq(ddayLabel(0), 'D-DAY', 'label D-DAY');
eq(ddayLabel(5), 'D-5', 'label D-5');
eq(ddayLabel(-3), 'D+3', 'label D+3');

// 5) 미래 마지막 교체일 방어
r = computeDday('2026-08-01', 90, '2026-07-14');
ok(!r.ok, 'future last date rejected');

// 6) 잘못된 날짜 방어
ok(!computeDday('2026-02-30', 90, '2026-07-14').ok, 'invalid feb30');
ok(!computeDday('not-a-date', 90).ok, 'invalid string');
ok(parseISODate('2026-13-01') === null, 'invalid month');

// 7) 잘못된 주기 방어
ok(!computeDday('2026-07-14', 0).ok, 'cycle 0 rejected');
ok(!computeDday('2026-07-14', -5).ok, 'cycle negative rejected');

// 8) 윤년 경계: 2024-02-29 +1일
eq(toISODate(new Date(parseISODate('2024-02-29').getTime() + 86400000)), '2024-03-01', 'leap boundary');

// 9) 원데이 렌즈: 1일 주기
r = computeDday('2026-07-13', 1, '2026-07-14');
eq(r.remaining, 0, 'oneday remaining 0');
eq(r.status, 'overdue', 'oneday overdue today');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
