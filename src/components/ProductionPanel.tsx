import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChefHat, GlassWater, Clock, Check, Play, User, RefreshCw, Layers, CheckCircle2, Volume2, Search, LogOut, Sun, Moon } from 'lucide-react';
import { TableComandaState, Product, CashierUser } from '../types';

// Audio Context chime utility for tactile/audible feedback
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
    console.warn("AudioContext playback prevented by browser security policy: ", e);
  }
}

interface ProductionPanelProps {
  tablesComandas: TableComandaState[];
  products: Product[];
  onUpdateTableItems: (tableId: string, items: any[]) => void;
  theme: 'dark' | 'light';
  currentUser?: CashierUser | null;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onGoToManager?: () => void;
}

export default function ProductionPanel({
  tablesComandas,
  products,
  onUpdateTableItems,
  theme,
  currentUser,
  onToggleTheme,
  onLogout,
  onGoToManager
}: ProductionPanelProps) {
  // Sector is privately locked based on user's role:
  // - 'kitchen' role locks to 'cozinha'
  // - 'bar' role locks to 'bar'
  // - Other roles (admin, manager, cashier) default to 'bar' but cannot switch on screen since toggle is removed.
  const initialSector = useMemo(() => {
    if (currentUser?.role === 'kitchen') return 'cozinha';
    if (currentUser?.role === 'bar') return 'bar';
    return 'bar';
  }, [currentUser]);

  const [activeSector, setActiveSector] = useState<'bar' | 'cozinha'>(initialSector);
  const [filterStatus, setFilterStatus] = useState<'ativos' | 'finalizados'>('ativos');
  const [searchFilter, setSearchFilter] = useState('');
  const [beepSimulated, setBeepSimulated] = useState(false);

  // Sync sector if currentUser changes
  useEffect(() => {
    if (currentUser?.role === 'kitchen') {
      setActiveSector('cozinha');
    } else if (currentUser?.role === 'bar') {
      setActiveSector('bar');
    }
  }, [currentUser]);

  // Derive flat list of order items from tables state
  const activeItems = useMemo(() => {
    const list: {
      tableId: string;
      tableName?: string;
      tableType: 'mesa' | 'comanda';
      tableNumber: number;
      itemIndex: number;
      productId: string;
      productName: string;
      productCategory: string;
      quantity: number;
      notes?: string;
      status: 'pendente' | 'recebido' | 'preparo' | 'pronto' | 'entregue' | 'cancelado';
      timestamp: string;
    }[] = [];

    tablesComandas.forEach(table => {
      if (table.status === 'livre') return;
      if (!table.items) return;

      table.items.forEach((item, idx) => {
        const prod = products.find(p => p.id === item.productId);
        const prodName = prod ? prod.name : 'Produto Desconhecido';
        const category = prod ? prod.category : 'Outros';

        // Filter sector: "Petiscos" category goes to Cozinha, others go to Bar
        const belongsToKitchen = category === 'Petiscos';
        const itemSector = belongsToKitchen ? 'cozinha' : 'bar';

        if (itemSector !== activeSector) return;

        // Filter status: active is anything not delivered/canceled
        const isDone = item.status === 'entregue' || item.status === 'cancelado';
        if (filterStatus === 'ativos' && isDone) return;
        if (filterStatus === 'finalizados' && !isDone) return;

        // Apply search query filter
        if (searchFilter && !prodName.toLowerCase().includes(searchFilter.toLowerCase()) && !String(table.number).includes(searchFilter)) {
          return;
        }

        const latestHistory = item.statusHistory?.[item.statusHistory.length - 1];
        const timestamp = latestHistory ? latestHistory.timestamp : new Date().toISOString();

        list.push({
          tableId: table.id,
          tableName: (table as any).tableName,
          tableType: table.type,
          tableNumber: table.number,
          itemIndex: idx,
          productId: item.productId,
          productName: prodName,
          productCategory: category,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          timestamp
        });
      });
    });

    // Sort by timestamp: oldest first (FIFO)
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [tablesComandas, products, activeSector, filterStatus, searchFilter]);

  // Sound Alarm: Trigger a kitchen ticket buzzer when a new order arrives in production queue
  const prevPendingCountRef = useRef<number>(0);
  const isFirstRenderRef = useRef<boolean>(true);
  
  const currentPendingCount = useMemo(() => {
    let count = 0;
    activeItems.forEach(item => {
      if (item.status === 'pendente' || item.status === 'recebido') {
        count += item.quantity;
      }
    });
    return count;
  }, [activeItems]);

  useEffect(() => {
    // If it is the initial load, simply initialize the ref and don't beep
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevPendingCountRef.current = currentPendingCount;
      return;
    }

    // If pending orders count increases, sound kitchen ticket buzzer alert
    if (currentPendingCount > prevPendingCountRef.current) {
      playBeep(440, 'triangle', 0.12);
      setTimeout(() => {
        playBeep(440, 'triangle', 0.12);
      }, 150);
      setTimeout(() => {
        playBeep(554.37, 'triangle', 0.2);
      }, 300);
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [currentPendingCount]);

  // Update specific item state
  const handleUpdateItemStatus = (
    tableId: string,
    itemIndex: number,
    newStatus: 'pendente' | 'recebido' | 'preparo' | 'pronto' | 'entregue' | 'cancelado'
  ) => {
    const table = tablesComandas.find(t => t.id === tableId);
    if (!table || !table.items) return;

    const updatedItems = [...table.items];
    const currentItem = updatedItems[itemIndex];
    if (!currentItem) return;

    updatedItems[itemIndex] = {
      ...currentItem,
      status: newStatus,
      statusHistory: [
        ...(currentItem.statusHistory || []),
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          userId: currentUser?.name || 'production-terminal'
        }
      ]
    };

    onUpdateTableItems(tableId, updatedItems);

    // Audio feedback chime for local operational action
    playBeep(587.33, 'sine', 0.15);

    // Beep sound simulator visual feedback
    setBeepSimulated(true);
    setTimeout(() => setBeepSimulated(false), 800);
  };

  const getElapsedTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Agora';
    return `${diffMins} min atrás`;
  };

  return (
    <div className={`flex flex-col gap-5 w-full min-h-[90vh] p-4 ${
      theme === 'dark' ? 'text-white' : 'text-[#111111]'
    }`}>
      {/* Sleek Compact Status Bar with Logout and Theme Toggle */}
      {currentUser && (
        <div className={`flex justify-between items-center px-4 py-2.5 rounded-xl border text-xs font-semibold ${
          theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#18F2A4]" />
            <span>Terminal de Produção • AdegaOS</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="font-bold leading-tight" style={{ color: theme === 'dark' ? 'white' : '#111' }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">{currentUser.role}</span>
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-[#222] bg-black text-amber-400 hover:bg-[#111]' : 'border-gray-200 bg-white text-violet-600 hover:bg-gray-100'
                }`}
                title="Alternar Tema"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Manager Return Trigger if admin/manager */}
            {(currentUser.role === 'admin' || currentUser.role === 'manager') && onGoToManager && (
              <button
                onClick={onGoToManager}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-sky-400 hover:bg-sky-400/10 ${
                  theme === 'dark' ? 'border-[#222] bg-black' : 'border-gray-200 bg-white'
                }`}
              >
                Gerente
              </button>
            )}

            {/* Logout Trigger */}
            {onLogout && (
              <button
                onClick={onLogout}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-red-500 hover:bg-red-500/10 ${
                  theme === 'dark' ? 'border-[#222] bg-black' : 'border-gray-200 bg-white'
                }`}
                title="Sair do Terminal"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Painel de Produção Operacional</h2>
          <p className="text-xs text-gray-400">Fila de preparação integrada com os pedidos do salão em tempo real.</p>
        </div>

        {/* Sector and Status filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Audio alarm beep simulator indicator */}
          <button
            onClick={() => {
              playBeep(587.33, 'sine', 0.15);
              setBeepSimulated(true);
              setTimeout(() => setBeepSimulated(false), 800);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border font-semibold transition-all cursor-pointer ${
              beepSimulated 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105'
                : theme === 'dark' 
                  ? 'border-[#222] bg-black text-gray-400 hover:bg-[#111]' 
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
            }`}
            title="Testar sinalizador sonoro"
          >
            <Volume2 className={`w-3.5 h-3.5 ${beepSimulated ? 'animate-bounce' : ''}`} />
            <span>Sinalizador Ativo</span>
          </button>

          {/* Private Sector Badge: Completely replaces sector toggle */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
            theme === 'dark' ? 'bg-[#080808]/50 border-[#1C1C1C]' : 'bg-gray-100 border-gray-200'
          }`}>
            {activeSector === 'bar' ? (
              <>
                <GlassWater className="w-4 h-4 text-[#18F2A4]" />
                <span className="text-[#18F2A4]">Terminal Privado: BAR</span>
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4 text-[#18F2A4]" />
                <span className="text-[#18F2A4]">Terminal Privado: COZINHA</span>
              </>
            )}
          </div>

          {/* Quick status view tabs */}
          <div className="flex rounded-lg border p-1" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <button
              onClick={() => setFilterStatus('ativos')}
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded cursor-pointer ${
                filterStatus === 'ativos'
                  ? (theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500 text-white')
                  : 'text-gray-400'
              }`}
            >
              Fila Ativa
            </button>
            <button
              onClick={() => setFilterStatus('finalizados')}
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded cursor-pointer ${
                filterStatus === 'finalizados'
                  ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-white')
                  : 'text-gray-400'
              }`}
            >
              Histórico Entregues
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter for Fast Operations */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por produto ou nº mesa/comanda..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:border-[#18F2A4]"
            style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}
          />
        </div>
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${
              theme === 'dark' ? 'border-[#1C1C1C] hover:bg-[#111]' : 'border-gray-200 hover:bg-gray-100'
            }`}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Production Grid Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map((item, idx) => {
              const minutesElapsed = getElapsedTime(item.timestamp);
              const isPreparo = item.status === 'preparo';
              const isPronto = item.status === 'pronto';
              const isRecebido = item.status === 'recebido';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-200 ${
                    isRecebido
                      ? 'border-red-500 bg-red-500/5 shadow-sm'
                      : isPreparo
                        ? 'border-amber-500 bg-amber-500/5'
                        : isPronto
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-gray-800'
                  }`}
                  style={{
                    backgroundColor: theme === 'dark' ? '' : 'white',
                    borderColor: theme === 'dark' ? '' : '#E5E5E5'
                  }}
                >
                  {/* Card upper row */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${
                        isRecebido ? 'text-red-400' : isPreparo ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.status === 'recebido' ? 'AGUARDANDO' : item.status === 'preparo' ? 'EM PREPARO' : item.status === 'pronto' ? 'PRONTO' : 'ENTREGUE'}
                      </span>
                      <h3 className="text-sm font-extrabold mt-0.5 uppercase tracking-wide">
                        {item.tableType === 'mesa' ? 'Mesa' : 'Comanda'} {item.tableNumber}
                        {item.tableName && (
                          <span className="text-[10px] text-gray-400 font-normal block tracking-normal lowercase italic mt-0.5">
                            Cliente: {item.tableName}
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{minutesElapsed}</span>
                    </div>
                  </div>

                  {/* Product Specification Block */}
                  <div className={`p-2.5 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#000000]/50 border-[#1C1C1C]' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {item.quantity}x
                      </span>
                      <span className="text-xs font-bold">{item.productName}</span>
                    </div>
                    {item.notes && (
                      <div className="mt-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium border border-amber-500/15">
                        OBS: {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 border-t pt-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    {filterStatus === 'ativos' ? (
                      <>
                        {/* 1. Recibido -> Preparar */}
                        {(isRecebido || item.status === 'pendente') && (
                          <button
                            onClick={() => handleUpdateItemStatus(item.tableId, item.itemIndex, 'preparo')}
                            className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Play className="w-3 h-3" />
                            Começar Preparo
                          </button>
                        )}

                        {/* 2. Preparo -> Pronto */}
                        {isPreparo && (
                          <button
                            onClick={() => handleUpdateItemStatus(item.tableId, item.itemIndex, 'pronto')}
                            className="flex-1 py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Check className="w-3 h-3" />
                            Marcar Pronto
                          </button>
                        )}

                        {/* 3. Pronto -> Entregar */}
                        {isPronto && (
                          <button
                            onClick={() => handleUpdateItemStatus(item.tableId, item.itemIndex, 'entregue')}
                            className="flex-1 py-1.5 px-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar Entrega
                          </button>
                        )}

                        {/* Quick cancel option for items in mistake */}
                        <button
                          onClick={() => {
                            if (confirm('Deseja cancelar a produção deste item? O estoque voltará ao normal.')) {
                              handleUpdateItemStatus(item.tableId, item.itemIndex, 'cancelado');
                            }
                          }}
                          className={`p-1.5 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                            theme === 'dark'
                              ? 'bg-red-950/20 text-red-400 border-red-500/10 hover:bg-red-950/40'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title="Cancelar Pedido"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 flex justify-between items-center text-[10px] text-gray-500">
                        <span>Status finalizado:</span>
                        <span className={`font-mono font-bold uppercase ${item.status === 'entregue' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.status === 'entregue' ? 'Entregue' : 'Cancelado'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Layers className="w-10 h-10 text-gray-600" />
            <span className="font-bold text-gray-400">Nenhum pedido na fila</span>
            <p className="text-[11px] text-gray-500 max-w-xs">Não há itens de {activeSector === 'bar' ? 'bebidas/bar' : 'comidas/cozinha'} aguardando preparação no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
