import { z } from 'zod';

export const dashboardFilterSchema = z.object({
  plantId: z.string().optional(),
  shiftId: z.string().optional(),
  dateRange: z.enum(['today', 'yesterday', 'this_week', 'this_month']).default('today'),
});

export type DashboardFilterFormValues = z.infer<typeof dashboardFilterSchema>;

export interface DashboardMetrics {
  activeWOCount: number;
  lowStockCount: number;
  openPOCount: number;
  oeePercentage: number;
  openNcrs: number;
  machineUtilization: number;
}
