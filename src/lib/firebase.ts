import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { Product, Supplier, Sale, FinancialTransaction, TableComandaState, CashierUser } from '../types';
import { 
  INITIAL_PRODUCTS, MOCK_SALES, INITIAL_SUPPLIERS, 
  MOCK_FINANCIAL_TRANSACTIONS, INITIAL_TABLES_COMANDAS, INITIAL_CASHIER_USERS 
} from '../data/mockData';

// Public client-side environment variables
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDl6RiKkdWSJTb2Qi1cHKXX45j5HUNxnAU",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "adegaos-bc0ff.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "adegaos-bc0ff",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "adegaos-bc0ff.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "303265966754",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:303265966754:web:098e6dfac893e02f0b45fb",
};


const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId
);

let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('🔥 Firebase initialized successfully for production storage!');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
} else {
  console.log(
    'ℹ️ Firebase environment variables are not configured.\n' +
    'The application is running in hybrid mode, persisting data safely in local storage.\n' +
    'To transition to production cloud storage (Firebase Firestore), configure the environment variables on Vercel/Netlify or in .env.'
  );
}

// Check status
export const isFirebaseEnabled = () => !!db;

// Helper to handle local storage fallback
const getLocalData = <T>(key: string, initialDefault: T | (() => T)): T => {
  const local = localStorage.getItem(key);
  if (local) {
    try {
      return JSON.parse(local) as T;
    } catch {
      // JSON parse failed
    }
  }
  return typeof initialDefault === 'function' 
    ? (initialDefault as () => T)() 
    : initialDefault;
};

const setLocalData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper to recursively strip undefined values to prevent Firestore crashes
const cleanData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = cleanData(val);
      }
    }
    return newObj;
  }
  return obj;
};

/* ============================================================================
   1. PRODUCTS SERVICE
   ============================================================================ */
export const fetchProductsFromDb = async (): Promise<Product[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty) {
        // Seed database on first run
        const seedProducts = INITIAL_PRODUCTS;
        const batch = writeBatch(db);
        seedProducts.forEach((p) => {
          const docRef = doc(db, 'products', p.id);
          batch.set(docRef, cleanData(p));
        });
        await batch.commit();
        console.log('🌱 Seeded products collection in Firestore.');
        return seedProducts;
      }
      return snap.docs.map(d => d.data() as Product);
    } catch (err) {
      console.error('Error fetching products from Firestore, falling back to local:', err);
    }
  }
  return getLocalData<Product[]>('adega_products', INITIAL_PRODUCTS);
};

export const saveProductToDb = async (product: Product): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'products', product.id), cleanData(product));
      return;
    } catch (err) {
      console.error('Error saving product to Firestore:', err);
    }
  }
  // Fallback to local state is managed in React State + we update localStorage
  const current = getLocalData<Product[]>('adega_products', INITIAL_PRODUCTS);
  const updated = current.some(p => p.id === product.id)
    ? current.map(p => p.id === product.id ? product : p)
    : [...current, product];
  setLocalData('adega_products', updated);
};

/* ============================================================================
   2. SALES SERVICE
   ============================================================================ */
export const fetchSalesFromDb = async (): Promise<Sale[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'sales'));
      if (snap.empty) {
        // Seed first batch of sales
        const seedSales = MOCK_SALES;
        const batch = writeBatch(db);
        // Only write first 25 sales to avoid exceeding batch limits
        seedSales.slice(0, 25).forEach((sale) => {
          const docRef = doc(db, 'sales', sale.id);
          batch.set(docRef, cleanData(sale));
        });
        await batch.commit();
        return seedSales;
      }
      return snap.docs.map(d => d.data() as Sale).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (err) {
      console.error('Error fetching sales from Firestore:', err);
    }
  }
  return getLocalData<Sale[]>('adega_sales', MOCK_SALES);
};

export const saveSaleToDb = async (sale: Sale): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'sales', sale.id), cleanData(sale));
      return;
    } catch (err) {
      console.error('Error saving sale to Firestore:', err);
    }
  }
  const current = getLocalData<Sale[]>('adega_sales', MOCK_SALES);
  const updated = current.some(s => s.id === sale.id)
    ? current.map(s => s.id === sale.id ? sale : s)
    : [sale, ...current];
  setLocalData('adega_sales', updated);
};

/* ============================================================================
   3. SUPPLIERS SERVICE
   ============================================================================ */
export const fetchSuppliersFromDb = async (): Promise<Supplier[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'suppliers'));
      if (snap.empty) {
        const seedSuppliers = INITIAL_SUPPLIERS;
        const batch = writeBatch(db);
        seedSuppliers.forEach((s) => {
          const docRef = doc(db, 'suppliers', s.id);
          batch.set(docRef, cleanData(s));
        });
        await batch.commit();
        return seedSuppliers;
      }
      return snap.docs.map(d => d.data() as Supplier);
    } catch (err) {
      console.error('Error fetching suppliers from Firestore:', err);
    }
  }
  return getLocalData<Supplier[]>('adega_suppliers', INITIAL_SUPPLIERS);
};

export const saveSupplierToDb = async (supplier: Supplier): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'suppliers', supplier.id), cleanData(supplier));
      return;
    } catch (err) {
      console.error('Error saving supplier to Firestore:', err);
    }
  }
  const current = getLocalData<Supplier[]>('adega_suppliers', INITIAL_SUPPLIERS);
  const updated = current.some(s => s.id === supplier.id)
    ? current.map(s => s.id === supplier.id ? supplier : s)
    : [...current, supplier];
  setLocalData('adega_suppliers', updated);
};

