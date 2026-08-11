export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}
