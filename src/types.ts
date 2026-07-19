export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  brand: string;
  supplierId: string;
  costPrice: number;
  sellPrice: number;
  margin: number; // calculated: ((sell - cost) / sell) * 100
  unit: 'UN' | 'LT' | 'KG';
  boxQuantity: number; // e.g., 12 units in a box/fardo
  stockBoxes: number;  // physical unopened boxes
  stockUnits: number;  // loose physical units
  // Total stock in units is calculated: (stockBoxes * boxQuantity) + stockUnits
  minStockUnits: number;
  maxStockUnits: number;
  active: boolean;
  ageRestricted: boolean;
  image?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  quantityBoxes: number;
  quantityUnits: number;
  costPrice: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  freight: number;
  discount: number;
  status: 'pendente' | 'recebido';
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Sale {
  id: string;
  number: string;
  timestamp: string; // ISO string
  type: 'mesa' | 'comanda' | 'balcao' | 'entrega';
  identifier: string; // e.g., "Mesa 04", "Comanda 112", "Balcão #1", "WhatsApp - João"
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'pix' | 'dinheiro' | 'debito' | 'credito' | 'dividido' | 'fiado';
  paymentSplit?: { method: string; value: number }[];
  cardBrand?: string; // ex: "Stone - Visa", "Maquininha 1 - Master"
  status: 'aberto' | 'pago' | 'cancelado';
  cancelReason?: string;
  cashierId: string; // PIN or User ID
  waiterName?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  deliveryDriverName?: string;
  deliveryStatus?: 'pendente' | 'preparo' | 'pronto' | 'saiu' | 'entregue' | 'cancelado';
  customerPhone?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'receita' | 'despesa';
  category: string; // ex: "Vendas", "Aluguel", "Fornecedores", "Energia", "Salários"
  description: string;
  value: number;
  paymentMethod?: string;
  status: 'pago' | 'pendente';
  dueDate?: string;
}

export interface CashierUser {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock' | 'kitchen' | 'bar';
  active: boolean;
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  action: 'create_sale' | 'update_sale' | 'sync_stock';
  data: any;
  status: 'pending' | 'syncing' | 'done' | 'failed' | 'conflict';
  errorMessage?: string;
}

export interface TableComandaState {
  id: string; // e.g. "mesa-4" or "comanda-15"
  type: 'mesa' | 'comanda';
  number: number;
  tableName?: string; // Option to put a name on the table (e.g. "Mesa do João")
  status: 'livre' | 'ocupada' | 'fechando';
  waiterId?: string;
  waiterName?: string;
  items: {
    productId: string;
    quantity: number;
    notes?: string;
    status: 'pendente' | 'recebido' | 'preparo' | 'pronto' | 'entregue' | 'cancelado';
    statusHistory: { status: string; timestamp: string; userId: string }[];
  }[];
  subtotal: number;
}

export interface Shift {
  id: string;
  isOpen: boolean;
  openTime: string; // ISO string
  closeTime?: string; // ISO string
  openedBy: string; // operator name
  initialBalance: number; // fundo de troco
  cashSales: number; // expected cash from sales
  otherSales: { pix: number; card: number; debt: number };
  sangrias: { id: string; timestamp: string; amount: number; reason: string }[];
  suprimentos: { id: string; timestamp: string; amount: number; reason: string }[];
  closingCashCounted?: number;
  discrepancy?: number;
  notes?: string;
}
