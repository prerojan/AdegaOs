import React, { useState, useMemo } from 'react';
import { Truck, Plus, Trash2, CheckCircle, Percent, ClipboardList, Info } from 'lucide-react';
import { Supplier, Product, Purchase, PurchaseItem, FinancialTransaction } from '../types';

interface ManagerPurchasesProps {
  suppliers: Supplier[];
  products: Product[];
  onAddPurchaseReceipt: (purchase: Purchase) => void;
  onUpdateProductCost: (productId: string, newCost: number) => void;
  onIncreaseStockBoxes: (productId: string, addedBoxes: number) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  theme: 'dark' | 'light';
}

export default function ManagerPurchases({
  suppliers,
  products,
  onAddPurchaseReceipt,
  onUpdateProductCost,
  onIncreaseStockBoxes,
  onAddFinancial,
  theme
}: ManagerPurchasesProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [freight, setFreight] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Active items being typed in the invoice
  const [cartItems, setCartItems] = useState<{ productId: string; boxes: number; costPrice: number }[]>([]);
  
  // Input fields for current item
  const [currentItemId, setCurrentItemId] = useState<string>(products[0]?.id || '');
  const [currentBoxes, setCurrentBoxes] = useState<number>(1);
  const [currentCost, setCurrentCost] = useState<number>(0);

  // Set default cost of selected product
  const handleItemSelect = (prodId: string) => {
    setCurrentItemId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCurrentCost(prod.costPrice);
    }
  };

  const handleAddItemToInvoice = () => {
    if (!currentItemId) return;
    if (currentBoxes <= 0) {
      alert('Favor preencher uma quantidade válida de caixas.');
      return;
    }
    if (currentCost <= 0) {
      alert('Favor preencher o custo de aquisição.');
      return;
    }

    // Check if already in active invoice
    const existingIdx = cartItems.findIndex(i => i.productId === currentItemId);
    if (existingIdx >= 0) {
      const copy = [...cartItems];
      copy[existingIdx].boxes += currentBoxes;
      setCartItems(copy);
    } else {
      setCartItems([...cartItems, { productId: currentItemId, boxes: currentBoxes, costPrice: currentCost }]);
    }

    // Reset current input fields
    setCurrentBoxes(1);
  };

  const handleRemoveItem = (idx: number) => {
    const copy = [...cartItems];
    copy.splice(idx, 1);
    setCartItems(copy);
  };

  const invoiceSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const prod = products.find(p => p.id === item.productId);
      const totalUnits = item.boxes * (prod ? prod.boxQuantity : 1);
      return acc + (item.costPrice * totalUnits);
    }, 0);
  }, [cartItems, products]);

  const invoiceTotal = useMemo(() => {
    return Math.max(0, invoiceSubtotal + freight - discount);
  }, [invoiceSubtotal, freight, discount]);

  const handleReceiveInvoice = () => {
    if (cartItems.length === 0) {
      alert('Selecione pelo menos um item para compor a nota.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Favor inserir o número da Nota Fiscal.');
      return;
    }

    // 1. Process purchase entry
    const purchaseId = `pur-${Date.now()}`;
    const newPurchase: Purchase = {
      id: purchaseId,
      supplierId: selectedSupplierId,
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      items: cartItems.map(i => ({
        productId: i.productId,
        quantityBoxes: i.boxes,
        quantityUnits: 0,
        costPrice: i.costPrice
      })),
      total: invoiceTotal,
      freight,
      discount,
      status: 'recebido'
    };

    onAddPurchaseReceipt(newPurchase);

    // 2. Loop products to increase stock & update average cost price
    cartItems.forEach(item => {
      onIncreaseStockBoxes(item.productId, item.boxes);
      onUpdateProductCost(item.productId, item.costPrice);
    });

    // 3. Register Accounts Payable in Financial Transactions
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // net 14 terms standard

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'despesa',
      category: 'Fornecedores',
      description: `Compra NF #${invoiceNumber} - ${selectedSupplier ? selectedSupplier.companyName : 'Fornecedor'}`,
      value: invoiceTotal,
      status: 'pendente', // unpaid initially as accounts payable
      dueDate: dueDate.toISOString().split('T')[0]
    };

    onAddFinancial(newTx);

    // Reset Entire Form
    setCartItems([]);
    setInvoiceNumber('');
    setFreight(0);
    setDiscount(0);
    alert(`Nota Fiscal #${invoiceNumber} recebida com sucesso!\n\nEstoque atualizado, preços médios recalculados e duplicata à pagar gerada para 14 dias.`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Recebimento de Notas (Compras)</h2>
        <p className="text-xs text-gray-400">Lance as compras em fardo fechado recebidas dos fornecedores para reabastecer o estoque e gerar as duplicatas financeiras.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoice Header Details */}
        <div className={`p-4 rounded-xl border flex flex-col gap-4 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <Truck className="w-4 h-4 text-[#18F2A4]" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Dados da Nota Fiscal</span>
          </div>

          {/* Supplier dropdown */}
          <div className="flex flex-col gap-1 text-xs">
            <label className="text-gray-400 font-semibold">Fornecedor Emitente</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="p-2 rounded border focus:outline-none"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>

          {/* NF input */}
          <div className="flex flex-col gap-1 text-xs">
            <label className="text-gray-400 font-semibold">Número NF-e *</label>
            <input
              type="text"
              required
              placeholder="Ex: 002.341.109"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="p-2 rounded border focus:outline-none font-mono"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 font-semibold">Frete da NF (R$)</label>
              <input
                type="number"
                min="0"
                value={freight || ''}
                onChange={(e) => setFreight(Number(e.target.value))}
                className="p-2 rounded border focus:outline-none font-mono"
                style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 font-semibold">Desconto NF (R$)</label>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="p-2 rounded border focus:outline-none font-mono"
                style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
              />
            </div>
          </div>

          <div className={`p-3 rounded-lg border text-[10px] leading-relaxed text-gray-400 flex gap-2 ${
            theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
          }`}>
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200" style={{ color: theme === 'dark' ? 'white' : '#333' }}>Contas a Pagar:</span><br />
              O recebimento gerará automaticamente uma duplicata a pagar com vencimento padrão de <span className="font-semibold text-[#18F2A4]">14 dias</span> vinculada a este fornecedor.
            </div>
          </div>
        </div>

        {/* Item additions & Invoice Cart */}
        <div className={`p-4 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <ClipboardList className="w-4 h-4 text-sky-400" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Itens Integrantes da Nota</span>
          </div>

          {/* Quick Item Addition Fields row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 rounded-lg bg-black/20 text-xs border" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-gray-400 font-semibold">Produto</label>
              <select
                value={currentItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="p-1.5 rounded border focus:outline-none"
                style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-400 font-semibold">Qtd Caixas (Fardos)</label>
              <input
                type="number"
                min="1"
                value={currentBoxes}
                onChange={(e) => setCurrentBoxes(Number(e.target.value))}
                className="p-1.5 rounded border focus:outline-none text-center font-mono"
                style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
              />
            </div>

            <button
              onClick={handleAddItemToInvoice}
              className={`p-1.5 rounded font-semibold text-center cursor-pointer transition-all ${
                theme === 'dark' ? 'bg-sky-500 hover:bg-sky-600 text-black' : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              Adicionar Item
            </button>
          </div>

          {/* Invoice Items table lists */}
          <div className="flex-1 overflow-y-auto max-h-48 min-h-24">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b text-gray-500 uppercase font-bold tracking-wider">
                  <th className="pb-1.5">Produto Alvo</th>
                  <th className="pb-1.5 text-center">Fardos/Cx</th>
                  <th className="pb-1.5 text-center">Qtd Total (UN)</th>
                  <th className="pb-1.5 font-mono text-right">Custo Unitário (UN)</th>
                  <th className="pb-1.5 font-mono text-right">Subtotal Custo</th>
                  <th className="pb-1.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  const totalUnits = item.boxes * (prod ? prod.boxQuantity : 12);
                  const rowSubtotal = item.costPrice * totalUnits;

                  return (
                    <tr key={idx} className={`border-b ${
                      theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-50'
                    }`}>
                      <td className="py-2 font-semibold text-gray-200" style={{ color: theme === 'dark' ? 'white' : '#222' }}>{prod ? prod.name : 'Produto'}</td>
                      <td className="py-2 text-center text-[#18F2A4] font-semibold">{item.boxes} cx</td>
                      <td className="py-2 text-center text-sky-400 font-mono">{totalUnits} un</td>
                      <td className="py-2 font-mono text-right text-gray-400">R$ {item.costPrice.toFixed(2)}</td>
                      <td className="py-2 font-mono text-right font-bold text-gray-200" style={{ color: theme === 'dark' ? 'white' : '#222' }}>R$ {rowSubtotal.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cartItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      Nenhum item lançado na Nota Fiscal. Adicione itens acima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Checkout Invoice bottom summary */}
          <div className="flex flex-col gap-2 pt-3 border-t border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>Subtotal Nota: R$ {invoiceSubtotal.toFixed(2)}</span>
              {freight > 0 && <span>Frete: + R$ {freight.toFixed(2)}</span>}
              {discount > 0 && <span className="text-red-500">Desconto: - R$ {discount.toFixed(2)}</span>}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col text-xs">
                <span className="text-[10px] uppercase text-gray-400 font-bold">Total Geral da Nota</span>
                <span className={`text-lg font-mono font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                  R$ {invoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                disabled={cartItems.length === 0}
                onClick={handleReceiveInvoice}
                className={`py-2 px-4 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  cartItems.length === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]'
                      : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Receber Mercadoria (NF-e)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
