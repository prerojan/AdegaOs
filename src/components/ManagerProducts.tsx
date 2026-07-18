import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Copy, Archive, Check, X, Tag, FileSpreadsheet, Percent } from 'lucide-react';
import { Product, Supplier } from '../types';

interface ManagerProductsProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  theme: 'dark' | 'light';
}

export default function ManagerProducts({
  products,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  theme
}: ManagerProductsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Cervejas');
  const [brand, setBrand] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [unit, setUnit] = useState<'UN' | 'LT' | 'KG'>('UN');
  const [boxQuantity, setBoxQuantity] = useState(12);
  const [stockBoxes, setStockBoxes] = useState(0);
  const [stockUnits, setStockUnits] = useState(0);
  const [minStockUnits, setMinStockUnits] = useState(12);
  const [maxStockUnits, setMaxStockUnits] = useState(120);
  const [active, setActive] = useState(true);
  const [ageRestricted, setAgeRestricted] = useState(true);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');

  // Auto-calculated margin
  const margin = useMemo(() => {
    if (sellPrice <= 0) return 0;
    return parseFloat((((sellPrice - costPrice) / sellPrice) * 100).toFixed(2));
  }, [costPrice, sellPrice]);

  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.barcode.includes(searchTerm) ||
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setBarcode(String(Math.floor(7890000000000 + Math.random() * 9999999999)));
    setSku(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setCategory('Cervejas');
    setBrand('');
    setSupplierId(suppliers[0]?.id || '');
    setCostPrice(0);
    setSellPrice(0);
    setUnit('UN');
    setBoxQuantity(12);
    setStockBoxes(0);
    setStockUnits(0);
    setMinStockUnits(24);
    setMaxStockUnits(240);
    setActive(true);
    setAgeRestricted(true);
    setNotes('');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setBarcode(prod.barcode);
    setSku(prod.sku);
    setCategory(prod.category);
    setBrand(prod.brand);
    setSupplierId(prod.supplierId);
    setCostPrice(prod.costPrice);
    setSellPrice(prod.sellPrice);
    setUnit(prod.unit);
    setBoxQuantity(prod.boxQuantity);
    setStockBoxes(prod.stockBoxes);
    setStockUnits(prod.stockUnits);
    setMinStockUnits(prod.minStockUnits);
    setMaxStockUnits(prod.maxStockUnits);
    setActive(prod.active);
    setAgeRestricted(prod.ageRestricted);
    setNotes(prod.notes || '');
    setImage(prod.image || '');
    setShowModal(true);
  };

  const handleDuplicate = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `p-${Date.now()}`,
      name: `${prod.name} (Cópia)`,
      sku: `${prod.sku}-COPY`,
      barcode: String(Math.floor(7890000000000 + Math.random() * 9999999999))
    };
    onAddProduct(duplicated);
    alert('Produto duplicado com sucesso! Lembre-se de ajustar o SKU e o Código de barras.');
  };

  const handleArchive = (prod: Product) => {
    onUpdateProduct({
      ...prod,
      active: !prod.active
    });
    alert(`Produto ${prod.active ? 'arquivado' : 'reativado'} com sucesso.`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode || !sku) {
      alert('Por favor, preencha nome, código de barras e SKU.');
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name,
      barcode,
      sku,
      category,
      brand,
      supplierId,
      costPrice: Number(costPrice),
      sellPrice: Number(sellPrice),
      margin,
      unit,
      boxQuantity: Number(boxQuantity),
      stockBoxes: Number(stockBoxes),
      stockUnits: Number(stockUnits),
      minStockUnits: Number(minStockUnits),
      maxStockUnits: Number(maxStockUnits),
      active,
      ageRestricted,
      notes,
      image
    };

    if (editingProduct) {
      onUpdateProduct(payload);
      alert('Produto atualizado com sucesso!');
    } else {
      onAddProduct(payload);
      alert('Produto cadastrado com sucesso!');
    }

    setShowModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateLabel = (prod: Product) => {
    alert(`Etiquta Gerada!\n\nProduto: ${prod.name}\nSKU: ${prod.sku}\nCód: ${prod.barcode}\nPreço: R$ ${prod.sellPrice.toFixed(2)}`);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cadastro de Produtos</h2>
          <p className="text-xs text-gray-400">Adicione, duplique ou edite itens do portfólio da adega.</p>
        </div>

        <button
          onClick={openNewModal}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
            theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
          }`}
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
      }`}>
        <div className={`relative flex items-center rounded-lg border px-3 py-2 w-full md:w-96 ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="w-full text-xs bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories selector button / dropdown */}
        <div className="relative w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-56 p-2 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none transition-all pr-8 appearance-none"
            style={{
              backgroundColor: theme === 'dark' ? '#080808' : 'white',
              borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5',
              color: theme === 'dark' ? '#DDD' : '#333',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${theme === 'dark' ? '%2318F2A4' : '%2310B981'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                Filtrar: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="overflow-x-auto border rounded-xl" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
        <table className={`w-full text-left border-collapse text-xs ${
          theme === 'dark' ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'
        }`}>
          <thead>
            <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
              theme === 'dark' ? 'border-[#1A1A1A] bg-[#0A0A0A] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              <th className="p-3">Nome / SKU</th>
              <th className="p-3">Categoria</th>
              <th className="p-3 font-mono">Custo</th>
              <th className="p-3 font-mono">Preço Venda</th>
              <th className="p-3">Margem</th>
              <th className="p-3">Fardo / Caixa</th>
              <th className="p-3">Idade</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(prod => {
              const totalStock = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
              const isLowStock = totalStock <= prod.minStockUnits;

              return (
                <tr key={prod.id} className={`border-b transition-colors ${
                  theme === 'dark' ? 'border-[#1A1A1A] hover:bg-[#181818]' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3 py-1">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className={`w-9 h-9 rounded-lg object-cover border flex-shrink-0 ${
                            theme === 'dark' ? 'border-[#222]' : 'border-gray-200'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-[9px] font-black flex-shrink-0 ${
                          theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C] text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}>
                          N/A
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[13px] tracking-tight leading-snug" style={{ color: theme === 'dark' ? '#F3F4F6' : '#1F2937' }}>
                          {prod.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                            theme === 'dark' ? 'bg-[#161616] border-[#252525] text-[#18F2A4]' : 'bg-emerald-50 border-emerald-100 text-[#10B981]'
                          }`}>
                            SKU: {prod.sku}
                          </span>
                          {prod.barcode && (
                            <span className={`inline-flex items-center text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C] text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                            }`}>
                              EAN: {prod.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      theme === 'dark' ? 'bg-[#1A1A1A] text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>{prod.category}</span>
                  </td>
                  <td className={`p-3 font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>R$ {prod.costPrice.toFixed(2)}</td>
                  <td className="p-3 font-mono font-bold">R$ {prod.sellPrice.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      theme === 'dark' ? (
                        prod.margin > 40 
                          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30' 
                          : prod.margin > 25 
                            ? 'text-amber-400 bg-amber-950/30 border-amber-900/30' 
                            : 'text-red-400 bg-red-950/30 border-red-900/30'
                      ) : (
                        prod.margin > 40 
                          ? 'text-emerald-900 bg-emerald-100 border-emerald-200' 
                          : prod.margin > 25 
                            ? 'text-amber-900 bg-amber-100 border-amber-200' 
                            : 'text-red-900 bg-red-100 border-red-200'
                      )
                    }`}>
                      {prod.margin}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{prod.boxQuantity} un/fardo</span>
                  </td>
                  <td className="p-3">
                    {prod.ageRestricted ? (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                        theme === 'dark'
                          ? 'bg-red-950/40 text-red-400 border-red-900/30'
                          : 'bg-red-100 text-red-900 border-red-200'
                      }`}>
                        18+
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-medium">Livre</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      prod.active 
                        ? theme === 'dark' 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
                          : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        : theme === 'dark'
                          ? 'bg-gray-900 text-gray-500 border-gray-800'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {prod.active ? 'Ativo' : 'Arquivado'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(prod)}
                        title="Editar"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-[#18F2A4]' : 'hover:bg-gray-100 text-[#10B981]'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(prod)}
                        title="Duplicar"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-amber-400' : 'hover:bg-gray-100 text-amber-600'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleGenerateLabel(prod)}
                        title="Etiqueta"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-sky-400' : 'hover:bg-gray-100 text-sky-600'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(prod)}
                        title={prod.active ? 'Arquivar' : 'Ativar'}
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-red-400' : 'hover:bg-gray-100 text-red-600'
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500">
                  Nenhum produto cadastrado corresponde aos critérios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-xl border flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1A1A1A]' : 'border-gray-200'
            }`}>
              <span className="font-semibold text-sm">
                {editingProduct ? `Editar: ${editingProduct.name}` : 'Cadastrar Novo Produto'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 flex flex-col gap-4 text-xs">
              {/* Product Basic */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-gray-400 font-medium">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`p-2 rounded border focus:outline-none ${
                      theme === 'dark' ? 'bg-[#111] border-[#222] focus:border-[#18F2A4]' : 'bg-gray-50 border-gray-200 focus:border-[#10B981]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">SKU Interno *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="p-2 rounded border bg-[#111] border-[#222] text-white focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : '#F9F9F9', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Código de Barras (EAN-13) *</label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : '#F9F9F9', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>

              {/* Categorization */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-2 rounded border bg-[#111] border-[#222] text-white focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    <option value="Cervejas">Cervejas</option>
                    <option value="Destilados">Destilados</option>
                    <option value="Vinhos">Vinhos</option>
                    <option value="Refrigerantes">Refrigerantes</option>
                    <option value="Energéticos">Energéticos</option>
                    <option value="Gelo">Gelo</option>
                    <option value="Combos">Combos</option>
                    <option value="Cigarros">Cigarros</option>
                    <option value="Petiscos">Petiscos</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Fornecedor Principal</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Margins */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#000000]/40 border border-[#1A1A1A]" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#F5F5F5', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none font-mono"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellPrice || ''}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none font-mono font-bold"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col justify-end pb-1 text-center">
                  <span className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase">Margem Lucro</span>
                  <div className="flex items-center justify-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-[#18F2A4]" />
                    <span className={`text-sm font-bold font-mono ${margin >= 40 ? 'text-[#18F2A4]' : 'text-amber-500'}`}>
                      {margin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Packaging and stock */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Qtd p/ Caixa (Embalagem)</label>
                  <input
                    type="number"
                    min="1"
                    value={boxQuantity}
                    onChange={(e) => setBoxQuantity(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Min Estoque (unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockUnits}
                    onChange={(e) => setMinStockUnits(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Max Estoque (unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxStockUnits}
                    onChange={(e) => setMaxStockUnits(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex gap-4 items-center p-2 rounded border" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                <label className="flex items-center gap-2 font-medium text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageRestricted}
                    onChange={(e) => setAgeRestricted(e.target.checked)}
                    className="rounded border-[#222] text-[#18F2A4] bg-transparent"
                  />
                  <span>Restrito para Menores (+18 anos)</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-[#222] text-[#18F2A4] bg-transparent"
                  />
                  <span>Produto Disponível para Vendas</span>
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Observações Operacionais</label>
                <textarea
                  value={notes}
                  rows={2}
                  onChange={(e) => setNotes(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  placeholder="Ex: Servir trincando de gelada. Manter no freezer 3."
                />
              </div>

              {/* Product Image Section */}
              <div className="flex flex-col gap-2.5 p-3 rounded-lg border" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : '#F9F9F9', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <label className="text-gray-400 font-semibold block">Imagem do Produto</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {/* Preview box */}
                  <div className={`w-14 h-14 rounded-xl flex-shrink-0 border flex items-center justify-center overflow-hidden bg-black/20 ${
                    theme === 'dark' ? 'border-[#222]' : 'border-gray-200'
                  }`}>
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[9px] text-gray-500 font-semibold text-center">Sem foto</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cole a URL de imagem do Google ou Unsplash..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="p-2 rounded border text-xs flex-1 focus:outline-none focus:border-[#18F2A4]"
                        style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                      />
                      {image && (
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="px-2 py-1.5 rounded text-[10px] font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    {/* Local File uploader */}
                    <div className="flex gap-2 items-center">
                      <label className={`text-[10px] font-bold px-2.5 py-1.5 rounded border cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                        theme === 'dark' ? 'bg-[#1A1A1A] border-[#252525] hover:bg-[#222] text-[#18F2A4]' : 'bg-white border-gray-200 hover:bg-gray-50 text-[#10B981]'
                      }`}>
                        <span>Carregar Arquivo Local (PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {image && image.startsWith('data:image') && (
                        <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Arquivo Carregado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Presets based on category */}
                <div className="mt-1">
                  <span className="text-[10px] text-gray-400 block mb-1">Dica rápida: Imagens Premium Prontas (Clique p/ usar)</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: 'Cerveja', url: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Vodka', url: 'https://images.unsplash.com/photo-1569529465841-dfedd87500f8?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Gin', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Whisky', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Vinho', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Refrigerante', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Energético', url: 'https://images.unsplash.com/photo-1622543953490-0b70039a4ac1?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Porção', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=200&auto=format&fit=crop' }
                    ].map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setImage(p.url)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          image === p.url
                            ? (theme === 'dark' ? 'bg-[#18F2A4]/15 border-[#18F2A4] text-[#18F2A4]' : 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]')
                            : (theme === 'dark' ? 'bg-[#111] border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100')
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-2 justify-end border-t pt-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-3 py-2 rounded font-semibold border transition-all ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-semibold transition-all ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
