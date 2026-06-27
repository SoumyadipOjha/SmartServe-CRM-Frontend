import apiClient from '../../../lib/api-client';

export interface SequenceStep {
  _id?:      string;
  delayDays: number;
  subject:   string;
  body:      string;
}

export interface Sequence {
  _id:         string;
  name:        string;
  description: string;
  steps:       SequenceStep[];
  active:      boolean;
  createdAt:   string;
}

export interface SequenceEnrollment {
  _id:         string;
  sequence:    { _id: string; name: string } | string;
  customer:    { _id: string; name: string; email: string } | string;
  currentStep: number;
  status:      'active' | 'completed' | 'paused' | 'cancelled';
  nextSendAt:  string | null;
  completedAt: string | null;
  stepsLog:    { stepIndex: number; sentAt: string; subject: string }[];
  createdAt:   string;
}

const SequenceService = {
  getAll:    ()                                   => apiClient.get<Sequence[]>('/sequences').then(r => r.data),
  getOne:    (id: string)                         => apiClient.get<Sequence>(`/sequences/${id}`).then(r => r.data),
  create:    (data: Partial<Sequence>)            => apiClient.post<Sequence>('/sequences', data).then(r => r.data),
  update:    (id: string, data: Partial<Sequence>) => apiClient.patch<Sequence>(`/sequences/${id}`, data).then(r => r.data),
  remove:    (id: string)                         => apiClient.delete(`/sequences/${id}`),

  getEnrollments:  (seqId: string)                => apiClient.get<SequenceEnrollment[]>(`/sequences/${seqId}/enrollments`).then(r => r.data),
  enroll:          (seqId: string, customerId: string) =>
    apiClient.post<SequenceEnrollment>(`/sequences/${seqId}/enroll`, { customerId }).then(r => r.data),
  cancelEnrollment: (seqId: string, enrollmentId: string) =>
    apiClient.patch<SequenceEnrollment>(`/sequences/${seqId}/enrollments/${enrollmentId}/cancel`, {}).then(r => r.data),
};

export default SequenceService;
