import type { SessionLoginMethod } from '@server/interfaces/api/userSettingsInterfaces';
import 'express-session';

// Declaration merging to apply our own types to SessionData
// See: (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-session/index.d.ts#L23)
declare module 'express-session' {
  export interface SessionData {
    userId: number;
    meta?: {
      createdAt: string;
      ip?: string;
      userAgent?: string;
      loginMethod: SessionLoginMethod;
    };
    pushEndpoint?: string;
  }
}
