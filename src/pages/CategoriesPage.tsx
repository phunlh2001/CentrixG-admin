import React, { useState } from 'react';
import type { Category, DynamicFormFieldSchema } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Search, FolderKanban } from 'lucide-react';

interface CategoriesPageProps {
  categories: Category[];
  onCreateCategory: (data: Omit<Category, 'id' | 'createdAt' | 'productCount'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const CATEGORY_FORM_SCHEMA: DynamicFormFieldSchema[] = [
  {
    name: 'name',
    label: 'Category Name',
    type: 'text',
    placeholder: 'e.g. Action RPG or Open World',
    required: true,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Brief summary of games belonging to this category...',
  },
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onCreateCategory({
        name: values.name,
        description: values.description || '',
      });
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!editingCategory) return;
    setIsSubmitting(true);
    try {
      await onUpdateCategory(editingCategory.id, {
        name: values.name,
        description: values.description || '',
      });
      setEditingCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await onDeleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search categories by name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Category
        </Button>
      </div>

      {/* Categories Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category Name & Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Product Count</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
                No categories available
              </TableCell>
            </TableRow>
          ) : (
            filteredCategories.map(cat => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-semibold text-sm">{cat.name}</div>
                    <div className="text-xs text-slate-400 font-mono">/{cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs text-slate-600 max-w-sm truncate">
                {cat.description || '—'}
              </TableCell>
              <TableCell className="text-xs font-semibold text-slate-800">
                {cat.productCount ?? 0} games
              </TableCell>
              <TableCell className="text-xs text-slate-500 font-mono">
                {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCategory(cat)}
                    className="h-8 gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(cat.id)}
                    className="h-8 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>

      {/* Create Category Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new game category for catalog organization.
            </DialogDescription>
          </DialogHeader>
          <DynamicForm
            fields={CATEGORY_FORM_SCHEMA}
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
            submitText="Create Category"
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category: {editingCategory?.name}</DialogTitle>
            <DialogDescription>
              Update category name or description.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <DynamicForm
              fields={CATEGORY_FORM_SCHEMA}
              initialValues={{
                name: editingCategory.name,
                description: editingCategory.description,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingCategory(null)}
              submitText="Update Category"
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
