import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Key, Smartphone, Wifi, WifiOff, RefreshCw, ShoppingCart, Search, Plus, Minus, Check, ArrowRight, User, AlertTriangle, TableProperties, DollarSign, X, CheckSquare, Layers, Sun, Moon, LogOut, Maximize2, Trash2, GlassWater, Info } from 'lucide-react';
import { Product, TableComandaState, Sale, FinancialTransaction, CashierUser, SyncQueueItem, ItemPaymentRecord } from '../types';
import ProductCard from './ProductCard';
import { ToastContainer, ToastItem, ToastType, playPremiumSound, useToastSubscription } from './ToastNotification';
import { triggerThermalPrint } from '../lib/thermalPrinter';
import { eventBus } from '../services/eventBus';
import { notificationService } from '../services/notificationService';
import { audioManager } from '../services/audioManager';

interface OrderAppProps {
  products: Product[];
  tablesComandas: TableComandaState[];
  onUpdateTableItems: (tableId: string, items: any[]) => void;
  onUpdateTableStatus: (tableId: string, status: 'livre' | 'ocupada' | 'fechando', tableName?: string) => void;
  onAddSale: (sale: Sale) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  onUpdateStock: (productId: string, qty: number) => void;
  onAddTableComanda?: (type: 'mesa' | 'comanda', number: number) => void;
  onAddTableComandaBatch?: (type: 'mesa' | 'comanda', numbers: number[]) => void;
  onRemoveTableComanda?: (tableId: string) => void;
  usersList: CashierUser[];
  theme: 'dark' | 'light';
  currentUser: CashierUser | null;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onGoToManager?: () => void;
}

interface ConsumedItemsListProps {
  items: any[];
  products: Product[];
  theme: 'dark' | 'light';
  mode: 'consumption' | 'checkout';
  onAlterQty?: (productId: string, delta: number) => void;
  onRemoveItem?: (productId: string) => void;
  itemPaymentQty?: { [idx: number]: number };
  onUpdatePaymentQty?: (idx: number, newQty: number) => void;
}

