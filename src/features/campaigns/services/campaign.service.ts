import apiClient from '../../../lib/api-client';
import { Campaign, CampaignRules, CampaignJob } from '../../../shared/types/models';

interface CampaignCreateData {
    name: string;
    description?: string;
    rules: CampaignRules;
    message: string;
    isAbTest?: boolean;
    variantBMessage?: string;
    scheduledAt?: string;
}

const CampaignService = {
    /**
     * Get all campaigns
     * @returns Promise with campaigns array
     */
    getCampaigns: async (): Promise<Campaign[]> => {
        const response = await apiClient.get<{ campaigns: Campaign[] }>('/campaigns');
        return response.data.campaigns;
    },

    /**
     * Get a single campaign by ID
     * @param id Campaign ID
     * @returns Promise with campaign data
     */
    getCampaign: async (id: string): Promise<Campaign> => {
        const response = await apiClient.get<{ campaign: Campaign }>(`/campaigns/${id}`);
        return response.data.campaign;
    },

    /**
     * Create a new campaign
     * @param campaignData Campaign data to create
     * @returns Promise with created campaign
     */
    createCampaign: async (campaignData: CampaignCreateData): Promise<Campaign> => {
        // Format and sanitize the campaign data before sending
        const sanitizedData: any = {
            ...campaignData,
            rules: {
                condition: campaignData.rules.condition.toUpperCase() as 'AND' | 'OR',
                conditions: campaignData.rules.conditions.map(condition => ({
                    field: condition.field,
                    operator: condition.operator,
                    value: ['totalSpend', 'visits'].includes(condition.field) &&
                           typeof condition.value === 'string' ?
                           Number(condition.value) : condition.value
                }))
            },
            message: campaignData.message.trim(),
        };
        if (campaignData.isAbTest && campaignData.variantBMessage) {
            sanitizedData.isAbTest = true;
            sanitizedData.variantBMessage = campaignData.variantBMessage.trim();
        }
        
        console.log('Sending sanitized campaign data:', sanitizedData);
        
        try {
            const response = await apiClient.post<{ campaign: Campaign, message: string }>('/campaigns', sanitizedData);
            return response.data.campaign;
        } catch (error: any) {
            console.error('Campaign creation error details:', error.response?.data);
            throw error;
        }
    },

    /**
     * Activate a campaign and send messages
     * @param id Campaign ID
     * @returns Promise with activated campaign
     */
    activateCampaign: async (id: string): Promise<{ message: string; jobId?: string; campaignId: string; scheduledAt?: string }> => {
        const response = await apiClient.post<{ message: string; jobId?: string; campaignId: string; scheduledAt?: string }>(`/campaigns/${id}/activate`);
        return response.data;
    },

    getJobStatus: async (campaignId: string): Promise<CampaignJob> => {
        const response = await apiClient.get<{ job: CampaignJob }>(`/campaigns/${campaignId}/job`);
        return response.data.job;
    },

    /**
     * Get latest campaign statistics (for real-time updates)
     * @param id Campaign ID
     * @returns Promise with campaign delivery stats
     */
    getCampaignStats: async (id: string): Promise<{
        sent: number;
        opened: number;
        clicked: number;
        failed: number;
        audienceSize: number;
        isAbTest?: boolean;
        variants?: { label: string; audienceSize: number; sent: number; opened: number; failed: number }[];
    }> => {
        const response = await apiClient.get<{
            stats: {
                sent: number; opened: number; clicked: number; failed: number; audienceSize: number;
                isAbTest?: boolean;
                variants?: { label: string; audienceSize: number; sent: number; opened: number; failed: number }[];
            }
        }>(`/campaigns/${id}/stats`);
        return response.data.stats;
    },

    /**
     * Preview audience size for a campaign based on rules
     * @param rules Campaign rules
     * @returns Promise with audience count
     */
    previewAudience: async (rules: CampaignRules): Promise<{
        count: number;
        audience: { _id: string; name: string; email: string }[];
    }> => {
        const sanitizedRules = {
            condition: rules.condition.toUpperCase() as 'AND' | 'OR',
            conditions: rules.conditions.map(condition => ({
                field: condition.field,
                operator: condition.operator,
                value: ['totalSpend', 'visits'].includes(condition.field) &&
                       typeof condition.value === 'string' ?
                       Number(condition.value) : condition.value
            }))
        };

        const response = await apiClient.post<{
            audienceCount: number;
            audience: { _id: string; name: string; email: string }[];
        }>('/campaigns/preview', { rules: sanitizedRules });
        return { count: response.data.audienceCount, audience: response.data.audience ?? [] };
    }
};

export default CampaignService;