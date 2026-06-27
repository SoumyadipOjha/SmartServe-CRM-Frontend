export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}