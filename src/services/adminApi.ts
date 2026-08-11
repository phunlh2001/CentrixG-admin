// import type { Product, Bill, UserAccount, BlogPost, OverviewMetrics, BaseResponse, Category, PaginatedResponse } from '../types';
// import { axiosClient } from '../api/axiosClient';

// // In-memory cache for product pagination to prevent redundant re-fetching
// let productsCache: Record<string, PaginatedResponse<Product>> = {};

// export function invalidateProductsCache() {
//   productsCache = {};
// }

// function unwrapResponse<T>(json: BaseResponse<T> | T): T {
//   if (json && typeof json === 'object' && 'data' in json && (json as any).data !== undefined) {
//     return (json as any).data;
//   }
//   return json as T;
// }

// export const adminApi = {
//   // --- OVERVIEW METRICS ---
//   async getOverviewMetrics(timeframe: 'weekly' | 'monthly' = 'monthly'): Promise<OverviewMetrics> {
//     // try {
//     //   const res = await axiosClient.get(`/admin/overview?timeframe=${timeframe}`);
//     //   return unwrapResponse<OverviewMetrics>(res.data);
//     // } catch (err) {
//     //   console.warn('Overview API unavailable, returning blank metrics:', err);
//     // }

//     return {
//       totalRevenueVnd: 0,
//       totalRevenueUsd: 0,
//       totalRevenueCny: 0,
//       topSellerProducts: [],
//       userAccountsSummary: {
//         total: 0,
//         activeCount: 0,
//         bannedCount: 0,
//         newlyCreated: [],
//       },
//       timeframe,
//     };
//   },

//   // --- PRODUCTS (REAL API DATA WITH CACHING) ---
//   async getProductsPaginated(
//     params: {
//       searchName?: string;
//       includeHidden?: boolean;
//       page?: number;
//       pageSize?: number;
//     },
//     forceRefresh = false
//   ): Promise<PaginatedResponse<Product>> {
//     const page = params.page || 1;
//     const pageSize = params.pageSize || 10;
//     const includeHidden = params.includeHidden ?? true;
//     const search = params.searchName || '';
//     const cacheKey = `${search}_${includeHidden}_${page}_${pageSize}`;

//     // Return cached product response if available and no force refresh requested
//     if (!forceRefresh && productsCache[cacheKey]) {
//       return productsCache[cacheKey];
//     }

//     try {
//       const queryParams = new URLSearchParams({
//         includeHidden: String(includeHidden),
//         page: String(page),
//         pageSize: String(pageSize),
//       });
//       if (search) {
//         queryParams.append('search', search);
//       }

//       const res = await axiosClient.get(`/products?${queryParams.toString()}`);
//       const data = unwrapResponse<PaginatedResponse<Product>>(res.data);
//       if (!data) {
//         throw new Error('No data received from API');
//       }

//       const items: Product[] = data.items;
//       const total = items.length;
//       const totalPages = Math.ceil(total / pageSize) || 1;

//       const result: PaginatedResponse<Product> = {
//         items,
//         total,
//         page,
//         limit: pageSize,
//         totalPages,
//       };

//       productsCache[cacheKey] = result;
//       return result;
//     } catch (e) {
//       console.warn('Products API error, returning empty dataset:', e);
//       return {
//         items: [],
//         total: 0,
//         page,
//         limit: 10,
//         totalPages: 1,
//       };
//     }
//   },

//   async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'totalPaidUsersCount'>): Promise<Product> {
//     invalidateProductsCache();

//     const payload = {
//       name: data.name,
//       pricing: data.pricing?.vnd || 0,
//       disabled: data.isDelete,
//       imageUrl: data.imageUrl,
//     };

//     const res = await axiosClient.post('/products', payload);
//     const rawData = unwrapResponse<any>(res.data);
//     return {
//       id: rawData.id,
//       name: rawData.name,
//       pricing: rawData.pricing,
//       isDelete: rawData.isDelete ?? data.isDelete,
//       isDenuvo: rawData.isDenuvo ?? data.isDenuvo,
//       disabled: rawData.disabled ?? data.disabled,
//       categories: rawData.categories ?? data.categories,
//       imageUrl: rawData.imageUrl || data.imageUrl,
//       createdAt: rawData.createdAt || new Date().toISOString(),
//       publisher: rawData.publisher || data.publisher,
//     };
//   },

