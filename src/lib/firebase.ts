import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'studio-8627810775-49878',
  appId: '1:758838734019:web:764dff0d592fbaf05f4676',
  apiKey: 'AIzaSyCAmp0IIgt1ISaGSPjUSLxXGWUHDB4ZJYM',
  authDomain: 'studio-8627810775-49878.firebaseapp.com',
  storageBucket: 'studio-8627810775-49878.firebasestorage.app',
  messagingSenderId: '758838734019',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
