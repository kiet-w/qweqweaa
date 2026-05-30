export type Category = 'Cooking' | 'Tech' | 'Personal' | 'Other';
export type Status = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Note {
  id: string;
  content: string;
  title?: string;
  category?: Category;
  summary?: string;
  bullets?: string[];
  status: Status;
  createdAt: string;
}
