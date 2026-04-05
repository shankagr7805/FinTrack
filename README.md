# FinTrack Dashboard

A clean and interactive finance dashboard built with React, Tailwind CSS, and Recharts.

## Features

- **Dashboard Overview**: Summary cards for Total Balance, Income, and Expenses.
- **Visualizations**: Interactive charts for balance trends (Area Chart) and spending breakdown (Pie Chart).
- **Transactions Management**: 
  - List view with filtering by type (Income/Expense).
  - Search functionality by description or category.
  - Role-based actions: Admins can add, edit, and delete transactions; Viewers have read-only access.
- **Role-Based UI**: Real role-based access control (RBAC) with Admin and Viewer roles.
- **Insights Section**: Automated observations based on spending patterns.
- **Authentication**: Real Firebase Authentication supporting Google Sign-In and Email/Password (with Password Reset).
- **Responsive Design**: Fully functional on mobile, tablet, and desktop.
- **State Management**: Context API for global state (Auth and Finance).
- **Persistence**: Real-time data synchronization using Cloud Firestore.
- **Animations**: Smooth transitions using `motion`.

## Tech Stack

- **Framework**: React 19
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Motion
- **State**: React Context API

## Setup Instructions

1. The application is pre-configured with Firebase.
2. Ensure `firebase-applet-config.json` is present in the root directory with your Firebase project credentials.
3. To start manually:
   ```bash
   npm install
   npm run dev
   ```
4. **Firestore Rules**: Deploy the provided `firestore.rules` to your Firebase project to enforce security and role-based access.

## Design Decisions

- **Interactivity**: Used `motion` for tab transitions and modal animations to provide a premium feel.
- **Clarity**: Used high-contrast colors (Emerald for income, Rose for expenses) to help users quickly distinguish financial data.
- **Modularity**: Components are separated by concern (Overview, Transactions, Insights) for better maintainability.
- **Accessibility**: Ensured touch targets are large enough for mobile use and used semantic HTML where possible.
