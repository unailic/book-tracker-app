export interface Book {
  id?: string;
  title: string;
  author: string;
  status: 'reading' | 'planned' | 'finished';
  rating?: number;
  notes?: string;
  userId: string;
}