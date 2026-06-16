import type Newsletter from '@server/entity/Newsletter';
import type {
  NewsletterBlockConfig,
  NewsletterBodyFormat,
  NewsletterRecipientMode,
  NewsletterScheduleType,
} from '@server/entity/Newsletter';
import type NewsletterHistory from '@server/entity/NewsletterHistory';
import type { PaginatedResponse } from './common';

export interface NewsletterResultsResponse extends PaginatedResponse {
  results: Newsletter[];
}

export interface NewsletterHistoryResultsResponse extends PaginatedResponse {
  results: NewsletterHistory[];
}

export type NewsletterBody = {
  name: string;
  subject: string;
  description?: string | null;
  body?: string;
  bodyFormat?: NewsletterBodyFormat;
  blocks?: NewsletterBlockConfig;
  recipientMode?: NewsletterRecipientMode;
  recipientIds?: number[];
  isImportant?: boolean;
  enabled?: boolean;
  scheduleType?: NewsletterScheduleType;
  cronSchedule?: string | null;
  sendAt?: string | null;
};

export interface NewsletterSendResult {
  newsletterId: number;
  recipientCount: number;
  failureCount: number;
}

export interface NewsletterVariable {
  token: string;
  description: string;
}

export interface NewsletterVariablesResponse {
  tokens: NewsletterVariable[];
  blocks: NewsletterVariable[];
}
