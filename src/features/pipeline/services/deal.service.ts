import apiClient from '../../../lib/api-client';
import { Deal, DealStage } from '../../../shared/types/models';

const DealService = {
    getDeals: async (): Promise<Deal[]> => {
        const res = await apiClient.get<{ deals: Deal[] }>('/deals');
        return res.data.deals;
    },

    createDeal: async (data: {
        title: string;
        customerId: string;
        stage?: DealStage;
        value?: number;
        expectedCloseDate?: string | null;
        notes?: string;
    }): Promise<Deal> => {
        const res = await apiClient.post<{ deal: Deal }>('/deals', data);
        return res.data.deal;
    },

    updateDeal: async (id: string, data: Partial<{
        title: string;
        stage: DealStage;
        value: number;
        expectedCloseDate: string | null;
        notes: string;
    }>): Promise<Deal> => {
        const res = await apiClient.patch<{ deal: Deal }>(`/deals/${id}`, data);
        return res.data.deal;
    },

    reorderDeals: async (updates: { id: string; stage: DealStage; order: number }[]): Promise<void> => {
        await apiClient.patch('/deals/reorder', { updates });
    },

    deleteDeal: async (id: string): Promise<void> => {
        await apiClient.delete(`/deals/${id}`);
    },
};

export default DealService;
