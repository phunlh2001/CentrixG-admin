import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, type TabType } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OverviewPage } from '@/pages/OverviewPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { WarehousePage } from '@/pages/WarehousePage';
import { TrashPage } from '@/pages/TrashPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { BillsPage } from '@/pages/BillsPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { LoginPage } from '@/pages/LoginPage';
import type { Product, UserAccount, Category, OverviewMetrics } from '@/types';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import productApi from './api/productApi';
import overviewApi from './api/overviewApi';
import categoryApi from './api/categoryApi';

const TAB_TITLES: Record<TabType, string> = {
  overview: 'Platform Analytics Overview',
  products: 'Product & Game Catalog Management',
  warehouse: 'Unmanifested Warehouse Catalog',
  trash: 'Recycle Bin & Deleted Catalog',
  categories: 'Game Category Administration',
  bills: 'Financial Bills & Transactions',
  accounts: 'User & Staff Account Administration',
};

function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isMod = user?.role?.toUpperCase() === 'MOD' || user?.role?.toUpperCase() === 'MODERATOR';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topPayer, setTopPayer] = useState<{ user: UserAccount; paymentCount: number; totalSpentVnd: number } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Automatically switch active tab away from overview for MOD role users
  useEffect(() => {
    if (isMod && (activeTab === 'overview' || activeTab === 'bills')) {
      setActiveTab('products');
    }
  }, [isMod, activeTab]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      let m: OverviewMetrics | null = null;
      if (!isMod) {
        m = await overviewApi.getOverviewMetrics(timeframe);
      }
      const catList = await categoryApi.getCategories();

      if (m) setMetrics(m);
      setCategories(catList);
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, isMod, timeframe]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Product CRUD handlers
  const handleCreateProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt'>) => {
    // Placeholder for future creation API
  }, []);

  const handleUpdateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    await productApi.update(id, updates);
  }, []);

  // Category CRUD handlers
  const handleCreateCategory = useCallback(async (data: Omit<Category, 'id' | 'createdAt' | 'productCount'>) => {
    await loadData();
  }, [loadData]);

  const handleUpdateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    await loadData();
  }, [loadData]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleTimeframeChange = useCallback((tf: 'weekly' | 'monthly') => {
    setTimeframe(tf);
  }, []);

  const activeTabTitle = useMemo(() => TAB_TITLES[activeTab] || 'Management Console', [activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
          Verifying authorization status...
        </div>
      </div>
    );
  }

  // Authorization Guard: Redirect to Login Page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          activeTabTitle={activeTabTitle}
        />

        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {dataLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
                Loading Centrix Admin Console...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && !isMod && metrics && <OverviewPage metrics={metrics} />}
              
              {/* Keep ProductsPage mounted to prevent re-fetching on tab navigation */}
              <div className={activeTab === 'products' ? 'block' : 'hidden'}>
                <ProductsPage
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                />
              </div>

              {activeTab === 'warehouse' && (
                <WarehousePage onUpdateProduct={handleUpdateProduct} />
              )}

              {activeTab === 'trash' && (<TrashPage />)}

              {activeTab === 'categories' && (
                <CategoriesPage
                  categories={categories}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}
              {activeTab === 'bills' && <BillsPage topPayer={topPayer} />}
              {activeTab === 'accounts' && <AccountsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
