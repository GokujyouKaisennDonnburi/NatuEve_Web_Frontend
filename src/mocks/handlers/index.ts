import { eventHandlers } from "./events";
import { uploadHandlers } from "./uploads";
import { userHandlers } from "./user";

export const handlers = [...userHandlers, ...eventHandlers, ...uploadHandlers];
