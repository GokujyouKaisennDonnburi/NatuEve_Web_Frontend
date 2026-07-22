// このファイルは、新しいイベント作成モックエンドポイントを定義する。
// POST /api/v1/events。要認証。
// 本番のサーバー側バリデーションを模す。
import { HttpResponse, http } from "msw";

import { MAX_TAG_COUNT } from "@/constants/config";
import { tagStore } from "@/mocks/handlers/tags";

import {
  TOKEN_TO_PROFILE_ID,
  getBearerToken,
  hasBearerToken,
  unauthorizedResponse,
} from "./auth";
import type { MockEvent } from "./data";
import { mockEventDetails, mockEvents } from "./data";
import { seedMembersForNewEvent } from "./participation";

export const eventCreateHandler = http.post(
  "/api/v1/events",
  async ({ request }) => {
    const authorizationHeader = request.headers.get("authorization");

    // 認証トークンが無効な場合は401エラーを返す
    if (!hasBearerToken(authorizationHeader)) {
      return unauthorizedResponse();
    }

    const token = getBearerToken(authorizationHeader);
    if (!TOKEN_TO_PROFILE_ID[token]) {
      return unauthorizedResponse();
    }

    // リクエストボディを取得する。本番 CreateEventRequest と同じ契約を想定する。
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      location?: unknown;
      eventDate?: unknown;
      costs?: unknown;
      capacity?: unknown;
      externalUrl?: unknown;
      items?: unknown;
      tagIds?: unknown;
      imageObjectKeys?: unknown;
      imageUrls?: unknown;
      imageFilenames?: unknown;
      pdfObjectKeys?: unknown;
      pdfUrls?: unknown;
      pdfFilenames?: unknown;
    };

    // 本番のサーバー側バリデーションを模し、必須項目が欠ける場合は 400 を返す。
    const hasTitle = typeof body.title === "string" && body.title.length > 0;
    const hasDescription =
      typeof body.description === "string" && body.description.length > 0;
    const hasLocation =
      typeof body.location === "string" && body.location.length > 0;
    const hasEventDate = typeof body.eventDate === "string";
    const hasCosts = Array.isArray(body.costs) && body.costs.length > 0;

    // 必須項目が欠けている場合は400エラーを返す
    if (
      !hasTitle ||
      !hasDescription ||
      !hasLocation ||
      !hasEventDate ||
      !hasCosts
    ) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "リクエストボディが不正です",
          },
        },
        { status: 400 },
      );
    }

    // タグIDのサーバー側バリデーション(任意項目)。本番仕様に合わせて
    // 配列・UUID形式・件数をここで検証する。
    let resolvedTags: Array<{ id: string; name: string }> | undefined;
    if (body.tagIds !== undefined && body.tagIds !== null) {
      if (!Array.isArray(body.tagIds)) {
        return HttpResponse.json(
          {
            error: {
              code: "invalid_request",
              message: "タグIDの形式が不正です",
            },
          },
          { status: 400 },
        );
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const candidateTagIds: string[] = [];
      for (const value of body.tagIds) {
        if (typeof value !== "string") {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: "タグIDは文字列で指定してください",
              },
            },
            { status: 400 },
          );
        }
        const trimmed = value.trim();
        if (!uuidRegex.test(trimmed)) {
          return HttpResponse.json(
            {
              error: {
                code: "invalid_request",
                message: "タグIDはUUID形式で指定してください",
              },
            },
            { status: 400 },
          );
        }
        candidateTagIds.push(trimmed);
      }

      if (candidateTagIds.length > MAX_TAG_COUNT) {
        return HttpResponse.json(
          {
            error: {
              code: "invalid_request",
              message: `タグは最大${MAX_TAG_COUNT}件までです`,
            },
          },
          { status: 400 },
        );
      }

      resolvedTags =
        candidateTagIds.length > 0
          ? candidateTagIds
              .map((id) => {
                // tagStore から一致するタグを検索（id で検索）
                for (const entry of tagStore.values()) {
                  if (entry.id === id) {
                    return { id: entry.id, name: entry.name };
                  }
                }
                return null;
              })
              .filter(
                (entry): entry is { id: string; name: string } =>
                  entry !== null,
              )
          : undefined;
    }

    // 新しいイベントを構築してメモリに追加する
    const eventId = crypto.randomUUID();
    const newEvent: MockEvent = {
      id: eventId,
      title: body.title as string,
      location: body.location as string,
      eventDate: body.eventDate as string,
      profileId: "mock-user-1",
      profile: {
        id: "mock-user-1",
        displayName: "Aoi Tanaka",
        avatarUrl: "https://i.pravatar.cc/150?img=1",
      },
      createdAt: new Date().toISOString(),
    };

    mockEvents.push(newEvent);
    mockEventDetails.set(eventId, {
      ...newEvent,
      organizerName: newEvent.profile.displayName,
      organizerAvatarUrl: newEvent.profile.avatarUrl,
      description: body.description as string,
      capacity: typeof body.capacity === "number" ? body.capacity : undefined,
      externalUrl:
        typeof body.externalUrl === "string" && body.externalUrl.length > 0
          ? body.externalUrl
          : undefined,
      costs: Array.isArray(body.costs)
        ? body.costs.map((cost) => {
            const item = cost as {
              category?: unknown;
              cost?: unknown;
            };

            return {
              category: typeof item.category === "string" ? item.category : "",
              cost: typeof item.cost === "number" ? item.cost : 0,
            };
          })
        : [],
      items: Array.isArray(body.items)
        ? body.items.map((item) => {
            const entry = item as {
              item?: unknown;
              isRequired?: unknown;
            };

            return {
              item: typeof entry.item === "string" ? entry.item : "",
              isRequired: entry.isRequired === true,
            };
          })
        : undefined,
      imageObjectKeys: Array.isArray(body.imageObjectKeys)
        ? body.imageObjectKeys.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      imageUrls: Array.isArray(body.imageUrls)
        ? (body.imageUrls as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      imageFilenames: Array.isArray(body.imageFilenames)
        ? body.imageFilenames.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      pdfObjectKeys: Array.isArray(body.pdfObjectKeys)
        ? body.pdfObjectKeys.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      pdfUrls: Array.isArray(body.pdfUrls)
        ? (body.pdfUrls as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      pdfFilenames: Array.isArray(body.pdfFilenames)
        ? body.pdfFilenames.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      tags: resolvedTags,
    });

    // 主催者画面（参加者一覧）の動作確認用に、新規イベントに参加者モックをシードする。
    seedMembersForNewEvent(eventId);

    // 本番と同形の CreateEventResponse（id / createdAt）を返す。
    return HttpResponse.json(
      {
        id: eventId,
        createdAt: newEvent.createdAt,
      },
      { status: 201 },
    );
  },
);
