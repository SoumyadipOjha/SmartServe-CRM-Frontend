export interface Customer {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    totalSpend: number;
    visits: number;
    lastActivity: Date;
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
        failed: number;
    };
    status: 'draft' | 'active' | 'completed' | 'cancelled';
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