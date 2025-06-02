import apiClient from './api-client';
import { Customer } from '../types/models';

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
     * Delete a customer
     * @param id Customer ID
     * @returns Promise with success message
     */
    deleteCustomer: async (id: string): Promise<string> => {
        const response = await apiClient.delete<{ message: string }>(`/customers/${id}`);
        return response.data.message;
    }
};

export default CustomerService;