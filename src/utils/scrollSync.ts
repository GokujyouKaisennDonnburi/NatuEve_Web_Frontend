import {
  CURRENT_SECTION_BAND_BOTTOM_PERCENT,
  CURRENT_SECTION_BAND_TOP_PX,
} from "@/constants/config";
import { isScrolledToBottom } from "@/utils/scroll";

// 表示の切り替え（入力→プレビューなど）の前後で「見ていた所」を引き継ぐための位置合わせ。
// 切替前の画面で見ている項目を特定し、切替後の画面で対応する項目を同じ高さに表示する。

// 切替前の項目 id と、切替後に対応する項目 id の候補の組（切替前の画面の並び順）。
// 候補は先頭から順に、画面に存在するものを採用する。
export type ScrollSyncMapping = readonly {
  sourceId: string;
  targetIds: readonly string[];
}[];

// 切替前に見ていた位置。切替後の対応先の候補と、画面上端からの表示位置（px）を持つ。
export type ScrollSyncPoint = {
  targetIds: readonly string[];
  offset: number;
};

// 固定ヘッダーに隠れない、項目の表示位置の下限（px）。
// 「今見ている所」とみなす帯の上端と同じ位置。
const MIN_OFFSET = CURRENT_SECTION_BAND_TOP_PX;

// 画面上端からの上端・下端の位置（px）
type VerticalRange = {
  top: number;
  bottom: number;
};

// 各項目の位置（画面上端基準、並び順）から、見ている項目の添字を返す。
// 目次（PageToc）のハイライトと同じく、画面上部の帯に少しでもかかっている項目のうち
// 一番上のものを採用する（端が接しているだけでも、IntersectionObserver と同じくかかっているとみなす）。
// ページ最下部では短い最後の項目が帯まで上がってこないため、最後の項目とみなす。
// 帯にかかる項目が無い（ページ先頭付近）ときは -1 を返す。
export const pickCurrentIndex = (
  ranges: readonly VerticalRange[],
  band: VerticalRange,
  isAtBottom: boolean,
): number => {
  if (isAtBottom) {
    return ranges.length - 1;
  }
  return ranges.findIndex(
    (range) => range.top <= band.bottom && range.bottom >= band.top,
  );
};

// 入力中の要素が画面に見えていれば、それを含む項目の添字を返す。無ければ -1 を返す。
// 画面の端で切れている要素は、入力したままスクロールして別の所を見ている可能性が高いため、
// 画面内に収まっていて、ヘッダーより下に見えているものだけを対象にする。
const findFocusedIndex = (
  elements: readonly HTMLElement[],
  focusedElement: Element | null,
): number => {
  if (!focusedElement) {
    return -1;
  }
  const rect = focusedElement.getBoundingClientRect();
  const isVisible =
    rect.top >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.bottom > MIN_OFFSET;
  if (!isVisible) {
    return -1;
  }
  return elements.findIndex((element) => element.contains(focusedElement));
};

// 切替前の画面で見ている項目を調べ、切替後に対応する位置を返す。
// focusedElement は切替を操作する直前にフォーカスしていた要素。
// 切替の操作でフォーカスが移ってしまうため、呼び出し側で操作の直前に記録して渡す。
// 見ている項目が無いとき（ページ先頭付近など）と、入力中の項目が見えないままページ先頭（scrollY 0）に
// いるときは null を返す
// （目次は直前のハイライトを保つが、こちらは「位置を合わせない」ことを呼び出し側に任せる）。
export const captureScrollSyncPoint = (
  mapping: ScrollSyncMapping,
  focusedElement: Element | null = null,
): ScrollSyncPoint | null => {
  const entries = mapping.flatMap((entry) => {
    const element = document.getElementById(entry.sourceId);
    if (!element) {
      return [];
    }
    const { top, bottom } = element.getBoundingClientRect();
    return [{ element, targetIds: entry.targetIds, top, bottom }];
  });

  // 画面上部の帯（目次の現在地と同じ範囲）にかかっている項目を「見ている所」とみなす
  const band = {
    top: CURRENT_SECTION_BAND_TOP_PX,
    bottom: (window.innerHeight * CURRENT_SECTION_BAND_BOTTOM_PERCENT) / 100,
  };
  // ただし入力中の項目が画面に見えていれば、そちらを優先する。
  // 入力欄が帯より下にあっても、見ているのはその項目のため。
  const focusedIndex = findFocusedIndex(
    entries.map((entry) => entry.element),
    focusedElement,
  );
  // 入力中の項目が無く、ページ先頭にいるときは、切替後もページ先頭のままにする。
  // 入力が短く全体が画面に収まると最下部の判定に当たり、縦に長い画面では先頭でも項目が帯にかかるため、
  // 先頭を見ているのに画面の高さによって別の所へ移ってしまうのを防ぐ。
  if (focusedIndex < 0 && window.scrollY <= 0) {
    return null;
  }
  const index =
    focusedIndex >= 0
      ? focusedIndex
      : pickCurrentIndex(entries, band, isScrolledToBottom());
  if (index < 0) {
    return null;
  }

  const current = entries[index];
  // 項目の先頭が画面外やヘッダーの裏にあるときはヘッダーに隠れない位置へ、
  // 帯より下にあるときは帯の下端へ寄せる
  return {
    targetIds: current.targetIds,
    offset: Math.min(
      Math.max(current.top, MIN_OFFSET),
      Math.max(band.bottom, MIN_OFFSET),
    ),
  };
};

// 切替後の画面で、対応する項目を切替前と同じ高さへ移す。
// 対応先がどれも見つからないときはページ先頭へ移す。
export const scrollToSyncPoint = ({ targetIds, offset }: ScrollSyncPoint) => {
  const target = targetIds
    .map((id) => document.getElementById(id))
    .find((element) => element !== null);

  // 対応先の画面上の位置を、ページ先頭からの位置に直してスクロール先を求める
  const targetTop = target ? target.getBoundingClientRect().top : null;
  const top = targetTop === null ? 0 : window.scrollY + targetTop - offset;

  // html の scroll-behavior: smooth を打ち消し、切替と同時に表示位置を合わせる
  window.scrollTo({ top, behavior: "instant" });
};
