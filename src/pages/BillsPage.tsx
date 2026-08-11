import React, { useState } from 'react';
import type { Bill, UserAccount } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatVND, formatUSD, formatCNY } from '@/lib/utils';
import { Crown, Search, CreditCard } from 'lucide-react';

interface BillsPageProps {
  bills: Bill[];
  topPayer: { user: UserAccount; paymentCount: number; totalSpentVnd: number } | null;
}

export const BillsPage: React.FC<BillsPageProps> = ({ bills, topPayer }) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const filteredBills = bills.filter(b => {
    const matchesSearch =
      b.productName.toLowerCase().includes(search.toLowerCase()) ||
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      (b.referrerInfo && b.referrerInfo.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = paymentFilter === 'ALL' || b.paymentMethod === paymentFilter;
    return matchesSearch && matchesMethod;
  });

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
                  <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">{topPayer.user.name}</h3>
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
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search bills by user, product, or referrer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Payment Method:</span>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Momo">Momo</option>
            <option value="PayPal">PayPal</option>
            <option value="Crypto">Crypto</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill ID</TableHead>
            <TableHead>Product Info</TableHead>
            <TableHead>User Account</TableHead>
            <TableHead>Referrer Info</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Payment Amount (VND / USD / CNY)</TableHead>
            <TableHead className="text-right">Date & Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
                No transaction bills available
              </TableCell>
            </TableRow>
          ) : (
            filteredBills.map(bill => (
            <TableRow key={bill.id}>
              <TableCell className="font-mono text-xs text-slate-500">{bill.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <img
                    src={bill.productImage}
                    alt={bill.productName}
                    className="w-9 h-9 rounded object-cover border border-slate-200"
                  />
                  <div className="font-semibold text-slate-900 text-xs">{bill.productName}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-slate-900 font-medium text-xs">{bill.userName}</div>
                <div className="text-[11px] text-slate-400">{bill.userEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px] font-mono">
                  {bill.referrerInfo || 'DIRECT'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {bill.paymentMethod}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-bold text-slate-900">{formatVND(bill.amountVnd)}</div>
                <div className="text-[11px] text-slate-400">
                  {formatUSD(bill.amountUsd)} • {formatCNY(bill.amountCny)}
                </div>
              </TableCell>
              <TableCell className="text-right text-xs text-slate-500 font-mono">
                {new Date(bill.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </div>
  );
};
