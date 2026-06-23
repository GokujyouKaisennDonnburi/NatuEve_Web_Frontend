import { eventHandlers } from './events';
import { userHandlers } from "./user";

export const handlers = [
    ...userHandlers, 
    ...eventHandlers
];
