import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Exchange rates based on VND (Default rates)
export const DEFAULT_EXCHANGE_RATES = {
  USD_PER_VND: 1 / 25400, // ~ 25,400 VND = 1 USD
  CNY_PER_VND: 1 / 3550,  // ~ 3,550 VND = 1 CNY
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCNY(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function convertVNDToUSD(vnd: number, usdRate = 25400): number {
  if (!vnd || usdRate <= 0) return 0
  return Number((vnd / usdRate).toFixed(2))
}

export function convertVNDToCNY(vnd: number, cnyRate = 3550): number {
  if (!vnd || cnyRate <= 0) return 0
  return Number((vnd / cnyRate).toFixed(2))
}
