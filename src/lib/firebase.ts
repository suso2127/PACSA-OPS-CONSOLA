
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración de Firebase para PACSA OPS CONSOLE
 * Proyecto: studio-8627810775-49878
 */
const firebaseConfig = {
  projectId: 'studio-8627810775-49878',
  appId: '1:8627810775:web:8627810775',
  apiKey: 'AIzaSyB-VALOR-REAL-SINCRONIZADO',
  authDomain: 'studio-8627810775-49878.firebaseapp.com',
  storageBucket: 'studio-8627810775-49878.firebasestorage.app',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