function ConsumedItemsList({
  items,
  products,
  theme,
  mode,
  onAlterQty,
  onRemoveItem,
  itemPaymentQty = {},
  onUpdatePaymentQty
}: ConsumedItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <div className={`p-4 text-center rounded-xl border text-xs text-gray-400 ${
        theme === 'dark' ? 'bg-[#111111]/30 border-[#1C1C1C]' : 'bg-gray-50 border-gray-100'
      }`}>
        Nenhum item consumido ainda nesta mesa/comanda.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, idx) => {
        if (item.status === 'cancelado') return null;
        const prod = products.find(p => p.id === item.productId);
        const unitPrice = prod ? prod.sellPrice : (item.unitPrice || 0);
        const totalQty = item.quantity || 0;
        const paidQty = item.paidQuantity || 0;
        const unpaidQty = Math.max(0, totalQty - paidQty);
        const totalAmount = totalQty * unitPrice;

        const qtyToPayInTx = itemPaymentQty[idx] !== undefined ? itemPaymentQty[idx] : unpaidQty;

        return (
          <div 
            key={idx} 
            className={`p-3 rounded-xl border flex flex-col justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#111]/40 border-[#1C1C1C]' : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            {/* Main Row */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              {/* Product thumbnail & basic info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-950 shrink-0 overflow-hidden border flex items-center justify-center" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                  {prod?.image ? (
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-500">
                      <GlassWater className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate" style={{ color: theme === 'dark' ? '#FFF' : '#111' }}>
                      {prod ? prod.name : 'Produto'}
                    </span>

                    {item.status && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        item.status === 'entregue'
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                          : item.status === 'pronto'
                            ? 'bg-blue-950/30 text-blue-400 border border-blue-900/30'
                            : item.status === 'preparo'
                              ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30'
                              : 'bg-gray-900/30 text-gray-400 border border-gray-800/30'
                      }`}>
                        {item.status}
                      </span>
                    )}

                    {paidQty > 0 && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {unpaidQty === 0 ? '✓ Quitado' : `Pago (${paidQty}/${totalQty})`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>Qtd Total: <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{totalQty}x</strong></span>
                    <span>Unit: <strong className="font-mono text-emerald-500">R$ {unitPrice.toFixed(2)}</strong></span>
                    {item.notes && <span className="italic truncate max-w-[150px]">Obs: "{item.notes}"</span>}
                  </div>
                </div>
              </div>

              {/* Mode-specific actions */}
              {mode === 'checkout' ? (
                /* Itemized partial payment picker */
                <div className="flex items-center gap-3 shrink-0 justify-end">
                  {unpaidQty === 0 ? (
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                      Totalmente Pago
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-gray-800">
                      <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Pagar:</span>
                      <button
                        type="button"
                        onClick={() => onUpdatePaymentQty && onUpdatePaymentQty(idx, Math.max(0, qtyToPayInTx - 1))}
                        disabled={qtyToPayInTx <= 0}
                        className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs w-6 text-center text-emerald-400">
                        {qtyToPayInTx}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdatePaymentQty && onUpdatePaymentQty(idx, Math.min(unpaidQty, qtyToPayInTx + 1))}
                        disabled={qtyToPayInTx >= unpaidQty}
                        className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-xs font-mono font-bold ml-1 text-white">
                        (R$ {(qtyToPayInTx * unitPrice).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Consumption mode: quantity alteration and cancellation */
                <div className="flex items-center gap-2 justify-end shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-500 mr-2">
                    R$ {totalAmount.toFixed(2)}
                  </span>

                  {onAlterQty && (
                    <>
                      <button 
                        type="button"
                        onClick={() => onAlterQty(item.productId, -1)} 
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-black active:scale-90 cursor-pointer ${
                          theme === 'dark' ? 'bg-[#1a1a1a] border-[#222] hover:bg-[#252525] text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-800'
                        }`}
                        title="Reduzir quantidade"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold w-5 text-center text-xs">{totalQty}</span>
                      <button 
                        type="button"
                        onClick={() => onAlterQty(item.productId, 1)} 
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-black active:scale-90 cursor-pointer ${
                          theme === 'dark' ? 'bg-[#1a1a1a] border-[#222] hover:bg-[#252525] text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-800'
                        }`}
                        title="Aumentar quantidade"
                      >
                        +
                      </button>
                    </>
                  )}

                  {onRemoveItem && (
                    <button 
                      type="button"
                      onClick={() => onRemoveItem(item.productId)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-900/30 bg-red-950/10 text-red-400 hover:bg-red-950/30 ml-1 cursor-pointer"
                      title="Cancelar/remover este item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment history audit log box if item has previous payment records */}
            {item.payments && item.payments.length > 0 && (
              <div className="text-[10px] bg-black/25 p-2 rounded-lg border border-gray-800/50 flex flex-col gap-1 text-gray-400 mt-1">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[9px]">Histórico de Pagamentos Deste Item:</span>
                {item.payments.map((p: ItemPaymentRecord, pIdx: number) => (
                  <div key={pIdx} className="flex justify-between items-center font-mono text-[10px]">
                    <span>• {p.qty} un via <strong className="uppercase text-white">{p.method}</strong> {p.userName ? `(${p.userName})` : ''}</span>
                    <span className="text-emerald-400 font-bold">R$ {(p.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderApp({
  products,
  tablesComandas,
  onUpdateTableItems,
  onUpdateTableStatus,
  onAddSale,
  onAddFinancial,
  onUpdateStock,
  onAddTableComanda,
  onAddTableComandaBatch,
  onRemoveTableComanda,
  usersList,
  theme,
  currentUser,
  onToggleTheme,
  onLogout,
  onGoToManager
}: OrderAppProps) {
  // Toast list state for animated, non-blocking notifications on Order screen
  const { toasts, addToast, removeToast } = useToastSubscription('order');

  // Register operational sector context for audio routing and listen for cancellation events
  useEffect(() => {
    notificationService.setSector('order');

    // Listen for cancellations originating from Production or Remote Sync
    const unsubCancelled = eventBus.subscribe('ORDER_CANCELLED', (payload) => {
      if (payload.origin === 'producao' || payload.origin === 'remote_sync') {
        const prodName = payload.productName || 'Produto';
        const tableStr = payload.table || 'Mesa/Comanda';
        const reasonStr = payload.reason ? `Motivo: ${payload.reason}` : 'Cancelado na Produção';

        // If product is currently in waiter's orderCart, purge it immediately
        if (payload.productId) {
          setOrderCart(prev => {
            const exists = prev.some(item => item.product.id === payload.productId);
            if (exists) {
              addToast(`Atenção: "${prodName}" foi cancelado e removido do seu carrinho.`, 'warning');
            }
            return prev.filter(item => item.product.id !== payload.productId);
          });
        }
      }
    });

    return () => {
      unsubCancelled();
    };
  }, [addToast]);

  // Item cancellation modal state (Mandatory reason)
  const [cancelModalData, setCancelModalData] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // Login status
  const [authorizedUser, setAuthorizedUser] = useState<CashierUser | null>(currentUser);
  const [pinInput, setPinInput] = useState('');
  
  // Offline simulation state
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // User details horizontal sliding menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Category list toggle state
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Table management states
  const [isConfiguringTables, setIsConfiguringTables] = useState(false);
  const [newTableType, setNewTableType] = useState<'mesa' | 'comanda'>('mesa');
  const [newTableInput, setNewTableInput] = useState<string>('');

  const parseBatchNumbers = (raw: string): number[] => {
    const results = new Set<number>();
    if (!raw || !raw.trim()) return [];
    
    // Normalize spaces around hyphens e.g. "1 - 10" or "8 - 20"
    const normalized = raw.trim().replace(/\s*-\s*/g, '-').replace(/\s+a\s+/gi, '-');
    const parts = normalized.split(/[,;\s]+/);
    
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const subParts = part.split('-');
        if (subParts.length === 2) {
          const start = parseInt(subParts[0].trim(), 10);
          const end = parseInt(subParts[1].trim(), 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            const boundedMax = Math.min(max, min + 200);
            for (let i = min; i <= boundedMax; i++) {
              if (i > 0) results.add(i);
            }
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num > 0) {
          results.add(num);
        }
      }
    }
    return Array.from(results).sort((a, b) => a - b);
  };

  // Sync authorizedUser when global currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setAuthorizedUser(currentUser);
    }
  }, [currentUser]);

  // Robust Order Ready Detector: detects whenever any item transitions to 'pronto'
  const readyItemsMap = useMemo(() => {
    const map: Record<string, { name: string; identifier: string; qty: number }> = {};
    tablesComandas.forEach(table => {
      if (table.items) {
        table.items.forEach(item => {
          if (item.status === 'pronto') {
            const prod = products.find(p => p.id === item.productId);
            const prodName = prod ? prod.name : 'Produto';
            const tableIdStr = table.type === 'mesa' ? `Mesa ${table.number}` : `Comanda ${table.number}`;
            const key = `${table.id}-${item.productId}-${item.notes || ''}`;
            
            if (!map[key]) {
              map[key] = {
                name: prodName,
                identifier: tableIdStr,
                qty: 0
              };
            }
            map[key].qty += item.quantity;
          }
        });
      }
    });
    return map;
  }, [tablesComandas, products]);

  const prevReadyItemsMapRef = useRef<Record<string, { name: string; identifier: string; qty: number }>>({});
  const isFirstReadyLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstReadyLoadRef.current) {
      prevReadyItemsMapRef.current = readyItemsMap;
      isFirstReadyLoadRef.current = false;
      return;
    }

    let newlyReadyAdded = false;
    let newlyReadyMessage = '';

    Object.keys(readyItemsMap).forEach(key => {
      const currentItem = readyItemsMap[key];
      const prevItem = prevReadyItemsMapRef.current[key];

      const currentQty = currentItem.qty;
      const prevQty = prevItem ? prevItem.qty : 0;

      if (currentQty > prevQty) {
        newlyReadyAdded = true;
        newlyReadyMessage = `Pronto: ${currentItem.qty - prevQty}x ${currentItem.name} (${currentItem.identifier})`;
      }
    });

    if (newlyReadyAdded && newlyReadyMessage) {
      addToast(newlyReadyMessage, 'ready');
    }

    prevReadyItemsMapRef.current = readyItemsMap;
  }, [readyItemsMap]);

  // Current navigation
  const [activeScreen, setActiveScreen] = useState<'tables' | 'order' | 'cart' | 'checkout' | 'shift_closing'>('tables');
  
  // Active table or comanda
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Find active table state
  const activeTable = useMemo(() => {
    return tablesComandas.find(t => t.id === selectedTableId);
  }, [tablesComandas, selectedTableId]);

  // Active ordering basket / cart
  const [orderCart, setOrderCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  
  // Search state in catalog
  const [catSearch, setCatSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Checkout billing split state & itemized payment selection
  const [splitInput, setSplitInput] = useState('1');
  const splitCount = useMemo(() => {
    const parsed = parseInt(splitInput, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [splitInput]);

  const [customAmountInput, setCustomAmountInput] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'debito' | 'credito'>('pix');
  const [stoneReference, setStoneReference] = useState('');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [ageCheckConfirmed, setAgeCheckConfirmed] = useState(false);

  // Item payment selection state for itemized partial payments in Checkout
  const [selectedItemPaymentQty, setSelectedItemPaymentQty] = useState<{ [itemIdx: number]: number }>({});

  // Reset selected item payment quantities when active table or screen changes
  useEffect(() => {
    setCustomAmountInput('');
    if (activeTable && activeTable.items) {
      const initialMap: { [itemIdx: number]: number } = {};
      activeTable.items.forEach((item, idx) => {
        const unpaidQty = Math.max(0, item.quantity - (item.paidQuantity || 0));
        initialMap[idx] = unpaidQty;
      });
      setSelectedItemPaymentQty(initialMap);
    } else {
      setSelectedItemPaymentQty({});
    }
  }, [selectedTableId, activeScreen]);

  // Centralized calculations for active table totals
  const activeTableTotals = useMemo(() => {
    if (!activeTable || !activeTable.items) {
      return { grossSubtotal: 0, paidTotal: 0, remainingBalance: 0 };
    }

    let grossSubtotal = 0;
    let paidTotal = 0;

    activeTable.items.forEach(i => {
      if (i.status === 'cancelado') return;
      const prod = products.find(p => p.id === i.productId);
      const unitPrice = prod ? prod.sellPrice : (i.unitPrice || 0);
      const qty = i.quantity || 0;
      const paidAmt = i.paidAmount !== undefined ? i.paidAmount : ((i.paidQuantity || 0) * unitPrice);

      grossSubtotal += qty * unitPrice;
      paidTotal += paidAmt;
    });

    const remainingBalance = Math.max(0, Number((grossSubtotal - paidTotal).toFixed(2)));

    return { grossSubtotal, paidTotal, remainingBalance };
  }, [activeTable, products]);

  // Checkout transaction calculation based on selected item quantities to pay
  const checkoutTxDetails = useMemo(() => {
    if (!activeTable || !activeTable.items) {
      return { itemsToPay: [], totalToPay: 0 };
    }

    const itemsToPay: {
      itemIndex: number;
      item: any;
      product: Product | undefined;
      unitPrice: number;
      qtyToPay: number;
      amountToPay: number;
    }[] = [];

    let totalToPay = 0;

    activeTable.items.forEach((item, idx) => {
      if (item.status === 'cancelado') return;
      const unpaidQty = Math.max(0, item.quantity - (item.paidQuantity || 0));
      if (unpaidQty <= 0) return;

      const prod = products.find(p => p.id === item.productId);
      const unitPrice = prod ? prod.sellPrice : (item.unitPrice || 0);

      const qtyToPay = selectedItemPaymentQty[idx] !== undefined 
        ? Math.min(unpaidQty, Math.max(0, selectedItemPaymentQty[idx]))
        : unpaidQty;

      if (qtyToPay > 0) {
        const amountToPay = qtyToPay * unitPrice;
        totalToPay += amountToPay;
        itemsToPay.push({
          itemIndex: idx,
          item,
          product: prod,
          unitPrice,
          qtyToPay,
          amountToPay
        });
      }
    });

    return { itemsToPay, totalToPay };
  }, [activeTable, products, selectedItemPaymentQty]);

  // Per-person share based on total remaining balance
  const perPersonShare = useMemo(() => {
    const pending = activeTableTotals.remainingBalance;
    if (pending <= 0 || splitCount <= 1) return pending;
    return Number((pending / splitCount).toFixed(2));
  }, [activeTableTotals.remainingBalance, splitCount]);

  // Synchronize transaction value input whenever split count or active table changes
  useEffect(() => {
    if (splitCount > 1) {
      setCustomAmountInput(perPersonShare > 0 ? perPersonShare.toFixed(2) : '');
    } else if (activeTableTotals.remainingBalance > 0) {
      setCustomAmountInput(activeTableTotals.remainingBalance.toFixed(2));
    }
  }, [splitCount, selectedTableId, activeScreen, perPersonShare, activeTableTotals.remainingBalance]);

  // Current payment transaction value being processed right now
  const currentTxAmount = useMemo(() => {
    const pending = activeTableTotals.remainingBalance;
    if (pending <= 0) return 0;

    const parsed = parseFloat(customAmountInput);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(pending, Number(parsed.toFixed(2)));
    }

    if (splitCount > 1) {
      return perPersonShare;
    }

    return Math.min(pending, checkoutTxDetails.totalToPay);
  }, [activeTableTotals.remainingBalance, customAmountInput, splitCount, perPersonShare, checkoutTxDetails.totalToPay]);

  // Authenticate staff PIN
  const handlePinSubmit = (num: string) => {
    const user = usersList.find(u => u.pin === num && u.active);
    if (user) {
      setAuthorizedUser(user);
      setPinInput('');
    } else {
      addToast('PIN Inválido ou Usuário Bloqueado. Tente novamente.', 'warning');
      setPinInput('');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const newVal = pinInput + num;
      setPinInput(newVal);
      if (newVal.length === 4) {
        // Auto submit once 4 digits typed
        setTimeout(() => handlePinSubmit(newVal), 200);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  // Catalog categories
  const categories = useMemo(() => {
    const list = new Set(products.filter(p => p.active).map(p => p.category));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  // Catalog products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(catSearch.toLowerCase()) || p.barcode.includes(catSearch);
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return p.active && matchesSearch && matchesCategory;
    });
  }, [products, catSearch, selectedCategory]);

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setOrderCart([]);
    setActiveScreen('order');
  };

  const addToBasket = (prod: Product) => {
    const existing = orderCart.findIndex(item => item.product.id === prod.id);
    if (existing >= 0) {
      const copy = [...orderCart];
      copy[existing].quantity += 1;
      setOrderCart(copy);
    } else {
      setOrderCart([...orderCart, { product: prod, quantity: 1, notes: '' }]);
    }
  };

  const updateBasketQuantity = (idx: number, delta: number) => {
    const copy = [...orderCart];
    const newQty = copy[idx].quantity + delta;
    if (newQty <= 0) {
      copy.splice(idx, 1);
    } else {
      copy[idx].quantity = newQty;
    }
    setOrderCart(copy);
  };

  const updateBasketNotes = (idx: number, text: string) => {
    const copy = [...orderCart];
    copy[idx].notes = text;
    setOrderCart(copy);
  };

  const basketSubtotal = useMemo(() => {
    return orderCart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
  }, [orderCart]);

  // Dispatch items to sector bar/kitchen queue
  const handleDispatchOrder = (navigateTo: 'tables' | 'order' | 'cart' | 'checkout' = 'tables') => {
    if (orderCart.length === 0) return;
    if (!selectedTableId || !activeTable) return;

    // Append to existing table items
    const updatedItems = [...(activeTable.items || [])];

    orderCart.forEach(cartItem => {
      const historyStamp = { status: 'pendente', timestamp: new Date().toISOString(), userId: authorizedUser?.id || 'u3' };
      updatedItems.push({
        productId: cartItem.product.id,
        quantity: cartItem.quantity,
        notes: cartItem.notes,
        status: 'recebido', // Auto-routes straight to Bar sector queue
        statusHistory: [historyStamp]
      });

      // Instantly decrease stock in real-time
      onUpdateStock(cartItem.product.id, cartItem.quantity);
    });

    onUpdateTableItems(selectedTableId, updatedItems);

    // Publish ORDER_CREATED event to Corporate EventBus (triggers PrintService and NotificationService)
    eventBus.publish('ORDER_CREATED', {
      id: `ORD_${selectedTableId}_${Date.now()}`,
      table: `${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      items: orderCart.map(c => ({
        name: c.product.name,
        qty: c.quantity,
        notes: c.notes,
        price: c.product.sellPrice
      })),
      sector: 'cozinha',
      clientName: authorizedUser?.name || 'Garçom',
      origin: 'order'
    });

    setOrderCart([]);
    
    // Notify
    addToast('Pedido enviado com sucesso para a produção!', 'success');
    setActiveScreen(navigateTo);
  };

  // Alter confirmed consumed item quantity or delete
  const handleAlterConsumedItemQty = (productId: string, delta: number) => {
    if (!selectedTableId || !activeTable) return;

    const updatedItems = [...(activeTable.items || [])];
    const itemIndex = updatedItems.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return;

    const item = updatedItems[itemIndex];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      (window as any).confirmModal("Deseja realmente remover este item já consumido da mesa?", () => {
        // Return stock back (negative quantity restores stock!)
        onUpdateStock(productId, -item.quantity);
        const nextItems = [...(activeTable.items || [])];
        const nextIndex = nextItems.findIndex(i => i.productId === productId);
        if (nextIndex !== -1) {
          nextItems.splice(nextIndex, 1);
          onUpdateTableItems(selectedTableId, nextItems);
        }
      });
      return;
    } else {
      // Check stock if increasing quantity
      if (delta > 0) {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          const stockTotal = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
          if (stockTotal <= 0) {
            addToast("Quantidade insuficiente em estoque!", "warning");
            return;
          }
        }
      }

      // Adjust stock
      onUpdateStock(productId, delta);
      updatedItems[itemIndex] = {
        ...item,
        quantity: newQty
      };
    }

    onUpdateTableItems(selectedTableId, updatedItems);
  };

  // Remove confirmed consumed item with mandatory reason modal
  const handleRemoveConsumedItem = (productId: string) => {
    if (!selectedTableId || !activeTable) return;
    const prod = products.find(p => p.id === productId);
    setCancelModalData({
      productId,
      productName: prod ? prod.name : 'Item'
    });
    setCancelReasonInput('');
  };

  const handleConfirmCancelItem = () => {
    if (!selectedTableId || !activeTable || !cancelModalData || !cancelReasonInput.trim()) return;

    const productId = cancelModalData.productId;
    const reason = cancelReasonInput.trim();
    const updatedItems = [...(activeTable.items || [])];
    const itemIndex = updatedItems.findIndex(i => i.productId === productId);

    if (itemIndex !== -1) {
      const item = updatedItems[itemIndex];
      onUpdateStock(productId, -item.quantity); // restore stock

      // Mark item status as cancelado with reason
      updatedItems[itemIndex] = {
        ...item,
        status: 'cancelado',
        cancelReason: reason
      };

      onUpdateTableItems(selectedTableId, updatedItems);

      const tableStr = `${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`;

      const prodObj = products.find(p => p.id === productId);

      eventBus.publish('ORDER_CANCELLED', {
        id: selectedTableId,
        table: tableStr,
        reason,
        productId,
        productName: prodObj ? prodObj.name : 'Produto',
        origin: 'order'
      });

      addToast(`Item cancelado. Motivo: ${reason}`, 'warning');
    }

    setCancelModalData(null);
  };

  // Process checkout payments (standalone single payment or partial share payment)
  const handleProcessPayment = async () => {
    if (!selectedTableId || !activeTable) return;

    if (currentTxAmount <= 0) {
      addToast('O valor do pagamento deve ser maior que R$ 0,00.', 'warning');
      return;
    }

    const saleNumber = String(Math.floor(1000 + Math.random() * 9000));
    
    // Map paid items for sale record
    const { itemsToPay } = checkoutTxDetails;
    const saleItems = itemsToPay.map(i => ({
      productId: i.item.productId,
      quantity: i.qtyToPay,
      unitPrice: i.unitPrice
    }));

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      number: saleNumber,
      timestamp: new Date().toISOString(),
      type: activeTable.type,
      identifier: `${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      items: saleItems,
      subtotal: currentTxAmount,
      discount: 0,
      total: currentTxAmount,
      paymentMethod,
      cardBrand: paymentMethod === 'credito' || paymentMethod === 'debito' ? (stoneReference ? `Stone (${stoneReference})` : 'Stone Terminal') : undefined,
      status: 'pago',
      cashierId: authorizedUser?.id || authorizedUser?.name || 'u3',
      openedBy: authorizedUser?.name || 'Operador PDV',
      waiterName: authorizedUser?.name
    };

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'receita',
      category: 'Vendas',
      description: `Pagamento ${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      value: currentTxAmount,
      paymentMethod,
      status: 'pago'
    };

    // Print non-fiscal sales coupon for this payment
    const receiptData = {
      number: saleNumber,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identifier: `${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      cashierId: authorizedUser?.name || 'Operador',
      subtotal: currentTxAmount,
      discount: 0,
      total: currentTxAmount,
      paymentMethod,
      paidAmount: paymentMethod === 'dinheiro' && cashReceived !== '' ? Number(cashReceived) : currentTxAmount,
      changeAmount: paymentMethod === 'dinheiro' && cashReceived !== '' && Number(cashReceived) > currentTxAmount ? Number(cashReceived) - currentTxAmount : 0,
      items: itemsToPay.map(i => ({
        qty: i.qtyToPay,
        name: i.product ? i.product.name : 'Produto',
        unitPrice: i.unitPrice,
        notes: i.item.notes
      }))
    };

    // Thermal print execution
    try {
      const printResult = await triggerThermalPrint('sale', receiptData, 'caixa');
      if (printResult.success) {
        addToast(`Pagamento de R$ ${currentTxAmount.toFixed(2)} (${paymentMethod.toUpperCase()}) registrado com sucesso! Cupom impresso.`, 'success');
      } else {
        addToast(`Pagamento registrado, mas impressora avisou: ${printResult.errorMsg || 'Verifique conexão/papel.'}`, 'warning');
      }
    } catch (printErr) {
      addToast(`Pagamento registrado! Falha na transmissão para impressora.`, 'warning');
    }

    // Record sale and financial tx in app state
    if (isOffline) {
      const queuePayload: SyncQueueItem = {
        id: `q-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'create_sale',
        data: { sale: newSale, tx: newTx, tableId: selectedTableId },
        status: 'pending'
      };
      setSyncQueue([...syncQueue, queuePayload]);
    } else {
      onAddSale(newSale);
      onAddFinancial(newTx);
    }

    // Allocate currentTxAmount across unpaid table items
    let amountLeftToAllocate = currentTxAmount;

    const updatedTableItems = activeTable.items.map((item) => {
      if (item.status === 'cancelado' || amountLeftToAllocate <= 0) return item;

      const prod = products.find(p => p.id === item.productId);
      const unitPrice = prod ? prod.sellPrice : (item.unitPrice || 0);
      const unpaidAmountForItem = Math.max(0, (item.quantity * unitPrice) - (item.paidAmount || 0));

      if (unpaidAmountForItem <= 0) return item;

      const allocatedForThisItem = Number(Math.min(unpaidAmountForItem, amountLeftToAllocate).toFixed(2));
      amountLeftToAllocate = Number((amountLeftToAllocate - allocatedForThisItem).toFixed(2));

      const newPaidAmt = Number(((item.paidAmount || 0) + allocatedForThisItem).toFixed(2));
      const newPaidQty = Math.min(item.quantity, Math.floor(newPaidAmt / (unitPrice || 1)));

      const newPaymentRecord: ItemPaymentRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        qty: unitPrice > 0 ? Number((allocatedForThisItem / unitPrice).toFixed(2)) : 1,
        amount: allocatedForThisItem,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        userName: authorizedUser?.name || 'Operador'
      };

      return {
        ...item,
        paidQuantity: newPaidQty,
        paidAmount: newPaidAmt,
        payments: [...(item.payments || []), newPaymentRecord]
      };
    });

    const newPendingBalance = Math.max(0, activeTableTotals.remainingBalance - currentTxAmount);
    const isCompletelyPaid = newPendingBalance <= 0.005;

    if (isCompletelyPaid) {
      onUpdateTableItems(selectedTableId, []);
      onUpdateTableStatus(selectedTableId, 'livre');
      setSelectedTableId(null);
      setActiveScreen('tables');
      addToast(
        `Mesa/Comanda ${activeTable.number} quitada integralmente e liberada!`,
        'success'
      );
    } else {
      onUpdateTableItems(selectedTableId, updatedTableItems);
      addToast(
        `Pagamento de R$ ${currentTxAmount.toFixed(2)} (${paymentMethod.toUpperCase()}) registrado! Saldo pendente: R$ ${newPendingBalance.toFixed(2)}.`,
        'info'
      );
    }

    // Reset payment / split controls for future transactions
    setSplitInput('1');
    setCustomAmountInput('');
    setCashReceived('');
    setStoneReference('');
  };

  // Re-sync queue once online
  const handleFlushQueue = () => {
    if (syncQueue.length === 0) return;
    
    // Simulate flushing everything sequentially
    syncQueue.forEach(item => {
      onAddSale(item.data.sale);
      onAddFinancial(item.data.tx);
    });

    setSyncQueue([]);
    addToast('Sincronização concluída! Todas as vendas salvas em cache foram salvas no servidor.', 'success');
  };

  const handleToggleNetwork = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (!nextState && syncQueue.length > 0) {
      setTimeout(() => {
        handleFlushQueue();
      }, 500);
    }
  };

  return (
    <div className={`w-full h-screen max-h-screen flex flex-col font-sans ${
      theme === 'dark' 
        ? 'bg-[#000000] text-white' 
        : 'bg-[#FAFAFA] text-[#111111]'
    } overflow-hidden relative`}>
      
      {/* Dynamic Offline and Connection Header Bar */}
      <div className={`p-3 border-b flex justify-between items-center text-xs font-semibold overflow-x-auto no-scrollbar relative transition-all duration-300 ${
        isOffline 
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' 
          : (theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-100 border-gray-200')
      }`}>
        {/* Left Side: App Name and interactive user badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Smartphone className="w-4 h-4 text-[#18F2A4]" />
          <span className="font-extrabold text-xs tracking-tight">
            Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span> Order
          </span>
          {authorizedUser && (
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-mono transition-all flex items-center gap-1 cursor-pointer font-bold ${
                theme === 'dark' 
                  ? 'bg-[#18F2A4]/15 text-[#18F2A4] hover:bg-[#18F2A4]/25 border border-[#18F2A4]/30' 
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              <User className="w-3 h-3" />
              <span>{authorizedUser.name.split(' ')[0]}</span>
              <span className="text-[8px] opacity-75">▾</span>
            </button>
          )}
        </div>

        {/* Right Side: Connection status & Sliding Menu containing logout and theme toggle */}
        <div className="flex items-center gap-2 shrink-0 transition-all duration-300 overflow-hidden">
          {/* Animated horizontal menu sliding to the right */}
          <div className={`flex items-center gap-2 transition-all duration-300 ease-in-out origin-right ${
            isUserMenuOpen 
              ? 'opacity-100 max-w-xs scale-100 translate-x-0' 
              : 'opacity-0 max-w-0 scale-95 translate-x-4 pointer-events-none'
          }`}>
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-[#1C1C1C] bg-black text-amber-400 hover:bg-[#111]' : 'border-gray-200 bg-white text-violet-600 hover:bg-gray-100'
                }`}
                title="Alternar Tema"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Manager Return Trigger if admin/manager */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && onGoToManager && (
              <button
                onClick={onGoToManager}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-sky-400 hover:bg-sky-400/10 ${
                  theme === 'dark' ? 'border-[#1C1C1C] bg-black' : 'border-gray-200 bg-white'
                }`}
              >
                Gerente
              </button>
            )}

            {/* Logout Trigger */}
            <button
              onClick={() => {
                setAuthorizedUser(null);
                if (onLogout) onLogout();
                setIsUserMenuOpen(false);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-red-500 hover:bg-red-500/10 flex items-center gap-1 ${
                theme === 'dark' ? 'border-[#1C1C1C] bg-black' : 'border-gray-200 bg-white'
              }`}
              title="Sair do Terminal"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>

          {/* Network Toggle Button */}
          <button
            onClick={handleToggleNetwork}
            className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer shrink-0 ${
              isOffline 
                ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                : 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Queue Badge indicator */}
      {syncQueue.length > 0 && (
        <div className="bg-amber-600 text-black px-4 py-1.5 text-center text-[10px] font-bold flex justify-between items-center">
          <span>{syncQueue.length} Pedido(s) aguardando conexão...</span>
          {!isOffline && (
            <button onClick={handleFlushQueue} className="bg-black text-white px-2 py-0.5 rounded flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizar
            </button>
          )}
        </div>
      )}

      {/* Screen Router */}
      {!authorizedUser ? (
        /* PIN Login Lockscreen */
        <div className="flex-1 flex flex-col justify-center items-center p-6 gap-8 my-auto max-w-sm mx-auto w-full">
          <div className="text-center flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 hover:scale-105 ${
              theme === 'dark' ? 'bg-[#0B0B0B] border-[#1C1C1C] text-[#18F2A4]' : 'bg-white border-gray-150 text-emerald-600'
            }`}>
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight mt-2">Acesso do Atendente</h3>
            <p className="text-xs text-gray-500 max-w-[240px]">Insira seu código PIN de 4 dígitos para gerenciar pedidos no salão.</p>
          </div>

          {/* Asterisk visual display */}
          <div className="flex gap-3.5 justify-center py-2 h-10 items-center">
            {Array(4).fill(0).map((_, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  pinInput.length > idx 
                    ? (theme === 'dark' ? 'bg-gradient-to-tr from-violet-500 to-[#18F2A4] border-transparent scale-110 shadow-sm' : 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-transparent scale-110 shadow-sm')
                    : 'bg-transparent border-gray-600 dark:border-gray-800'
                }`}
              />
            ))}
          </div>

          {/* Compact PIN dialpad */}
          <div className="grid grid-cols-3 gap-3.5 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className={`py-4 rounded-xl text-lg font-black transition-all active:scale-95 cursor-pointer border flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-[#0A0A0A] border-[#1C1C1C] text-gray-200 hover:bg-[#111] hover:text-white' 
                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setAuthorizedUser(usersList[2]); // instant mock bypass so user doesn't get locked out
                addToast('Acesso simulado como João (Garçom). PIN padrão: 3333', 'info');
              }}
              className={`text-[10px] font-black uppercase tracking-wider transition-colors text-center py-4 rounded-xl border border-dashed flex items-center justify-center ${
                theme === 'dark' ? 'border-[#1C1C1C] text-[#18F2A4]/70 hover:text-[#18F2A4] hover:bg-[#18F2A4]/5' : 'border-gray-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Demo PIN
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className={`py-4 rounded-xl text-lg font-black transition-all active:scale-95 cursor-pointer border flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-[#0A0A0A] border-[#1C1C1C] text-gray-200 hover:bg-[#111] hover:text-white' 
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:text-black'
              }`}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className={`py-4 rounded-xl text-xs font-black tracking-wide transition-all active:scale-95 cursor-pointer border flex items-center justify-center ${
                theme === 'dark' ? 'bg-red-950/10 border-red-900/20 text-red-400 hover:bg-red-950/20' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100/70'
              }`}
            >
              APAGAR
            </button>
          </div>
        </div>
      ) : (
        /* Authorized Subscreens */
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeScreen === 'tables' ? (
            /* Subscreen 1: Tables and Comandas list grid */
            <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b dark:border-gray-900/40 border-gray-200/50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Salão / Comandas</span>
                {authorizedUser && (authorizedUser.role === 'admin' || authorizedUser.role === 'manager') ? (
                  <button
                    onClick={() => setIsConfiguringTables(true)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4] hover:bg-[#18F2A4]/15' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                    }`}
                  >
                    Configurar Terminais
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthorizedUser(null);
                    }}
                    className="text-[10px] text-gray-400 hover:underline cursor-pointer"
                  >
                    Bloquear Terminal
                  </button>
                )}
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                {tablesComandas.map(tbl => {
                  const itemsCount = tbl.items ? tbl.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
                  const isLivre = tbl.status === 'livre';
                  const isOcupada = tbl.status === 'ocupada';
                  const isFechando = tbl.status === 'fechando';
                  return (
                    <button
                      key={tbl.id}
                      onClick={() => handleSelectTable(tbl.id)}
                      className={`group relative p-4 rounded-xl border text-left flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                        isOcupada
                          ? 'border-amber-500/30 bg-amber-500/[0.02] hover:bg-amber-500/[0.04]'
                          : isFechando
                            ? 'border-red-500/40 bg-red-500/[0.03] hover:bg-red-500/[0.05] animate-pulse'
                            : theme === 'dark'
                              ? 'border-[#1C1C1C] bg-[#0E0E0E]/40 hover:border-gray-700 hover:bg-[#111]'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Badge and state dot */}
                      <div className="flex justify-between items-start w-full gap-1">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-extrabold text-xs uppercase tracking-wide text-gray-400">
                            {tbl.type === 'mesa' ? 'Mesa' : 'Comanda'} <span className="font-black" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{tbl.number}</span>
                          </span>
                          {tbl.tableName && (
                            <span className="text-[11px] font-semibold text-gray-400 truncate max-w-[120px] block" title={tbl.tableName}>
                              {tbl.tableName}
                            </span>
                          )}
                        </div>
                        
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          isOcupada ? 'bg-amber-500' : isFechando ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                      </div>

                      {/* Content block */}
                      {!isLivre ? (
                        <div className="flex flex-col gap-0.5 mt-2">
                          <span className="text-[9px] text-gray-400 font-mono">Consumo: {itemsCount} un</span>
                          <span className="font-mono text-xs font-black" style={{ color: theme === 'dark' ? '#18F2A4' : '#10B981' }}>
                            R$ {(tbl.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 mt-2">
                          <span className="text-[10px] text-gray-400 italic font-medium">Livre</span>
                          <span className="font-mono text-xs font-semibold text-gray-500">R$ 0,00</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeScreen === 'order' ? (
            /* Subscreen 2: Catalog drink picker and quantity modifier */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Back to tables button */}
              <div className="p-3 border-b flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setActiveScreen('tables')}
                    className="text-xs font-semibold text-gray-400 hover:text-white cursor-pointer shrink-0"
                  >
                    ← Voltar p/ Salão
                  </button>
                  
                  <span className="text-xs font-black uppercase text-[#18F2A4]">
                    {activeTable?.type === 'mesa' ? 'Mesa' : 'Comanda'} {activeTable?.number}
                  </span>

                  <div className="w-16 shrink-0" />
                </div>

                {/* Option to assign table name to prevent customer confusion */}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Identificação:</span>
                  <input
                    type="text"
                    placeholder="Nome do Cliente (Ex: Mesa do João)..."
                    value={activeTable?.tableName || ''}
                    onChange={(e) => {
                      if (selectedTableId && activeTable) {
                        onUpdateTableStatus(selectedTableId, activeTable.status, e.target.value);
                      }
                    }}
                    className={`w-full text-xs px-2.5 py-1 rounded bg-black/10 border font-semibold focus:outline-none transition-all ${
                      theme === 'dark' 
                        ? 'text-[#18F2A4] bg-black/35 focus:border-[#18F2A4] border-[#1C1C1C]' 
                        : 'text-emerald-700 bg-gray-50 focus:border-[#10B981] border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Integrated Search Bar + Embedded Category Button */}
              <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                <div className={`flex-1 relative flex items-center rounded-xl border overflow-hidden transition-all ${
                  theme === 'dark' 
                    ? 'bg-[#080808] border-[#1C1C1C] focus-within:border-[#18F2A4]' 
                    : 'bg-white border-gray-200 focus-within:border-emerald-500 shadow-sm'
                }`}>
                  <Search className={`w-4 h-4 ml-3 shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Buscar produto ou código..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className={`w-full py-2 pl-2 pr-3 text-xs font-medium bg-transparent focus:outline-none ${
                      theme === 'dark' ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                    }`}
                  />
                  {catSearch && (
                    <button
                      type="button"
                      onClick={() => setCatSearch('')}
                      className="p-1 mr-1 text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    className={`shrink-0 h-full py-2 px-3 border-l flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-[#1C1C1C] bg-[#0E0E0E] text-gray-200 hover:bg-[#161616]'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
                    <span className="hidden sm:inline text-gray-400 font-normal">Cat:</span>
                    <span className={`font-black max-w-[80px] sm:max-w-[110px] truncate ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>
                      {selectedCategory}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-0.5">▾</span>
                  </button>
                </div>
              </div>

              {/* Vertical categories popup list */}
              {isCategoriesOpen && (
                <div className={`p-3 border-b flex flex-col gap-1.5 transition-all ${
                  theme === 'dark' ? 'bg-[#040404]' : 'bg-gray-100'
                }`}>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Selecione uma Categoria</span>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoriesOpen(false);
                        }}
                        className={`text-xs text-left px-3 py-1.5 rounded border font-bold transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4] border-[#18F2A4]' : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]')
                            : (theme === 'dark' ? 'bg-transparent text-gray-400 border-[#1C1C1C] hover:bg-[#111]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast catalog items list */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
                  {filteredProducts.map(prod => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onAdd={addToBasket}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>

              {/* Basket / Active Draft items list bottom drawer */}
              <div className={`p-4 border-t mt-auto flex flex-col gap-3 ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-xl'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#18F2A4]" />
                    Fila de Lançamento
                  </span>
                  <span className="font-mono text-xs font-black">R$ {basketSubtotal.toFixed(2)}</span>
                </div>

                {/* Basket List */}
                <div id="order-summary-list" className="max-h-36 overflow-y-auto flex flex-col gap-3 w-full p-2" style={{ boxSizing: 'border-box' }}>
                  {orderCart.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col gap-2 pb-3 border-b last:border-b-0 w-full shrink-0" 
                      style={{ 
                        borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {/* Thumbnail image */}
                        <div className="w-8 h-8 rounded bg-gray-900 shrink-0 overflow-hidden border flex items-center justify-center" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                          {item.product.image ? (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-500">
                              <GlassWater className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Name with text-overflow ellipsis */}
                        <div className="flex-1 min-w-0 pr-2 text-left">
                          <span 
                            className="font-bold text-[13px] tracking-tight truncate block" 
                            title={item.product.name} 
                            style={{ color: theme === 'dark' ? '#E5E5E5' : '#111' }}
                          >
                            {item.product.name}
                          </span>
                        </div>
                        
                        {/* Fixed control buttons at 44x44px for professional touch target size */}
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <button 
                            type="button"
                            onClick={() => updateBasketQuantity(idx, -1)} 
                            className={`w-11 h-11 flex items-center justify-center rounded-lg border cursor-pointer text-sm font-extrabold transition-all active:scale-95 ${
                              theme === 'dark' 
                                ? 'bg-[#121212] border-[#222] text-gray-300 hover:bg-[#1A1A1A]' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            -
                          </button>
                          <span className="font-mono font-bold min-w-[20px] text-center text-sm" style={{ color: theme === 'dark' ? '#FFF' : '#111' }}>
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => updateBasketQuantity(idx, 1)} 
                            className={`w-11 h-11 flex items-center justify-center rounded-lg border cursor-pointer text-sm font-extrabold transition-all active:scale-95 ${
                              theme === 'dark' 
                                ? 'bg-[#121212] border-[#222] text-gray-300 hover:bg-[#1A1A1A]' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {/* Note input field with balanced padding */}
                      <div className="w-full">
                        <input
                          type="text"
                          placeholder="Adicionar observação (ex: com limão)..."
                          value={item.notes}
                          onChange={(e) => updateBasketNotes(idx, e.target.value)}
                          className="w-full text-[11px] bg-transparent border-b text-gray-400 focus:outline-none focus:border-emerald-500 py-1.5 px-2 rounded-md"
                          style={{
                            borderBottomColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
                            color: theme === 'dark' ? '#888' : '#444',
                            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {orderCart.length === 0 && (
                    <div className="text-center py-4 text-[11px] text-gray-500">Selecione bebidas acima para lançar.</div>
                  )}
                </div>

                {/* Dispatch Trigger Split Buttons */}
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('cart')}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      theme === 'dark'
                        ? 'bg-transparent border-[#1C1C1C] text-gray-300 hover:bg-[#111] hover:border-[#18F2A4]/50'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-[#10B981]/50'
                    }`}
                  >
                    <ShoppingCart className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-500'}`} />
                    <span>Ver Consumo/Carrinho</span>
                  </button>

                  <button
                    type="button"
                    disabled={orderCart.length === 0}
                    onClick={() => handleDispatchOrder('order')}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orderCart.length === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]'
                          : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Enviar p/ Fila do Bar</span>
                  </button>
                </div>
              </div>

            </div>
          ) : activeScreen === 'cart' ? (
            /* Subscreen 3: Full Screen Carrinho / Consumo View */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Screen Header */}
              <div className="p-3 border-b flex items-center justify-between gap-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setActiveScreen('order')}
                  className="text-xs font-semibold text-gray-400 hover:text-white cursor-pointer shrink-0 flex items-center gap-1"
                >
                  ← Voltar p/ Pedidos
                </button>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#18F2A4]" />
                  <span className="text-xs font-black uppercase text-[#18F2A4]">
                    Carrinho & Consumo — {activeTable?.type === 'mesa' ? 'Mesa' : 'Comanda'} {activeTable?.number}
                  </span>
                </div>
                <div className="w-16 shrink-0" />
              </div>

              {/* Scrollable Carrinho Body */}
              <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                
                {/* Section 1: Fila de Lançamento (Draft Items) */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#18F2A4]">
                      Novos Pedidos em Rascunho (Fila de Lançamento)
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-400">
                      R$ {basketSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {orderCart.length === 0 ? (
                    <div className={`p-4 text-center rounded-xl border text-xs text-gray-400 ${
                      theme === 'dark' ? 'bg-[#111111]/50 border-[#1C1C1C]' : 'bg-gray-50 border-gray-100'
                    }`}>
                      Nenhum novo item na fila. Escolha produtos no catálogo de pedidos.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {orderCart.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                            theme === 'dark' ? 'bg-[#111] border-[#1C1C1C]' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-950 shrink-0 overflow-hidden border flex items-center justify-center" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                              {item.product.image ? (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-500">
                                  <GlassWater className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm block" style={{ color: theme === 'dark' ? '#E5E5E5' : '#111' }}>
                                {item.product.name}
                              </span>
                              <span className="text-xs text-emerald-500 font-bold font-mono">
                                R$ {item.product.sellPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                            <input
                              type="text"
                              placeholder="Observação (ex: com limão)..."
                              value={item.notes}
                              onChange={(e) => updateBasketNotes(idx, e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:border-emerald-500 w-full sm:w-44"
                              style={{
                                backgroundColor: theme === 'dark' ? '#000' : '#FFF',
                                borderColor: theme === 'dark' ? '#222' : '#E5E5E5',
                                color: theme === 'dark' ? '#FFF' : '#000'
                              }}
                            />

                            <div className="flex items-center gap-2 justify-end">
                              <button 
                                type="button"
                                onClick={() => updateBasketQuantity(idx, -1)} 
                                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-black active:scale-90 cursor-pointer ${
                                  theme === 'dark' ? 'bg-[#1a1a1a] border-[#222] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-6 text-center text-sm">{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => updateBasketQuantity(idx, 1)} 
                                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-black active:scale-90 cursor-pointer ${
                                  theme === 'dark' ? 'bg-[#1a1a1a] border-[#222] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                +
                              </button>
                              
                              <button 
                                type="button"
                                onClick={() => {
                                  const newCart = [...orderCart];
                                  newCart.splice(idx, 1);
                                  setOrderCart(newCart);
                                }} 
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 ml-1 cursor-pointer"
                                title="Remover item da fila"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleDispatchOrder('cart')}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                            theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Enviar Rascunho p/ Fila do Bar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Itens já Confirmados e Consumidos */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-400 block">
                    Itens já Confirmados e Consumidos na Mesa
                  </span>
                  
                  <ConsumedItemsList
                    items={activeTable?.items || []}
                    products={products}
                    theme={theme}
                    mode="consumption"
                    onAlterQty={handleAlterConsumedItemQty}
                    onRemoveItem={handleRemoveConsumedItem}
                  />
                </div>

              </div>

              {/* Fixed Footer with "Continuar Escolhendo" and "Fechar Conta" */}
              <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-xl'
              }`}>
                <div className="text-left w-full sm:w-auto">
                  <span className="text-xs text-gray-400">Total Consumido:</span>
                  <div className="font-mono text-base font-black text-emerald-500">
                    R$ {(activeTableTotals.grossSubtotal + basketSubtotal).toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('order')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-transparent border-[#222] text-gray-300 hover:bg-[#111]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Continuar Escolhendo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('checkout')}
                    className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                      theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                    }`}
                  >
                    <span>Fechar Conta</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Subscreen 4: Checkout and bill splitting with payments */
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              
              {/* Scrollable details container */}
              <div className="p-4 flex flex-col gap-4 flex-1 text-xs overflow-y-auto">
                {/* Head */}
                <div className="flex justify-between items-center border-b pb-2">
                  <button onClick={() => setActiveScreen('cart')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer">
                    ← Voltar p/ Carrinho
                  </button>
                  <span className="font-bold text-sm">Fechar Conta</span>
                </div>

                {/* Items recap list with itemized partial payment */}
                <div className="p-3 rounded-xl bg-black/20 flex flex-col gap-2 border w-full" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-800">
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Itens Consumidos & Seleção de Pagamento</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeTable || !activeTable.items) return;
                        const allMap: { [i: number]: number } = {};
                        activeTable.items.forEach((it, idx) => {
                          allMap[idx] = Math.max(0, it.quantity - (it.paidQuantity || 0));
                        });
                        setSelectedItemPaymentQty(allMap);
                      }}
                      className="text-[10px] font-bold text-[#18F2A4] hover:underline cursor-pointer"
                    >
                      Selecionar Todos a Pagar
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto pr-1">
                    <ConsumedItemsList
                      items={activeTable?.items || []}
                      products={products}
                      theme={theme}
                      mode="checkout"
                      itemPaymentQty={selectedItemPaymentQty}
                      onUpdatePaymentQty={(idx, newQty) => {
                        setSelectedItemPaymentQty(prev => ({
                          ...prev,
                          [idx]: newQty
                        }));
                      }}
                    />
                  </div>

                  {/* Totals Summary */}
                  <div className="flex flex-col gap-1 pt-2 border-t border-dashed border-gray-800 text-xs">
                    <div className="flex justify-between text-gray-400 font-medium">
                      <span>Subtotal Consumido:</span>
                      <span className="font-mono font-bold text-gray-200">R$ {activeTableTotals.grossSubtotal.toFixed(2)}</span>
                    </div>
                    {activeTableTotals.paidTotal > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>Já Pago Anteriormente:</span>
                        <span className="font-mono font-bold">- R$ {activeTableTotals.paidTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-gray-800">
                      <span>Saldo Pendente Atual:</span>
                      <span className="font-mono text-[#18F2A4]">R$ {activeTableTotals.remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Bill splitting selector & Amount to pay */}
                <div className="flex flex-col gap-2.5 p-3 rounded-xl border bg-black/10" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-gray-300 font-bold text-xs">Dividir Saldo Pendente (Simulador)</span>
                      <span className="text-gray-500 text-[10px]">Quantas pessoas vão dividir os R$ {activeTableTotals.remainingBalance.toFixed(2)}?</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={splitInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setSplitInput(val);
                      }}
                      onBlur={() => {
                        if (!splitInput || parseInt(splitInput, 10) < 1) {
                          setSplitInput('1');
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="p-1.5 w-16 text-center rounded-lg border font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>

                  {splitCount > 1 && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-gray-800">
                      <span className="text-gray-400 font-medium">Valor Sugerido Por Pessoa:</span>
                      <span className="text-[#18F2A4] font-mono font-extrabold text-sm">
                        R$ {perPersonShare.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-gray-800">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-300 text-xs font-bold">
                        Valor a Pagar Nesta Transação (R$):
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomAmountInput(activeTableTotals.remainingBalance.toFixed(2))}
                        className="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        Quitar Total (R$ {activeTableTotals.remainingBalance.toFixed(2)})
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      max={activeTableTotals.remainingBalance}
                      value={customAmountInput}
                      onChange={(e) => setCustomAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="p-2.5 rounded-lg border font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                      style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>
                </div>

                {/* Payments selector */}
                <div className="flex flex-col gap-2 pt-2 border-t border-dashed" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                      Selecione Forma de Pagamento
                    </span>
                    <span className="font-mono text-sm font-extrabold text-[#18F2A4]">
                      R$ {currentTxAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(['pix', 'dinheiro', 'debito', 'credito'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 rounded border font-bold capitalize text-[10px] text-center transition-all ${
                          paymentMethod === method
                            ? (theme === 'dark' ? 'bg-[#18F2A4]/15 text-[#18F2A4] border-[#18F2A4]' : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]')
                            : (theme === 'dark' ? 'bg-transparent text-gray-400 border-[#222]' : 'bg-white text-gray-600 border-gray-200')
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maquininha Stone references indicator */}
                {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 font-semibold text-xs">
                      Código Conciliação Stone Terminal (NFC / NSU)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ref 004212"
                      value={stoneReference}
                      onChange={(e) => setStoneReference(e.target.value)}
                      className="p-2 rounded border font-mono uppercase text-xs"
                      style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>
                )}

                {/* Cash received & change calculation */}
                {paymentMethod === 'dinheiro' && (
                  <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-dashed mt-2" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5', backgroundColor: theme === 'dark' ? '#080808' : '#F9F9F9' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400 font-semibold">
                        Valor Recebido em Dinheiro (R$):
                      </span>
                      <input
                        type="number"
                        min={currentTxAmount}
                        step="0.01"
                        placeholder="0.00"
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : '')}
                        className="w-24 text-right font-mono text-xs p-1.5 rounded border focus:outline-none"
                        style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#333' : '#CCC', color: theme === 'dark' ? 'white' : 'black' }}
                      />
                    </div>
                    {cashReceived !== '' && Number(cashReceived) >= currentTxAmount && (
                      <div className="flex justify-between text-xs font-bold text-amber-500 pt-1.5 border-t border-dashed border-[#222]/20">
                        <span>Troco ao Cliente:</span>
                        <span className="font-mono">
                          R$ {(Number(cashReceived) - currentTxAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fixed bottom footer with checkout action */}
              <div className={`p-4 border-t shrink-0 ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <button
                  onClick={handleProcessPayment}
                  disabled={currentTxAmount <= 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    currentTxAmount <= 0
                      ? 'opacity-40 cursor-not-allowed bg-gray-700 text-gray-400'
                      : theme === 'dark' 
                        ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] hover:shadow-[#18F2A4]/10' 
                        : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <CheckSquare className="w-4.5 h-4.5" />
                  <span>
                    Confirmar Recebimento (R$ {currentTxAmount.toFixed(2)})
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Cancel Item Reason Modal */}
      {cancelModalData && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#111111] border-gray-800 text-white' : 'bg-white border-gray-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-gray-700/50">
              <h3 className="font-bold text-sm text-red-500 flex items-center gap-2">
                <span>Cancelar Item na Mesa/Comanda</span>
              </h3>
              <button
                onClick={() => setCancelModalData(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs flex flex-col gap-1">
              <span className="font-bold text-sm">{cancelModalData.productName}</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Motivo do Cancelamento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Desistência do cliente, pedido duplicado..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-800 text-white focus:border-red-500'
                    : 'bg-gray-50 border-gray-300 text-slate-900 focus:border-red-500'
                }`}
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Desistência do Cliente', 'Pedido Duplicado', 'Demora na Entrega', 'Erro do Garçom'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReasonInput(preset)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                      cancelReasonInput === preset
                        ? 'bg-red-500 text-white border-red-500'
                        : theme === 'dark'
                          ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                          : 'bg-gray-100 text-slate-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-gray-700/50">
              <button
                type="button"
                onClick={() => setCancelModalData(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-slate-700 hover:bg-gray-300'
                }`}
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!cancelReasonInput.trim()}
                onClick={handleConfirmCancelItem}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded non-blocking Toast System */}
      <ToastContainer toasts={toasts} onRemove={removeToast} theme={theme} />
    </div>
  );
}
