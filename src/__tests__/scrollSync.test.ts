import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  captureScrollSyncPoint,
  pickCurrentIndex,
  scrollToSyncPoint,
} from "@/utils/scrollSync";

// 実装側の MIN_OFFSET（= 現在位置の帯の上端）と同じ値。実装が変わったときにテストが気づけるよう、あえてここでも明示している。
const MIN_OFFSET = 96;
// 既定の innerHeight 900 のときの帯の下端（900 の 30%）。帯は [96, 270]。
const BAND_BOTTOM = 270;
const BAND = { top: MIN_OFFSET, bottom: BAND_BOTTOM };

// jsdom はレイアウトを持たないため、要素の上端・下端位置は getBoundingClientRect を差し替えて与える。
// bottom を省略したときは高さ 100 の要素として扱う。
function addElement(id: string, top: number, bottom = top + 100): HTMLElement {
  const element = document.createElement("div");
  element.id = id;
  document.body.appendChild(element);
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top,
    bottom,
  } as DOMRect);
  return element;
}

// フォーカス要素用。parent の子として作り、上端・下端の位置を差し替える。
function addChild(
  parent: HTMLElement,
  top: number,
  bottom: number,
): HTMLElement {
  const element = document.createElement("input");
  parent.appendChild(element);
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top,
    bottom,
  } as DOMRect);
  return element;
}

// 書き換えたウィンドウ・ドキュメントの値は、テスト後に元へ戻す。
const originals = new Map<string, PropertyDescriptor | undefined>();

function defineWindow(key: "innerHeight" | "scrollY", value: number) {
  if (!originals.has(key)) {
    originals.set(key, Object.getOwnPropertyDescriptor(window, key));
  }
  Object.defineProperty(window, key, { value, configurable: true });
}

function defineScrollHeight(value: number) {
  const key = "scrollHeight";
  if (!originals.has(key)) {
    originals.set(
      key,
      Object.getOwnPropertyDescriptor(document.documentElement, key),
    );
  }
  Object.defineProperty(document.documentElement, key, {
    value,
    configurable: true,
  });
}

beforeEach(() => {
  // 既定は最下部ではない状態（innerHeight 900 → 帯 [96, 270]）
  defineWindow("innerHeight", 900);
  defineWindow("scrollY", 0);
  defineScrollHeight(5000);
});

