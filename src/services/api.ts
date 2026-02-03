// API Service - Connects to real backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Employee {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  employeeId: string;
  companyId: string;
  role: 'employee';
  createdAt?: Date;
}

export interface Checklist {
  id?: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  assignedTo: string;
  companyId: string;
  createdAt: Date;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Submission {
  id?: string;
  employeeId: string;
  employeeData: {
    name: string;
    email: string;
    employeeId: string;
    companyId: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  submittedAt: Date;
  createdAt: Date;
}

export interface AdminLoginResponse {
  success: boolean;
  admin: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
  token: string;
}

export interface EmployeeLoginResponse {
  success: boolean;
  employee: {
    id: string;
    email: string;
    name: string;
    employeeId: string;
    companyId: string;
    role: string;
  };
  token: string;
}

// Helper for fetch with credentials
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Important for cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw { response: { data: error } };
  }

  return response.json();
}

export const apiService = {
  // Auth Operations
  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    return fetchApi<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async employeeLogin(email: string, password: string, companyId?: string): Promise<EmployeeLoginResponse> {
    return fetchApi<EmployeeLoginResponse>('/auth/employee/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, companyId }),
    });
  },

  async logout(): Promise<void> {
    await fetchApi('/auth/logout');
  },

  async getCurrentUser(): Promise<{ success: boolean; user: Employee }> {
    return fetchApi('/auth/me');
  },

  // Admin: Employee Operations
  async getEmployees(): Promise<Employee[]> {
    return fetchApi<Employee[]>('/admin/employees');
  },

  async addEmployee(employee: { email: string; password: string; name: string; employeeId: string; companyId: string }): Promise<Employee> {
    return fetchApi<Employee>('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    await fetchApi(`/admin/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    await fetchApi(`/admin/employees/${employeeId}`, {
      method: 'DELETE',
    });
  },

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      return await fetchApi<Employee>(`/admin/employees/email/${encodeURIComponent(email)}`);
    } catch {
      return null;
    }
  },

  // Admin: Submission Operations
  async getSubmissions(companyId?: string): Promise<Submission[]> {
    const query = companyId && companyId !== 'all' ? `?companyId=${companyId}` : '';
    return fetchApi<Submission[]>(`/admin/submissions${query}`);
  },

  // Employee: Submission Operations
  async addSubmission(submission: Omit<Submission, 'id' | 'createdAt' | 'submittedAt'>): Promise<Submission> {
    return fetchApi<Submission>('/employee/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },

  async getSubmissionByEmployee(employeeId: string): Promise<Submission | null> {
    try {
      return await fetchApi<Submission>(`/employee/submissions/today`);
    } catch {
      return null;
    }
  },

  async getMySubmissions(): Promise<Submission[]> {
    return fetchApi<Submission[]>('/employee/submissions');
  },

  // Employee: Profile
  async getMyProfile(): Promise<Employee> {
    return fetchApi<Employee>('/employee/profile');
  },

  async updateMyProfile(updates: Partial<Employee>): Promise<void> {
    await fetchApi('/employee/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Polling-based "real-time" updates
  onEmployeesChange(callback: (employees: Employee[]) => void): () => void {
    let isActive = true;

    const fetchEmployees = async () => {
      if (!isActive) return;
      try {
        const employees = await this.getEmployees();
        if (isActive) {
          callback(employees);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        if (isActive) {
          callback([]);
        }
      }
    };

    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  },

  onSubmissionsChange(callback: (submissions: Submission[]) => void): () => void {
    let isActive = true;

    const fetchSubmissions = async () => {
      if (!isActive) return;
      try {
        const submissions = await this.getSubmissions();
        if (isActive) {
          callback(submissions);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        if (isActive) {
          callback([]);
        }
      }
    };

    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }
};

export default apiService;
