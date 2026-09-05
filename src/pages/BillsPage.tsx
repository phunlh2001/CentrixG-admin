import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Bill, UserAccount, PaginatedResponse, BillProductInfo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Crown, Search, ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Boxes, RotateCcw } from 'lucide-react';
import billApi from '@/api/billApi';

interface BillsPageProps {
  bills?: Bill[];
  topPayer?: { user: UserAccount; paymentCount: number; totalSpentVnd: number } | null;
}

const getStatusBadge = (status?: string) => {
  const normalized = status?.toUpperCase() || 'PENDING';

  switch (normalized) {
    case 'COMPLETED':
    case 'PAID':
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          COMPLETED
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          PENDING
        </span>
      );
    case 'CANCELED':
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          CANCELED
        </span>
      );
    case 'FAILED':
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          FAILED
        </span>
      );
    case 'REFUNDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          REFUNDED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          {normalized}
        </span>
      );
  }
};

const getBillProducts = (bill: Bill): BillProductInfo[] => {
  if (Array.isArray(bill.products) && bill.products.length > 0) {
    return bill.products;
  }
  if (Array.isArray(bill.productInfo) && bill.productInfo.length > 0) {
    return bill.productInfo;
  }
  if (bill.productInfo && typeof bill.productInfo === 'object' && 'name' in bill.productInfo) {
    return [bill.productInfo as BillProductInfo];
  }
  return [];
};

