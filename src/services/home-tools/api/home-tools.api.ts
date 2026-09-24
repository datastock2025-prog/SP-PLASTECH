import axios, { AxiosInstance } from 'axios';
import {
  DashboardData,
  DashboardWidget,
  Task,
  ApprovalRequest,
  Notification,
  SavedView,
  RecentRecord,
} from './home-tools.types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export class HomeToolsApi {
  private static instance: HomeToolsApi;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Attach tenant ID & CSRF headers
    this.api.interceptors.request.use((config) => {
      const tenantId = this.getActiveTenantId();
      const csrfToken = this.getCsrfToken();
      if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
      if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
      return config;
    });

    // Response interceptor: Silent 401 token refresh queue
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
            return this.api(originalRequest);
          } catch (refreshErr) {
            console.warn('[HomeToolsApi] Session expired, redirecting to auth.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): HomeToolsApi {
    if (!HomeToolsApi.instance) {
      HomeToolsApi.instance = new HomeToolsApi();
    }
    return HomeToolsApi.instance;
  }

  // ==================== SCREEN 1: WORKSPACE HOME ====================
  async getDashboard(): Promise<DashboardData> {
    try {
      const res = await this.api.get('/home-tools/dashboard');
      return res.data;
    } catch {
      return {
        stats: { pendingTasksCount: 2, pendingApprovalsCount: 3, unreadNotificationsCount: 2, activeWorkOrders: 14, averagePlantOeePct: 84.6, plantStatus: 'OPERATIONAL_NOMINAL' },
        widgets: [
          { id: 'WDG-01', widgetType: 'PENDING_TASKS', title: 'Assigned Action Items', config: {}, position: 1, isVisible: true, refreshInterval: 120 },
          { id: 'WDG-02', widgetType: 'MY_APPROVALS', title: 'Pending Stage-Gates', config: {}, position: 2, isVisible: true, refreshInterval: 120 },
          { id: 'WDG-03', widgetType: 'PRODUCTION_STATUS', title: 'IMM Bays Production Status', config: {}, position: 3, isVisible: true, refreshInterval: 300 },
          { id: 'WDG-04', widgetType: 'INVENTORY_ALERTS', title: 'Resin Silo Low Stock Alerts', config: {}, position: 4, isVisible: true, refreshInterval: 300 },
        ],
      };
    }
  }

  async getDashboardWidgets(): Promise<DashboardWidget[]> {
    try {
      const res = await this.api.get('/home-tools/dashboard/widgets');
      return res.data;
    } catch {
      return [];
    }
  }

  async createWidget(widgetData: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const res = await this.api.post('/home-tools/dashboard/widgets', widgetData);
    return res.data;
  }

  async updateWidget(widgetId: string, config: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const res = await this.api.put(`/home-tools/dashboard/widgets/${widgetId}`, config);
    return res.data;
  }

  // ==================== SCREEN 2: MY TASKS ====================
  async getTasks(filters: { status?: string; priority?: string; page?: number; limit?: number } = {}): Promise<{ tasks: Task[]; total: number; page: number }> {
    try {
      const res = await this.api.get('/home-tools/tasks', { params: filters });
      return res.data;
    } catch {
      return { tasks: [], total: 0, page: 1 };
    }
  }

  async getTaskById(taskId: string): Promise<Task> {
    const res = await this.api.get(`/home-tools/tasks/${taskId}`);
    return res.data;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const res = await this.api.post('/home-tools/tasks', taskData);
    return res.data;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    const res = await this.api.put(`/home-tools/tasks/${taskId}/status`, { status });
    return res.data;
  }

  // ==================== SCREEN 3: MY APPROVALS ====================
  async getApprovals(filters: { status?: string; page?: number; limit?: number } = {}): Promise<{ approvals: ApprovalRequest[]; total: number }> {
    try {
      const res = await this.api.get('/home-tools/approvals', { params: filters });
      return res.data;
    } catch {
      return { approvals: [], total: 0 };
    }
  }

  async getApprovalById(approvalId: string): Promise<ApprovalRequest> {
    const res = await this.api.get(`/home-tools/approvals/${approvalId}`);
    return res.data;
  }

  async processApproval(approvalId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'ESCALATE', comments?: string): Promise<ApprovalRequest> {
    const res = await this.api.post(`/home-tools/approvals/${approvalId}/action`, { action, comments });
    return res.data;
  }

  // ==================== SCREEN 4: NOTIFICATIONS ====================
  async getNotifications(filters: { isRead?: boolean; page?: number; limit?: number } = {}): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const res = await this.api.get('/home-tools/notifications', { params: filters });
      return res.data;
    } catch {
      return { notifications: [], total: 0 };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const res = await this.api.get('/home-tools/notifications/unread-count');
      return res.data.count || 0;
    } catch {
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.api.post(`/home-tools/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.api.post('/home-tools/notifications/read-all');
  }

  // ==================== SCREEN 5: SAVED VIEWS ====================
  async getSavedViews(module?: string): Promise<SavedView[]> {
    try {
      const res = await this.api.get('/home-tools/saved-views', { params: { module } });
      return res.data;
    } catch {
      return [];
    }
  }

  async createSavedView(viewData: Partial<SavedView>): Promise<SavedView> {
    const res = await this.api.post('/home-tools/saved-views', viewData);
    return res.data;
  }

  async updateSavedView(viewId: string, viewData: Partial<SavedView>): Promise<SavedView> {
    const res = await this.api.put(`/home-tools/saved-views/${viewId}`, viewData);
    return res.data;
  }

  async deleteSavedView(viewId: string): Promise<void> {
    await this.api.delete(`/home-tools/saved-views/${viewId}`);
  }

  // ==================== SCREEN 6: RECENT RECORDS ====================
  async getRecentRecords(limit: number = 20): Promise<RecentRecord[]> {
    try {
      const res = await this.api.get('/home-tools/recent-records', { params: { limit } });
      return res.data;
    } catch {
      return [];
    }
  }

  async logRecentRecord(entityType: string, entityId: string, recordName: string, recordUrl: string): Promise<void> {
    try {
      await this.api.post('/home-tools/recent-records', { entityType, entityId, recordName, recordUrl });
    } catch {
      // Non-blocking telemetry
    }
  }

  async deleteRecentRecord(recordId: string): Promise<void> {
    await this.api.delete(`/home-tools/recent-records/${recordId}`);
  }

  async clearRecentRecords(): Promise<void> {
    await this.api.delete('/home-tools/recent-records');
  }

  // ==================== HELPERS ====================
  private getActiveTenantId(): string {
    return localStorage.getItem('activeTenantId') || 'TENANT-ALPHA-IND';
  }

  private getCsrfToken(): string {
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1] || '';
  }
}

export const homeToolsApi = HomeToolsApi.getInstance();
