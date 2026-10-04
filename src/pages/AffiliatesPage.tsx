import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { AffiliateListItem, AffiliateDetail, AffiliateStatus, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Share2,
  FileText,
  Trophy,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import affiliateApi from '@/api/affiliateApi';
import { formatVND } from '@/lib/utils';

export const AffiliatesPage: React.FC = React.memo(() => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const isInitialMount = useRef(true);

  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<AffiliateListItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Detail Modal State
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AffiliateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Rejection Dialog State
  const [rejectingApp, setRejectingApp] = useState<AffiliateListItem | AffiliateDetail | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Debounce search input
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setPaginatedData(prev => ({ ...prev, items: [] }));
      setLoading(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load applications
  const loadApplications = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setPaginatedData(prev => ({ ...prev, items: [] }));
    }
    setLoading(true);
    try {
      const data = await affiliateApi.getApplications({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
      });
      setPaginatedData(data);
    } catch (err) {
      console.error('Failed fetching affiliate applications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  const handleStatusFilterChange = useCallback((newStatus: AffiliateStatus | null) => {
    setStatusFilter(newStatus);
    setPage(1);
    setPaginatedData(prev => ({ ...prev, items: [] }));
    setLoading(true);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [debouncedSearch, statusFilter, page]);

  // Load detail when an application is selected
  const handleOpenDetail = useCallback(async (item: AffiliateListItem) => {
    setSelectedAppId(item.id);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const detail = await affiliateApi.getApplicationDetail(item.id);
      setDetailData(detail);
    } catch (err) {
      console.error('Failed fetching application detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Approve action handler
  const handleApprove = useCallback(async (appId: string) => {
    setIsSubmittingAction(true);
    try {
      // Optimistic update in table
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === appId ? { ...item, status: 'APPROVED' as AffiliateStatus } : item
        ),
      }));

      // Update detail if open
      if (detailData && detailData.id === appId) {
        setDetailData(prev => (prev ? { ...prev, status: 'APPROVED' } : null));
      }

      await affiliateApi.updateStatus(appId, { status: 'APPROVED' });
    } catch (err) {
      console.error('Failed approving affiliate application:', err);
      await loadApplications(true);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [detailData, loadApplications]);

  // Confirm Reject handler
  const handleConfirmReject = useCallback(async () => {
    if (!rejectingApp) return;
    setIsSubmittingAction(true);
    const reasonText = rejectReason.trim() || null;
    try {
      // Optimistic update in table
      setPaginatedData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === rejectingApp.id
            ? { ...item, status: 'REJECTED' as AffiliateStatus }
            : item
        ),
      }));

      // Update detail if open
      if (detailData && detailData.id === rejectingApp.id) {
        setDetailData(prev =>
          prev ? { ...prev, status: 'REJECTED', rejectionReason: reasonText } : null
        );
      }

      await affiliateApi.updateStatus(rejectingApp.id, {
        status: 'REJECTED',
        rejectionReason: reasonText,
      });

      setRejectingApp(null);
      setRejectReason('');
    } catch (err) {
      console.error('Failed rejecting affiliate application:', err);
      await loadApplications(true);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [rejectingApp, rejectReason, detailData, loadApplications]);

  // Copy bank account number
  const handleCopyBankAccount = useCallback((accountNum: string) => {
    if (!accountNum) return;
    navigator.clipboard.writeText(accountNum);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  }, []);

  const getStatusBadge = (status: AffiliateStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved Partner
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const tableRows = useMemo(() => {
    if (loading && paginatedData.items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-44 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
              <span>Loading affiliate applications...</span>
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
              <span>No affiliate applications found</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedData.items.map(item => (
      <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
        {/* 1. Applicant Info */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {(item.fullName || item.username || item.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-slate-900 font-semibold text-xs">
                {item.fullName || item.username}
              </div>
              <div className="text-[11px] text-slate-500">
                @{item.username} • <span className="font-mono text-slate-400">{item.email}</span>
              </div>
            </div>
          </div>
        </TableCell>

        {/* 2. Phone Number */}
        <TableCell>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{item.phoneNumber || '—'}</span>
          </div>
        </TableCell>

        {/* 3. Offer Code */}
        <TableCell>
          {item.offerCode ? (
            <span className="inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {item.offerCode}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-mono">—</span>
          )}
        </TableCell>

        {/* 4. Total Earn (VND) */}
        <TableCell>
          {item.totalEarn !== null && item.totalEarn !== undefined ? (
            <span className="inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {formatVND(Number(item.totalEarn))}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-mono">—</span>
          )}
        </TableCell>

        {/* 5. Status */}
        <TableCell>
          {getStatusBadge(item.status)}
        </TableCell>

        {/* 6. Submitted At */}
        <TableCell className="text-xs text-slate-500 font-mono">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
        </TableCell>

        {/* 7. Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenDetail(item)}
              className="h-8 text-xs gap-1"
              title="View full application details"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              Detail
            </Button>

            {item.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmittingAction}
                  onClick={() => handleApprove(item.id)}
                  className="h-8 text-xs gap-1 border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 font-medium"
                  title="Approve partner application"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmittingAction}
                  onClick={() => {
                    setRejectingApp(item);
                    setRejectReason('');
                  }}
                  className="h-8 text-xs gap-1 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-800 font-medium"
                  title="Reject application"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    ));
  }, [loading, paginatedData.items, handleOpenDetail, handleApprove, isSubmittingAction]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Affiliate Partner Applications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage creator partnership registrations, promotional plans, and banking payout information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Total: {paginatedData.total}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Status Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => handleStatusFilterChange(null)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === null
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            All Applications
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('APPROVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-white text-rose-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadApplications(true)}
            disabled={loading}
            className="h-9 px-3 shrink-0 cursor-pointer"
            title="Refresh applications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="relative overflow-hidden rounded-md border border-slate-200">
        {loading && paginatedData.items.length > 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all duration-200">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-xs text-xs text-slate-700 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              Updating list...
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Offer Code</TableHead>
              <TableHead>Total Earn (VND)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{paginatedData.items.length}</span> of{' '}
          <span className="font-bold text-slate-900">{paginatedData.total}</span> applications (Page {paginatedData.page} of {paginatedData.totalPages || 1})
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

      {/* Detailed Application Inspection Modal */}
      <Dialog
        open={Boolean(selectedAppId)}
        onOpenChange={open => {
          if (!open) {
            setSelectedAppId(null);
            setDetailData(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Affiliate Partner Application Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive applicant portfolio, promotional strategy, and banking verification.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="h-48 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
              Loading application details...
            </div>
          ) : detailData ? (
            <div className="space-y-5 py-2 text-xs">
              {/* Profile & Status Header */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {(detailData.fullName || detailData.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-sm">{detailData.fullName}</div>
                    <div className="text-slate-500 font-medium">@{detailData.username}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">ID: {detailData.userId}</div>
                  </div>
                </div>
                <div>{getStatusBadge(detailData.status)}</div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> Email Address
                  </div>
                  <div className="font-mono text-slate-800 font-medium select-all">
                    {detailData.email}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone Number
                  </div>
                  <div className="font-mono text-slate-800 font-medium select-all">
                    {detailData.phoneNumber || '—'}
                  </div>
                </div>
              </div>

              {/* Social Channels List */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" /> Social Media Channels & Platforms
                </div>
                {detailData.socialChannels && detailData.socialChannels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {detailData.socialChannels.map((channel, idx) => (
                      <a
                        key={idx}
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs group"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{channel.platform}</span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-[200px]">
                            {channel.url}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No social media channels provided.</p>
                )}
              </div>

              {/* Promotion Strategy */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" /> Promotion Plan & Strategy
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detailData.promotionPlan || 'No promotion plan specified.'}
                </div>
              </div>

              {/* Milestones & Achievements */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Content Achievements & Metrics
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detailData.achievements || 'No achievements specified.'}
                </div>
              </div>

              {/* Bank & Payout Information */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-700" /> Banking & Payout Account
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-md bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Bank Name</div>
                    <div className="font-semibold text-slate-800">{detailData.bankName || '—'}</div>
                  </div>

                  <div className="p-3 rounded-md bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-semibold mb-0.5">Account Holder</div>
                    <div className="font-semibold text-slate-800 uppercase font-mono">
                      {detailData.bankAccountName || '—'}
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-white border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-semibold mb-0.5 flex items-center justify-between">
                      <span>Account Number</span>
                      {detailData.bankAccountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyBankAccount(detailData.bankAccountNumber)}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                        >
                          {copiedBank ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {detailData.bankAccountNumber || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection / Review History if applicable */}
              {detailData.status === 'REJECTED' && detailData.rejectionReason && (
                <div className="p-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Rejection Reason:
                  </div>
                  <div className="text-xs leading-relaxed">{detailData.rejectionReason}</div>
                </div>
              )}

              {detailData.reviewedAt && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  Reviewed at: {new Date(detailData.reviewedAt).toLocaleString()}
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAppId(null);
                setDetailData(null);
              }}
            >
              Close
            </Button>

            {detailData && detailData.status === 'PENDING' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  disabled={isSubmittingAction}
                  onClick={() => handleApprove(detailData.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Partner
                </Button>

                <Button
                  variant="destructive"
                  disabled={isSubmittingAction}
                  onClick={() => {
                    setRejectingApp(detailData);
                    setRejectReason('');
                  }}
                  className="gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={Boolean(rejectingApp)}
        onOpenChange={open => {
          if (!open) {
            setRejectingApp(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              Reject Affiliate Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the partnership application for{' '}
              <strong>{rejectingApp?.fullName || rejectingApp?.username}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <label className="font-semibold text-slate-700">Reason for Rejection (Optional):</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Channel metrics do not meet requirements, invalid social link..."
              rows={3}
              className="w-full rounded-md border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSubmittingAction}
              onClick={() => {
                setRejectingApp(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmittingAction}
              onClick={handleConfirmReject}
            >
              {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AffiliatesPage.displayName = 'AffiliatesPage';
