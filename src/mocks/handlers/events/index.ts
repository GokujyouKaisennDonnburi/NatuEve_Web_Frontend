// このファイルは、events/ 配下の各機能単位ハンドラーを集約し eventHandlers を公開する。
// 元は単一ファイル src/mocks/handlers/events.ts で構成されていたが、
// 機能単位（一覧・詳細・参加・キャンセルなど）に分割して保守性を向上させている。
import { eventCancelHandler } from "./cancel";
import { eventCreateHandler } from "./create";
import { eventDetailHandler } from "./detail";
import { eventJoinHandler } from "./join";
import { eventLeaveHandler } from "./leave";
import { eventListHandler } from "./list";
import { eventMembersHandler } from "./members";
import { eventNotificationHandler } from "./notifications";
import { eventParticipationLogsHandler } from "./participation-logs";
import { eventReportHandler } from "./report";

export const eventHandlers = [
  eventListHandler,
  eventDetailHandler,
  eventReportHandler,
  eventCancelHandler,
  eventNotificationHandler,
  eventCreateHandler,
  eventJoinHandler,
  eventMembersHandler,
  eventParticipationLogsHandler,
  eventLeaveHandler,
];