//   async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
//     invalidateProductsCache();

//     const patchPayload: Record<string, any> = {};
//     if (updates.name !== undefined) patchPayload.name = updates.name;
//     if (updates.pricing !== undefined) {
//       patchPayload.pricing = updates.pricing;
//     }
//     if (updates.isDelete !== undefined) {
//       patchPayload.isDelete = updates.isDelete;
//     }
//     if (updates.imageUrl !== undefined) patchPayload.imageUrl = updates.imageUrl;

//     const res = await axiosClient.patch(`/products/${id}`, patchPayload);
//     const rawData = unwrapResponse<any>(res.data);
//     return {
//       id: rawData?.id || id,
//       name: rawData?.name || updates.name || '',
//       pricing: rawData?.pricing || updates.pricing || { vnd: 0, usd: 0, cny: 0 },
//       isDelete: rawData?.disabled ?? (rawData?.isAvailable !== undefined ? !rawData.isAvailable : Boolean(updates.isDelete)),
//       category: rawData?.category || updates.category || 'General',
//       imageUrl: rawData?.imageUrl || updates.imageUrl || '',
//       createdAt: rawData?.createdAt || new Date().toISOString(),
//     };
//   },

//   // --- CATEGORIES ---
//   async getCategories(): Promise<Category[]> {
//     try {
//       const res = await axiosClient.get('/categories');
//       return unwrapResponse<Category[]>(res.data);
//     } catch (e) {
//       console.warn('Categories API unavailable, returning empty list:', e);
//     }
//     return [];
//   },

//   async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<Category> {
//     const res = await axiosClient.post('/categories', category);
//     return unwrapResponse<Category>(res.data);
//   },

//   async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
//     const res = await axiosClient.put(`/categories/${id}`, updates);
//     return unwrapResponse<Category>(res.data);
//   },

//   async deleteCategory(id: string): Promise<boolean> {
//     await axiosClient.delete(`/categories/${id}`);
//     return true;
//   },

//   // --- BILLS ---
//   async getBills(): Promise<{ bills: Bill[]; topPayerOfMonth: { user: UserAccount; paymentCount: number; totalSpentVnd: number } | null }> {
//     try {
//       const res = await axiosClient.get('/admin/bills');
//       return unwrapResponse<{ bills: Bill[]; topPayerOfMonth: { user: UserAccount; paymentCount: number; totalSpentVnd: number } | null }>(res.data);
//     } catch (e) {
//       console.warn('Bills API unavailable, returning empty list:', e);
//     }

//     return {
//       bills: [],
//       topPayerOfMonth: null,
//     };
//   },

//   // --- ACCOUNTS & BANNING ---
//   async getUsers(): Promise<UserAccount[]> {
//     try {
//       const res = await axiosClient.get('/admin/users');
//       return unwrapResponse<UserAccount[]>(res.data);
//     } catch (e) {
//       console.warn('Users API unavailable, returning empty list:', e);
//     }
//     return [];
//   },

//   async banUser(userId: string, reason?: string): Promise<{ user: UserAccount; emailNotificationSent: boolean }> {
//     const res = await axiosClient.post(`/admin/users/${userId}/ban`, { reason });
//     return unwrapResponse<{ user: UserAccount; emailNotificationSent: boolean }>(res.data);
//   },

//   async unbanUser(userId: string): Promise<UserAccount> {
//     const res = await axiosClient.post(`/admin/users/${userId}/unban`);
//     return unwrapResponse<UserAccount>(res.data);
//   },

//   // --- BLOG TAB ---
//   async getBlogPosts(): Promise<BlogPost[]> {
//     try {
//       const res = await axiosClient.get('/admin/blog');
//       return unwrapResponse<BlogPost[]>(res.data);
//     } catch (e) {
//       console.warn('Blog API unavailable, returning empty list:', e);
//     }
//     return [];
//   },

//   async createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
//     const res = await axiosClient.post('/admin/blog', post);
//     return unwrapResponse<BlogPost>(res.data);
//   },

//   async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
//     const res = await axiosClient.put(`/admin/blog/${id}`, updates);
//     return unwrapResponse<BlogPost>(res.data);
//   },

//   async deleteBlogPost(id: string): Promise<boolean> {
//     const res = await axiosClient.delete(`/admin/blog/${id}`);
//     return unwrapResponse<boolean>(res.data);
//   },
// };
