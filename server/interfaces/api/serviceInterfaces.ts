export interface ServiceCommonServer {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
}

export interface ServiceCommonServerWithDetails {
  server: ServiceCommonServer;
}
