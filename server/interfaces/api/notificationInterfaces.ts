import type Notification from '@server/entity/Notification';
import type { PaginatedResponse } from './common';
import type { User } from '@server/entity/User';
import type {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';

export interface NotificationResultsResponse extends PaginatedResponse {
  results: Notification[];
}

export type NotificationBody = {
  userId?: number;
  notifyUser: User;
  type: NotificationType;
  severity: NotificationSeverity;
  subject: string;
  message: string;
  isRead?: boolean;
  actionUrl?: string;
  actionUrlTitle?: string;
};
