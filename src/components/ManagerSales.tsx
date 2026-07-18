import React, { useState, useMemo } from 'react';
import { Search, Filter, Printer, XCircle, FileDown, CheckCircle, RefreshCw, X, Receipt } from 'lucide-react';
import { Sale, Product } from '../types';

interface ManagerSalesProps {
  sales: Sale[];
  products: Product[];
  onCancelSale: (saleId: string, reason: string) => void;
  theme: 'dark' | 'light';
}

export default function ManagerSales({
  sales,
  products,
  onCancelSale,
  theme
}: ManagerSalesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');
  
  // Modal for cancellation
  const [cancelingSaleId, setCancelingSaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Modal for receipt preview
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = s.number.includes(searchTerm) || 
                            s.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.waiterName && s.waiterName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPayment = paymentFilter === 'Todos' || s.paymentMethod === paymentFilter;
      const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
      const matchesType = typeFilter === 'Todos' || s.type === typeFilter;
      
      return matchesSearch && matchesPayment && matchesStatus && matchesType;
    });
  }, [sales, searchTerm, paymentFilter, statusFilter, typeFilter]);

  const handleOpenCancelModal = (saleId: string) => {
    setCancelingSaleId(saleId);
    setCancelReason('');
  };

  const handleConfirmCancel = () => {
    if (!cancelingSaleId) return;
    if (!cancelReason.trim()) {
      alert('Favor inserir o motivo do cancelamento.');
      return;
    }
    onCancelSale(cancelingSaleId, cancelReason);
    setCancelingSaleId(null);
    alert('Venda cancelada com sucesso. O estoque foi reajustado e o histórico de auditoria gravado.');
  };

  const handleExportCSV = () => {
    const headers = 'Numero,Canal,Identificador,Subtotal,Desconto,Total,Metodo,Status,MotivoCancelamento,Data\n';
    const csvContent = filteredSales.map(s => 
      `"${s.number}","${s.type}","${s.identifier}",${s.subtotal},${s.discount},${s.total},"${s.paymentMethod}","${s.status}","${s.cancelReason || ''}","${s.timestamp}"`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'adegaos-auditoria-vendas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Auditoria e Histórico de Vendas</h2>
          <p className="text-xs text-gray-400">Rastreabilidade total das vendas de balcão, comandas e mesas. Cancelamentos exigem justificativa.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className={`px-4 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
            theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] hover:bg-[#1A1A1A]' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FileDown className="w-4 h-4 text-emerald-500" />
          Exportar Relatório (CSV)
        </button>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-5 gap-3 items-center ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
      }`}>
        {/* Search */}
        <div className={`relative flex items-center rounded-lg border px-2.5 py-1.5 md:col-span-2 ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por número, mesa/comanda, garçom..."
            className="w-full text-xs bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Payment Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="p-1.5 rounded border text-xs focus:outline-none"
            style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
          >
            <option value="Todos">Pagamento: Todos</option>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="fiado">Fiado</option>
          </select>
        </div>

        {/* Channel Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-1.5 rounded border text-xs focus:outline-none"
            style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
          >
            <option value="Todos">Canal: Todos</option>
            <option value="balcao">Balcão</option>
            <option value="mesa">Mesa</option>
            <option value="comanda">Comanda</option>
            <option value="entrega">Delivery / WhatsApp</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 rounded border text-xs focus:outline-none"
            style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
          >
            <option value="Todos">Status: Todos</option>
            <option value="pago">Conciliado (Pago)</option>
            <option value="aberto">Em aberto / Rascunho</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border rounded-xl" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
        <table className={`w-full text-left border-collapse text-xs ${
          theme === 'dark' ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'
        }`}>
          <thead>
            <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
              theme === 'dark' ? 'border-[#1A1A1A] bg-[#0A0A0A] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              <th className="p-3">Nº Venda</th>
              <th className="p-3">Data / Hora</th>
              <th className="p-3">Canal / Origem</th>
              <th className="p-3">Lançamento de Itens</th>
              <th className="p-3 font-mono">Total Geral</th>
              <th className="p-3">Forma Pgto</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => {
              const saleDate = new Date(sale.timestamp);
              const formattedDate = saleDate.toLocaleDateString('pt-BR') + ' ' + saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <tr key={sale.id} className={`border-b transition-colors ${
                  theme === 'dark' ? 'border-[#1A1A1A] hover:bg-[#181818]' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className="p-3 font-mono font-bold">#{sale.number}</td>
                  <td className={`p-3 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{formattedDate}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold uppercase text-[10px]" style={{ color: theme === 'dark' ? '#E5E5E5' : '#111' }}>{sale.type}</span>
                      <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{sale.identifier}</span>
                    </div>
                  </td>
                  <td className={`p-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="line-clamp-1 truncate max-w-xs font-medium">
                      {sale.items.map(item => {
                        const prod = products.find(p => p.id === item.productId);
                        return `${item.quantity}x ${prod ? prod.name : 'Produto'}`;
                      }).join(', ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-gray-200 text-sm" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    R$ {sale.total.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                      theme === 'dark' ? (
                        sale.paymentMethod === 'pix' ? 'bg-[#18F2A4]/10 border-[#18F2A4]/20 text-[#18F2A4]' :
                        sale.paymentMethod === 'dinheiro' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        sale.paymentMethod === 'debito' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        sale.paymentMethod === 'credito' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        sale.paymentMethod === 'fiado' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      ) : (
                        sale.paymentMethod === 'pix' ? 'bg-emerald-100 border-emerald-200 text-emerald-900' :
                        sale.paymentMethod === 'dinheiro' ? 'bg-emerald-100 border-emerald-200 text-emerald-900' :
                        sale.paymentMethod === 'debito' ? 'bg-blue-100 border-blue-200 text-blue-900' :
                        sale.paymentMethod === 'credito' ? 'bg-amber-100 border-amber-200 text-amber-900' :
                        sale.paymentMethod === 'fiado' ? 'bg-red-100 border-red-200 text-red-900' :
                        'bg-purple-100 border-purple-200 text-purple-900'
                      )
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3">
                    {sale.status === 'pago' ? (
                      <span className={`flex items-center gap-1 font-bold text-[10px] ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        Conciliado
                      </span>
                    ) : sale.status === 'cancelado' ? (
                      <div className="flex flex-col">
                        <span className={`font-bold text-[10px] flex items-center gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          Cancelado
                        </span>
                        {sale.cancelReason && (
                          <span className="text-[8px] text-red-500 max-w-[120px] leading-tight truncate" title={sale.cancelReason}>
                            Motivo: {sale.cancelReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-500 font-semibold text-[10px] animate-pulse">Rascunho (Aberto)</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewSale(sale)}
                        title="Ver Cupom / Cupom Fiscal"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-[#18F2A4]' : 'hover:bg-gray-100 text-[#10B981]'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      {sale.status !== 'cancelado' && (
                        <button
                          onClick={() => handleOpenCancelModal(sale.id)}
                          title="Estornar / Cancelar Venda"
                          className={`p-1.5 rounded transition-colors ${
                            theme === 'dark' ? 'hover:bg-[#222] text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  Nenhuma transação correspondente encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancellation Reason Modal */}
      {cancelingSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border flex flex-col p-4 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-red-500/30 text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <h3 className="text-sm font-bold text-red-400 mb-2">Cancelar Lançamento Financeiro</h3>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              O cancelamento irá restaurar fisicamente o saldo dos produtos no estoque e remover a receita operacional do fluxo de caixa. Insira o motivo abaixo:
            </p>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Erro do operador no caixa ao selecionar PIX, pago em dinheiro..."
              className="w-full p-2 text-xs rounded border bg-[#111] border-[#222] text-white focus:outline-none focus:border-red-500 mb-3"
              style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancelingSaleId(null)}
                className={`px-3 py-1.5 rounded text-xs border ${
                  theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cupom / Receipt Print Preview Modal */}
      {previewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white text-black p-5 rounded-lg border shadow-2xl flex flex-col font-mono text-[11px] leading-tight select-none">
            
            {/* Header receipt info */}
            <div className="text-center flex flex-col gap-1 border-b border-dashed border-black pb-3">
              <span className="font-bold text-sm tracking-wide">ADEGA OS LTDA</span>
              <span>CNPJ: 12.345.678/0001-99</span>
              <span>Rua dos Boêmios, 100 - Centro</span>
              <span>Tel: (11) 98765-4321</span>
            </div>

            {/* Order status info */}
            <div className="py-2.5 border-b border-dashed border-black flex flex-col gap-0.5">
              <div className="flex justify-between font-bold">
                <span>CUPOM NÃO FISCAL</span>
                <span>Nº {previewSale.number}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>DATA: {new Date(previewSale.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>CANAL: {previewSale.type.toUpperCase()}</span>
                <span>ID: {previewSale.identifier}</span>
              </div>
              {previewSale.waiterName && (
                <div>ATENDENTE: {previewSale.waiterName}</div>
              )}
            </div>

            {/* Items list */}
            <div className="py-3 border-b border-dashed border-black flex flex-col gap-2">
              <div className="flex justify-between font-bold">
                <span>ITEM / DESCRIÇÃO</span>
                <div className="flex gap-4">
                  <span>QTD</span>
                  <span>TOTAL</span>
                </div>
              </div>
              {previewSale.items.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[140px]">{prod ? prod.name : 'Item'}</span>
                    <div className="flex gap-4">
                      <span>{item.quantity}x</span>
                      <span>R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations breakdown */}
            <div className="py-2.5 flex flex-col gap-0.5 font-bold border-b border-dashed border-black">
              <div className="flex justify-between font-normal">
                <span>SUBTOTAL:</span>
                <span>R$ {previewSale.subtotal.toFixed(2)}</span>
              </div>
              {previewSale.discount > 0 && (
                <div className="flex justify-between text-red-600 font-normal">
                  <span>DESCONTO:</span>
                  <span>- R$ {previewSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1">
                <span>TOTAL GERAL:</span>
                <span>R$ {previewSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="py-2.5 text-center flex flex-col gap-1 border-b border-dashed border-black uppercase font-bold text-[10px]">
              <span>Forma de Pagamento: {previewSale.paymentMethod}</span>
              <span className="text-xs">{previewSale.status === 'pago' ? '✓ PAGO / OPERAÇÃO INTEGRADA' : '❌ CANCELADA'}</span>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-gray-600 flex flex-col gap-1 text-[9px]">
              <span>Obrigado pela preferência!</span>
              <span>AdegaOS - Operação sem Gargalos</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="mt-3 w-full bg-black text-white py-1.5 rounded text-[10px] font-semibold font-sans flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Via Térmica
              </button>
              <button
                onClick={() => setPreviewSale(null)}
                className="mt-1 w-full border border-gray-300 text-gray-700 py-1 rounded text-[9px] font-sans hover:bg-gray-50 transition-colors"
              >
                Fechar Visualização
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
