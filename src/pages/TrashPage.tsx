import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Product, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Trash2, RotateCcw, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import productApi from '@/api/productApi';

export const TrashPage: React.FC = React.memo(() => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const isInitialMount = useRef(true);

  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Product>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  const [restoringProduct, setRestoringProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
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

  const loadTrashProducts = useCallback(async (forceRefresh = false) => {
    if (paginatedData.items.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await productApi.getAll({
        mode: 'trash',
        search: debouncedSearch,
        page,
        limit,
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching trash products:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, paginatedData.items.length]);

  useEffect(() => {
    loadTrashProducts();
  }, [debouncedSearch, page]);

  const handleConfirmRestore = useCallback(async () => {
    if (!restoringProduct) return;
    setIsSubmitting(true);
    try {
      // Optimistic removal from trash list
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== restoringProduct.id),
        total: Math.max(0, prev.total - 1),
      }));

      await productApi.restoreProduct(restoringProduct.id);
      setRestoringProduct(null);
      await loadTrashProducts(true);
    } catch (err) {
      console.error('Failed to restore product:', err);
      await loadTrashProducts(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [restoringProduct, loadTrashProducts]);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      // Optimistic removal from trash list
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== deletingProduct.id),
        total: Math.max(0, prev.total - 1),
      }));

      await productApi.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      await loadTrashProducts(true);
    } catch (err) {
      console.error('Failed to permanently delete product:', err);
      await loadTrashProducts(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [deletingProduct, loadTrashProducts]);

  // Memoized header notice banner
  const headerBanner = useMemo(() => (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-100/80 text-xs text-slate-800">
      <div className="flex items-center gap-2">
        <Archive className="w-4 h-4 text-slate-600 shrink-0" />
        <span>
          <strong>Trash & Recycle Bin:</strong> Showing removed games. You can restore them to active status or delete them permanently.
        </span>
      </div>
      <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 shrink-0">
        <Trash2 className="w-3 h-3 mr-1 text-slate-500" />
        {paginatedData.total} Deleted Items
      </Badge>
    </div>
  ), [paginatedData.total]);

  // Memoized table rows
  const tableRows = useMemo(() => {
    if (loading && paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              Loading trash catalog...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>Trash is empty. No deleted products found.</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedData.items.map(product => (
      <TableRow key={product.id} className="bg-slate-50/50">
        {/* 1. App ID */}
        <TableCell className="font-mono text-xs font-semibold text-slate-700">
          <span className="px-2 py-1 rounded-md bg-slate-200/70 border border-slate-300 inline-block">
            {product.appId ? `#${product.appId}` : `#${product.id.slice(0, 8)}`}
          </span>
        </TableCell>

        {/* 2. Game Info */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover border border-slate-200 opacity-80 shrink-0"
            />
            <div>
              <div className="text-slate-900 font-semibold text-s decoration-slate-400">
                {product.name}
              </div>
              {product.publisher && (
                <div className="text-xs text-slate-400">{product.publisher}</div>
              )}
            </div>
          </div>
        </TableCell>

        {/* 3. Prices */}
        <TableCell>
          <div className="text-xs font-bold text-slate-700">{formatVND(Number(product.pricing.vnd))}</div>
          <div className="text-[11px] text-slate-500">
            {formatUSD(Number(product.pricing.usd))} • {formatCNY(Number(product.pricing.cny))}
          </div>
        </TableCell>

        {/* 4. Category Type */}
        <TableCell>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {product.type?.name || 'Unassigned'}
          </span>
        </TableCell>

        {/* 5. Status Badge */}
        <TableCell>
          <Badge variant="banned">
            Deleted (In Trash)
          </Badge>
        </TableCell>

        {/* 6. Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRestoringProduct(product)}
              className="h-8 gap-1 border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-900 font-medium transition-colors"
              title="Restore game to catalog"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              Restore
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeletingProduct(product)}
              className="h-8 gap-1 font-medium"
              title="Delete permanently from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  }, [loading, paginatedData.items]);

  return (
    <div className="space-y-6">
      {headerBanner}

      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search deleted games..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Trash Products Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">App ID</TableHead>
            <TableHead>Game Info</TableHead>
            <TableHead>Prices</TableHead>
            <TableHead>Category / Type</TableHead>
            <TableHead>Status</TableHead>
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
          <span className="font-bold text-slate-900">{paginatedData.total}</span> deleted items (Page {paginatedData.page} of {paginatedData.totalPages})
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

      {/* Restore Product Confirmation Dialog */}
      <Dialog open={Boolean(restoringProduct)} onOpenChange={(open) => !open && setRestoringProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 font-bold">
              <RotateCcw className="w-5 h-5 text-emerald-700" />
              Restore Game to Catalog
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-slate-600 text-xs leading-relaxed">
                <p>
                  Are you sure you want to restore <strong>{restoringProduct?.name}</strong> (#{restoringProduct?.appId})?
                </p>
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                    <span>✨ Restore Information</span>
                  </div>
                  <div>
                    This item will be restored back to the catalog and made available for store management.
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRestoringProduct(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmRestore}
              disabled={isSubmitting}
              className="bg-emerald-700 text-white hover:bg-emerald-800 font-medium"
            >
              {isSubmitting ? 'Restoring...' : 'Confirm Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Product Confirmation Dialog */}
      <Dialog open={Boolean(deletingProduct)} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Permanently Delete Product
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-slate-600 text-xs leading-relaxed">
                <p>
                  Are you sure you want to permanently delete <strong>{deletingProduct?.name}</strong> (#{deletingProduct?.appId}) from the system?
                </p>
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-700">
                    <span>⚠️ Permanent Deletion Notice</span>
                  </div>
                  <div>
                    This item will be <strong>deleted forever and cannot be restored</strong>. All database records and prices will be permanently removed.
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingProduct(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmPermanentDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

TrashPage.displayName = 'TrashPage';
