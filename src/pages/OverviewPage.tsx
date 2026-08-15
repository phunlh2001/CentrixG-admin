import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { TrendingUp, Users, ShieldAlert, Award, Lock, DollarSign, Calendar } from 'lucide-react';
import type { OverviewMetrics } from '@/types/admin-overview';

interface OverviewPageProps {
  metrics: OverviewMetrics;
}

export const OverviewPage: React.FC<OverviewPageProps> = React.memo(({ metrics }) => {
  const { revenue, topSellers, accountMetrics, period, recentUsers } = metrics;

  // Memoize Header / Notice banner (re-renders only when period changes)
  const headerNotice = useMemo(() => (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-700" />
        <span><strong>View-Only Permission Mode:</strong> Showing live aggregate analytics for <strong>{period?.toUpperCase()}</strong> report.</span>
      </div>
      <Badge variant="outline" className="bg-white">
        <Calendar className="w-3 h-3 mr-1 text-slate-500" />
        {period === 'weekly' ? 'Last 7 Days' : 'Current Month'}
      </Badge>
    </div>
  ), [period]);

  // Memoize Revenue Summary Cards (re-renders only when revenue metrics change)
  const revenueSection = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue (VND)</span>
            <div className="p-2 rounded-md bg-slate-900 text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
            {formatVND(revenue.totalRevenueVnd)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Whole app total earnings</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">USD Equivalent</span>
            <div className="p-2 rounded-md bg-slate-100 text-slate-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
            {formatUSD(revenue.usdEquivalent)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Calculated via live rate</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CNY Equivalent</span>
            <div className="p-2 rounded-md bg-slate-100 text-slate-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
            {formatCNY(revenue.cnyEquivalent)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Calculated via live rate</p>
        </CardContent>
      </Card>
    </div>
  ), [revenue]);

  // Memoize Top Sellers Section (re-renders only when topSellers data changes)
  const topSellersSection = useMemo(() => (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top Seller Products (Max 3)
            </CardTitle>
            <CardDescription>Ranked by total users paid for the game</CardDescription>
          </div>
          <Badge variant="secondary">Top 3 Only</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {topSellers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No top seller products data available
            </div>
          ) : (
            topSellers.map((item, index) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold">
                    #{index + 1}
                  </div>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-11 h-11 rounded-md object-cover border border-slate-200"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category || 'General'} • {formatVND(item.priceVnd)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{item.paidUsersCount} Paid Users</div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {formatVND(item.totalRevenueVnd)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  ), [topSellers]);

  // Memoize Account Metrics Counters (re-renders only when accountMetrics data changes)
  const accountMetricsSection = useMemo(() => (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Active Accounts</span>
            <span className="text-2xl font-bold text-slate-900">{accountMetrics.activeAccountsCount}</span>
          </div>
          <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Users className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Banned Accounts</span>
            <span className="text-2xl font-bold text-slate-900">{accountMetrics.bannedAccountsCount}</span>
          </div>
          <div className="p-2.5 rounded-full bg-red-50 text-red-600 border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  ), [accountMetrics]);

  // Memoize Recent Users Table (re-renders only when recentUsers data changes)
  const recentUsersSection = useMemo(() => (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">Newly Created Accounts</CardTitle>
        <CardDescription>Latest user registrations on the platform</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-xs text-slate-400">
                  No newly created accounts
                </TableCell>
              </TableRow>
            ) : (
              recentUsers.map((usr) => (
                <TableRow key={usr.id}>
                  <TableCell className="font-medium">
                    <div className="text-slate-900">{usr.username}</div>
                    <div className="text-xs text-slate-400">{usr.email}</div>
                  </TableCell>
                  <TableCell className="capitalize text-xs text-slate-600">{usr.role}</TableCell>
                  <TableCell>
                    <Badge variant={usr.status === 'active' ? 'active' : 'banned'}>
                      {usr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-500">
                    {new Date(usr.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  ), [recentUsers]);

  return (
    <div className="space-y-6">
      {headerNotice}
      {revenueSection}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topSellersSection}
        <div className="space-y-6">
          {accountMetricsSection}
          {recentUsersSection}
        </div>
      </div>
    </div>
  );
});

OverviewPage.displayName = 'OverviewPage';
