# Checklist Central App

A modern checklist management application built with React, Firebase, and Vercel.

## Features

- 🔐 Secure Authentication (Admin & Employee)
- 👥 Role-based Access Control
- 🏢 Multi-company Support
- ✅ Dynamic Checklist Management
- 📊 Real-time Progress Tracking
- 📱 Responsive Design

## Tech Stack

- Frontend: React + TypeScript + Vite
- UI: TailwindCSS + Radix UI
- Backend: Firebase + Vercel Serverless Functions
- Database: Firestore
- Authentication: Firebase Auth
- Hosting: Vercel

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- Firebase account
- Vercel account

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd checklist-central-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   
   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   
   b. Enable Authentication and Firestore
   
   c. Generate a new Service Account Key:
      - Go to Project Settings > Service Accounts
      - Click "Generate New Private Key"
      - Save the JSON file securely

4. **Environment Variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Vercel Setup**

   a. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

   b. Link your project:
   ```bash
   vercel link
   ```

   c. Add Firebase service account as a secret:
   ```bash
   vercel env add FIREBASE_SERVICE_ACCOUNT_KEY
   # Paste the entire service account JSON when prompted
   ```

6. **Development**
   ```bash
   npm run dev
   ```

7. **Production Build**
   ```bash
   npm run build
   ```

8. **Deploy**
   ```bash
   vercel --prod
   ```

## Initial Admin Setup

After deployment, create the initial admin account:

```bash
curl -X POST https://your-vercel-url/api/createAdmin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-secure-password"}'
```

## Firestore Security Rules

Copy these rules to your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.role == 'admin';
    }
    
    function isEmployee() {
      return request.auth != null && request.auth.token.role == 'employee';
    }
    
    match /employees/{employeeId} {
      allow read: if isAdmin() || (isEmployee() && request.auth.uid == resource.data.uid);
      allow write: if isAdmin();
    }
    
    match /checklists/{checklistId} {
      allow read: if isAdmin() || (isEmployee() && resource.data.assignedTo == request.auth.uid);
      allow write: if isAdmin() || (isEmployee() && resource.data.assignedTo == request.auth.uid);
    }
    
    match /companies/{companyId} {
      allow read: if isAdmin() || isEmployee();
      allow write: if isAdmin();
    }
  }
}
```

## Usage

1. **Admin Portal**
   - Create and manage companies
   - Add and manage employees
   - Create and assign checklists
   - Monitor progress

2. **Employee Portal**
   - View assigned checklists
   - Update task status
   - Track completion progress

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
