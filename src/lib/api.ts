import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'minister' | 'record_office' | 'department';
  department_id: number | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Letter {
  id: number;
  subject: string;
  body: string;
  document_path: string | null;
  document_name: string | null;
  document_type: string | null;
  document_size: number | null;
  description: string | null;
  from_department_id: number;
  to_department_id: number | null;
  requires_minister: boolean;
  status: 'pending_review' | 'needs_minister_approval' | 'minister_approved' | 'minister_rejected' | 'forwarded' | 'delivered' | 'rejected';
  created_by_user_id: number;
  reviewed_by_admin_id: number | null;
  minister_decision: 'approved' | 'rejected' | null;
  reviewed_at: string | null;
  minister_decided_at: string | null;
  created_at: string;
  updated_at: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Departments API
export const departmentsAPI = {
  getAll: async (): Promise<Department[]> => {
    const response = await api.get('/departments');
    return response.data.data;
  },
};

// Letters API
export const lettersAPI = {
  getInbox: async (): Promise<Letter[]> => {
    const response = await api.get('/letters/inbox');
    return response.data.data;
  },

  getSent: async (): Promise<Letter[]> => {
    const response = await api.get('/letters/sent');
    return response.data.data;
  },

  create: async (data: { subject: string; description: string; document: File; requires_minister?: boolean }): Promise<Letter> => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('document', data.document);
    formData.append('requires_minister', data.requires_minister ? '1' : '0');
    
    const response = await api.post('/letters', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  adminReview: async (id: number, data: { action: 'forward' | 'needs_minister'; to_department_id?: number }): Promise<Letter> => {
    const response = await api.patch(`/letters/${id}/admin-review`, data);
    return response.data.data;
  },

  ministerDecision: async (id: number, decision: 'approved' | 'rejected'): Promise<Letter> => {
    const response = await api.patch(`/letters/${id}/minister-decision`, { decision });
    return response.data.data;
  },

  forward: async (id: number, to_department_id: number): Promise<Letter> => {
    const response = await api.patch(`/letters/${id}/forward`, { to_department_id });
    return response.data.data;
  },
};

export default api;