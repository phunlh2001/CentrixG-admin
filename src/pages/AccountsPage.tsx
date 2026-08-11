import React, { useState } from 'react';
import type { UserAccount } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Mail, Ban, Search, ShieldCheck, Eye } from 'lucide-react';

interface AccountsPageProps {
  users: UserAccount[];
  onBanUser: (userId: string, reason?: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  users,
  onBanUser,
  onUnbanUser,
}) => {
  const [search, setSearch] = useState('');
  const [banModalUser, setBanModalUser] = useState<UserAccount | null>(null);
  const [banReason, setBanReason] = useState('');
  const [emailPreviewUser, setEmailPreviewUser] = useState<{ user: UserAccount; reason?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    setIsSubmitting(true);
    try {
      await onBanUser(banModalUser.id, banReason);
      const bannedUserCopy = { ...banModalUser, status: 'banned' as const, banReason };
      setBanModalUser(null);
      // Open email preview notification letter modal
      setEmailPreviewUser({ user: bannedUserCopy, reason: banReason });
      setBanReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search accounts by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredUsers.length} total accounts (Passwords securely omitted)
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
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
                No user accounts available
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map(user => (
            <TableRow key={user.id} className={user.status === 'banned' ? 'bg-red-50/20' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-slate-900 font-semibold text-xs">{user.name}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize text-xs">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'active' : 'banned'}>
                  {user.status === 'active' ? 'Active' : 'Banned'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                {user.banReason || '—'}
              </TableCell>
              <TableCell className="text-xs text-slate-500 font-mono">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                {user.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBanModalUser(user)}
                    className="h-8 gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Ban User
                  </Button>
                ) : (
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmailPreviewUser({ user, reason: user.banReason })}
                      className="h-8 text-xs gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Email Letter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnbanUser(user.id)}
                      className="h-8 text-xs gap-1 text-emerald-700 hover:bg-emerald-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Unban
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )))}
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
              Are you sure you want to ban <strong>{banModalUser?.name}</strong> ({banModalUser?.email})?
              This will revoke their game access and trigger an HTML email notification letter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-slate-700">Reason for Banning (Optional):</label>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="e.g. Violation of Steam account sharing terms, chargebacks, or abusive behavior..."
              rows={3}
              className="w-full rounded-md border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalUser(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmBan} disabled={isSubmitting}>
              {isSubmitting ? 'Banning...' : 'Confirm Ban & Send Email'}
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
                <p>Hello <strong>{emailPreviewUser?.user.name}</strong>,</p>
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
};
