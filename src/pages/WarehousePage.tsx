import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Product, DynamicFormFieldSchema, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Edit2, Search, ChevronLeft, ChevronRight, Tag, Loader2, ChevronDown, Warehouse, Boxes, AlertCircle, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import productApi from '@/api/productApi';
import { Switch } from '@/components/ui/switch';

interface WarehousePageProps {
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
}

const CATEGORIES = [
  { label: 'Rockstar', value: 'Rockstar' },
  { label: 'Ubisoft', value: 'Ubisoft' },
  { label: 'EA', value: 'EA' },
];

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
    name: 'isDenuvo',
    label: 'Denuvo',
    type: 'toggle',
    description: 'Toggle if this game belongs to Denuvo DRM',
    defaultValue: false,
  },
];

export const WarehousePage: React.FC<WarehousePageProps> = React.memo(({
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

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadWarehouseProducts = async (forceRefresh = false) => {
    if (paginatedData.items.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await productApi.getAll({
        search: debouncedSearch,
        page,
        pageSize,
        hasManifest: false, // Filter for unmanifested products
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching warehouse products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouseProducts();
  }, [debouncedSearch, page]);

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
      });
      setEditingProduct(null);
      await loadWarehouseProducts(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDenuvo = async (product: Product, currentDenuvo: boolean) => {
    await onUpdateProduct(product.id, { isDenuvo: !currentDenuvo });
    await loadWarehouseProducts(true);
  }

  const handleSelectCategory = async (product: Product, categoryName: string) => {
    setUpdatingCategoryId(product.id);
    // Optimistic UI update
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
      console.error('Failed to update warehouse product category:', err);
      await loadWarehouseProducts(true);
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  // Export list of App IDs to exports.txt file (123\n456\n789)
  const handleExportAppIds = () => {
    if (paginatedData.items.length === 0) return;
    const content = paginatedData.items
      .map(item => item.appId)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exports.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Memoize header notice banner (re-renders only when total count changes)
  const headerBanner = useMemo(() => (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <Warehouse className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Unmanifested Warehouse Catalog:</strong> Showing games without Steam Manifest files.
        </span>
      </div>
      <Badge variant="outline" className="bg-white border-amber-300 text-amber-800 shrink-0">
        <Boxes className="w-3 h-3 mr-1 text-amber-600" />
        {paginatedData.total} Items
      </Badge>
    </div>
  ), [paginatedData.total]);

  // Memoize table rows to prevent unnecessary re-renders when data is unchanged
  const tableRows = useMemo(() => {
    if (loading && paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              Loading warehouse catalog...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>No unmanifested warehouse products found</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedData.items.map(product => (
      <TableRow key={product.id} className={product.isDelete ? 'bg-slate-50/70' : ''}>
        {/* 1. App ID */}
        <TableCell className="font-mono text-xs font-semibold text-slate-700">
          <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 inline-block">
            {product.appId ? `#${product.appId}` : `#${product.id.slice(0, 8)}`}
          </span>
        </TableCell>

        {/* 2. Game Info */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div className="text-slate-900 font-semibold text-sm">{product.name}</div>
              {product.publisher && (
                <div className="text-xs text-slate-400">{product.publisher}</div>
              )}
            </div>
          </div>
        </TableCell>

        {/* 3. Prices */}
        <TableCell>
          <div className="text-xs font-bold text-slate-900">{formatVND(Number(product.pricing.vnd))}</div>
          <div className="text-[11px] text-slate-500">
            {formatUSD(Number(product.pricing.usd))} • {formatCNY(Number(product.pricing.cny))}
          </div>
        </TableCell>

        {/* 4. Category Type */}
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

        {/* 5. Denuvo */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Switch
              checked={product.isDenuvo}
              onCheckedChange={() => handleToggleDenuvo(product, product.isDenuvo)}
            />
          </div>
        </TableCell>

        {/* 6. Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingProduct(product)}
              className="h-8 gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  }, [loading, paginatedData.items, updatingCategoryId]);

  return (
    <div className="space-y-6">
      {headerBanner}

      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search warehouse games..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        <Button
          onClick={handleExportAppIds}
          disabled={paginatedData.items.length === 0}
          variant="outline"
          className="flex items-center gap-2 shrink-0 border-slate-300 hover:bg-slate-100"
        >
          <Download className="w-4 h-4 text-slate-700" />
          Export AppIDs (.txt)
        </Button>
      </div>

      {/* Warehouse Products Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">App ID</TableHead>
            <TableHead>Game Info</TableHead>
            <TableHead>Prices (VND / USD / CNY)</TableHead>
            <TableHead>Category / Type</TableHead>
            <TableHead>Denuvo</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>

      {/* Pagination Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{paginatedData.items.length}</span> of{' '}
          <span className="font-bold text-slate-900">{paginatedData.total}</span> warehouse items (Page {paginatedData.page} of {paginatedData.totalPages})
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

      {/* Edit Product Modal */}
      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Warehouse Item: {editingProduct?.name}</DialogTitle>
            <DialogDescription>
              Modify price, title, and display status for this unmanifested game.
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
                isDenuvo: editingProduct.isDenuvo,
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

WarehousePage.displayName = 'WarehousePage';
