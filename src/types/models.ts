export interface Note {
    _id: string;
    content: string;
    createdAt: Date;
}

export interface Customer {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    totalSpend: number;
    visits: number;
    lastActivity: Date;
    tags?: string[];
    notes?: Note[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
    _id: string;
    customer: string | Customer;
    amount: number;
    products: Product[];
    status: 'pending' | 'completed' | 'cancelled';
    orderDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface RuleCondition {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '=' | '!=' | 'contains';
    value: any;
}

export interface CampaignRules {
    conditions: RuleCondition[];
    condition: 'AND' | 'OR';
}

export interface CampaignVariant {
    label: 'A' | 'B';
    message: string;
    audienceSize: number;
    deliveryStats: {
        sent: number;
        opened: number;
        failed: number;
    };
}

export interface Campaign {
    _id: string;
    name: string;
    description?: string;
    rules: CampaignRules;
    message: string;
    audience: string[] | Customer[];
    audienceSize: number;
    deliveryStats: {
        sent: number;
        opened: number;
        failed: number;
    };
    status: 'draft' | 'queued' | 'active' | 'completed' | 'cancelled';
    isAbTest?: boolean;
    variants?: CampaignVariant[];
    scheduledAt?: Date | null;
    createdBy: string | User;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommunicationLog {
    _id: string;
    campaign: string | Campaign;
    customer: string | Customer;
    message: string;
    status: 'sent' | 'failed' | 'pending';
    failureReason?: string;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Segment {
    _id: string;
    name: string;
    description?: string;
    tags: string[];
    rules: CampaignRules;
    exclusions: RuleCondition[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SegmentPreview {
    count: number;
    samples: { _id: string; name: string; email: string }[];
    excludedCount: number;
}

export interface CampaignJob {
    jobId: string;
    campaignId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    processed: number;
    total: number;
    error: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

export interface CustomerProfile {
    customer: Customer;
    orders: Order[];
    communicationLogs: CommunicationLog[];
    stats: {
        orderCount: number;
        daysSinceLastActivity: number;
        avgOrderValue: number;
        healthStatus: 'active' | 'at_risk' | 'dormant';
    };
}

export interface Task {
    _id: string;
    customer: string | Customer;
    createdBy: string | User;
    title: string;
    description?: string;
    dueDate?: Date | null;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    googleId: string;
    picture?: string;
    role: 'admin' | 'user';
    createdAt: Date;
    updatedAt: Date;
}