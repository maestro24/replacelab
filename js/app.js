/*
 * 교체알리미 — 메인 앱 (교체주기 D-day 계산기 + 우리집 교체 대시보드)
 * 순수 정적 · Vanilla ES module · localStorage 기반. 서버 전송 없음.
 */
import { computeDday, ddayLabel, todayISO, parseISODate, daysBetween, todayUTC } from './dday.js';

var LS_KEY = 'replacelab.dashboard.v1';
var state = { items: [], byId: {} };

/* ---------- 데이터 로드 ---------- */
async function loadItems() {
  var res = await fetch('./data/items.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('items.json load failed: ' + res.status);
  var data = await res.json();
  state.items = Array.isArray(data.items) ? data.items : [];
  state.categories = Array.isArray(data.categories) ? data.categories : [];
  state.byId = {};
  state.items.forEach(function (it) { state.byId[it.id] = it; });
}

/* ---------- 유틸 ---------- */
function el(tag, attrs, children) {
  var e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) { if (c) e.appendChild(c); });
  return e;
}
function statusFromRemaining(r) { return r <= 0 ? 'overdue' : (r <= 7 ? 'soon' : 'ok'); }
function statusText(r) { return r < 0 ? '교체 시기 지남' : (r === 0 ? '오늘 교체' : (r <= 7 ? '교체 임박' : '여유 있음')); }

/* ---------- 계산기 ---------- */
var calcEls = {};
function initCalculator() {
  calcEls.item = document.getElementById('calc-item');
  calcEls.variantWrap = document.getElementById('calc-variant-wrap');
  calcEls.variant = document.getElementById('calc-variant');
  calcEls.date = document.getElementById('calc-date');
  calcEls.dateField = document.getElementById('calc-date-field');
  calcEls.btn = document.getElementById('calc-btn');
  calcEls.result = document.getElementById('calc-result');

  // 품목 select 채우기 (카테고리 그룹)
  var frag = document.createDocumentFragment();
  frag.appendChild(el('option', { value: '', text: '품목을 선택하세요' }));
  (state.categories.length ? state.categories : [{ key: null, name: '품목' }]).forEach(function (cat) {
    var group = el('optgroup', { label: cat.name });
    state.items.filter(function (it) { return it.category === cat.key; }).forEach(function (it) {
      group.appendChild(el('option', { value: it.id, text: it.icon + ' ' + it.name }));
    });
    if (group.children.length) frag.appendChild(group);
  });
  calcEls.item.innerHTML = '';
  calcEls.item.appendChild(frag);

  calcEls.date.value = todayISO();
  calcEls.date.max = todayISO();

  calcEls.item.addEventListener('change', onItemChange);
  calcEls.btn.addEventListener('click', runCalc);
}

function onItemChange() {
  var it = state.byId[calcEls.item.value];
  if (it && Array.isArray(it.variants) && it.variants.length) {
    calcEls.variant.innerHTML = '';
    it.variants.forEach(function (v, i) {
      calcEls.variant.appendChild(el('option', { value: String(i), text: v.label }));
    });
    calcEls.variantWrap.style.display = '';
  } else {
    calcEls.variantWrap.style.display = 'none';
  }
  calcEls.result.classList.remove('show');
}

function resolveCycle(it) {
  if (it && Array.isArray(it.variants) && it.variants.length) {
    var idx = Math.max(0, Math.min(it.variants.length - 1, parseInt(calcEls.variant.value || '0', 10)));
    var v = it.variants[idx];
    return { cycleDays: v.days, variantLabel: v.label };
  }
  return { cycleDays: it ? it.cycleDays : 0, variantLabel: null };
}

function runCalc() {
  var it = state.byId[calcEls.item.value];
  calcEls.dateField.classList.remove('invalid');
  if (!it) {
    calcEls.item.focus();
    return;
  }
  var c = resolveCycle(it);
  var r = computeDday(calcEls.date.value, c.cycleDays);
  if (!r.ok) {
    calcEls.dateField.classList.add('invalid');
    document.getElementById('calc-date-error').textContent = r.error;
    calcEls.result.classList.remove('show');
    return;
  }
  renderCalcResult(it, c, r);
}

function renderCalcResult(it, c, r) {
  var box = calcEls.result;
  box.innerHTML = '';
  var buyLink = window.coupangLinkFor ? window.coupangLinkFor(it.coupangKey) : '#';

  var hero = el('div', { class: 'dday-hero' }, [
    el('div', { class: 'label', text: it.icon + ' ' + it.name + (c.variantLabel ? ' · ' + c.variantLabel : '') }),
    el('div', { class: 'dday-big ' + r.status, text: ddayLabel(r.remaining) }),
    el('div', { class: 'dday-sub', text:
      r.remaining < 0 ? ('권장 교체일이 ' + Math.abs(r.remaining) + '일 지났어요. 지금 교체를 권장합니다.')
      : r.remaining === 0 ? '오늘이 권장 교체일입니다.'
      : ('다음 교체 권장일까지 ' + r.remaining + '일 남았습니다.') })
  ]);

  var meta = el('div', { class: 'dday-meta' }, [
    el('div', { class: 'stat' }, [ el('div', { class: 'k', text: '다음 교체 권장일' }), el('div', { class: 'v', text: r.nextISO }) ]),
    el('div', { class: 'stat' }, [ el('div', { class: 'k', text: '권장 주기' }), el('div', { class: 'v', text: c.cycleDays + '일' }) ]),
    el('div', { class: 'stat' }, [ el('div', { class: 'k', text: '경과' }), el('div', { class: 'v', text: r.elapsed + '일' }) ])
  ]);

  var actions = el('div', { class: 'btn-row' }, [
    el('a', { class: 'btn btn-buy', href: buyLink, target: '_blank', rel: 'sponsored noopener', text: '🛒 쿠팡에서 재구매' }),
    el('button', { class: 'btn btn-secondary', type: 'button', text: '＋ 우리집 대시보드에 저장' })
  ]);
  actions.querySelector('button').addEventListener('click', function () {
    addToDashboard(it, c, calcEls.date.value);
    this.textContent = '✓ 저장됨';
    this.disabled = true;
  });

  box.appendChild(hero);
  box.appendChild(meta);
  box.appendChild(actions);
  box.classList.add('show');
}