export const deleteSupplierFromDb = async (id: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      return;
    } catch (err) {
      console.error('Error deleting supplier from Firestore:', err);
    }
  }
  const current = getLocalData<Supplier[]>('adega_suppliers', INITIAL_SUPPLIERS);
  const updated = current.filter(s => s.id !== id);
  setLocalData('adega_suppliers', updated);
};

/* ============================================================================
   4. FINANCIAL TRANSACTIONS SERVICE
   ============================================================================ */
export const fetchTransactionsFromDb = async (): Promise<FinancialTransaction[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      if (snap.empty) {
        const seedTx = MOCK_FINANCIAL_TRANSACTIONS();
        const batch = writeBatch(db);
        seedTx.forEach((tx) => {
          const docRef = doc(db, 'transactions', tx.id);
          batch.set(docRef, cleanData(tx));
        });
        await batch.commit();
        return seedTx;
      }
      return snap.docs.map(d => d.data() as FinancialTransaction).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (err) {
      console.error('Error fetching transactions from Firestore:', err);
    }
  }
  return getLocalData<FinancialTransaction[]>('adega_transactions', MOCK_FINANCIAL_TRANSACTIONS);
};

export const saveTransactionToDb = async (tx: FinancialTransaction): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'transactions', tx.id), cleanData(tx));
      return;
    } catch (err) {
      console.error('Error saving transaction to Firestore:', err);
    }
  }
  const current = getLocalData<FinancialTransaction[]>('adega_transactions', MOCK_FINANCIAL_TRANSACTIONS);
  const updated = current.some(t => t.id === tx.id)
    ? current.map(t => t.id === tx.id ? tx : t)
    : [tx, ...current];
  setLocalData('adega_transactions', updated);
};

export const deleteTransactionFromDb = async (id: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      return;
    } catch (err) {
      console.error('Error deleting transaction from Firestore:', err);
    }
  }
  const current = getLocalData<FinancialTransaction[]>('adega_transactions', MOCK_FINANCIAL_TRANSACTIONS);
  const updated = current.filter(t => t.id !== id);
  setLocalData('adega_transactions', updated);
};

/* ============================================================================
   5. TABLES & COMANDAS SERVICE
   ============================================================================ */
export const fetchTablesComandasFromDb = async (): Promise<TableComandaState[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'tables_comandas'));
      if (snap.empty) {
        const seedTables = INITIAL_TABLES_COMANDAS;
        const batch = writeBatch(db);
        seedTables.forEach((t) => {
          const docRef = doc(db, 'tables_comandas', t.id);
          batch.set(docRef, cleanData(t));
        });
        await batch.commit();
        return seedTables;
      }
      return snap.docs.map(d => d.data() as TableComandaState).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'mesa' ? -1 : 1;
        return a.number - b.number;
      });
    } catch (err) {
      console.error('Error fetching tables from Firestore:', err);
    }
  }
  return getLocalData<TableComandaState[]>('adega_tables', INITIAL_TABLES_COMANDAS);
};

export const saveTableComandaToDb = async (table: TableComandaState): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'tables_comandas', table.id), cleanData(table));
      return;
    } catch (err) {
      console.error('Error saving table to Firestore:', err);
    }
  }
  const current = getLocalData<TableComandaState[]>('adega_tables', INITIAL_TABLES_COMANDAS);
  const updated = current.some(t => t.id === table.id)
    ? current.map(t => t.id === table.id ? table : t)
    : [...current, table].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'mesa' ? -1 : 1;
        return a.number - b.number;
      });
  setLocalData('adega_tables', updated);
};

export const deleteTableComandaFromDb = async (id: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'tables_comandas', id));
      return;
    } catch (err) {
      console.error('Error deleting table from Firestore:', err);
    }
  }
  const current = getLocalData<TableComandaState[]>('adega_tables', INITIAL_TABLES_COMANDAS);
  const updated = current.filter(t => t.id !== id);
  setLocalData('adega_tables', updated);
};

/* ============================================================================
   6. CASHIER USERS SERVICE
   ============================================================================ */
export const fetchUsersFromDb = async (): Promise<CashierUser[]> => {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) {
        const seedUsers = INITIAL_CASHIER_USERS;
        const batch = writeBatch(db);
        seedUsers.forEach((u) => {
          const docRef = doc(db, 'users', u.id);
          batch.set(docRef, cleanData(u));
        });
        await batch.commit();
        return seedUsers;
      }
      return snap.docs.map(d => d.data() as CashierUser);
    } catch (err) {
      console.error('Error fetching users from Firestore:', err);
    }
  }
  return getLocalData<CashierUser[]>('adega_users', INITIAL_CASHIER_USERS);
};

export const saveUserToDb = async (user: CashierUser): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.id), cleanData(user));
      return;
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
  }
  const current = getLocalData<CashierUser[]>('adega_users', INITIAL_CASHIER_USERS);
  const updated = current.some(u => u.id === user.id)
    ? current.map(u => u.id === user.id ? user : u)
    : [...current, user];
  setLocalData('adega_users', updated);
};

export const deleteUserFromDb = async (id: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'users', id));
      return;
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
  }
  const current = getLocalData<CashierUser[]>('adega_users', INITIAL_CASHIER_USERS);
  const updated = current.filter(u => u.id !== id);
  setLocalData('adega_users', updated);
};
