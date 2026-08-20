import React, { useState, useEffect, useRef } from 'react';
import type { Product, DynamicFormFieldSchema, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Edit2, Search, ChevronLeft, ChevronRight, Tag, Loader2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import productApi from '@/api/productApi';

interface ProductsPageProps {
  onCreateProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
}

const CATEGORIES = [
  { label: 'Rockstar', value: 'Rockstar' },
  { label: 'Ubisoft', value: 'Ubisoft' },
  { label: 'EA', value: 'EA' },
];

// Edit Form Schema
const EDIT_PRODUCT_FORM_SCHEMA: DynamicFormFieldSchema[] = [
  {
    name: 'name',
    label: 'Game Title / Name',
    type: 'text',
    placeholder: 'e.g. Black Myth: Wukong',
    required: true,
  },
  {
    name: 'prices',
    label: 'Rental Price & Concurrencies',
    type: 'vnd-currency',
    required: true,
    description: 'Enter price in VND. USD ($) and CNY (¥) will automatically calculate.',
  },
  {
    name: 'imageUrl',
    label: 'Game Cover Image URL',
    type: 'text',
    placeholder: 'https://images.unsplash.com/...',
    required: true,
  },
  {
    name: 'disabled',
    label: 'Display on Web',
    type: 'toggle',
    description: 'Enable to show game on store frontend; toggle off to set disabled/hidden flag.',
    defaultValue: false,
  },
  {
    name: 'isDenuvo',
    label: 'Denuvo',
    type: 'toggle',
    description: 'Toggle if this game belongs to Denuvo DRM',
    defaultValue: false,
  },
];

// Create Form Schema
const CREATE_PRODUCT_FORM_SCHEMA: DynamicFormFieldSchema[] = [
  {
    name: 'name',
    label: 'Game Title / Name',
    type: 'text',
    placeholder: 'e.g. Black Myth: Wukong',
    required: true,
  },
  {
    name: 'categories',
    label: 'Categories',
    type: 'select',
    description: 'Categories of the game.',
    options: CATEGORIES,
  },
  {
    name: 'prices',
    label: 'Rental Price & Concurrencies',
    type: 'vnd-currency',
    required: true,
    description: 'Enter price in VND. USD ($) and CNY (¥) will automatically calculate.',
  },
  {
    name: 'imageUrl',
    label: 'Game Cover Image URL',
    type: 'text',
    placeholder: 'https://images.unsplash.com/...',
    required: true,
  },
  {
    name: 'disabled',
    label: 'Display on Web',
    type: 'toggle',
    description: 'Enable to show game on store frontend; toggle off to set disabled/hidden flag.',
    defaultValue: false,
  },
];

export const ProductsPage: React.FC<ProductsPageProps> = React.memo(({
  onCreateProduct,
  onUpdateProduct,
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const isInitialMount = useRef(true);

  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Product>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input (skip initial mount to prevent duplicate fetch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadProducts = async (forceRefresh = false) => {
    // Only show full loading UI if we have no items cached or forceRefresh requested
    if (paginatedData.items.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await productApi.getAll({
        search: debouncedSearch,
        page,
        pageSize
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching paginated products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, page]);

  const handleCreateSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onCreateProduct({
        name: values.name,
        pricing: values.prices || { vnd: 0, usd: 0, cny: 0 },
        imageUrl: values.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
        isDelete: false,
        isDenuvo: values.isDenuvo,
        publisher: values.publisher,
        categories: values.categories,
      });
      setIsCreateModalOpen(false);
      await loadProducts(true); // Force refresh on creation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await onUpdateProduct(editingProduct.id, {
        name: values.name,
        pricing: values.prices,
        imageUrl: values.imageUrl,
        isDenuvo: Boolean(values.isDenuvo),
        isDelete: Boolean(values.isDelete),
        categories: values.categories,
      });
      setEditingProduct(null);
      await loadProducts(true); // Force refresh on edit change
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDisabled = async (product: Product, currentIsDelete: boolean) => {
    const newIsDelete = !currentIsDelete;
    // Optimistic UI update for Web Status (disabled/isDelete)
    setPaginatedData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === product.id ? { ...item, isDelete: newIsDelete, disabled: newIsDelete } : item
      ),
    }));

    try {
      await onUpdateProduct(product.id, { isDelete: newIsDelete });
    } catch (err) {
      console.error('Failed to update product web status:', err);
      // Revert on error
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === product.id ? { ...item, isDelete: currentIsDelete, disabled: currentIsDelete } : item
        ),
      }));
    }
  };

  const handleToggleDenuvo = async (product: Product, currentDenuvo: boolean) => {
    const newDenuvo = !currentDenuvo;
    // Optimistic UI update for Denuvo DRM status
    setPaginatedData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === product.id ? { ...item, isDenuvo: newDenuvo } : item
      ),
    }));

    try {
      await onUpdateProduct(product.id, { isDenuvo: newDenuvo });
    } catch (err) {
      console.error('Failed to update Denuvo status:', err);
      // Revert on error
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === product.id ? { ...item, isDenuvo: currentDenuvo } : item
        ),
      }));
    }
  };

  const handleSelectCategory = async (product: Product, categoryName: string) => {
    setUpdatingCategoryId(product.id);
    // Optimistic UI update: immediately change state so UI updates without lag
    setPaginatedData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === product.id
          ? {
              ...item,
              type: categoryName ? { id: item.type?.id || '', name: categoryName } : undefined,
            }
          : item
      ),
    }));

    try {
      await productApi.updateType(product.id, categoryName);
    } catch (err) {
      console.error('Failed to update product category:', err);
      await loadProducts(true); // revert state on failure
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Create New Product
        </Button> */}
      </div>

      {/* Products Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game Info</TableHead>
            <TableHead>Prices (VND / USD / CNY)</TableHead>
            <TableHead>Web Status</TableHead>
            <TableHead>Denuvo</TableHead>
            <TableHead>Category / Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && paginatedData.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
                Loading products...
              </TableCell>
            </TableRow>
          ) : paginatedData.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.items.map(product => (
              <TableRow key={product.id} className={product.isDelete ? 'bg-slate-50/70' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-slate-900 font-semibold text-sm">{product.name}</div>
                      {product.publisher && (
                        <div className="text-xs text-slate-400">{product.publisher}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-bold text-slate-900">{formatVND(Number(product.pricing.vnd))}</div>
                  <div className="text-[11px] text-slate-500">
                    {formatUSD(Number(product.pricing.usd))} • {formatCNY(Number(product.pricing.cny))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!product.isDelete}
                      onCheckedChange={() => handleToggleDisabled(product, product.isDelete)}
                    />
                    <Badge variant={!product.isDelete ? 'active' : 'disabled'}>
                      {!product.isDelete ? 'Displayed on Web' : 'Disabled (Hidden)'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.isDenuvo}
                      onCheckedChange={() => handleToggleDenuvo(product, product.isDenuvo)}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative inline-block">
                    <select
                      disabled={updatingCategoryId === product.id}
                      onChange={e => handleSelectCategory(product, e.target.value)}
                      value={product.type?.name ?? ''}
                      className={`appearance-none h-8 w-36 pl-8 pr-7 rounded-md border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                        product.type?.name === 'Rockstar'
                          ? 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100/80'
                          : product.type?.name === 'Ubisoft'
                          ? 'bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100/80'
                          : product.type?.name === 'EA'
                          ? 'bg-rose-50/80 text-rose-800 border-rose-200 hover:bg-rose-100/80'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <option value="" className="bg-white text-slate-600">Unassigned</option>
                      {CATEGORIES.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {updatingCategoryId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                      ) : (
                        <Tag className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </div>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingProduct(product)}
                    className="h-8 gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{paginatedData.items.length}</span> of{' '}
          <span className="font-bold text-slate-900">{paginatedData.total}</span> products (Page {paginatedData.page} of {paginatedData.totalPages})
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="h-8 gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>

          <div className="px-2 font-semibold text-slate-700">
            {page} / {paginatedData.totalPages || 1}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={page >= paginatedData.totalPages || loading}
            onClick={() => setPage(p => p + 1)}
            className="h-8 gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Create Product Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Rental Product</DialogTitle>
            <DialogDescription>
              Enter product details and price in VND with auto-calculated USD and CNY rates.
            </DialogDescription>
          </DialogHeader>
          <DynamicForm
            fields={CREATE_PRODUCT_FORM_SCHEMA}
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
            submitText="Create Product"
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product Details: {editingProduct?.name}</DialogTitle>
            <DialogDescription>
              Modify price (VND base with live USD/CNY auto-conversion), game title, and web display visibility flag.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <DynamicForm
              fields={EDIT_PRODUCT_FORM_SCHEMA}
              initialValues={{
                name: editingProduct.name,
                prices: editingProduct.pricing,
                imageUrl: editingProduct.imageUrl,
                disabled: !editingProduct.isDelete,
                isDenuvo: editingProduct.isDenuvo
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingProduct(null)}
              submitText="Save Product Details"
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

ProductsPage.displayName = 'ProductsPage';
