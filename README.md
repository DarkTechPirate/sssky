# TaskFlow Management System - Checklist Central App

## 📋 Overview

**TaskFlow Management System** (Checklist Central) is a comprehensive web-based task and checklist management application designed for manufacturing/PCB fabrication companies. It enables employees to track their daily tasks through predefined checklists and allows administrators to monitor employee progress in real-time.

The application is built specifically for managing quality control workflows in PCB (Printed Circuit Board) manufacturing, with predefined checklists covering various stages of the production process.

---

## 🎯 Purpose & Why This App Exists

### The Problem
In manufacturing environments, especially PCB fabrication:
- Employees need to follow strict quality control procedures
- Multiple checklist items must be verified at each production stage
- Managers need visibility into task completion across teams
- Tracking paper-based checklists is inefficient and error-prone

### The Solution
This application provides:
- **Digital checklists** organized by production stages
- **Real-time progress tracking** for employees
- **Centralized dashboard** for administrators to monitor all submissions
- **Multi-company support** for organizations with multiple facilities

---

## 👥 User Roles

### 1. **Employees**
- Log in with company-specific credentials
- Access task checklists organized by production stages
- Mark tasks as complete
- Submit daily progress reports
- View their completion statistics

### 2. **Administrators**
- Access a comprehensive dashboard
- Monitor all employee submissions
- Filter reports by company
- Manage employees (add, edit, delete)
- View completion statistics and analytics

---

## 🔐 Login Credentials (Demo/Test)

### Admin Accounts
| Username | Password |
|----------|----------|
| `admin01` | `ADMIN123` |
| `admin02` | `ADMIN456` |

### Employee Accounts
| Company | Email | Password |
|---------|-------|----------|
| Company 1 | `emp1@company1.com` | `Employee123` |
| Company 1 | `emp2@company1.com` | `Employee123` |
| Company 2 | `emp1@company2.com` | `Employee123` |
| Company 2 | `emp2@company2.com` | `Employee123` |
| Company 3 | `emp1@company3.com` | `Employee123` |

---

## 📁 Project Structure

```
checklist-central-app-main/
├── public/                    # Static assets
│   └── robots.txt
├── src/
│   ├── components/
│   │   └── ui/               # Reusable UI components (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── toast.tsx
│   │       └── ... (40+ UI components)
│   ├── hooks/
│   │   ├── use-mobile.tsx    # Mobile detection hook
│   │   └── use-toast.ts      # Toast notification hook
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── pages/
│   │   ├── Index.tsx         # Home page with portal selection
│   │   ├── AdminLogin.tsx    # Admin authentication page
│   │   ├── AdminDashboard.tsx # Admin control panel
│   │   ├── EmployeeLogin.tsx  # Employee authentication page
│   │   ├── EmployeeDashboard.tsx # Employee task interface
│   │   └── NotFound.tsx      # 404 page
│   ├── services/
│   │   ├── api.ts            # Mock API service (localStorage-based)
│   │   └── socket.ts         # WebSocket service (optional)
│   ├── App.tsx               # Main application component
│   ├── App.css               # Global styles
│   ├── main.tsx              # Application entry point
│   └── index.css             # Tailwind CSS imports
├── backend/                   # Backend server (optional)
│   ├── server.js             # Express server with MongoDB
│   └── package.json
├── Checklist-new.json        # Checklist data (PCB manufacturing tasks)
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vercel.json               # Vercel deployment config
```

---

## 📝 Checklist Categories (Production Stages)

The application includes predefined checklists for PCB manufacturing stages:

