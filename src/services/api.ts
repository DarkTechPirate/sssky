import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  updateDoc,
  query,
  where,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore';

// Types
export interface Employee {
  id?: string;
  uid: string;
  name: string;
  email: string;
  companyId: string;
  role: 'employee';
  createdAt: Date;
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

const COLLECTIONS = {
  EMPLOYEES: 'employees',
  CHECKLISTS: 'checklists',
  COMPANIES: 'companies'
} as const;

export const apiService = {
  // Employee Operations
  onEmployeesChange(callback: (employees: Employee[]) => void) {
    return onSnapshot(collection(db, COLLECTIONS.EMPLOYEES), (snapshot) => {
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Employee));
      callback(employees);
    });
  },

  async addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), {
        ...employee,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  },

  async updateEmployee(employeeId: string, updates: Partial<Omit<Employee, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const employeeRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
      await updateDoc(employeeRef, updates);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      const q = query(collection(db, COLLECTIONS.EMPLOYEES), where("email", "==", email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Employee;
    } catch (error) {
      console.error('Error getting employee by email:', error);
      throw error;
    }
  },

  // Checklist Operations
  async addChecklist(checklist: Omit<Checklist, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CHECKLISTS), {
        ...checklist,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding checklist:', error);
      throw error;
    }
  },

  async updateChecklist(checklistId: string, updates: Partial<Omit<Checklist, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const checklistRef = doc(db, COLLECTIONS.CHECKLISTS, checklistId);
      await updateDoc(checklistRef, updates);
    } catch (error) {
      console.error('Error updating checklist:', error);
      throw error;
    }
  },

  async getChecklists(companyId?: string): Promise<Checklist[]> {
    try {
      const checklistsRef = collection(db, COLLECTIONS.CHECKLISTS);
      const q = companyId 
        ? query(checklistsRef, where("companyId", "==", companyId))
        : checklistsRef;
        
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate()
      } as Checklist));
    } catch (error) {
      console.error('Error getting checklists:', error);
      throw error;
    }
  },

  onChecklistsChange(companyId: string | undefined, callback: (checklists: Checklist[]) => void) {
    const checklistsRef = collection(db, COLLECTIONS.CHECKLISTS);
    const q = companyId 
      ? query(checklistsRef, where("companyId", "==", companyId))
      : checklistsRef;

    return onSnapshot(q, (snapshot) => {
      const checklists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate()
      } as Checklist));
      callback(checklists);
    });
  },

  // Company Operations
  async addCompany(company: Omit<Company, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.COMPANIES), {
        ...company,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  },

  async getCompanies(): Promise<Company[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.COMPANIES));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Company));
    } catch (error) {
      console.error('Error getting companies:', error);
      throw error;
    }
  },

  onCompaniesChange(callback: (companies: Company[]) => void) {
    return onSnapshot(collection(db, COLLECTIONS.COMPANIES), (snapshot) => {
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Company));
      callback(companies);
    });
  }
}; 