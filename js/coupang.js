/*
 * 교체알리미 — 쿠팡 파트너스 상품 CTA 설정
 * ------------------------------------------------------------------
 * 지금은 모든 품목이 제네릭 딥링크(_generic)로 연결됩니다.
 * 품목별 전용 딥링크를 만들려면:
 *   1) 쿠팡 파트너스(partners.coupang.com)에서 해당 상품 검색 페이지/상품의 "딥링크" 생성
 *   2) 생성된 https://link.coupang.com/a/XXXXXX 주소를 아래 값에 붙여넣기 (null → 링크)
 * ※ 존재하지 않는 /a/XXXX 코드를 임의로 지어내지 말 것. 반드시 파트너스에서 발급받은 실제 링크만 사용.
 *
 * "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다." (고지문 필수)
 */
(function () {
  var GENERIC = 'https://link.coupang.com/a/fnxIjnErXE'; // 발급받은 제네릭 딥링크(전 품목 공용)

  // 품목키 → 전용 딥링크 (미설정 시 null → 제네릭 사용). TODO: 파트너스 딥링크로 교체.
  var LINKS = {
    _generic:       GENERIC,
    filter_water:   null, // TODO: 정수기 필터(전처리/카본/멤브레인)
    filter_air:     null, // TODO: 공기청정기 필터(헤파/카본)
    filter_aircon:  null, // TODO: 에어컨 필터
    washer_cleaner: null, // TODO: 세탁조 세정제
    toothbrush_head:null, // TODO: 칫솔/전동칫솔모
    razor_blade:    null, // TODO: 면도날
    contact_lens:   null, // TODO: 콘택트렌즈
    lens_solution:  null, // TODO: 렌즈 세정액
    lens_case:      null, // TODO: 렌즈 케이스
    towel:          null, // TODO: 수건
    pillow:         null, // TODO: 베개
    sponge:         null, // TODO: 수세미/스펀지
    dishcloth:      null, // TODO: 행주
    cutting_board:  null, // TODO: 도마
    frypan:         null, // TODO: 코팅 프라이팬
    water_purifier: null  // TODO: 정수기 코크/살균용품
  };

  function linkFor(key) {
    return (key && LINKS[key]) ? LINKS[key] : LINKS._generic;
  }

  // 전역 노출 (모듈/인라인 양쪽에서 사용)
  window.coupangLinkFor = linkFor;

  // data-coupang-key 를 가진 정적 CTA 링크의 href 를 설정값으로 덮어씀
  function applyStaticLinks() {
    document.querySelectorAll('a[data-coupang-key]').forEach(function (a) {
      a.href = linkFor(a.getAttribute('data-coupang-key'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStaticLinks);
  } else {
    applyStaticLinks();
  }
})();
