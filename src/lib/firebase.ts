import { Product, Supplier, Sale, FinancialTransaction, TableComandaState, CashierUser } from '../types';
import { 
  INITIAL_PRODUCTS, MOCK_SALES, INITIAL_SUPPLIERS, 
  INITIAL_TABLES_COMANDAS, INITIAL_CASHIER_USERS 
} from '../data/mockData';

export const isFirebaseEnabled = false;

// Reactive state listeners
const listeners = {
  products: new Set<(data: Product[]) => void>(),
  sales: new Set<(data: Sale[]) => void>(),
  suppliers: new Set<(data: Supplier[]) => void>(),
  transactions: new Set<(data: FinancialTransaction[]) => void>(),
  tables: new Set<(data: TableComandaState[]) => void>(),
  users: new Set<(data: CashierUser[]) => void>()
};

// Helper to get data with seeding
function getCollection<T>(key: string, initialData: T[]): T[] {
  try {
    const stored = localStorage.getItem(`fluxos_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(`fluxos_${key}`, JSON.stringify(initialData));
    return initialData;
  } catch {
    return initialData;
  }
}

// Helper to set data and notify listeners
function setCollection<T>(key: string, data: T[], listenerSet: Set<(data: T[]) => void>) {
  try {
    localStorage.setItem(`fluxos_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving collection ${key}:`, err);
  }
  listenerSet.forEach(cb => cb([...data]));
}

// Subscription methods
export function subscribeProducts(callback: (p: Product[]) => void) {
  listeners.products.add(callback);
  callback(getCollection('products', INITIAL_PRODUCTS));
  return () => { listeners.products.delete(callback); };
}

export function subscribeSales(callback: (s: Sale[]) => void) {
  listeners.sales.add(callback);
  callback(getCollection('sales', MOCK_SALES));
  return () => { listeners.sales.delete(callback); };
}

export function subscribeSuppliers(callback: (s: Supplier[]) => void) {
  listeners.suppliers.add(callback);
  callback(getCollection('suppliers', INITIAL_SUPPLIERS));
  return () => { listeners.suppliers.delete(callback); };
}

export function subscribeTransactions(callback: (t: FinancialTransaction[]) => void) {
  listeners.transactions.add(callback);
  callback(getCollection('transactions', []));
  return () => { listeners.transactions.delete(callback); };
}

export function subscribeTablesComandas(callback: (t: TableComandaState[]) => void) {
  listeners.tables.add(callback);
  callback(getCollection('tables', INITIAL_TABLES_COMANDAS));
  return () => { listeners.tables.delete(callback); };
}

export function subscribeUsers(callback: (u: CashierUser[]) => void) {
  listeners.users.add(callback);
  callback(getCollection('users', INITIAL_CASHIER_USERS));
  return () => { listeners.users.delete(callback); };
}

// Direct DB operations
export async function fetchProductsFromDb(): Promise<Product[]> {
  return getCollection('products', INITIAL_PRODUCTS);
}

export async function saveProductToDb(prod: Product): Promise<void> {
  const list = getCollection('products', INITIAL_PRODUCTS);
  const idx = list.findIndex(p => p.id === prod.id);
  if (idx >= 0) {
    list[idx] = prod;
  } else {
    list.push(prod);
  }
  setCollection('products', list, listeners.products);
}

export async function fetchSalesFromDb(): Promise<Sale[]> {
  return getCollection('sales', MOCK_SALES);
}

export async function saveSaleToDb(sale: Sale): Promise<void> {
  const list = getCollection('sales', MOCK_SALES);
  const idx = list.findIndex(s => s.id === sale.id);
  if (idx >= 0) {
    list[idx] = sale;
  } else {
    list.push(sale);
  }
  setCollection('sales', list, listeners.sales);
}

export async function fetchSuppliersFromDb(): Promise<Supplier[]> {
  return getCollection('suppliers', INITIAL_SUPPLIERS);
}

export async function saveSupplierToDb(sup: Supplier): Promise<void> {
  const list = getCollection('suppliers', INITIAL_SUPPLIERS);
  const idx = list.findIndex(s => s.id === sup.id);
  if (idx >= 0) {
    list[idx] = sup;
  } else {
    list.push(sup);
  }
  setCollection('suppliers', list, listeners.suppliers);
}

export async function deleteSupplierFromDb(id: string): Promise<void> {
  const list = getCollection('suppliers', INITIAL_SUPPLIERS).filter(s => s.id !== id);
  setCollection('suppliers', list, listeners.suppliers);
}

export async function fetchTransactionsFromDb(): Promise<FinancialTransaction[]> {
  return getCollection('transactions', []);
}

export async function saveTransactionToDb(tx: FinancialTransaction): Promise<void> {
  const list = getCollection('transactions', []);
  const idx = list.findIndex(t => t.id === tx.id);
  if (idx >= 0) {
    list[idx] = tx;
  } else {
    list.push(tx);
  }
  setCollection('transactions', list, listeners.transactions);
}

export async function deleteTransactionFromDb(id: string): Promise<void> {
  const list = getCollection('transactions', []).filter(t => t.id !== id);
  setCollection('transactions', list, listeners.transactions);
}

export async function fetchTablesComandasFromDb(): Promise<TableComandaState[]> {
  return getCollection('tables', INITIAL_TABLES_COMANDAS);
}

export async function saveTableComandaToDb(tc: TableComandaState): Promise<void> {
  const list = getCollection('tables', INITIAL_TABLES_COMANDAS);
  const idx = list.findIndex(t => t.id === tc.id);
  if (idx >= 0) {
    list[idx] = tc;
  } else {
    list.push(tc);
  }
  setCollection('tables', list, listeners.tables);
}

export async function deleteTableComandaFromDb(id: string): Promise<void> {
  const list = getCollection('tables', INITIAL_TABLES_COMANDAS).filter(t => t.id !== id);
  setCollection('tables', list, listeners.tables);
}

export async function fetchUsersFromDb(): Promise<CashierUser[]> {
  return getCollection('users', INITIAL_CASHIER_USERS);
}

export async function saveUserToDb(user: CashierUser): Promise<void> {
  const list = getCollection('users', INITIAL_CASHIER_USERS);
  const idx = list.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    list[idx] = user;
  } else {
    list.push(user);
  }
  setCollection('users', list, listeners.users);
}

export async function deleteUserFromDb(id: string): Promise<void> {
  const list = getCollection('users', INITIAL_CASHIER_USERS).filter(u => u.id !== id);
  setCollection('users', list, listeners.users);
}