/* ---------- 대시보드 (localStorage) ---------- */
function loadDash() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveDash(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
  catch (e) { /* 저장 실패는 조용히 무시 (사생활 모드 등) */ }
}
function addToDashboard(it, c, lastDate) {
  var arr = loadDash();
  var uid = it.id + '|' + (c.variantLabel || '') + '|' + lastDate + '|' + Date.now();
  arr.push({
    uid: uid, itemId: it.id, name: it.name, icon: it.icon,
    coupangKey: it.coupangKey, variantLabel: c.variantLabel,
    cycleDays: c.cycleDays, lastDate: lastDate
  });
  saveDash(arr);
  renderDashboard();
}
function removeFromDashboard(uid) {
  var arr = loadDash().filter(function (e) { return e.uid !== uid; });
  saveDash(arr);
  renderDashboard();
}

function renderDashboard() {
  var wrap = document.getElementById('dash-body');
  if (!wrap) return;
  var arr = loadDash();

  if (!arr.length) {
    wrap.innerHTML = '';
    wrap.appendChild(el('p', { class: 'dash-empty', text: '아직 저장한 품목이 없습니다. 위 계산기에서 "우리집 대시보드에 저장"을 눌러 추가하세요.' }));
    updateDashSummary(null);
    return;
  }

  // D-day 계산 후 임박순(remaining 오름차순) 정렬
  var rows = arr.map(function (e) {
    var r = computeDday(e.lastDate, e.cycleDays);
    return { e: e, r: r };
  });
  rows.sort(function (a, b) {
    var ra = a.r.ok ? a.r.remaining : 99999;
    var rb = b.r.ok ? b.r.remaining : 99999;
    return ra - rb;
  });

  var list = el('ul', { class: 'dash-list' });
  var overdue = 0, soon = 0;
  rows.forEach(function (row) {
    var e = row.e, r = row.r;
    var rem = r.ok ? r.remaining : null;
    var st = r.ok ? statusFromRemaining(rem) : 'ok';
    if (r.ok && rem <= 0) overdue++;
    else if (r.ok && rem <= 7) soon++;

    var buyLink = window.coupangLinkFor ? window.coupangLinkFor(e.coupangKey) : '#';
    var detail = (e.variantLabel ? e.variantLabel + ' · ' : '') + '주기 ' + e.cycleDays + '일 · 마지막 ' + e.lastDate +
                 (r.ok ? ' · 다음 ' + r.nextISO : '');

    var li = el('li', { class: 'dash-item' }, [
      el('span', { class: 'di-icon', text: e.icon || '📦' }),
      el('div', { class: 'di-main' }, [
        el('div', { class: 'di-name' }, [
          document.createTextNode(e.name + '  '),
          el('span', { class: 'badge ' + st, text: r.ok ? statusText(rem) : '날짜 오류' })
        ]),
        el('div', { class: 'di-detail', text: detail })
      ]),
      el('div', { class: 'di-dday ' + st, text: r.ok ? ddayLabel(rem) : '—' }),
      el('div', { class: 'di-actions' }, [
        el('a', { class: 'btn-buy', href: buyLink, target: '_blank', rel: 'sponsored noopener', text: '재구매' }),
        (function () {
          var b = el('button', { class: 'btn-mini', type: 'button', text: '삭제' });
          b.addEventListener('click', function () { removeFromDashboard(e.uid); });
          return b;
        })()
      ])
    ]);
    list.appendChild(li);
  });

  wrap.innerHTML = '';
  wrap.appendChild(list);
  updateDashSummary({ total: rows.length, overdue: overdue, soon: soon });
}

function updateDashSummary(s) {
  var sum = document.getElementById('dash-summary');
  if (!sum) return;
  if (!s) { sum.textContent = ''; return; }
  var parts = ['등록 ' + s.total + '개'];
  if (s.overdue) parts.push('🔴 교체 필요 ' + s.overdue);
  if (s.soon) parts.push('🟠 임박 ' + s.soon);
  sum.textContent = parts.join(' · ');
}

/* ---------- 부트 ---------- */
(async function boot() {
  try {
    await loadItems();
    initCalculator();
    renderDashboard();
  } catch (err) {
    console.error(err);
    var box = document.getElementById('calc-result');
    if (box) {
      box.classList.add('show');
      box.innerHTML = '<p style="color:var(--bad)">품목 데이터를 불러오지 못했습니다. 새로고침 해주세요.</p>';
    }
  }
})();
