import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;
try {
  // Try to read from environment variable first
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  if (!serviceAccount.type) {
    // If not available, read from file
    const keyPath = join(dirname(__dirname), 'firebase-key.json');
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://skyla-tech-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO for Vercel
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  path: '/api/socket'
});

app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('Client connected');

  // Send current employees to newly connected client
  const snapshot = await db.collection('employees').get();
  const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  socket.emit('initial_employees', employees);

  // Handle new employee addition
  socket.on('add_employee', async (employee) => {
    const docRef = await db.collection('employees').add(employee);
    const newEmployee = { id: docRef.id, ...employee };
    socket.broadcast.emit('employee_added', newEmployee);
  });

  // Handle employee deletion
  socket.on('delete_employee', async (employeeId) => {
    await db.collection('employees').doc(employeeId).delete();
    socket.broadcast.emit('employee_deleted', employeeId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// REST endpoints
app.get('/api/employees', async (req, res) => {
  try {
    const snapshot = await db.collection('employees').get();
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(employees);
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = req.body;
    const docRef = await db.collection('employees').add(employee);
    const newEmployee = { id: docRef.id, ...employee };
    io.emit('employee_added', newEmployee);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('employees').doc(id).delete();
    io.emit('employee_deleted', id);
    res.status(200).json({ message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// For Vercel serverless functions
if (process.env.VERCEL) {
  // Export the Express app
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
} 