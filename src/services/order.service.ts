import apiClient from './api-client';
import { Order, Product } from '../types/models';

interface OrderCreateData {
    customer: string;
    amount: number;
    products: Product[];
}

const OrderService = {
    /**
     * Get all orders
     * @returns Promise with orders array
     */
    getOrders: async (): Promise<Order[]> => {
        const response = await apiClient.get<{ orders: Order[] }>('/orders');
        return response.data.orders;
    },

    /**
     * Get a single order by ID
     * @param id Order ID
     * @returns Promise with order data
     */
    getOrder: async (id: string): Promise<Order> => {
        const response = await apiClient.get<{ order: Order }>(`/orders/${id}`);
        return response.data.order;
    },

    /**
     * Get orders by customer ID
     * @param customerId Customer ID
     * @returns Promise with orders array
     */
    getOrdersByCustomer: async (customerId: string): Promise<Order[]> => {
        const response = await apiClient.get<{ orders: Order[] }>(`/orders/customer/${customerId}`);
        return response.data.orders;
    },

    /**
     * Create a new order
     * @param orderData Order data to create
     * @returns Promise with created order
     */
    createOrder: async (orderData: OrderCreateData): Promise<Order> => {
        const response = await apiClient.post<{ order: Order, message: string }>('/orders', orderData);
        return response.data.order;
    },

    /**
     * Update order status
     * @param id Order ID
     * @param status New order status
     * @returns Promise with updated order
     */
    updateOrderStatus: async (id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Order> => {
        const response = await apiClient.patch<{ order: Order, message: string }>(`/orders/${id}/status`, { status });
        return response.data.order;
    }
};

export default OrderService;