import type Invite from '@server/entity/Invite';
import type { PaginatedResponse } from './common';

export interface InviteResultsResponse extends PaginatedResponse {
  results: Invite[];
}