afterEach(() => {
  originals.forEach((descriptor, key) => {
    const target = key === "scrollHeight" ? document.documentElement : window;
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    } else {
      Reflect.deleteProperty(target, key);
    }
  });
  originals.clear();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("pickCurrentIndex", () => {
  it("帯にかかる項目のうち、一番上（並び順で最初）の添字を返す", () => {
    const ranges = [
      { top: -200, bottom: -100 },
      { top: -50, bottom: 120 },
      { top: 150, bottom: 400 },
      { top: 500, bottom: 700 },
    ];
    expect(pickCurrentIndex(ranges, BAND, false)).toBe(1);
  });

  it("目次で「タグ」へ飛んだ状態では、タグを採用する", () => {
    // innerHeight 800 → 帯 [96, 240]。タイトルは帯より上に抜け、タグと開催情報（top=226）が帯にかかる。
    // 帯にかかる一番上のタグを採用する。
    const ranges = [
      { top: -66, bottom: 64 },
      { top: 80, bottom: 210 },
      { top: 226, bottom: 700 },
    ];
    expect(pickCurrentIndex(ranges, { top: 96, bottom: 240 }, false)).toBe(1);
  });

  it("前の項目の下端がわずかに帯にかかるだけでも、その（上の）項目を採用する", () => {
    const ranges = [
      { top: -300, bottom: MIN_OFFSET + 1 },
      { top: MIN_OFFSET + 5, bottom: 500 },
    ];
    expect(pickCurrentIndex(ranges, BAND, false)).toBe(0);
  });

  it("端が接しているだけ（下端が帯の上端・上端が帯の下端）でもかかっているとみなす", () => {
    expect(
      pickCurrentIndex([{ top: -300, bottom: MIN_OFFSET }], BAND, false),
    ).toBe(0);
    expect(
      pickCurrentIndex(
        [
          { top: -300, bottom: MIN_OFFSET - 1 },
          { top: BAND_BOTTOM, bottom: 500 },
        ],
        BAND,
        false,
      ),
    ).toBe(1);
  });

  it("帯にかかる項目が無ければ -1 を返す", () => {
    const ranges = [
      { top: -300, bottom: MIN_OFFSET - 1 },
      { top: BAND_BOTTOM + 1, bottom: 500 },
    ];
    expect(pickCurrentIndex(ranges, BAND, false)).toBe(-1);
  });

  it("最下部では帯に関係なく最後の添字を返す", () => {
    const ranges = [
      { top: 0, bottom: 100 },
      { top: 100, bottom: 200 },
      { top: 800, bottom: 850 },
    ];
    expect(pickCurrentIndex(ranges, BAND, true)).toBe(2);
  });
});

describe("captureScrollSyncPoint", () => {
  it("帯にかかる一番上の項目の targetIds と、その上端を offset として返す", () => {
    addElement("a", -100);
    addElement("b", 200);
    addElement("c", 500);

    const point = captureScrollSyncPoint([
      { sourceId: "a", targetIds: ["ta"] },
      { sourceId: "b", targetIds: ["tb1", "tb2"] },
      { sourceId: "c", targetIds: ["tc"] },
    ]);

    expect(point).toEqual({ targetIds: ["tb1", "tb2"], offset: 200 });
  });

  it("目次で「タグ」へ飛んだ状態では、タグの位置を返す", () => {
    // innerHeight 800 → 帯 [96, 240]。タイトルは帯より上に抜け、タグと開催情報（top=226）が帯にかかる。
    // 帯にかかる一番上のタグを採用する。offset はタグの上端 80 が下限 96 未満のため 96 に切り上がる。
    defineWindow("innerHeight", 800);
    addElement("title", -66, 64);
    addElement("tag", 80, 210);
    addElement("info", 226, 700);

    const point = captureScrollSyncPoint([
      { sourceId: "title", targetIds: ["t-title"] },
      { sourceId: "tag", targetIds: ["t-tag"] },
      { sourceId: "info", targetIds: ["t-info"] },
    ]);

    expect(point).toEqual({ targetIds: ["t-tag"], offset: 96 });
  });

  it("前の項目の下端がわずかに帯にかかるだけでも、その項目を採用する", () => {
    addElement("a", -300, MIN_OFFSET + 1);
    addElement("b", 150);

    const point = captureScrollSyncPoint([
      { sourceId: "a", targetIds: ["ta"] },
      { sourceId: "b", targetIds: ["tb"] },
    ]);

    expect(point?.targetIds).toEqual(["ta"]);
  });

  it("offset は下限 96 にクランプされる（上端が画面外・ヘッダーの裏のとき）", () => {
    // 上端が画面外（負）。a が帯にかかる一番上
    addElement("a", -500, 300);
    expect(
      captureScrollSyncPoint([{ sourceId: "a", targetIds: ["ta"] }]),
    ).toEqual({ targetIds: ["ta"], offset: MIN_OFFSET });

    // 上端がヘッダーの裏（0 以上 96 未満）
    document.body.innerHTML = "";
    addElement("b", MIN_OFFSET - 1, 300);
    expect(
      captureScrollSyncPoint([{ sourceId: "b", targetIds: ["tb"] }]),
    ).toEqual({ targetIds: ["tb"], offset: MIN_OFFSET });
  });

  it("帯の下端ちょうどに上端がある項目も採用され、offset はその位置になる", () => {
    addElement("a", BAND_BOTTOM);
    expect(
      captureScrollSyncPoint([{ sourceId: "a", targetIds: ["ta"] }]),
    ).toEqual({ targetIds: ["ta"], offset: BAND_BOTTOM });
  });

  it("画面が低く帯の下端が 96 未満でも、offset は 96 を下回らない", () => {
    // innerHeight 200 → 帯の下端 60。上端 60 以下の項目だけが帯にかかる
    defineWindow("innerHeight", 200);
    addElement("a", MIN_OFFSET - 40, 500);
    addElement("b", MIN_OFFSET - 35);

    expect(
      captureScrollSyncPoint([
        { sourceId: "a", targetIds: ["ta"] },
        { sourceId: "b", targetIds: ["tb"] },
      ]),
    ).toEqual({ targetIds: ["ta"], offset: MIN_OFFSET });

    // 上端が帯の下端（60）より下の項目はかからない
    document.body.innerHTML = "";
    addElement("c", 61, 500);
    expect(
      captureScrollSyncPoint([{ sourceId: "c", targetIds: ["tc"] }]),
    ).toBeNull();
  });

  it("存在しない sourceId はスキップして判定する", () => {
    addElement("b", 100);

    const point = captureScrollSyncPoint([
      { sourceId: "missing", targetIds: ["tm"] },
      { sourceId: "b", targetIds: ["tb"] },
    ]);

    expect(point).toEqual({ targetIds: ["tb"], offset: 100 });
  });

  it("最下部では最後の項目が帯より下でもそれを採用する", () => {
    addElement("a", 100);
    addElement("b", 700);
    // innerHeight + scrollY = scrollHeight - 2 ちょうどで最下部扱い
    defineWindow("scrollY", 4098);

    const point = captureScrollSyncPoint([
      { sourceId: "a", targetIds: ["ta"] },
      { sourceId: "b", targetIds: ["tb"] },
    ]);

    // offset は上限（帯の下端 270）にクランプされる
    expect(point).toEqual({ targetIds: ["tb"], offset: BAND_BOTTOM });
  });

  it("最下部まで 3px 残っていれば最下部扱いにせず、帯にかかる項目が無ければ null を返す", () => {
    addElement("a", 400);
    defineWindow("scrollY", 4097);

    expect(
      captureScrollSyncPoint([{ sourceId: "a", targetIds: ["ta"] }]),
    ).toBeNull();
  });
});

describe("captureScrollSyncPoint（フォーカス要素の優先）", () => {
  const mapping = [
    { sourceId: "a", targetIds: ["ta"] },
    { sourceId: "b", targetIds: ["tb"] },
  ];

  // フォーカス要素を b の子に置き、帯にかかる一番上が a（フォーカス無視なら ta になる）という配置にする
  function addItems() {
    addElement("a", -50, 150);
    return addElement("b", 200, 500);
  }

  it("帯が別の項目にかかっていても、見えているフォーカス要素を含む項目を採用する", () => {
    // タグ入力の例: 上の項目 a が帯にかかっていても、入力中の b を見ている
    const b = addItems();
    const input = addChild(b, 300, 350);

    expect(captureScrollSyncPoint(mapping, input)).toEqual({
      targetIds: ["tb"],
      offset: 200,
    });
  });

  it("フォーカス要素の下端が 96 以下（ヘッダーの裏）なら見えていないとみなし、無視して帯で判定する", () => {
    const b = addItems();

    // 下端がちょうど 96 は見えていない扱い
    const hidden = addChild(b, 60, MIN_OFFSET);
    expect(captureScrollSyncPoint(mapping, hidden)?.targetIds).toEqual(["ta"]);
  });

  it("画面の端で切れているフォーカス要素は、入力したままスクロールしたとみなして無視する", () => {
    const b = addItems();

    // 上端が画面より上に出ている
    const cutTop = addChild(b, -10, 120);
    expect(captureScrollSyncPoint(mapping, cutTop)?.targetIds).toEqual(["ta"]);

    // 下端が画面より下に出ている
    const cutBottom = addChild(b, 880, 920);
    expect(captureScrollSyncPoint(mapping, cutBottom)?.targetIds).toEqual([
      "ta",
    ]);

    // 画面より完全に下（上端が innerHeight ちょうど）も同じ
    const below = addChild(b, 900, 940);
    expect(captureScrollSyncPoint(mapping, below)?.targetIds).toEqual(["ta"]);

    // 画面内に収まっていれば（上端 0・下端 innerHeight ちょうど）対象にする
    const fits = addChild(b, 0, 900);
    expect(captureScrollSyncPoint(mapping, fits)?.targetIds).toEqual(["tb"]);
  });

  it("フォーカス要素がどの項目にも含まれない（切替ボタン側・body など）なら帯で判定する", () => {
    addItems();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    vi.spyOn(outside, "getBoundingClientRect").mockReturnValue({
      top: 300,
      bottom: 350,
    } as DOMRect);

    expect(captureScrollSyncPoint(mapping, outside)?.targetIds).toEqual(["ta"]);
    expect(captureScrollSyncPoint(mapping, document.body)?.targetIds).toEqual([
      "ta",
    ]);
  });

  it("最下部でも、見えているフォーカス要素があればそちらを優先する", () => {
    const a = addElement("a", 100);
    addElement("b", 700);
    defineWindow("scrollY", 4098);
    const input = addChild(a, 150, 200);

    expect(captureScrollSyncPoint(mapping, input)).toEqual({
      targetIds: ["ta"],
      offset: 100,
    });
  });

  it("優先した項目の offset も [96, 帯の下端] にクランプされる", () => {
    // 上端が帯の下端（270）より下 → 270
    addElement("a", -50, 150);
    const lowerItem = addElement("b", 500, 700);
    const lower = addChild(lowerItem, 520, 560);
    expect(captureScrollSyncPoint(mapping, lower)).toEqual({
      targetIds: ["tb"],
      offset: BAND_BOTTOM,
    });

    // 上端が画面外（項目が長く、フォーカス要素だけ見えている）→ 96
    document.body.innerHTML = "";
    addElement("a", -700, -600);
    const upperItem = addElement("b", -500, 300);
    const upper = addChild(upperItem, 150, 200);
    expect(captureScrollSyncPoint(mapping, upper)).toEqual({
      targetIds: ["tb"],
      offset: MIN_OFFSET,
    });
  });
});

describe("scrollToSyncPoint", () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    vi.spyOn(window, "scrollTo").mockImplementation(scrollTo);
  });

  it("対応先の上端が offset の位置に来るよう、scrollY を加味して instant でスクロールする", () => {
    defineWindow("scrollY", 1000);
    addElement("t", 500);

    scrollToSyncPoint({ targetIds: ["t"], offset: 200 });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1300, behavior: "instant" });
  });

  it("targetIds の先頭から存在するものを採用し、見つからないものは飛ばす", () => {
    addElement("second", 400);
    addElement("third", 900);

    scrollToSyncPoint({ targetIds: ["first", "second", "third"], offset: 100 });

    expect(scrollTo).toHaveBeenCalledWith({ top: 300, behavior: "instant" });
  });

  it("先頭の候補が存在すれば、後ろの候補があってもそちらを優先する", () => {
    addElement("first", 250);
    addElement("second", 900);

    scrollToSyncPoint({ targetIds: ["first", "second"], offset: 50 });

    expect(scrollTo).toHaveBeenCalledWith({ top: 200, behavior: "instant" });
  });

  it("どの候補も存在しないときはページ先頭へ移す", () => {
    defineWindow("scrollY", 1000);

    scrollToSyncPoint({ targetIds: ["none1", "none2"], offset: 200 });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("targetIds が空のときもページ先頭へ移す", () => {
    defineWindow("scrollY", 1000);

    scrollToSyncPoint({ targetIds: [], offset: 200 });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });
});
