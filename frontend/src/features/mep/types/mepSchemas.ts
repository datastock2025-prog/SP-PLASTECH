import { z } from 'zod';

export const chillerSetpointSchema = z.object({
  unitId: z.string().min(1, 'Unit identifier is required'),
  targetTempC: z.number().min(5).max(35),
  flowRateLpm: z.number().positive(),
});

export type ChillerSetpointFormValues = z.infer<typeof chillerSetpointSchema>;

export interface ScadaTelemetryItem {
  id: string;
  name: string;
  category: 'chiller' | 'compressor' | 'power' | 'hvac';
  status: 'optimal' | 'warning' | 'critical';
  reading: number;
  unit: string;
  setpoint: number;
}
