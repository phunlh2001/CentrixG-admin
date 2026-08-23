import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Bill, UserAccount, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Crown, Search, ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import billApi from '@/api/billApi';

interface BillsPageProps {
  bills?: Bill[];
  topPayer?: { user: UserAccount; paymentCount: number; totalSpentVnd: number } | null;
}

const getStatusBadge = (status?: string) => {
  const normalized = status?.toUpperCase() || 'PENDING';

  switch (normalized) {
    case 'PAID':
    case 'SUCCESS':
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {normalized}
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {normalized}
        </span>
      );
    case 'FAILED':
    case 'CANCELLED':
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {normalized}
        </span>
      );
    case 'REFUNDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          {normalized}
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

export const BillsPage: React.FC<BillsPageProps> = React.memo(({ topPayer }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const isInitialMount = useRef(true);

  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Bill>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

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

  const loadBills = async (forceRefresh = false) => {
    if (paginatedData.items.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await billApi.getBills({
        search: debouncedSearch,
        page,
        pageSize,
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [debouncedSearch, page]);

  // Memoized Table Rows
  const tableRows = useMemo(() => {
    if (loading && paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
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
          <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>No transaction bills found</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedData.items.map(bill => (
      <TableRow key={bill.id}>
        {/* 1. Bill ID */}
        <TableCell className="font-mono text-xs text-slate-600">
          <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 inline-block font-semibold">
            #{bill.id.length > 8 ? bill.id.slice(0, 8) : bill.id}
          </span>
        </TableCell>

        {/* 2. Product Info (Single Object) */}
        <TableCell>
          {bill.productInfo ? (
            <div className="flex items-center gap-2.5">
              <img
                src={bill.productInfo.imageUrl}
                alt={bill.productInfo.name}
                className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs">{bill.productInfo.name}</div>
                {bill.productInfo.appId && (
                  <span className="text-[10px] font-mono text-slate-400">#{bill.productInfo.appId}</span>
                )}
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

        {/* 5. Referrer Info */}
        <TableCell>
          {bill.referrerInfo ? (
            <div className="space-y-0.5">
              <Badge variant="outline" className="bg-amber-50/80 text-amber-800 border-amber-200 text-[10px] font-mono">
                {bill.referrerInfo.code || bill.referrerInfo.username}
              </Badge>
              <div className="text-[10px] text-slate-400 font-mono">{bill.referrerInfo.email}</div>
            </div>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-mono">
              DIRECT
            </Badge>
          )}
        </TableCell>

        {/* 6. Payment Amount */}
        <TableCell>
          <div className="text-xs font-extrabold text-slate-900">
            {formatVND(bill.paymentAmount?.vnd ?? 0)}
          </div>
          <div className="text-[11px] text-slate-500">
            {formatUSD(bill.paymentAmount?.usd ?? 0)} • {formatCNY(bill.paymentAmount?.cny ?? 0)}
          </div>
        </TableCell>

        {/* 7. Date & Time */}
        <TableCell className="text-right text-xs text-slate-500 font-mono">
          {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : '—'}
        </TableCell>
      </TableRow>
    ));
  }, [loading, paginatedData.items]);

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
            <TableHead>Product</TableHead>
            <TableHead>User Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Referrer Info</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Date & Time</TableHead>
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
    </div>
  );
});

BillsPage.displayName = 'BillsPage';