| Category | Description |
|----------|-------------|
| **ORIG** | Original data settings and verification |
| **REFERANCE** | Reference data translation and netlist creation |
| **Edit\|stackup** | Layer stackup editing and verification |
| **Edit\|Marking** | Date codes, logos, and markings |
| **EDIT\|Rout** | Routing tool setup and verification |
| **EDIT\|Drill** | Drill tool configuration |
| **DRILL_PLOT** | Drill plotting and documentation |
| **Netlist** | Netlist creation and verification |
| **Other** | Additional layer checks |
| **Panel\|Setup** | Manufacturing panel configuration |
| **Multipanel\|Setup** | Multi-board panel setup |
| **Panel\|Edit** | Panel editing and verification |
| **Final** | Final documentation and packaging |
| **Panel special** | Special panel requirements |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built UI components
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **React Query** - Data fetching (optional)

### Storage
- **localStorage** - Client-side data persistence (mock mode)
- **MongoDB** - Database (when using backend)

### Build & Deploy
- **Vercel** - Deployment platform
- **ESLint** - Code linting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd checklist-central-app-main

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 📱 Features

### Home Page
- Portal selection (Employee or Admin)
- Clean, modern interface
- Feature highlights for each portal

### Employee Dashboard
- **Checklist Navigation**: Switch between different production stages
- **Task List**: View all tasks with descriptions
- **Progress Tracking**: Visual progress bar showing completion
- **Task Completion**: Check/uncheck tasks
- **Submit Progress**: Send daily completion report

### Admin Dashboard
- **Overview Statistics**: Total submissions, completion rates
- **Company Filter**: View submissions by company
- **Employee Management**: Add, edit, delete employees
- **Submission History**: View all employee submissions
- **Real-time Updates**: Automatic data refresh every 5 seconds

---

## 💾 Data Storage

The application operates in **mock mode** by default, storing all data in the browser's localStorage:

- `mock_employees` - Employee records
- `mock_submissions` - Task submission history
- `employeeData` / `adminData` - Current user session
- `authToken` - Authentication token
- `employeeTasks` - Current task progress

**Note**: Data persists in your browser but is not synced across devices.

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite bundler configuration |
| `tailwind.config.ts` | Tailwind CSS theme customization |
| `tsconfig.json` | TypeScript compiler options |
| `components.json` | shadcn/ui component configuration |
| `vercel.json` | Vercel deployment settings |

---

## 🖥️ Screenshots & UI Flow

### 1. Home Page
The landing page presents two portals:
- **Employee Portal** - For task completion and progress tracking
- **Admin Portal** - For management and monitoring

### 2. Employee Login
- Select company from dropdown
- Enter email and password
- Redirects to Employee Dashboard on success

### 3. Employee Dashboard
- View assigned checklist items
- Toggle between different production stages (tabs)
- Check off completed tasks
- See progress bar update in real-time
- Submit daily progress report

### 4. Admin Login
- Enter admin username and password
- Redirects to Admin Dashboard on success

### 5. Admin Dashboard
- Overview cards showing statistics
- Employee management section
- Submission history with filters
- Company-based filtering

---

## 🔄 Application Flow

```
┌─────────────────┐
│   Home Page     │
│  (Index.tsx)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│Employee │ │  Admin  │
│ Login   │ │  Login  │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│Employee │ │  Admin  │
│Dashboard│ │Dashboard│
└─────────┘ └─────────┘
```

---

## 📊 Data Model

### Employee
```typescript
{
  id: string;
  name: string;
  email: string;
  employeeId: string;
  companyId: string;
  role: 'employee';
  createdAt: Date;
}
```

### Submission
```typescript
{
  id: string;
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
```

---

## 🛡️ Security Notes

- This is a demo/development version with hardcoded credentials
- For production, implement proper authentication (JWT, OAuth)
- Passwords should be hashed and stored securely
- Enable HTTPS for all API communications

---

## 📄 License

This project is private and proprietary.

---

## 🤝 Support

For questions or issues, contact the development team.

---

## 📝 Changelog

### Version 1.0.0
- Initial release
- Employee and Admin portals
- PCB manufacturing checklists
- Mock API for frontend-only operation
- localStorage-based data persistence
