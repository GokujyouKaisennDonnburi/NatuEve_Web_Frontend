import { eventHandlers } from "./events";
import { tagHandlers } from "./tags";
import { uploadHandlers } from "./uploads";
import { userHandlers } from "./user";

export const handlers = [
  ...userHandlers,
  ...eventHandlers,
  ...tagHandlers,
  ...uploadHandlers,
];
