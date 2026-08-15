import { useState, useEffect } from 'react';
import { Sidebar, type TabType } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OverviewPage } from '@/pages/OverviewPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { BillsPage } from '@/pages/BillsPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { BlogPage } from '@/pages/BlogPage';
import { LoginPage } from '@/pages/LoginPage';
import type { Product, Bill, UserAccount, BlogPost, Category, OverviewMetrics } from '@/types';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import productApi from './api/productApi';
import overviewApi from './api/overviewApi';
import categoryApi from './api/categoryApi';

function AdminDashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [topPayer, setTopPayer] = useState<{ user: UserAccount; paymentCount: number; totalSpentVnd: number } | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      const m = await overviewApi.getOverviewMetrics(timeframe);
      const catList = await categoryApi.getCategories();
      // const [m, catList, bRes, u, blog] = await Promise.all([
      //   adminApi.getOverviewMetrics(timeframe),
      //   adminApi.getCategories(),
      //   adminApi.getBills(),
      //   adminApi.getUsers(),
      //   adminApi.getBlogPosts(),
      // ]);

      setMetrics(m);
      setCategories(catList);
      // setBills(bRes.bills);
      // setTopPayer(bRes.topPayerOfMonth);
      // setUsers(u);
      // setBlogPosts(blog);
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [timeframe, isAuthenticated]);

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

  // Product CRUD handlers
  const handleCreateProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'totalPaidUsersCount'>) => {
    // await adminApi.createProduct(data);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    await productApi.update(id, updates);
  };

  // Category CRUD handlers
  const handleCreateCategory = async (data: Omit<Category, 'id' | 'createdAt' | 'productCount'>) => {
    // await adminApi.createCategory(data);
    await loadData();
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    // await adminApi.updateCategory(id, updates);
    await loadData();
  };

  // User Banning handlers
  const handleBanUser = async (userId: string, reason?: string) => {
    // await adminApi.banUser(userId, reason);
    await loadData();
  };

  const handleUnbanUser = async (userId: string) => {
    // await adminApi.unbanUser(userId);
    await loadData();
  };

  // Blog handlers
  const handleCreateBlogPost = async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
    // await adminApi.createBlogPost(post);
    await loadData();
  };

  const handleUpdateBlogPost = async (id: string, updates: Partial<BlogPost>) => {
    // await adminApi.updateBlogPost(id, updates);
    await loadData();
  };

  const handleDeleteBlogPost = async (id: string) => {
    // await adminApi.deleteBlogPost(id);
    await loadData();
  };

  const tabTitles: Record<TabType, string> = {
    overview: 'Platform Analytics Overview',
    products: 'Product & Game Catalog Management',
    categories: 'Game Category Administration',
    bills: 'Financial Bills & Transactions',
    accounts: 'User & Staff Account Administration',
    blog: 'Blog & Site Announcements',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          activeTabTitle={tabTitles[activeTab]}
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
              {activeTab === 'overview' && metrics && <OverviewPage metrics={metrics} />}
              
              {/* Keep ProductsPage mounted to prevent re-fetching on tab navigation */}
              <div className={activeTab === 'products' ? 'block' : 'hidden'}>
                <ProductsPage
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                />
              </div>

              {activeTab === 'categories' && (
                <CategoriesPage
                  categories={categories}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}
              {activeTab === 'bills' && <BillsPage bills={bills} topPayer={topPayer} />}
              {activeTab === 'accounts' && (
                <AccountsPage
                  users={users}
                  onBanUser={handleBanUser}
                  onUnbanUser={handleUnbanUser}
                />
              )}
              {activeTab === 'blog' && (
                <BlogPage
                  posts={blogPosts}
                  onCreatePost={handleCreateBlogPost}
                  onUpdatePost={handleUpdateBlogPost}
                  onDeletePost={handleDeleteBlogPost}
                />
              )}
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
