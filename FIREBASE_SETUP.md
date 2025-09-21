# Firebase Emulator Setup Guide

This guide will help you set up and run the Firebase emulators locally to test the Meraki ERP project.

## Prerequisites

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Install project dependencies:
```bash
npm install
```

## Setup Steps

### 1. Initialize Firebase Project (if not done already)
```bash
firebase login
firebase init
```

- Select "Firestore", "Auth", and "Emulators"
- Choose "Use an existing project" and select "merakierp"
- Accept default settings for Firestore rules and indexes
- Configure emulators: Auth (9099), Firestore (8080), UI (4000)

### 2. Set up Environment Variables
Create `.env.local` from the template:
```bash
cp .env.template .env.local
```

For development with emulators, you can use these placeholder values in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=merakierp
NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key-for-emulator
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=merakierp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=merakierp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"merakierp"}
```

## Running the Emulators

### Option 1: Run Emulators and Dev Server Together
```bash
npm run dev:emulator
```

### Option 2: Run Emulators Separately
```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start Next.js dev server
npm run dev
```

### Option 3: Run with UI and Data Persistence
```bash
npm run emulators:ui
```

## Seed Sample Data

After starting the emulators, seed with sample data:
```bash
npm run seed:emulator
```

This will create:
- Sample users (admin, teacher, student)
- Sample facilities and classes
- Sample students and enrollments
- Sample financial records

## Access Points

- **Next.js App**: http://localhost:3001 (changed from 3000 to avoid conflicts)
- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099

## Sample Accounts

After seeding, you can login with these accounts:

- **Admin**: admin@merakierp.com / admin123
- **Teacher**: teacher@merakierp.com / teacher123  
- **Student**: student@merakierp.com / student123

## Troubleshooting

### Emulator Connection Issues
If you get connection errors, make sure:
1. No other services are using ports 8080, 9099, or 4000
2. Firebase CLI is updated to the latest version
3. Emulators are fully started before running the Next.js app

### Data Not Persisting
The emulators run in memory by default. To persist data between sessions:
```bash
firebase emulators:start --import=./firebase-export --export-on-exit
```

### Reset Emulator Data
To start fresh:
```bash
# Stop emulators and delete export directory
rm -rf firebase-export
# Restart emulators and re-seed
npm run emulators
npm run seed:emulator
```

## Production Setup

For production, replace the placeholder environment variables with real Firebase project credentials from the Firebase Console.