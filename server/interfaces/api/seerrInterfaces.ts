export interface SeerrQuotaResponse {
  movieQuotaLimit: number | null;
  movieQuotaDays: number | null;
  tvQuotaLimit: number | null;
  tvQuotaDays: number | null;
}

export interface SeerrNotificationsResponse {
  enabledAgents: string[];
}
