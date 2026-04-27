/**
 * Firebase Configuration for Content Creator Workspace
 * 
 * This file initializes Firebase services including:
 * - Authentication (Email/Password)
 * - Firestore Database (for projects, scripts, timer logs)
 * 
 * To use these services in your components, import from this file:
 * import { auth, db } from '@/lib/firebase';
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration - provided by user
const firebaseConfig = {
  apiKey: "AIzaSyBcMdPvkE4XxZmuuVlVLBDtvye0RdlURoU",
  authDomain: "cortenara-9d0cf.firebaseapp.com",
  projectId: "cortenara-9d0cf",
  storageBucket: "cortenara-9d0cf.firebasestorage.app",
  messagingSenderId: "722283269564",
  appId: "1:722283269564:web:8ac6c14dbcc33f15fa6fb9"
};

// Initialize Firebase app (singleton pattern to prevent multiple initializations)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
auth = getAuth(app);

// Initialize Firestore
db = getFirestore(app);

export { app, auth, db };

/**
 * Firestore Collection Schema:
 * 
 * projects/
 *   - {projectId}/
 *     - name: string
 *     - description: string
 *     - createdAt: timestamp
 *     - updatedAt: timestamp
 *     - userId: string
 *     - script: string
 *     - timerLogs: {
 *         scripting: number (milliseconds)
 *         media: number (milliseconds)
 *         review: number (milliseconds)
 *       }
 */
