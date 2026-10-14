import { apiClient } from '../../../shared/api/client';
import { ScadaTelemetryItem } from '../types/mepSchemas';

export const mepApi = {
  getTelemetry: async (): Promise<ScadaTelemetryItem[]> => {
    try {
      const response = await apiClient.get<ScadaTelemetryItem[]>('/mep/telemetry');
      return response.data;
    } catch {
      return [
        { id: 'CHILLER-01', name: 'Central Chilled Water Loop', category: 'chiller', status: 'optimal', reading: 12.4, unit: '°C', setpoint: 12.0 },
        { id: 'COMP-02', name: 'High-Pressure Air Compressor', category: 'compressor', status: 'optimal', reading: 38.5, unit: 'bar', setpoint: 40.0 },
        { id: 'HVAC-01', name: 'Cleanroom ISO Class 8 AHU', category: 'hvac', status: 'optimal', reading: 21.0, unit: '°C', setpoint: 21.5 },
      ];
    }
  },
};
