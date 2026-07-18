import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Key, Smartphone, Wifi, WifiOff, RefreshCw, ShoppingCart, Search, Plus, Minus, Check, ArrowRight, User, AlertTriangle, TableProperties, DollarSign, X, CheckSquare, Layers, Sun, Moon, LogOut } from 'lucide-react';
import { Product, TableComandaState, Sale, FinancialTransaction, CashierUser, SyncQueueItem } from '../types';
import ProductCard from './ProductCard';

// Audio Context beep utility for physical waiters' terminal notifications
function playBeep(frequency = 587.33, type: OscillatorType = 'sine', duration = 0.3) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth ramp-down
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("AudioContext playback prevented by browser: ", e);
  }
}

interface OrderAppProps {
  products: Product[];
  tablesComandas: TableComandaState[];
  onUpdateTableItems: (tableId: string, items: any[]) => void;
  onUpdateTableStatus: (tableId: string, status: 'livre' | 'ocupada' | 'fechando', tableName?: string) => void;
  onAddSale: (sale: Sale) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  onUpdateStock: (productId: string, qty: number) => void;
  onAddTableComanda?: (type: 'mesa' | 'comanda', number: number) => void;
  onRemoveTableComanda?: (tableId: string) => void;
  usersList: CashierUser[];
  theme: 'dark' | 'light';
  currentUser: CashierUser | null;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onGoToManager?: () => void;
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
  onRemoveTableComanda,
  usersList,
  theme,
  currentUser,
  onToggleTheme,
  onLogout,
  onGoToManager
}: OrderAppProps) {
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
  const [newTableNumber, setNewTableNumber] = useState<number | ''>('');

  // Sync authorizedUser when global currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setAuthorizedUser(currentUser);
    }
  }, [currentUser]);

  // Sound Alarm: Trigger a notification beep when any order item status changes to 'pronto'
  const prevProntoCountRef = useRef<number>(0);
  const currentProntoCount = useMemo(() => {
    let count = 0;
    tablesComandas.forEach(table => {
      if (table.items) {
        table.items.forEach(item => {
          if (item.status === 'pronto') {
            count += item.quantity;
          }
        });
      }
    });
    return count;
  }, [tablesComandas]);

  useEffect(() => {
    if (currentProntoCount > prevProntoCountRef.current && prevProntoCountRef.current > 0) {
      // Order ready! Play a pleasant high-pitched double beep chime for waiters
      playBeep(880, 'sine', 0.1);
      setTimeout(() => {
        playBeep(1320, 'sine', 0.15);
      }, 120);
    }
    prevProntoCountRef.current = currentProntoCount;
  }, [currentProntoCount]);

  // Current navigation
  const [activeScreen, setActiveScreen] = useState<'tables' | 'order' | 'checkout' | 'shift_closing'>('tables');
  
  // Active table or comanda
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Active ordering basket / cart
  const [orderCart, setOrderCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  
  // Search state in catalog
  const [catSearch, setCatSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Checkout billing split state
  const [splitCount, setSplitCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'debito' | 'credito'>('pix');
  const [stoneReference, setStoneReference] = useState('');
  const [ageCheckConfirmed, setAgeCheckConfirmed] = useState(false);

  // Authenticate staff PIN
  const handlePinSubmit = (num: string) => {
    const user = usersList.find(u => u.pin === num && u.active);
    if (user) {
      setAuthorizedUser(user);
      setPinInput('');
    } else {
      alert('PIN Inválido ou Usuário Bloqueado. Tente novamente.');
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

  // Find active table state
  const activeTable = useMemo(() => {
    return tablesComandas.find(t => t.id === selectedTableId);
  }, [tablesComandas, selectedTableId]);

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
    const tbl = tablesComandas.find(t => t.id === tableId);
    
    // If table is free, mark occupied initially
    if (tbl && tbl.status === 'livre') {
      onUpdateTableStatus(tableId, 'ocupada');
    }

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
  const handleDispatchOrder = () => {
    if (orderCart.length === 0) return;
    if (!selectedTableId || !activeTable) return;

    // Check age limits
    const hasAlcohol = orderCart.some(i => i.product.ageRestricted);
    if (hasAlcohol && !ageCheckConfirmed) {
      alert('ATENÇÃO: Este pedido contém bebidas alcoólicas. Confirme se o cliente possui +18 anos antes de enviar ao Bar.');
      setAgeCheckConfirmed(true);
      return;
    }

    const isAlcoholVerified = !hasAlcohol || ageCheckConfirmed;

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
    setOrderCart([]);
    setAgeCheckConfirmed(false);
    
    // Notify
    alert('Pedido despachado!');
    setActiveScreen('tables');
  };

  // Process checkout payments and wipe comanda table back to free
  const handleProcessPayment = () => {
    if (!selectedTableId || !activeTable) return;
    const totalToPay = activeTable.items.reduce((acc, i) => {
      const prod = products.find(p => p.id === i.productId);
      return acc + ((prod ? prod.sellPrice : 0) * i.quantity);
    }, 0);

    const saleNumber = String(Math.floor(1000 + Math.random() * 9000));
    
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      number: saleNumber,
      timestamp: new Date().toISOString(),
      type: activeTable.type,
      identifier: `${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      items: activeTable.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: products.find(p => p.id === i.productId)?.sellPrice || 0
      })),
      subtotal: totalToPay,
      discount: 0,
      total: totalToPay,
      paymentMethod,
      cardBrand: paymentMethod === 'credito' || paymentMethod === 'debito' ? 'Stone Terminal' : undefined,
      status: 'pago',
      cashierId: authorizedUser?.id || 'u3',
      waiterName: authorizedUser?.name
    };

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'receita',
      category: 'Vendas',
      description: `Fechamento ${activeTable.type === 'mesa' ? 'Mesa' : 'Comanda'} ${activeTable.number}`,
      value: totalToPay,
      paymentMethod,
      status: 'pago'
    };

    // If simulating OFFLINE, queue transaction instead of flushing immediately!
    if (isOffline) {
      const queuePayload: SyncQueueItem = {
        id: `q-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'create_sale',
        data: { sale: newSale, tx: newTx, tableId: selectedTableId },
        status: 'pending'
      };
      setSyncQueue([...syncQueue, queuePayload]);
      
      // Wipe the table local state anyway so the waiter can serve next tables
      onUpdateTableItems(selectedTableId, []);
      onUpdateTableStatus(selectedTableId, 'livre');
      setSelectedTableId(null);
      setActiveScreen('tables');
      alert('Modo OFFLINE ativo! Venda salva em cache e enfileirada no dispositivo.');
      return;
    }

    // ONLINE standard flush
    onAddSale(newSale);
    onAddFinancial(newTx);
    onUpdateTableItems(selectedTableId, []);
    onUpdateTableStatus(selectedTableId, 'livre');

    setSelectedTableId(null);
    setActiveScreen('tables');
    alert(`Mesa ${newSale.number} liquidada com sucesso! Valor: R$ ${totalToPay.toFixed(2)}`);
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
    alert('Operações sincronizadas! Todas as vendas retidas localmente em cache foram registradas no caixa central.');
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
          <span className="font-bold">AdegaOS Order</span>
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
        <div className="flex-1 flex flex-col justify-center items-center p-6 gap-6 my-auto">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border ${
              theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200'
            }`}>
              <Key className="w-6 h-6 text-[#18F2A4]" />
            </div>
            <h3 className="font-bold text-sm">Acesso do Atendente</h3>
            <p className="text-[11px] text-gray-400 mt-1">Insira seu PIN numérico de 4 dígitos para lançar.</p>
          </div>

          {/* Asterisk visual display */}
          <div className="flex gap-2 justify-center py-2 h-10 items-center">
            {Array(4).fill(0).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all ${
                  pinInput.length > idx 
                    ? (theme === 'dark' ? 'bg-[#18F2A4] border-[#18F2A4]' : 'bg-[#10B981] border-[#10B981]')
                    : 'bg-transparent border-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Compact PIN dialpad */}
          <div className="grid grid-cols-3 gap-3 w-64 max-w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className={`py-3.5 rounded-lg text-lg font-bold transition-all active:scale-95 cursor-pointer ${
                  theme === 'dark' ? 'bg-[#080808] border border-[#1C1C1C] hover:bg-[#111]' : 'bg-white border hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setAuthorizedUser(usersList[2]); // instant mock bypass so user doesn't get locked out
                alert('Acesso simulado como João (Garçom). PIN padrão: 3333');
              }}
              className="text-[9px] text-gray-500 font-bold uppercase transition-colors text-center"
            >
              Demo PIN
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className={`py-3.5 rounded-lg text-lg font-bold transition-all active:scale-95 cursor-pointer ${
                theme === 'dark' ? 'bg-[#080808] border border-[#1C1C1C] hover:bg-[#111]' : 'bg-white border hover:bg-gray-100'
              }`}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className={`py-3.5 rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                theme === 'dark' ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              DEL
            </button>
          </div>
        </div>
      ) : (
        /* Authorized Subscreens */
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeScreen === 'tables' ? (
            /* Subscreen 1: Tables and Comandas list grid */
            <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Salão / Comandas</span>
                {authorizedUser && (authorizedUser.role === 'admin' || authorizedUser.role === 'manager') ? (
                  <button
                    onClick={() => setIsConfiguringTables(true)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all hover:scale-105 cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4]' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    ⚙ Configurar Mesas/Comandas
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
              <div className="grid grid-cols-2 gap-3">
                {tablesComandas.map(tbl => {
                  const itemsCount = tbl.items ? tbl.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
                  return (
                    <button
                      key={tbl.id}
                      onClick={() => handleSelectTable(tbl.id)}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-4 transition-all relative overflow-hidden group cursor-pointer ${
                        tbl.status === 'ocupada'
                          ? 'border-amber-500 bg-amber-500/5'
                          : tbl.status === 'fechando'
                            ? 'border-red-500 bg-red-500/5 animate-pulse'
                            : 'border-transparent hover:border-gray-800 bg-[#111111]/40'
                      }`}
                      style={{ backgroundColor: tbl.status === 'livre' ? (theme === 'dark' ? '#111' : '#FFF') : '', borderColor: tbl.status === 'livre' ? (theme === 'dark' ? '#1C1C1C' : '#E5E5E5') : '' }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-sm leading-none uppercase tracking-wide">
                          {tbl.type === 'mesa' ? 'Mesa' : 'Comanda'} {tbl.number}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          tbl.status === 'ocupada' ? 'bg-amber-500' : tbl.status === 'fechando' ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                      </div>

                      {tbl.status !== 'livre' ? (
                        <div>
                          <span className="text-[10px] text-gray-400 block font-mono">Consumo: {itemsCount} un</span>
                          <span className="font-mono text-xs font-black text-gray-200 mt-1 block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>R$ {tbl.subtotal.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 block italic">Livre</span>
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
                    className="text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    ← Voltar p/ Salão
                  </button>
                  <span className="text-xs font-bold uppercase text-[#18F2A4]">
                    {activeTable?.type === 'mesa' ? 'Mesa' : 'Comanda'} {activeTable?.number}
                  </span>

                  {/* Closing button if comanda is occupied */}
                  {activeTable && activeTable.items.length > 0 && (
                    <button
                      onClick={() => setActiveScreen('checkout')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                        theme === 'dark' ? 'bg-[#18F2A4] text-black' : 'bg-[#10B981] text-white'
                      }`}
                    >
                      Fechar Conta
                    </button>
                  )}
                </div>

                {/* Option to assign table name to prevent customer confusion */}
                <div className="flex items-center gap-2">
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

              {/* Button to open vertical categories list (replacing horizontal list) */}
              <div className="p-2 border-b flex justify-between items-center gap-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-[#080808] border-[#1C1C1C] text-gray-200 hover:bg-[#111]' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600'}`} />
                    Categoria: <span className={`font-black ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>{selectedCategory}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Filtrar Categoria ▾</span>
                </button>
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
                      <div className="grid grid-cols-12 items-center gap-2 w-full">
                        {/* Name with text-overflow ellipsis */}
                        <div className="col-span-7 min-w-0 pr-2 text-left">
                          <span 
                            className="font-bold text-[13px] tracking-tight truncate block" 
                            title={item.product.name} 
                            style={{ color: theme === 'dark' ? '#E5E5E5' : '#111' }}
                          >
                            {item.product.name}
                          </span>
                        </div>
                        {/* Fixed control buttons at 44x44px for professional touch target size */}
                        <div className="col-span-5 flex items-center justify-end gap-2 shrink-0">
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

                {/* Dispatch Trigger */}
                <button
                  disabled={orderCart.length === 0}
                  onClick={handleDispatchOrder}
                  className={`w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orderCart.length === 0
                      ? 'opacity-40 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]'
                        : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Enviar p/ Fila do Bar (+ Produção)
                </button>
              </div>

            </div>
          ) : (
            /* Subscreen 3: Checkout and bill splitting with payments */
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              
              {/* Scrollable details container */}
              <div className="p-4 flex flex-col gap-4 flex-1 text-xs overflow-y-auto">
                {/* Head */}
                <div className="flex justify-between items-center border-b pb-2">
                  <button onClick={() => setActiveScreen('order')} className="text-xs text-gray-400 hover:text-white">
                    ← Voltar
                  </button>
                  <span className="font-bold text-sm">Fechar Conta</span>
                </div>

                {/* Items recap list */}
                <div className="p-3 rounded-lg bg-black/25 flex flex-col gap-1.5 border w-full" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Detalhamento Consumido</span>
                  <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
                    {activeTable?.items.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-900/30 gap-4 w-full">
                          <span className="truncate flex-1 pr-2 text-left" title={prod ? prod.name : 'Produto'} style={{ color: theme === 'dark' ? '#E5E5E5' : '#333' }}>
                            <span className="font-bold mr-1.5" style={{ color: theme === 'dark' ? '#18F2A4' : '#10B981' }}>{item.quantity}x</span>
                            {prod ? prod.name : 'Produto'}
                          </span>
                          <span className="font-mono text-xs shrink-0 font-semibold" style={{ color: theme === 'dark' ? '#FFF' : '#111' }}>
                            R$ {((prod ? prod.sellPrice : 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center font-bold pt-2 border-t border-dashed border-gray-800">
                    <span>SUBTOTAL DA COMANDA:</span>
                    <span className="font-mono text-[#18F2A4] text-base">R$ {activeTable?.subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Bill splitting selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-400 font-semibold">Dividir Conta em Quantas Pessoas?</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={splitCount}
                      onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value)))}
                      className="p-2 w-20 text-center rounded border font-mono font-bold text-sm"
                      style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-[10px]">Custo por Pessoa (Estimado):</span>
                      <span className="font-bold text-[#18F2A4] font-mono text-sm">
                        R$ {((activeTable?.subtotal || 0) / splitCount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payments selector */}
                <div className="flex flex-col gap-2 pt-2 border-t border-dashed" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Selecione Forma de Pagamento</span>
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
                    <label className="text-gray-400 font-semibold">Código de Conciliação Stone (NFC / NSU)</label>
                    <input
                      type="text"
                      placeholder="Ex: Ref 004212"
                      value={stoneReference}
                      onChange={(e) => setStoneReference(e.target.value)}
                      className="p-2 rounded border font-mono uppercase"
                      style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>
                )}
              </div>

              {/* Fixed bottom footer with checkout action */}
              <div className={`p-4 border-t shrink-0 ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <button
                  onClick={handleProcessPayment}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] hover:shadow-[#18F2A4]/10' 
                      : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <CheckSquare className="w-4.5 h-4.5" />
                  Confirmar Recebimento • Liberar Comanda
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table & Comanda Dynamic Configuration Modal */}
      {isConfiguringTables && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-4 flex flex-col gap-4 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <h3 className="font-extrabold text-xs tracking-tight flex items-center gap-1.5">
                <span className="text-emerald-500">⚙</span> Painel de Mesas & Comandas
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsConfiguringTables(false);
                  setNewTableNumber('');
                }} 
                className="text-gray-400 hover:text-white text-xs font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Form */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] uppercase font-bold text-gray-400">Adicionar Novo Terminal</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTableType('mesa')}
                  className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                    newTableType === 'mesa'
                      ? (theme === 'dark' ? 'bg-[#18F2A4]/10 border-[#18F2A4] text-[#18F2A4]' : 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]')
                      : (theme === 'dark' ? 'bg-[#111] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500')
                  }`}
                >
                  Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setNewTableType('comanda')}
                  className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                    newTableType === 'comanda'
                      ? (theme === 'dark' ? 'bg-[#18F2A4]/10 border-[#18F2A4] text-[#18F2A4]' : 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]')
                      : (theme === 'dark' ? 'bg-[#111] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500')
                  }`}
                >
                  Comanda
                </button>
              </div>

              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Número (Ex: 16)"
                  min="1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  className="p-2 rounded-lg border text-xs flex-1 focus:outline-none focus:border-emerald-500"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTableNumber) {
                      alert('Por favor, digite um número.');
                      return;
                    }
                    if (onAddTableComanda) {
                      onAddTableComanda(newTableType, Number(newTableNumber));
                      setNewTableNumber('');
                    }
                  }}
                  className={`px-4 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Existing Terminals List with delete capability */}
            <div className="flex flex-col gap-2 flex-1 max-h-[180px] overflow-y-auto pr-1">
              <span className="text-[9px] uppercase font-bold text-gray-400">Terminais Ativos ({tablesComandas.length})</span>
              <div className="flex flex-col gap-1.5">
                {tablesComandas.map((tbl) => (
                  <div 
                    key={tbl.id} 
                    className="flex justify-between items-center p-2 rounded-lg border text-xs"
                    style={{ 
                      backgroundColor: theme === 'dark' ? '#0F0F0F' : '#F9F9F9', 
                      borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' 
                    }}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${tbl.status === 'ocupada' ? 'bg-red-500' : tbl.status === 'fechando' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {tbl.type === 'mesa' ? 'Mesa' : 'Comanda'} {tbl.number}
                      <span className="text-[9px] text-gray-500 font-normal">({tbl.status})</span>
                    </span>
                    {onRemoveTableComanda && (
                      <button
                        type="button"
                        onClick={() => {
                          if (tbl.status !== 'livre') {
                            alert(`Este terminal está ocupado ou finalizando. Libere-o primeiro antes de remover.`);
                            return;
                          }
                          if (confirm(`Excluir permanentemente a ${tbl.type === 'mesa' ? 'Mesa' : 'Comanda'} ${tbl.number}?`)) {
                            onRemoveTableComanda(tbl.id);
                          }
                        }}
                        className={`text-red-500 font-black hover:bg-red-500/10 px-2 py-1 rounded transition-colors cursor-pointer ${
                          tbl.status !== 'livre' ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsConfiguringTables(false)}
              className="w-full py-2 rounded-xl text-xs font-bold border transition-all hover:bg-white/5 cursor-pointer"
              style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}
            >
              Fechar Painel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
