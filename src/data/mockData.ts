import { Product, Supplier, CashierUser, Sale, FinancialTransaction, TableComandaState } from '../types';

export const INITIAL_CASHIER_USERS: CashierUser[] = [
  { id: 'u1', name: 'Carlos (Dono/Admin)', pin: '1234', role: 'admin', active: true }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const MOCK_SALES: Sale[] = [];

export const MOCK_FINANCIAL_TRANSACTIONS = (): FinancialTransaction[] => [];

export const INITIAL_TABLES_COMANDAS: TableComandaState[] = [
  { id: 'mesa-1', type: 'mesa', number: 1, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-2', type: 'mesa', number: 2, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-3', type: 'mesa', number: 3, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-4', type: 'mesa', number: 4, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-5', type: 'mesa', number: 5, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-6', type: 'mesa', number: 6, status: 'livre', items: [], subtotal: 0 },
  { id: 'comanda-101', type: 'comanda', number: 101, status: 'livre', items: [], subtotal: 0 },
  { id: 'comanda-102', type: 'comanda', number: 102, status: 'livre', items: [], subtotal: 0 },
  { id: 'comanda-103', type: 'comanda', number: 103, status: 'livre', items: [], subtotal: 0 },
  { id: 'comanda-104', type: 'comanda', number: 104, status: 'livre', items: [], subtotal: 0 },
];
