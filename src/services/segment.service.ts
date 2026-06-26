import apiClient from './api-client';
import { Segment, SegmentPreview, CampaignRules, RuleCondition } from '../types/models';

const SegmentService = {
    getSegments: async (): Promise<Segment[]> => {
        const res = await apiClient.get<{ segments: Segment[] }>('/segments');
        return res.data.segments;
    },

    getSegment: async (id: string): Promise<Segment> => {
        const res = await apiClient.get<{ segment: Segment }>(`/segments/${id}`);
        return res.data.segment;
    },

    createSegment: async (data: {
        name: string;
        description?: string;
        tags?: string[];
        rules: CampaignRules;
        exclusions?: RuleCondition[];
    }): Promise<Segment> => {
        const res = await apiClient.post<{ segment: Segment }>('/segments', data);
        return res.data.segment;
    },

    deleteSegment: async (id: string): Promise<void> => {
        await apiClient.delete(`/segments/${id}`);
    },

    preview: async (rules: CampaignRules, exclusions: RuleCondition[] = []): Promise<SegmentPreview> => {
        const res = await apiClient.post<SegmentPreview>('/segments/preview', { rules, exclusions });
        return res.data;
    },
};

export default SegmentService;
