import apiClient from '../../../lib/api-client';
import { Customer, CustomerProfile, Note } from '../../../shared/types/models';

const CustomerService = {
    /**
     * Get all customers
     * @returns Promise with customers array
     */
    getCustomers: async (): Promise<Customer[]> => {
        const response = await apiClient.get<{ customers: Customer[] }>('/customers');
        return response.data.customers;
    },

    /**
     * Get a single customer by ID
     * @param id Customer ID
     * @returns Promise with customer data
     */
    getCustomer: async (id: string): Promise<Customer> => {
        const response = await apiClient.get<{ customer: Customer }>(`/customers/${id}`);
        return response.data.customer;
    },

    /**
     * Create a new customer
     * @param customerData Customer data to create
     * @returns Promise with created customer
     */
    createCustomer: async (customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalSpend' | 'visits' | 'lastActivity'>): Promise<Customer> => {
        const response = await apiClient.post<{ customer: Customer, message: string }>('/customers', customerData);
        return response.data.customer;
    },

    /**
     * Update a customer
     * @param id Customer ID
     * @param customerData Customer data to update
     * @returns Promise with updated customer
     */
    updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
        const response = await apiClient.put<{ customer: Customer, message: string }>(`/customers/${id}`, customerData);
        return response.data.customer;
    },

    /**
     * Get full 360 profile for a customer
     */
    getCustomerProfile: async (id: string): Promise<CustomerProfile> => {
        const response = await apiClient.get<CustomerProfile>(`/customers/${id}/profile`);
        return response.data;
    },

    /**
     * Delete a customer
     * @param id Customer ID
     * @returns Promise with success message
     */
    deleteCustomer: async (id: string): Promise<string> => {
        const response = await apiClient.delete<{ message: string }>(`/customers/${id}`);
        return response.data.message;
    },

    addNote: async (customerId: string, content: string): Promise<Note> => {
        const response = await apiClient.post<{ note: Note }>(`/customers/${customerId}/notes`, { content });
        return response.data.note;
    },

    deleteNote: async (customerId: string, noteId: string): Promise<void> => {
        await apiClient.delete(`/customers/${customerId}/notes/${noteId}`);
    },

    updateTags: async (customerId: string, tags: string[]): Promise<Customer> => {
        const response = await apiClient.put<{ customer: Customer }>(`/customers/${customerId}`, { tags });
        return response.data.customer;
    },
};

export default CustomerService;