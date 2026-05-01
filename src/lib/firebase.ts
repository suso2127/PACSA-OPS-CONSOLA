
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'studio-8627810775-49878',
  appId: '1:8627810775:web:unknown',
  apiKey: 'fake-api-key-for-ui-development',
  authDomain: 'studio-8627810775-49878.firebaseapp.com',
  storageBucket: 'studio-8627810775-49878.firebasestorage.app',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
