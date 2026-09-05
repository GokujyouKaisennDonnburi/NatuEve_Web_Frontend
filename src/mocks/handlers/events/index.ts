// このファイルは、events/ 配下の各機能単位ハンドラーを集約し eventHandlers を公開する。
import { eventAbsenceHandler } from "./absence";
import { eventCancelHandler } from "./cancel";
import { eventCreateHandler } from "./create";
import { eventDetailHandler } from "./detail";
import { eventJoinHandler } from "./join";
import { eventLeaveHandler } from "./leave";
import { eventListHandler } from "./list";
import { eventMembersHandler } from "./members";
import { eventMyApplicationHandler } from "./members-me";
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
  eventMyApplicationHandler,
  eventParticipationLogsHandler,
  eventLeaveHandler,
  eventAbsenceHandler,
];
