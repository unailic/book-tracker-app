export interface Book {
  id?: string;
  catalogueBookId?: string;
  title: string;
  author: string;
  genre?: string;
  status: 'reading' | 'planned' | 'finished';
  rating?: number;
  notes?: string;
  userId: string;
}