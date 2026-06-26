import apiClient from './api-client';
import { Task } from '../types/models';

const TaskService = {
    getTasksForCustomer: async (customerId: string): Promise<Task[]> => {
        const res = await apiClient.get<{ tasks: Task[] }>(`/customers/${customerId}/tasks`);
        return res.data.tasks;
    },

    createTask: async (customerId: string, data: {
        title: string;
        description?: string;
        dueDate?: string | null;
        priority?: 'low' | 'medium' | 'high';
    }): Promise<Task> => {
        const res = await apiClient.post<{ task: Task }>(`/customers/${customerId}/tasks`, data);
        return res.data.task;
    },

    updateTask: async (taskId: string, data: Partial<{
        title: string;
        description: string;
        dueDate: string | null;
        priority: 'low' | 'medium' | 'high';
        completed: boolean;
    }>): Promise<Task> => {
        const res = await apiClient.patch<{ task: Task }>(`/tasks/${taskId}`, data);
        return res.data.task;
    },

    deleteTask: async (taskId: string): Promise<void> => {
        await apiClient.delete(`/tasks/${taskId}`);
    },

    getAllTasks: async (completed?: boolean): Promise<Task[]> => {
        const params = completed !== undefined ? `?completed=${completed}` : '';
        const res = await apiClient.get<{ tasks: Task[] }>(`/tasks${params}`);
        return res.data.tasks;
    },
};

export default TaskService;
