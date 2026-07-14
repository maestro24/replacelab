/*
 * 교체알리미 — D-day 날짜 계산 (순수 함수)
 * 모든 계산은 날짜 단위(UTC 자정 기준)로 처리해 시간대·서머타임 영향을 배제한다.
 */

var MS_PER_DAY = 86400000;

/** 'YYYY-MM-DD' → UTC 자정 Date. 유효하지 않으면 null. */
export function parseISODate(iso) {
  if (typeof iso !== 'string') return null;
  var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  var dt = new Date(Date.UTC(y, mo - 1, d));
  // 실제 존재하는 날짜인지 검증 (예: 2월 30일 방어)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

/** Date → 'YYYY-MM-DD' (UTC 기준) */
export function toISODate(dt) {
  var y = dt.getUTCFullYear();
  var mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
  var d = String(dt.getUTCDate()).padStart(2, '0');
  return y + '-' + mo + '-' + d;
}

/** 오늘(로컬 달력 기준)의 UTC 자정 Date */
export function todayUTC() {
  var now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** 오늘 'YYYY-MM-DD' */
export function todayISO() {
  return toISODate(todayUTC());
}

/** a→b 사이의 정수 일수 (b - a). 둘 다 UTC 자정 Date. */
export function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * 교체 D-day 계산.
 * @param {string} lastISO   마지막 교체일 'YYYY-MM-DD'
 * @param {number} cycleDays 권장 교체 주기(일). 양의 정수여야 함.
 * @param {string} [refISO]  기준일(기본: 오늘). 테스트용.
 * @returns {{ok:boolean, error?:string, nextISO?:string, remaining?:number, elapsed?:number, status?:string}}
 *   status: 'overdue' | 'soon' | 'ok'
 *   remaining: 다음 교체일까지 남은 일수(음수면 초과)
 */
export function computeDday(lastISO, cycleDays, refISO) {
  var last = parseISODate(lastISO);
  if (!last) return { ok: false, error: '날짜를 올바르게 입력하세요.' };
  if (typeof cycleDays !== 'number' || !isFinite(cycleDays) || cycleDays <= 0) {
    return { ok: false, error: '교체 주기가 올바르지 않습니다.' };
  }
  cycleDays = Math.round(cycleDays);

  var today = refISO ? parseISODate(refISO) : todayUTC();
  if (!today) return { ok: false, error: '기준 날짜 오류' };

  if (daysBetween(today, last) > 0) {
    return { ok: false, error: '마지막 교체일이 미래로 되어 있어요. 오늘 이전 날짜를 입력하세요.' };
  }

  var next = new Date(last.getTime() + cycleDays * MS_PER_DAY);
  var remaining = daysBetween(today, next); // 양수: 남음, 0: 오늘, 음수: 초과
  var elapsed = daysBetween(last, today);

  var status;
  if (remaining <= 0) status = 'overdue';
  else if (remaining <= 7) status = 'soon';
  else status = 'ok';

  return {
    ok: true,
    nextISO: toISODate(next),
    remaining: remaining,
    elapsed: elapsed,
    cycleDays: cycleDays,
    status: status
  };
}

/** D-day 표시 문자열: 남음/오늘/초과 */
export function ddayLabel(remaining) {
  if (remaining === 0) return 'D-DAY';
  if (remaining > 0) return 'D-' + remaining;
  return 'D+' + Math.abs(remaining);
}
