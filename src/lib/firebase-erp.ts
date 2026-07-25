
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración del Proyecto ERP (studio-672610643-a82f1)
 * Solo lectura para módulos de Operaciones y Planificación.
 */
const erpConfig = {
  apiKey: "AIzaSyB8DEYAT-b8RmyySoHkL1Pqz4hm5vU3NTA",
  authDomain: "studio-672610643-a82f1.firebaseapp.com",
  projectId: "studio-672610643-a82f1",
  storageBucket: "studio-672610643-a82f1.firebasestorage.app",
  messagingSenderId: "738901018808",
  appId: "1:738901018808:web:84d707e74698207e628c4d"
};

// Inicialización segura de la instancia secundaria
const erpApp = getApps().find(app => app.name === 'erp-readonly') 
  || initializeApp(erpConfig, 'erp-readonly');

const erpDb = getFirestore(erpApp);

export { erpDb };
