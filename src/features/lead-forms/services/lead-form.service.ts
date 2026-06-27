import apiClient from '../../../lib/api-client';

export interface LeadFormField {
  label:     string;
  fieldKey:  string;
  fieldType: 'text' | 'email' | 'phone' | 'textarea';
  required:  boolean;
}

export interface LeadForm {
  _id:              string;
  name:             string;
  token:            string;
  fields:           LeadFormField[];
  submitMessage:    string;
  active:           boolean;
  submissionsCount: number;
  createdAt:        string;
}

const LeadFormService = {
  getForms:   ()                              => apiClient.get<LeadForm[]>('/lead-forms').then(r => r.data),
  createForm: (data: Partial<LeadForm>)       => apiClient.post<LeadForm>('/lead-forms', data).then(r => r.data),
  updateForm: (id: string, data: Partial<LeadForm>) => apiClient.patch<LeadForm>(`/lead-forms/${id}`, data).then(r => r.data),
  deleteForm: (id: string)                    => apiClient.delete(`/lead-forms/${id}`),

  // Public — no auth header needed
  getPublicForm: (token: string) =>
    apiClient.get<Pick<LeadForm,'name'|'fields'|'submitMessage'>>(`/lead-forms/public/${token}`).then(r => r.data),
  submitForm: (token: string, data: Record<string, string>) =>
    apiClient.post<{ message: string }>(`/lead-forms/public/${token}/submit`, data).then(r => r.data),
};

export default LeadFormService;
