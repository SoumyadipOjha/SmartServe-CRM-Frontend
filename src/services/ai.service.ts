import apiClient from './api-client';
import { CampaignRules } from '../types/models';

const AIService = {
    /**
     * Convert natural language description to segment rules
     * @param description Natural language description of the segment
     * @returns Promise with converted rules
     */
    convertNaturalLanguageToRules: async (description: string): Promise<CampaignRules> => {
        const response = await apiClient.post<{ description: string, rules: CampaignRules }>('/ai/convert-rules', { description });
        return response.data.rules;
    },

    /**
     * Generate promotional message based on campaign goal
     * @param goal Campaign goal description
     * @returns Promise with generated message
     */
    generatePromotionalMessage: async (goal: string): Promise<string> => {
        const response = await apiClient.post<{ goal: string, message: string }>('/ai/generate-message', { goal });
        return response.data.message;
    }
};

export default AIService;