export const BillsPage: React.FC<BillsPageProps> = React.memo(({ topPayer }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const isInitialMount = useRef(true);
  const [expandedBillIds, setExpandedBillIds] = useState<Set<string>>(new Set());

  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Bill>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [refundingBill, setRefundingBill] = useState<Bill | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

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

  const loadBills = useCallback(async (forceRefresh = false) => {
    if (paginatedData.items.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await billApi.getBills({
        search: debouncedSearch,
        page,
        limit,
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching bills:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, paginatedData.items.length]);

  useEffect(() => {
    loadBills();
  }, [debouncedSearch, page, loadBills]);

  const toggleRowExpand = useCallback((billId: string) => {
    setExpandedBillIds(prev => {
      const next = new Set(prev);
      if (next.has(billId)) {
        next.delete(billId);
      } else {
        next.add(billId);
      }
      return next;
    });
  }, []);

  const handleConfirmRefund = useCallback(async () => {
    if (!refundingBill) return;
    setIsRefunding(true);
    try {
      // Optimistic update: set bill status to REFUNDED
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === refundingBill.id ? { ...item, orderStatus: 'REFUNDED' } : item
        ),
      }));

      await billApi.refundBill(refundingBill.id);
      setRefundingBill(null);
      await loadBills(true);
    } catch (err) {
      console.error('Failed to refund bill:', err);
      await loadBills(true);
    } finally {
      setIsRefunding(false);
    }
  }, [refundingBill, loadBills]);

  // Memoized Table Rows
  const tableRows = useMemo(() => {
    if (loading && paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-32 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              Loading financial bills...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>No transaction bills found</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedData.items.map(bill => {
      const products = getBillProducts(bill);
      const isExpanded = expandedBillIds.has(bill.id);
      const firstProduct = products[0];
      const hasMultiple = products.length > 1;
      const isCompleted = bill.orderStatus?.toUpperCase() === 'COMPLETED';

      return (
        <React.Fragment key={bill.id}>
          <TableRow className={isExpanded ? 'bg-slate-50/50 border-b-0' : ''}>
            {/* 1. Bill ID */}
            <TableCell className="font-mono text-xs text-slate-600">
              <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 inline-block font-semibold">
                #{bill.id.length > 8 ? bill.id.slice(0, 8) : bill.id}
              </span>
            </TableCell>

            {/* 2. Product Info with Multi-product Expand Preview */}
            <TableCell>
              {products.length > 0 ? (
                <div className="flex items-center gap-2.5">
                  {firstProduct?.imageUrl ? (
                    <img
                      src={firstProduct.imageUrl}
                      alt={firstProduct.name}
                      className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Boxes className="w-4 h-4 text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px] sm:max-w-[200px]">
                        {firstProduct?.name || 'Product'}
                      </span>
                      {hasMultiple && (
                        <button
                          onClick={() => toggleRowExpand(bill.id)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                          title="Toggle all order products"
                        >
                          +{products.length - 1} more
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {firstProduct?.appId && (
                        <span className="text-[10px] font-mono text-slate-400">#{firstProduct.appId}</span>
                      )}
                      {!hasMultiple && (
                        <span className="text-[10px] text-slate-400 font-mono">1 item</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-mono">—</span>
              )}
            </TableCell>

            {/* 3. User Account */}
            <TableCell>
              <div className="text-slate-900 font-semibold text-xs">{bill.userAccount?.username || '—'}</div>
              <div className="text-[11px] text-slate-400 font-mono">{bill.userAccount?.email || '—'}</div>
            </TableCell>

            {/* 4. Status Chip Tag */}
            <TableCell>
              {getStatusBadge(bill.orderStatus)}
            </TableCell>

            {/* 5. Payment Amount */}
            <TableCell>
              <div className="text-xs font-extrabold text-slate-900">
                {formatVND(bill.paymentAmount?.vnd ?? 0)}
              </div>
              <div className="text-[11px] text-slate-500">
                {formatUSD(bill.paymentAmount?.usd ?? 0)} • {formatCNY(bill.paymentAmount?.cny ?? 0)}
              </div>
            </TableCell>

            {/* 6. Date & Time */}
            <TableCell className="text-xs text-slate-500 font-mono">
              {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : '—'}
            </TableCell>

            {/* 7. Actions (Refund) */}
            <TableCell className="text-right">
              {isCompleted ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRefundingBill(bill)}
                  className="h-7 px-2.5 gap-1 text-xs border-purple-300 text-purple-700 bg-purple-50/70 hover:bg-purple-100 hover:text-purple-800 font-medium transition-colors"
                  title="Refund this completed bill"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  Refund
                </Button>
              ) : (
                <span className="text-xs text-slate-300 font-mono">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Expanded Multi-Product Minimalist Drawer Sub-Row */}
          {isExpanded && (
            <TableRow className="bg-slate-50/70 border-b border-slate-200">
              <TableCell colSpan={8} className="p-0">
                <div className="p-4 sm:px-6 border-t border-dashed border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-800">Order Items</span>
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 text-[10px] font-mono">
                        {products.length} {products.length === 1 ? 'game' : 'games'}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleRowExpand(bill.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer transition-colors"
                    >
                      Collapse details ↑
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {products.map((prod, idx) => (
                      <div
                        key={prod.id || `${bill.id}-prod-${idx}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 text-xs truncate" title={prod.name}>
                            {prod.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {prod.appId ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-600">
                                #{prod.appId}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>
      );
    });
  }, [loading, paginatedData.items, expandedBillIds, toggleRowExpand]);

  return (
    <div className="space-y-6">
      {/* Highest Payment User of the Month Highlight Card */}
      {topPayer && (
        <Card className="border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-extrabold text-xl shadow-lg border-2 border-white">
                  <Crown className="w-6 h-6 fill-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                       Top Customer of the Month
                    </span>
                    <Badge variant="outline" className="border-amber-400 text-amber-300 text-[10px]">
                      Highest Transactions
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">{topPayer.user.username || topPayer.user.name || 'Top Customer'}</h3>
                  <p className="text-xs text-slate-300">{topPayer.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-6">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Total Monthly Payments</span>
                  <span className="text-xl font-extrabold text-white">{topPayer.paymentCount} Bills Paid</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Total Amount Spent</span>
                  <span className="text-xl font-extrabold text-amber-300">{formatVND(topPayer.totalSpentVnd)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search bills by user, product, or referrer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBills(true)}
            disabled={loading}
            className="h-9 px-3 shrink-0"
            title="Refresh Bills"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Bills Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Bill ID</TableHead>
            <TableHead>Product Info</TableHead>
            <TableHead>User Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Amount</TableHead>
            <TableHead>Date & Time</TableHead>
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
          <span className="font-bold text-slate-900">{paginatedData.total}</span> bills (Page {paginatedData.page} of {paginatedData.totalPages})
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

      {/* Refund Confirmation Dialog */}
      <Dialog open={Boolean(refundingBill)} onOpenChange={(open) => !open && setRefundingBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-900 font-bold">
              <RotateCcw className="w-5 h-5 text-purple-700" />
              Process Bill Refund
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-slate-600 text-xs leading-relaxed">
                <p>
                  Are you sure you want to refund bill <strong>#{refundingBill?.id.slice(0, 8)}</strong> for customer <strong>{refundingBill?.userAccount?.username}</strong>?
                </p>
                <div className="p-3 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Refund Amount:</span>
                    <span className="font-bold text-purple-950">{formatVND(refundingBill?.paymentAmount?.vnd ?? 0)}</span>
                  </div>
                  <div className="text-[11px] text-purple-800 pt-1">
                    This action will mark the bill status as <strong>REFUNDED</strong>.
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRefundingBill(null)} disabled={isRefunding}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmRefund}
              disabled={isRefunding}
              className="bg-purple-700 text-white hover:bg-purple-800 font-medium"
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

BillsPage.displayName = 'BillsPage';
