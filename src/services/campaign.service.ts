import apiClient from './api-client';
import { Campaign, CampaignRules } from '../types/models';

interface CampaignCreateData {
    name: string;
    description?: string;
    rules: CampaignRules;
    message: string;
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
        const sanitizedData = {
            ...campaignData,
            // Ensure rules are properly formatted
            rules: {
                // Fix capitalization - ensure condition is always uppercase 'AND' or 'OR'
                condition: campaignData.rules.condition.toUpperCase() as 'AND' | 'OR',
                conditions: campaignData.rules.conditions.map(condition => ({
                    field: condition.field,
                    operator: condition.operator,
                    // Convert numeric values to actual numbers if needed
                    value: ['totalSpend', 'visits'].includes(condition.field) && 
                           typeof condition.value === 'string' ? 
                           Number(condition.value) : condition.value
                }))
            },
            // Trim any excessive whitespace in the message
            message: campaignData.message.trim()
        };
        
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
    activateCampaign: async (id: string): Promise<{ message: string, audienceSize: number }> => {
        const response = await apiClient.post<{ message: string, audienceSize: number }>(`/campaigns/${id}/activate`);
        return response.data;
    },

    /**
     * Get latest campaign statistics (for real-time updates)
     * @param id Campaign ID
     * @returns Promise with campaign delivery stats
     */
    getCampaignStats: async (id: string): Promise<{
        sent: number;
        failed: number;
        audienceSize: number;
    }> => {
        const response = await apiClient.get<{
            stats: { sent: number; failed: number; audienceSize: number }
        }>(`/campaigns/${id}/stats`);
        return response.data.stats;
    },

    /**
     * Preview audience size for a campaign based on rules
     * @param rules Campaign rules
     * @returns Promise with audience count
     */
    previewAudience: async (rules: CampaignRules): Promise<number> => {
        // Format rules the same way as in createCampaign for consistency
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
        
        const response = await apiClient.post<{ audienceCount: number }>('/campaigns/preview', { rules: sanitizedRules });
        return response.data.audienceCount;
    }
};

export default CampaignService;