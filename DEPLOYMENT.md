# Production Deployment Guide for MerakiERP

This guide walks you through deploying the MerakiERP Firebase project to production.

## ✅ Pre-Deployment Checklist

- [x] Firebase project `merakierp` exists
- [x] Firestore rules deployed
- [x] Firestore indexes deployed
- [x] Port configuration updated (3001 to avoid conflicts)
- [ ] Environment variables configured
- [ ] Firebase Web App created
- [ ] Service Account key generated

## 🚀 Deployment Steps

### 1. Set up Firebase Web App Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/merakierp)
2. Click on "Project Settings" (gear icon)
3. Go to "General" tab
4. In "Your apps" section, if no web app exists:
   - Click "Add app" > Web (</>) icon
   - App nickname: "MerakiERP Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Register app

5. Copy the Firebase config object values:
```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Copy this
  authDomain: "merakierp.firebaseapp.com",
  projectId: "merakierp",
  storageBucket: "merakierp.appspot.com",
  messagingSenderId: "123456789", // Copy this
  appId: "1:123456789:web:abc123", // Copy this
};
```

### 2. Generate Service Account Key

1. In Firebase Console, go to "Project Settings" > "Service Accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire JSON content (it will be used as a string in environment variables)

### 3. Configure Environment Variables

Create `.env.local` file:
```bash
cp .env.template .env.local
```

Fill in the actual values in `.env.local`:
```env
# Firebase Project Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=merakierp
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...  # From step 1
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=merakierp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=merakierp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789  # From step 1
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123  # From step 1

# Firebase Admin SDK Service Account (entire JSON as string)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"merakierp",...}
```

### 4. Test Locally

```bash
# Install dependencies
npm install

# Test with emulators
npm run dev:emulator

# Test with production Firebase (but local Next.js)
npm run dev
```

Visit: http://localhost:3001

### 5. Deploy to Firebase Hosting (Optional)

To deploy the web app to Firebase Hosting:

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 6. Deploy to External Hosting (Vercel, Netlify, etc.)

For external hosting platforms:

1. **Build command**: `npm run build`
2. **Output directory**: `.next` (for Vercel) or `out` (for static export)
3. **Environment variables**: Copy all variables from `.env.local`

## 🔐 Security Configuration

### Enable Authentication Methods
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Configure authorized domains if needed

### Set up User Roles
Use the admin panel or run this script to set user roles:

```javascript
// Set user role example
import { getAuth } from 'firebase-admin/auth';
await getAuth().setCustomUserClaims(userId, { role: 'admin' });
```

## 📱 Access Points

### Development
- **App**: http://localhost:3001
- **Firebase Emulator UI**: http://localhost:4000

### Production
- **Firebase Hosting**: https://merakierp.web.app
- **Custom Domain**: (configure in Firebase Hosting)
- **Firebase Console**: https://console.firebase.google.com/project/merakierp

## 🎯 First Production Setup

### 1. Create Admin User
```bash
# Use Firebase Console or run this in your app
# Go to Authentication > Users > Add user
Email: admin@merakierp.com
Password: [secure-password]
```

### 2. Set Admin Role
In Firebase Console > Authentication > Users:
1. Click on the admin user
2. Set custom claims: `{"role": "admin"}`

### 3. Initial Data Setup
- Create facilities through the admin panel
- Add employee records
- Set up class schedules

## 🚨 Important Notes

- **Port Change**: App now runs on port 3001 to avoid conflicts with your Interactive Quiz Kit (port 3000)
- **Security**: Never commit `.env.local` to version control
- **Firestore Rules**: Already deployed with role-based access control
- **Development**: Use emulators for local development to avoid affecting production data

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Verify environment variables are set correctly
3. Ensure Firestore rules allow your operations
4. Check browser console for client-side errors

## ✅ Deployment Status

- [x] Firebase project configured
- [x] Firestore rules deployed
- [x] Firestore indexes deployed
- [x] Port configuration updated
- [ ] Production environment variables configured
- [ ] First admin user created

Next steps: Configure environment variables and create your first admin user!