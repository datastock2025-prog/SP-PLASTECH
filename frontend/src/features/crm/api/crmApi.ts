import { apiClient } from '../../../shared/api/client';
import { Customer, Quotation } from '../../../types';
import { initialCustomers, initialQuotations } from '../../../data/initialData';

export const crmApi = {
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<Customer[]>('/crm/customers');
      return response.data;
    } catch {
      return initialCustomers;
    }
  },

  getQuotations: async (): Promise<Quotation[]> => {
    try {
      const response = await apiClient.get<Quotation[]>('/crm/quotations');
      return response.data;
    } catch {
      return initialQuotations;
    }
  },
};
