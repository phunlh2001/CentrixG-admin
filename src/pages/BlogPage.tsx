import React, { useState, useCallback, useMemo } from 'react';
import type { BlogPost, DynamicFormFieldSchema } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BlogPageProps {
  posts: BlogPost[];
  onCreatePost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

const BLOG_FORM_SCHEMA: DynamicFormFieldSchema[] = [
  {
    name: 'title',
    label: 'Article Title',
    type: 'text',
    placeholder: 'e.g. Steam Rental Service System Upgrade 2.0',
    required: true,
  },
  {
    name: 'author',
    label: 'Author Name',
    type: 'text',
    placeholder: 'e.g. Centrix Admin Team',
    required: true,
  },
  {
    name: 'status',
    label: 'Publication Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Published', value: 'published' },
      { label: 'Draft', value: 'draft' },
    ],
  },
  {
    name: 'content',
    label: 'Article Body / News Content',
    type: 'textarea',
    placeholder: 'Write the announcement news or site updates here...',
    required: true,
  },
];

export const BlogPage: React.FC<BlogPageProps> = React.memo(({
  posts,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
}) => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPosts = useMemo(() => {
    return posts.filter(p =>
      (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
      (p.author && p.author.toLowerCase().includes(search.toLowerCase())) ||
      (p.content && p.content.toLowerCase().includes(search.toLowerCase()))
    );
  }, [posts, search]);

  const handleCreateSubmit = useCallback(async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await onCreatePost({
        title: values.title,
        slug,
        author: values.author,
        content: values.content,
        status: values.status || 'published',
      });
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [onCreatePost]);

  const handleEditSubmit = useCallback(async (values: Record<string, any>) => {
    if (!editingPost) return;
    setIsSubmitting(true);
    try {
      const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await onUpdatePost(editingPost.id, {
        title: values.title,
        slug,
        author: values.author,
        content: values.content,
        status: values.status,
      });
      setEditingPost(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingPost, onUpdatePost]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this news article?')) {
      await onDeletePost(id);
    }
  }, [onDeletePost]);

  // Memoized Table Rows
  const tableRows = useMemo(() => {
    if (filteredPosts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>No news articles available</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredPosts.map(post => (
      <TableRow key={post.id}>
        <TableCell className="font-medium max-w-xs">
          <div className="text-slate-900 font-semibold text-sm line-clamp-1">{post.title}</div>
          <div className="text-xs text-slate-400 font-mono">/{post.slug}</div>
        </TableCell>
        <TableCell className="text-xs text-slate-600 font-medium">
          {post.author}
        </TableCell>
        <TableCell>
          <Badge variant={post.status === 'published' ? 'active' : 'secondary'}>
            {post.status}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 font-mono">
          {new Date(post.updatedAt).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingPost(post)}
              className="h-8 gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(post.id)}
              className="h-8 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  }, [filteredPosts, handleDelete]);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search news by title or content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white"
          />
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Write News Article
        </Button>
      </div>

      {/* Blog Posts Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article Title & Slug</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>

      {/* Create Blog Post Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write New Site Announcement</DialogTitle>
            <DialogDescription>
              Publish news or updates about the rental games site to the database.
            </DialogDescription>
          </DialogHeader>
          <DynamicForm
            fields={BLOG_FORM_SCHEMA}
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
            submitText="Publish Article"
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Blog Post Modal */}
      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Article: {editingPost?.title}</DialogTitle>
            <DialogDescription>
              Update news body content or publication status.
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <DynamicForm
              fields={BLOG_FORM_SCHEMA}
              initialValues={{
                title: editingPost.title,
                author: editingPost.author,
                status: editingPost.status,
                content: editingPost.content,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingPost(null)}
              submitText="Save Changes"
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

BlogPage.displayName = 'BlogPage';
