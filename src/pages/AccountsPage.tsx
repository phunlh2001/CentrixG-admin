import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { UserAccount } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Mail, Ban, Search, ShieldCheck, Eye, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import userApi from '@/api/userApi';

interface AccountsPageProps {
  users?: UserAccount[];
  onBanUser?: (userId: string, reason?: string) => Promise<void>;
  onUnbanUser?: (userId: string) => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = React.memo(({
  onBanUser: externalBanUser,
  onUnbanUser: externalUnbanUser,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [banModalUser, setBanModalUser] = useState<UserAccount | null>(null);
  const [banReason, setBanReason] = useState('');
  const [emailPreviewUser, setEmailPreviewUser] = useState<{ user: UserAccount; reason?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async (forceRefresh = false) => {
    if (users.length === 0 || forceRefresh) {
      setLoading(true);
    }
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [users.length]);

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search]);

  const handleConfirmBan = useCallback(async () => {
    if (!banModalUser) return;
    setIsSubmitting(true);
    const reasonText = banReason.trim() || 'Violation of platform terms of service';
    try {
      // Optimistic UI update
      setUsers(prev =>
        prev.map(u =>
          u.id === banModalUser.id ? { ...u, isBlock: true, resonable: reasonText } : u
        )
      );

      if (externalBanUser) {
        await externalBanUser(banModalUser.id, reasonText);
      } else {
        await userApi.banUser({
          userId: banModalUser.id,
          reason: reasonText,
          isBlock: true,
        });
      }

      const bannedUserCopy: UserAccount = {
        ...banModalUser,
        isBlock: true,
        resonable: reasonText,
      };
      setBanModalUser(null);
      // Open email preview notification letter modal
      setEmailPreviewUser({ user: bannedUserCopy, reason: reasonText });
      setBanReason('');
    } catch (err) {
      console.error('Failed to ban user:', err);
      await loadUsers(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [banModalUser, banReason, externalBanUser, loadUsers]);

  const handleUnban = useCallback(async (user: UserAccount) => {
    // Optimistic UI update
    setUsers(prev =>
      prev.map(u =>
        u.id === user.id ? { ...u, isBlock: false, resonable: null } : u
      )
    );

    try {
      if (externalUnbanUser) {
        await externalUnbanUser(user.id);
      } else {
        await userApi.banUser({
          userId: user.id,
          reason: null,
          isBlock: false,
        });
      }
    } catch (err) {
      console.error('Failed to unban user:', err);
      await loadUsers(true);
    }
  }, [externalUnbanUser, loadUsers]);

  const tableRows = useMemo(() => {
    if (loading && users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              Loading registered user accounts...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5 py-4">
              <AlertCircle className="w-5 h-5 text-slate-300" />
              <span>No user accounts found</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredUsers.map(user => (
      <TableRow key={user.id} className={user.isBlock ? 'bg-red-50/20' : ''}>
        {/* 1. User Account */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {(user.username || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-slate-900 font-semibold text-xs">{user.username || '—'}</div>
              <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
            </div>
          </div>
        </TableCell>

        {/* 2. Role */}
        <TableCell>
          <Badge variant="outline" className="capitalize text-xs font-semibold">
            {user.role}
          </Badge>
        </TableCell>

        {/* 3. Account Status */}
        <TableCell>
          {user.isBlock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Blocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          )}
        </TableCell>

        {/* 4. Ban Reason */}
        <TableCell className="text-xs text-slate-600 max-w-xs truncate">
          {user.resonable || '—'}
        </TableCell>

        {/* 5. Created At */}
        <TableCell className="text-xs text-slate-500 font-mono">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
        </TableCell>

        {/* 6. Actions */}
        <TableCell className="text-right">
          {!user.isBlock ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBanModalUser(user)}
              className="h-8 gap-1 font-semibold"
            >
              <Ban className="w-3.5 h-3.5" />
              Ban User
            </Button>
          ) : (
            <div className="flex justify-end gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmailPreviewUser({ user, reason: user.resonable || undefined })}
                className="h-8 text-xs gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Email Letter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnban(user)}
                className="h-8 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Unban
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [loading, filteredUsers, users.length, handleUnban]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search accounts by name, email, or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadUsers(true)}
            disabled={loading}
            className="h-9 px-3 shrink-0"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> of{' '}
          <span className="font-bold text-slate-900">{users.length}</span> user accounts
        </div>
      </div>

      {/* User Accounts Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Account</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Account Status</TableHead>
            <TableHead>Ban Reason (if any)</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>

      {/* Ban Confirmation Modal */}
      <Dialog open={Boolean(banModalUser)} onOpenChange={(open) => !open && setBanModalUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Confirm Ban Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to ban <strong>{banModalUser?.username}</strong> ({banModalUser?.email})?
              This will revoke active sessions and trigger an email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-slate-700">Reason for Banning:</label>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="e.g. Violation of platform terms of service, abusive behavior, or chargebacks..."
              rows={3}
              className="w-full rounded-md border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalUser(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmBan} disabled={isSubmitting}>
              {isSubmitting ? 'Banning...' : 'Confirm Ban & Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HTML Email Notification Letter Modal Preview */}
      <Dialog open={Boolean(emailPreviewUser)} onOpenChange={(open) => !open && setEmailPreviewUser(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-slate-900" />
              HTML Email Notification Preview
            </DialogTitle>
            <DialogDescription>
              Below is the exact HTML letter template rendered and sent to <strong>{emailPreviewUser?.user.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Rendered HTML Letter Frame */}
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 font-sans shadow-inner my-2">
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
              {/* Header */}
              <div className="bg-slate-900 text-white p-6 text-center">
                <h2 className="text-xl font-bold tracking-tight">Centrix Games Rental</h2>
                <span className="text-xs text-slate-400">Account Status Notification</span>
              </div>
              {/* Body */}
              <div className="p-6 space-y-4 text-slate-800 text-sm leading-relaxed">
                <p>Hello <strong>{emailPreviewUser?.user.username}</strong>,</p>
                <p>
                  We are writing to inform you that your account associated with <strong>{emailPreviewUser?.user.email}</strong> has been suspended from the Centrix Rental Games platform.
                </p>

                <div className="p-4 rounded border-l-4 border-red-500 bg-red-50 text-red-900 text-xs">
                  <div className="font-bold mb-1">Reason for Suspension:</div>
                  <div>{emailPreviewUser?.reason || 'Violation of community safety and platform usage policies.'}</div>
                </div>

                <p className="text-xs text-slate-500">
                  During this suspension period, active game key credentials and cloud save access will be revoked.
                </p>

                <p className="text-xs text-slate-500">
                  If you believe this action was taken in error, you may reply directly to this email or contact support at <a href="mailto:support@centrix.games" className="text-slate-900 underline">support@centrix.games</a>.
                </p>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                  &copy; 2026 Centrix Games Rental Ltd. All rights reserved.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="default" onClick={() => setEmailPreviewUser(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AccountsPage.displayName = 'AccountsPage';
