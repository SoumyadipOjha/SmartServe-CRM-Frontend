import apiClient from '../../lib/api-client';

export interface RevenueDay {
    date: string;
    revenue: number;
    count: number;
}

export interface AnalyticsSummary {
    customers: {
        total: number;
        health: { active: number; at_risk: number; dormant: number };
    };
    orders: {
        total: number;
        revenue: number;
        avgOrderValue: number;
        revenueByDay: RevenueDay[];
    };
    campaigns: {
        total: number;
        active: number;
        byStatus: Record<string, number>;
        delivery: { sent: number; failed: number };
        deliveryRate: number;
        recent: {
            _id: string;
            name: string;
            status: string;
            audienceSize: number;
            deliveryStats: { sent: number; failed: number };
            isAbTest?: boolean;
            createdAt: string;
        }[];
    };
    generatedAt: string;
}

const AnalyticsService = {
    getSummary: async (): Promise<AnalyticsSummary> => {
        const response = await apiClient.get<{ summary: AnalyticsSummary }>('/analytics/summary');
        return response.data.summary;
    },

    getStreamUrl(): string {
        const token = localStorage.getItem('token');
        const BASE_URL = process.env.REACT_APP_API_URL ?? '';
        return `${BASE_URL}/api/analytics/stream?token=${encodeURIComponent(token || '')}`;
    },
};

export default AnalyticsService;
