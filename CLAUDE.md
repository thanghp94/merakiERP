# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npm run setup` - Run initial project setup script

### Testing and Development
- Development server runs on http://localhost:3001 (avoiding port conflicts)
- Before making significant changes, always run `npm run lint` to ensure code quality
- The project includes a setup script that should be run for initial configuration
- Firebase emulators run on http://localhost:4000 (UI) for local testing

## Architecture Overview

This is a **Meraki ERP** - an English Language Center Management System built with:

### Core Technologies
- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database**: Firebase Firestore with flexible metadata approach
- **Authentication**: Firebase Auth with custom claims for role-based access control (RBAC)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI components

### Database Architecture (Firebase Firestore)
The system uses a **collection-based architecture** with:
- **Main collections** for core entities
- **Subcollections** for related data organized hierarchically
- **Flexible metadata** stored as nested objects in documents

#### Collection Structure
```
facilities/
├── {facilityId}/
    ├── classes/
        ├── {classId}/
            ├── enrollments/
            ├── main_sessions/
                ├── {sessionId}/
                    ├── sessions/
                    ├── attendance/

students/
├── {studentId}/
    ├── enrollments/
    ├── finances/

employees/
├── {employeeId}/
    ├── tasks/
```

#### Document Data Examples
```json
// Student document
{
  "id": "auto-generated",
  "full_name": "Student Name",
  "email": "student@example.com",
  "phone": "0123456789",
  "status": "active",
  "data": {
    "date_of_birth": "1990-01-01",
    "emergency_contact": {
      "name": "Parent Name",
      "phone": "0123456789", 
      "relationship": "Parent"
    },
    "level": "beginner",
    "notes": "Additional notes"
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}

// Class document
{
  "id": "auto-generated",
  "class_name": "English Beginner A1",
  "facility_id": "facility_reference_id",
  "status": "active",
  "start_date": "2024-01-01",
  "data": {
    "end_date": "2024-12-31",
    "level": "intermediate",
    "max_students": 20,
    "schedule": {
      "days": ["Monday", "Wednesday"],
      "time": "18:00-20:00"
    },
    "instructor_id": "uuid-here"
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Authentication System
- Firebase Authentication with email/password
- Custom claims for role-based access control
- Auth context in `lib/auth/AuthContext.tsx`
- Protected routes using `components/auth/ProtectedRoute.tsx`
- RBAC utilities in `lib/auth/rbac.ts`

## Project Structure

```
/components/
  /auth/           # Authentication components
  /dashboard/      # Dashboard-specific components
  [ComponentName].tsx # Reusable UI components

/lib/
  /auth/           # Authentication logic and RBAC
  /api/            # API helper functions
  /utils/          # Utility functions (timezone, etc.)
  /validations/    # Zod schemas for form validation
  firebase.ts      # Firebase client configuration
  firebase-admin.ts # Firebase Admin SDK configuration

/pages/
  /api/            # Next.js API routes
  /auth/           # Authentication pages
  [page].tsx       # Main application pages

/database/
  schema.sql       # Database schema definitions

/scripts/         # Development and setup scripts
/styles/          # Global CSS and Tailwind config
```

## Environment Configuration

### Required Environment Variables
Copy `.env.example` to `.env.local` and configure:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=merakierp
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=merakierp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=merakierp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK Service Account
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Development Guidelines

### Component Patterns
- Uses functional components with TypeScript
- Form components use React Hook Form + Zod validation
- UI components follow Headless UI patterns
- All components are located in `/components/` directory

### API Patterns
- API routes in `/pages/api/` follow RESTful conventions
- Database operations use Firestore via Firebase Admin SDK
- TypeScript interfaces defined in `lib/firebase.ts` for all database models
- Authentication middleware in `lib/auth/rbac.ts`

### State Management
- React Context for authentication state
- Local component state for UI interactions
- No global state management library (Redux/Zustand) currently used

### Styling Conventions
- Tailwind CSS for all styling
- Custom CSS in `styles/globals.css`
- Responsive design patterns throughout

## Common Tasks

### Adding New Collections
1. Add collection name to `COLLECTIONS` constant in `lib/firebase-admin.ts`
2. Add TypeScript interface to `lib/firebase.ts`
3. Create API routes in `/pages/api/[collection]/`
4. Implement RBAC middleware for access control

### Creating New Components
- Follow existing patterns in `/components/`
- Use TypeScript interfaces for props
- Implement responsive design with Tailwind
- Use React Hook Form for forms with Zod validation

### Database Operations
- All queries go through Firebase Admin SDK
- Use TypeScript interfaces for type safety
- Leverage nested objects for flexible metadata
- Follow existing patterns in API routes

## Special Features

### Bilingual Support
- Interface supports Vietnamese and English
- Localization patterns implemented throughout

### Role-Based Access Control
- RBAC system in `lib/auth/rbac.ts`
- Role checking in components and API routes
- Protected route patterns established
- Firebase custom claims for role management

### Flexible Data Model
- Nested object approach allows for evolving requirements
- Core fields for performance, metadata for flexibility
- Well-defined TypeScript interfaces for structure

### Collection Organization
- Hierarchical subcollections for better data organization
- Related data grouped under parent collections
- Efficient querying and data relationships