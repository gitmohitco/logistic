import { apiRequest } from './apiClient';
import { ExceptionItem } from '../types';

export const exceptionService = {
  async getExceptions(): Promise<ExceptionItem[]> {
    return apiRequest<ExceptionItem[]>('/exceptions');
  },

  async getExceptionById(id: string): Promise<ExceptionItem> {
    return apiRequest<ExceptionItem>(`/exceptions/${id}`);
  },

  async resolveException(
    id: string,
    action: string,
    notes: string
  ): Promise<{ success: boolean; exception: ExceptionItem }> {
    return apiRequest<{ success: boolean; exception: ExceptionItem }>(
      `/exceptions/${id}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      }
    );
  },
};
