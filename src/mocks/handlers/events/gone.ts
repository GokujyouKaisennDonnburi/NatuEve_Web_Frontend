// このファイルは、取りやめ済みのイベントに対するモックの判定と 410 レスポンスを定義する
// （NatuEve_API#314・ADR-0008）。
import { HttpResponse } from "msw";

import { mockEventDetails } from "./data";
import { cancelledEventIds } from "./participation";

// キャンセル API で取りやめた ID か、詳細データに cancelledAt を持つイベントなら true。
export const isCancelledMockEvent = (id: string): boolean =>
  cancelledEventIds.has(id) || mockEventDetails.get(id)?.cancelledAt != null;

// 取りやめ済みのイベントの 410 Gone レスポンス。
// 本文の code は API 側で検討中のため仮の値。フロントは本文に依存しない。
export const eventGoneResponse = () =>
  HttpResponse.json(
    { error: { code: "event_gone", message: "イベントは削除されました" } },
    { status: 410 },
  );
