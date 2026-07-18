import React, { useState, useMemo } from 'react';
import { Package, RefreshCw, Barcode, Plus, Minus, ArrowRight, AlertCircle, History, LayoutGrid } from 'lucide-react';
import { Product } from '../types';

interface ManagerInventoryProps {
  products: Product[];
  onUpdateFullStock: (productId: string, boxes: number, units: number) => void;
  theme: 'dark' | 'light';
}

interface InventoryLog {
  timestamp: string;
  productName: string;
  type: 'entrada' | 'ajuste' | 'conversao' | 'saida';
  description: string;
  qtyChanged: string;
}

export default function ManagerInventory({
  products,
  onUpdateFullStock,
  theme
}: ManagerInventoryProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [inputBoxes, setInputBoxes] = useState<number>(0);
  const [inputUnits, setInputUnits] = useState<number>(0);
  const [barcodeSearch, setBarcodeSearch] = useState<string>('');
  
  // Local log history to simulate real audit trials
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([
    { timestamp: new Date(Date.now() - 3600000).toISOString(), productName: 'Cerveja Heineken Long Neck 330ml', type: 'conversao', description: 'Desdobramento de 2 caixas fechadas em 48 unidades avulsas para o freezer rápido', qtyChanged: '-2 cx | +48 un' },
    { timestamp: new Date(Date.now() - 7200000).toISOString(), productName: 'Cerveja Amstel Latão 473ml', type: 'entrada', description: 'Entrada manual de mercadoria por fardo comercial (Ambev)', qtyChanged: '+10 cx | 0 un' },
    { timestamp: new Date(Date.now() - 14400000).toISOString(), productName: 'Vodka Absolut Regular 1L', type: 'ajuste', description: 'Ajuste de inventário físico por quebra de garrafa', qtyChanged: '0 cx | -1 un' },
  ]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Barcode simulation matching
  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.barcode === barcodeSearch);
    if (prod) {
      setSelectedProductId(prod.id);
      alert(`Produto encontrado: ${prod.name}`);
      setBarcodeSearch('');
    } else {
      alert('Código de barras não cadastrado no sistema.');
    }
  };

  const handleApplyAdjustment = (type: 'somar' | 'ajustar') => {
    if (!selectedProduct) return;

    let targetBoxes = selectedProduct.stockBoxes;
    let targetUnits = selectedProduct.stockUnits;

    if (type === 'somar') {
      targetBoxes += inputBoxes;
      targetUnits += inputUnits;
    } else {
      targetBoxes = inputBoxes;
      targetUnits = inputUnits;
    }

    if (targetBoxes < 0 || targetUnits < 0) {
      alert('O estoque não pode ser negativo.');
      return;
    }

    onUpdateFullStock(selectedProduct.id, targetBoxes, targetUnits);

    const logMsg: InventoryLog = {
      timestamp: new Date().toISOString(),
      productName: selectedProduct.name,
      type: type === 'somar' ? 'entrada' : 'ajuste',
      description: type === 'somar' ? 'Entrada manual de mercadoria' : 'Ajuste geral de inventário físico',
      qtyChanged: `${type === 'somar' ? '+' : ''}${inputBoxes} cx | ${type === 'somar' ? '+' : ''}${inputUnits} un`
    };

    setInventoryLogs([logMsg, ...inventoryLogs]);
    setInputBoxes(0);
    setInputUnits(0);
    alert('Operação de estoque aplicada com sucesso!');
  };

  const handleBoxConversion = () => {
    if (!selectedProduct) return;
    if (selectedProduct.stockBoxes < 1) {
      alert('Não há caixas fechadas disponíveis deste produto para conversão.');
      return;
    }

    // Convert 1 box into its constituent units
    const targetBoxes = selectedProduct.stockBoxes - 1;
    const targetUnits = selectedProduct.stockUnits + selectedProduct.boxQuantity;

    onUpdateFullStock(selectedProduct.id, targetBoxes, targetUnits);

    const logMsg: InventoryLog = {
      timestamp: new Date().toISOString(),
      productName: selectedProduct.name,
      type: 'conversao',
      description: `Conversão: Desdobrou 1 Caixa de ${selectedProduct.boxQuantity} un em unidades soltas`,
      qtyChanged: '-1 cx | +' + selectedProduct.boxQuantity + ' un'
    };

    setInventoryLogs([logMsg, ...inventoryLogs]);
    alert(`Conversão Concluída!\n\n1 Caixa fechada foi aberta e adicionou +${selectedProduct.boxQuantity} unidades avulsas ao estoque físico.`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Upper header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Painel de Controle Físico de Estoque</h2>
        <p className="text-xs text-gray-400">Controle rigoroso de caixas comerciais fechadas e unidades soltas com desdobramento dinâmico.</p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: Interactive Stock Adjustments */}
        <div className={`p-4 rounded-xl border flex flex-col gap-4 lg:col-span-1 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <Package className="w-4 h-4 text-[#18F2A4]" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Ajuste de Saldo Físico</span>
          </div>

          {/* Barcode scanner mock */}
          <form onSubmit={handleBarcodeSearch} className="flex gap-2">
            <div className={`relative flex items-center rounded-lg border px-2.5 py-1.5 flex-1 ${
              theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-white border-gray-200'
            }`}>
              <Barcode className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Simular Código de Barras..."
                className="w-full text-xs bg-transparent focus:outline-none font-mono"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${
                theme === 'dark' ? 'bg-[#1A1A1A] hover:bg-[#222]' : 'bg-gray-100 border hover:bg-gray-200'
              }`}
            >
              Buscar
            </button>
          </form>

          {/* Product selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-[10px] font-bold uppercase">Produto Alvo</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="p-2 rounded border text-xs focus:outline-none"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            >
              {products.map(p => {
                const tot = (p.stockBoxes * p.boxQuantity) + p.stockUnits;
                return (
                  <option key={p.id} value={p.id}>{p.name} (Atual: {tot} un)</option>
                );
              })}
            </select>
          </div>

          {/* Product Overview Card */}
          {selectedProduct && (
            <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
              theme === 'dark' ? 'bg-[#080808]/80 border-[#1C1C1C]' : 'bg-gray-50 border-gray-200 shadow-sm'
            }`}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-xs leading-snug block truncate" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{selectedProduct.name}</span>
                  <span className={`text-[10px] font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>EAN: {selectedProduct.barcode}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                  ((selectedProduct.stockBoxes * selectedProduct.boxQuantity) + selectedProduct.stockUnits) <= selectedProduct.minStockUnits
                    ? theme === 'dark'
                      ? 'bg-red-950/40 text-red-400 border-red-900/30'
                      : 'bg-red-100 text-red-900 border-red-200'
                    : theme === 'dark'
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}>
                  {selectedProduct.boxQuantity} UN/CAIXA
                </span>
              </div>

              {/* Box vs Loose representation */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className={`p-1.5 rounded border ${theme === 'dark' ? 'bg-black/20 border-[#111]' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <span className={`text-[10px] block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>Caixas Fechadas</span>
                  <span className={`font-mono text-sm font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>{selectedProduct.stockBoxes} cx</span>
                </div>
                <div className={`p-1.5 rounded border ${theme === 'dark' ? 'bg-black/20 border-[#111]' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <span className={`text-[10px] block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>Garrafas Soltas</span>
                  <span className={`font-mono text-sm font-bold ${theme === 'dark' ? 'text-sky-400' : 'text-sky-700'}`}>{selectedProduct.stockUnits} un</span>
                </div>
              </div>

              {/* Dynamic stock total */}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed" style={{ borderColor: theme === 'dark' ? '#111' : '#E5E5E5' }}>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600 font-medium'}>Total Físico Estimado:</span>
                <span className="font-mono font-extrabold text-sm" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                  {(selectedProduct.stockBoxes * selectedProduct.boxQuantity) + selectedProduct.stockUnits} unidades
                </span>
              </div>

              {/* Conversion trigger */}
              {selectedProduct.stockBoxes > 0 && (
                <button
                  type="button"
                  onClick={handleBoxConversion}
                  className={`w-full py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4] border-[#18F2A4]/30 hover:bg-[#18F2A4]/20' : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Abrir / Desdobrar 1 Caixa
                </button>
              )}
            </div>
          )}

          {/* Form adjustments inputs */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Caixas (Fardos)</label>
                <input
                  type="number"
                  value={inputBoxes || ''}
                  placeholder="0"
                  onChange={(e) => setInputBoxes(Number(e.target.value))}
                  className="p-2 rounded border focus:outline-none text-center font-mono"
                  style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Unidades Soltas</label>
                <input
                  type="number"
                  value={inputUnits || ''}
                  placeholder="0"
                  onChange={(e) => setInputUnits(Number(e.target.value))}
                  className="p-2 rounded border focus:outline-none text-center font-mono"
                  style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleApplyAdjustment('ajustar')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-transparent border-[#222] text-gray-300 hover:bg-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Ajustar Total
              </button>
              <button
                type="button"
                onClick={() => handleApplyAdjustment('somar')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Somar Entrada
              </button>
            </div>
          </div>
        </div>

        {/* Box 2: Stock levels audit ledger table */}
        <div className={`p-5 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-sky-400" />
              <span className={`text-xs uppercase font-extrabold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Planilha Geral de Estoques</span>
            </div>
            <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total de {products.length} itens</span>
          </div>

          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase tracking-wider text-[10px] ${
                  theme === 'dark' ? 'border-[#1C1C1C] text-gray-400' : 'border-gray-150 text-gray-500 bg-gray-50/50'
                }`}>
                  <th className="p-3">Produto</th>
                  <th className="p-3 font-mono">Caixas Fechadas</th>
                  <th className="p-3 font-mono">Unidades Avulsas</th>
                  <th className="p-3 text-right">Saldo Líquido</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const totalUnits = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
                  const isCrit = totalUnits <= prod.minStockUnits;
                  
                  return (
                    <tr key={prod.id} className={`border-b transition-colors ${
                      theme === 'dark' ? 'border-[#1C1C1C] hover:bg-[#151515]' : 'border-gray-150 hover:bg-gray-50'
                    }`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className={`w-7 h-7 rounded object-cover border flex-shrink-0 ${
                                theme === 'dark' ? 'border-[#222]' : 'border-gray-200'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-7 h-7 rounded flex items-center justify-center border text-[8px] font-black flex-shrink-0 ${
                              theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C] text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}>
                              N/A
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-[13px]" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{prod.name}</span>
                            <span className={`text-[9px] font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Fardo: {prod.boxQuantity} un</span>
                          </div>
                        </div>
                      </td>
                      <td className={`p-3 font-mono font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>{prod.stockBoxes} cx</td>
                      <td className={`p-3 font-mono font-bold ${theme === 'dark' ? 'text-sky-400' : 'text-sky-700'}`}>{prod.stockUnits} un</td>
                      <td className="p-3 font-mono text-right font-black text-[13px]" style={{ color: theme === 'dark' ? 'white' : '#111' }}>
                        {totalUnits} un
                      </td>
                      <td className="p-3 text-center">
                        {isCrit ? (
                          <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            theme === 'dark'
                              ? 'bg-red-950/40 text-red-400 border-red-900/30'
                              : 'bg-red-100 text-red-900 border-red-200'
                          }`}>REPOSIÇÃO</span>
                        ) : (
                          <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            theme === 'dark'
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          }`}>SUFICIENTE</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Standalone Card: Audit Trail Logs for factual analysis */}
      <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#18F2A4]" />
            <span className={`text-xs uppercase font-extrabold tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Histórico de Movimentações (Auditoria Factual)</span>
          </div>
          <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Log de Transações Físicas</span>
        </div>
        
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {inventoryLogs.map((log, idx) => (
            <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center text-xs transition-colors ${
              theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A] hover:bg-[#0E0E0E]' : 'bg-gray-50 border-gray-150 hover:bg-gray-100'
            }`}>
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{log.productName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${
                    log.type === 'entrada' ? (theme === 'dark' ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-800') :
                    log.type === 'conversao' ? (theme === 'dark' ? 'bg-sky-950/40 border-sky-500/20 text-sky-400' : 'bg-sky-100 border-sky-200 text-sky-800') :
                    (theme === 'dark' ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-800')
                  }`}>{log.type}</span>
                </div>
                <span className={`text-[11px] font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{log.description}</span>
              </div>
              <div className="text-right font-mono shrink-0">
                <span className="font-black text-sm block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{log.qtyChanged}</span>
                <span className={`text-[9px] font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
          {inventoryLogs.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-500">Nenhum registro de movimentação disponível.</div>
          )}
        </div>
      </div>
    </div>
  );
}
