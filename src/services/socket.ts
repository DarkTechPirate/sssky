import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  path: '/api/socket',
  transports: ['websocket', 'polling']
});

export const socketService = {
  connect() {
    socket.connect();
  },

  disconnect() {
    socket.disconnect();
  },

  onEmployeeAdded(callback: (employee: any) => void) {
    socket.on('employee_added', callback);
  },

  onEmployeeDeleted(callback: (employeeId: string) => void) {
    socket.on('employee_deleted', callback);
  },

  onInitialEmployees(callback: (employees: any[]) => void) {
    socket.on('initial_employees', callback);
  },

  emitAddEmployee(employee: any) {
    socket.emit('add_employee', employee);
  },

  emitDeleteEmployee(employeeId: string) {
    socket.emit('delete_employee', employeeId);
  },

  removeAllListeners() {
    socket.removeAllListeners();
  }
}; 