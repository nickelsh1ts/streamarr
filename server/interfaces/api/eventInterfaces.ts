export type EventBody = {
  type: string;
  params: Record<string, unknown>;
  categories: string[];
  description: string;
  end: Date;
  dtstamp: Date;
  start: Date;
  sequence: number;
  status: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  summary: string;
  uid: string;
  userId?: number;
};
