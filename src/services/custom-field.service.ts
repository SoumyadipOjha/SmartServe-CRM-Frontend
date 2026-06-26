import apiClient from './api-client';

export interface FieldDef {
    _id: string;
    name: string;
    key: string;
    fieldType: 'text' | 'number' | 'date' | 'boolean';
}

const CustomFieldService = {
    getFieldDefs: async (): Promise<FieldDef[]> => {
        const res = await apiClient.get<{ defs: FieldDef[] }>('/custom-fields');
        return res.data.defs;
    },

    createFieldDef: async (name: string, fieldType: FieldDef['fieldType']): Promise<FieldDef> => {
        const res = await apiClient.post<{ def: FieldDef }>('/custom-fields', { name, fieldType });
        return res.data.def;
    },

    deleteFieldDef: async (defId: string): Promise<void> => {
        await apiClient.delete(`/custom-fields/${defId}`);
    },

    setCustomerFields: async (
        customerId: string,
        fields: Record<string, string | number | boolean | null>,
    ): Promise<Record<string, unknown>> => {
        const res = await apiClient.patch<{ customFields: Record<string, unknown> }>(
            `/custom-fields/customers/${customerId}`,
            { fields },
        );
        return res.data.customFields;
    },
};

export default CustomFieldService;
