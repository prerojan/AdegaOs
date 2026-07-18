import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, X, Percent, Check, AlertTriangle, HelpCircle, Archive, Save, ChevronDown, ChevronUp, Folder } from 'lucide-react';
import { Product, Sale, FinancialTransaction } from '../types';

interface QuickSaleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateStock: (productId: string, qtyToRemove: number) => void;
  onAddSale: (sale: Sale) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  currentUser: any;
  theme: 'dark' | 'light';
}

export default function QuickSaleSidebar({
  isOpen,
  onClose,
  products,
  onUpdateStock,
  onAddSale,
  onAddFinancial,
  currentUser,
  theme
}: QuickSaleSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes?: string }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'debito' | 'credito'>('pix');
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Get categories
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  // Filter products for quick selection
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.barcode.includes(searchTerm);
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return p.active && matchesSearch && matchesCategory;
    }).slice(0, 8); // show only top 8 for UI compactness
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const totalUnitsInStock = (product.stockBoxes * product.boxQuantity) + product.stockUnits;

    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    if (currentQtyInCart >= totalUnitsInStock) {
      alert(`Quantidade máxima em estoque atingida (${totalUnitsInStock} un)`);
      return;
    }

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const totalUnitsInStock = (item.product.stockBoxes * item.product.boxQuantity) + item.product.stockUnits;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else if (newQty > totalUnitsInStock) {
      alert(`Quantidade máxima em estoque atingida (${totalUnitsInStock} un)`);
      return;
    } else {
      item.quantity = newQty;
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Check if cart contains age restricted items
  const hasAgeRestrictedItem = useMemo(() => {
    return cart.some(item => item.product.ageRestricted);
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (hasAgeRestrictedItem && !ageVerified) {
      setShowAgeVerification(true);
      return;
    }

    // Process checkout
    const saleId = `sale-${Date.now()}`;
    const saleNumber = String(Math.floor(1000 + Math.random() * 9000));

    // Deduct stock
    cart.forEach(item => {
      onUpdateStock(item.product.id, item.quantity);
    });

    const newSale: Sale = {
      id: saleId,
      number: saleNumber,
      timestamp: new Date().toISOString(),
      type: 'balcao',
      identifier: `Balcão #${saleNumber}`,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice,
        notes: item.notes
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'pago',
      cashierId: currentUser?.id || 'u1',
    };

    onAddSale(newSale);

    // Create financial recipe transaction
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'receita',
      category: 'Vendas',
      description: `Venda de Balcão #${saleNumber}`,
      value: total,
      paymentMethod,
      status: 'pago'
    };
    onAddFinancial(newTx);

    // Reset checkout state
    setCart([]);
    setDiscount(0);
    setAgeVerified(false);
    
    // Simulate receipt generation
    alert(`Venda #${saleNumber} concluída com sucesso! Valor: R$ ${total.toFixed(2)}`);
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) return;

    const saleNumber = String(Math.floor(1000 + Math.random() * 9000));
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      number: saleNumber,
      timestamp: new Date().toISOString(),
      type: 'balcao',
      identifier: `Rascunho Balcão #${saleNumber}`,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'aberto',
      cashierId: currentUser?.id || 'u1'
    };

    onAddSale(newSale);
    setCart([]);
    setDiscount(0);
    alert(`Rascunho #${saleNumber} salvo com sucesso!`);
  };

  if (!isOpen) return null;

  return (
    <div className={`w-96 border-l shrink-0 flex flex-col h-full z-10 ${
      theme === 'dark' 
        ? 'bg-[#080808] border-[#1A1A1A] text-white' 
        : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#111111]'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${
        theme === 'dark' ? 'border-[#1A1A1A]' : 'border-[#E5E5E5]'
      }`}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#18F2A4]" />
          <span className="font-semibold text-sm">Venda Rápida (Balcão)</span>
        </div>
        <button 
          onClick={onClose} 
          className={`p-1 rounded-md transition-colors ${
            theme === 'dark' ? 'hover:bg-[#111111]' : 'hover:bg-[#F0F0F0]'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Product Finder Panel */}
      <div className="p-3 flex flex-col gap-2">
        <div className={`relative flex items-center rounded-lg border px-3 py-1.5 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-[#E5E5E5]'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar nome ou código de barras..."
            className="w-full text-xs bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`w-full flex items-center justify-between text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
              theme === 'dark'
                ? 'bg-[#111111] border-[#1A1A1A] text-white hover:border-[#18F2A4]/50'
                : 'bg-white border-[#E5E5E5] text-gray-700 hover:border-[#10B981]/50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Folder className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`} />
              <span>Categoria: <strong className={theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}>{selectedCategory}</strong></span>
            </div>
            {showCategoryDropdown ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showCategoryDropdown && (
            <>
              {/* Backdrop to close */}
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setShowCategoryDropdown(false)}
              />
              <div className={`absolute left-0 right-0 mt-1.5 p-1.5 rounded-lg border shadow-xl z-30 max-h-48 overflow-y-auto ${
                theme === 'dark'
                  ? 'bg-[#111111] border-[#1A1A1A]'
                  : 'bg-white border-[#E5E5E5]'
              }`}>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-all ${
                        selectedCategory === cat
                          ? (theme === 'dark' ? 'bg-[#18F2A4] text-black font-semibold' : 'bg-[#10B981] text-white font-semibold')
                          : (theme === 'dark' ? 'text-gray-400 hover:bg-[#1C1C1C] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dynamic searchable matching product results */}
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredProducts.map(prod => {
            const stockTotal = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
            const isOutOfStock = stockTotal <= 0;
            return (
              <button
                key={prod.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(prod)}
                className={`p-2 rounded-lg border text-left flex flex-col transition-all relative overflow-hidden group ${
                  isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  theme === 'dark' 
                    ? 'bg-[#111111] border-[#1A1A1A] hover:border-[#18F2A4]/30' 
                    : 'bg-white border-[#E5E5E5] hover:border-[#10B981]/30'
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="font-medium text-[11px] leading-tight line-clamp-2">{prod.name}</span>
                  {prod.ageRestricted && (
                    <span className={`text-[9px] font-extrabold px-1.5 rounded-sm scale-90 shrink-0 border ${
                      theme === 'dark'
                        ? 'bg-red-950/40 text-red-400 border-red-900/30'
                        : 'bg-red-100 text-red-900 border-red-200'
                    }`}>18+</span>
                  )}
                </div>
                <div className="mt-1.5 flex justify-between items-baseline">
                  <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                    R$ {prod.sellPrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-gray-400">Est: {stockTotal} un</span>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-4 text-[11px] text-gray-500">
              Nenhum produto ativo encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Cart Area */}
      <div className={`flex-1 overflow-y-auto px-4 py-2 border-t ${
        theme === 'dark' ? 'border-[#1A1A1A]' : 'border-[#E5E5E5]'
      }`}>
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-2">Carrinho</span>
        
        {cart.length === 0 ? (
          <div className="h-40 flex flex-col justify-center items-center text-center gap-2">
            <ShoppingCart className="w-8 h-8 text-gray-600 stroke-[1.5]" />
            <span className="text-xs text-gray-500">Carrinho vazio.<br />Selecione produtos acima.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cart.map((item, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg border flex flex-col gap-1.5 ${
                  theme === 'dark' ? 'bg-[#111111]/50 border-[#1A1A1A]' : 'bg-gray-50 border-[#E5E5E5]'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[11px] font-medium leading-tight">{item.product.name}</span>
                  <button 
                    onClick={() => removeFromCart(index)} 
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => updateQuantity(index, -1)}
                      className={`w-5 py-0.5 rounded text-xs text-center border transition-all ${
                        theme === 'dark' ? 'border-[#222] hover:bg-[#222]' : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      -
                    </button>
                    <span className="font-mono text-xs w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(index, 1)}
                      className={`w-5 py-0.5 rounded text-xs text-center border transition-all ${
                        theme === 'dark' ? 'border-[#222] hover:bg-[#222]' : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-bold font-mono">
                    R$ {(item.product.sellPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Actions & Summary */}
      <div className={`p-4 border-t flex flex-col gap-3 ${
        theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-white border-[#E5E5E5]'
      }`}>
        {/* Discount controller */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Percent className="w-3.5 h-3.5 text-[#18F2A4]" />
            <span>Desconto (R$):</span>
          </div>
          <input
            type="number"
            disabled={cart.length === 0}
            min="0"
            max={subtotal}
            placeholder="0.00"
            value={discount || ''}
            onChange={(e) => setDiscount(Math.min(subtotal, Number(e.target.value)))}
            className={`w-20 text-right text-xs font-mono px-1.5 py-1 rounded border focus:outline-none ${
              theme === 'dark' 
                ? 'bg-[#111111] border-[#222] text-white focus:border-[#18F2A4]' 
                : 'bg-white border-gray-200 text-[#111111] focus:border-[#10B981]'
            }`}
          />
        </div>

        {/* Payment options */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Forma de Pagamento</span>
          <div className="grid grid-cols-4 gap-1">
            {(['pix', 'dinheiro', 'debito', 'credito'] as const).map(method => (
              <button
                key={method}
                disabled={cart.length === 0}
                onClick={() => setPaymentMethod(method)}
                className={`text-[10px] font-medium py-1.5 px-1 rounded border capitalize transition-all ${
                  paymentMethod === method
                    ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4] border-[#18F2A4]' : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]')
                    : (theme === 'dark' ? 'bg-[#111111] text-gray-400 border-transparent hover:border-[#222]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100')
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="flex flex-col gap-1 py-1 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal:</span>
            <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-500 font-medium">
              <span>Desconto:</span>
              <span className="font-mono">- R$ {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-[#222]">
            <span>Total Geral:</span>
            <span className={`font-mono ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Age Restriction Verification Popup */}
        {showAgeVerification && (
          <div className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
            theme === 'dark' ? 'bg-amber-950/20 border-amber-500/50 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}>
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold">Verificação de Idade Obrigatória!</span><br />
                Este carrinho contém produtos restritos (+18). Solicite documento do cliente e confirme.
              </div>
            </div>
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => {
                  setShowAgeVerification(false);
                  setCart([]);
                }}
                className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                  theme === 'dark' ? 'bg-transparent border-red-500/30 text-red-400 hover:bg-red-950/30' : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                Cancelar Venda
              </button>
              <button
                onClick={() => {
                  setAgeVerified(true);
                  setShowAgeVerification(false);
                  alert("Idade verificada com sucesso! Prossiga com o checkout.");
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
                  theme === 'dark' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                Sim, documento verificado
              </button>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            disabled={cart.length === 0}
            onClick={handleSaveDraft}
            className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              cart.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-transparent border-[#222] text-gray-300 hover:bg-[#111]'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Rascunho
          </button>

          <button
            disabled={cart.length === 0 || (hasAgeRestrictedItem && showAgeVerification)}
            onClick={handleCheckout}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              cart.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f] active:scale-95'
                  : 'bg-[#10B981] text-white hover:bg-[#0e9f6e] active:scale-95'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
}
