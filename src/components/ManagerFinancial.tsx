import React, { useState, useMemo } from 'react';
import { Landmark, TrendingUp, TrendingDown, CheckSquare, Calendar, Plus, ChevronDown, Check, Percent } from 'lucide-react';
import { FinancialTransaction, Sale, Product } from '../types';

interface ManagerFinancialProps {
  financialTransactions: FinancialTransaction[];
  sales: Sale[];
  products: Product[];
  onConfirmPayment: (txId: string) => void;
  onAddTransaction: (tx: FinancialTransaction) => void;
  theme: 'dark' | 'light';
}

export default function ManagerFinancial({
  financialTransactions,
  sales,
  products,
  onConfirmPayment,
  onAddTransaction,
  theme
}: ManagerFinancialProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'dre'>('geral');
  const [showAddTxModal, setShowAddTxModal] = useState(false);

  // Form states for manual additions
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('Despesas Variáveis');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);

  // Math totals
  const financials = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;

    financialTransactions.forEach(tx => {
      if (tx.status === 'pago') {
        if (tx.type === 'receita') cashIn += tx.value;
        else cashOut += tx.value;
      }
    });

    const netBalance = cashIn - cashOut;

    return {
      cashIn,
      cashOut,
      netBalance
    };
  }, [financialTransactions]);

  // Dynamic DRE (Demonstrativo do Resultado do Exercício) Generator
  const dreData = useMemo(() => {
    // 1. Receita Bruta: Paid sales sum + non-sales revenue
    let faturamentoBruto = sales
      .filter(s => s.status === 'pago')
      .reduce((acc, s) => acc + s.total, 0);

    const otherRevenues = financialTransactions
      .filter(tx => tx.type === 'receita' && tx.status === 'pago' && tx.category !== 'Vendas')
      .reduce((acc, tx) => acc + tx.value, 0);

    faturamentoBruto += otherRevenues;

    // 2. Cost of Goods Sold (CMV)
    let totalCmv = 0;
    sales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        s.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            totalCmv += prod.costPrice * item.quantity;
          } else {
            totalCmv += item.unitPrice * 0.5 * item.quantity; // fallback
          }
        });
      });

    // 3. Contribution Margin (Margem Bruta)
    const margemContribuicao = faturamentoBruto - totalCmv;
    const margemPercent = faturamentoBruto > 0 ? (margemContribuicao / faturamentoBruto) * 100 : 0;

    // 4. Fixed Operational Expenses (Aluguel, Luz, Internet, etc.)
    const despesasFixas = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && ['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
      .reduce((acc, tx) => acc + tx.value, 0);

    // 5. Variable / Other Operational Expenses
    const despesasVariaveis = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && !['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
      .reduce((acc, tx) => acc + tx.value, 0);

    const totalDespesas = despesasFixas + despesasVariaveis;

    // 6. Lucro Líquido Operacional
    const lucroLiquido = margemContribuicao - totalDespesas;
    const rentabilidade = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;

    return {
      faturamentoBruto,
      otherRevenues,
      totalCmv,
      margemContribuicao,
      margemPercent,
      despesasFixas,
      despesasVariaveis,
      totalDespesas,
      lucroLiquido,
      rentabilidade
    };
  }, [sales, products, financialTransactions]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0) {
      alert('Preencha a descrição e um valor de transação válido.');
      return;
    }

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      value: Number(value),
      status: 'pago'
    };

    onAddTransaction(newTx);
    setShowAddTxModal(false);
    setDescription('');
    setValue(0);
    alert('Transação financeira adicionada com sucesso!');
  };

  const handleConfirmPay = (txId: string) => {
    onConfirmPayment(txId);
    alert('Pagamento de duplicata efetuado. Saldo do fluxo de caixa atualizado.');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tab Switcher and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Setor Financeiro</h2>
          <p className="text-xs text-gray-400">Fluxo de caixa diário, liquidações de duplicatas a pagar/receber e DRE Gerencial.</p>
        </div>

        {/* Inner Tab Selector */}
        <div className={`flex rounded-lg p-1 border ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-100 border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('geral')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'geral'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-[#10B981] shadow-sm')
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Fluxo de Caixa / Duplicatas
          </button>
          <button
            onClick={() => setActiveTab('dre')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'dre'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-[#10B981] shadow-sm')
                : 'text-gray-400 hover:text-white'
            }`}
          >
            DRE Gerencial Real
          </button>
        </div>
      </div>

      {activeTab === 'geral' ? (
        <div className="flex flex-col gap-6">
          {/* Quick Balance Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash In */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Receitas Liquidadas</span>
              <span className="text-xl font-bold font-mono text-emerald-500">R$ {financials.cashIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Vendas e outras receitas recebidas
              </span>
            </div>

            {/* Cash Out */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Despesas Pagas</span>
              <span className="text-xl font-bold font-mono text-red-500">R$ {financials.cashOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                Fornecedores e custos operacionais liquidados
              </span>
            </div>

            {/* Net Drawer Balance */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Saldo Líquido em Caixa</span>
              <span className={`text-xl font-bold font-mono ${financials.netBalance >= 0 ? (theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600') : 'text-red-500'}`}>
                R$ {financials.netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-sky-400" />
                Disponibilidade imediata (conciliado)
              </span>
            </div>
          </div>

          {/* Table: Accounts payables / receivables & launch custom expense */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Financial Ledger (70% column) */}
            <div className={`p-4 rounded-xl border lg:col-span-2 flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Livro-Razão Operacional</span>
                
                <button
                  onClick={() => setShowAddTxModal(true)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-[#1A1A1A] hover:bg-[#222]' : 'bg-gray-100 border hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lançar Despesa / Receita
                </button>
              </div>

              {/* Transactions list */}
              <div className="overflow-x-auto overflow-y-auto max-h-96 w-full">
                <table className="min-w-[550px] w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className={`border-b uppercase font-bold tracking-wider pb-1.5 text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Descrição / Categoria</th>
                      <th className="pb-2 text-right">Valor</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialTransactions.map(tx => (
                      <tr key={tx.id} className={`border-b ${
                        theme === 'dark' ? 'border-[#1A1A1A] hover:bg-[#151515]' : 'border-gray-50 hover:bg-gray-100'
                      }`}>
                        <td className="py-3 px-1 font-mono text-gray-400 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-1">
                          <div className="flex flex-col">
                            <span className="font-semibold" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{tx.description}</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">{tx.category}</span>
                          </div>
                        </td>
                        <td className={`py-3 px-1 font-mono text-right font-bold whitespace-nowrap ${
                          tx.type === 'receita' 
                            ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                            : 'text-red-500'
                        }`}>
                          {tx.type === 'receita' ? '+' : '-'} R$ {tx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-1 text-center whitespace-nowrap">
                          {tx.status === 'pago' ? (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                              theme === 'dark'
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            }`}>
                              LIQUIDADO
                            </span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                                theme === 'dark'
                                  ? 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                                  : 'bg-amber-100 text-amber-900 border-amber-200'
                              }`}>
                                PENDENTE
                              </span>
                              {tx.dueDate && (
                                <span className={`text-[8px] font-mono font-bold mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Venc: {tx.dueDate}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-1 text-right whitespace-nowrap">
                          {tx.status === 'pendente' && tx.type === 'despesa' && (
                            <button
                              onClick={() => handleConfirmPay(tx.id)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                                theme === 'dark' ? 'bg-[#18F2A4]/10 hover:bg-[#18F2A4]/20 text-[#18F2A4]' : 'bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981]'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick cash conciliation info */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-gray-300' : 'bg-white border-gray-200 text-[#111111]'
            }`}>
              <div>
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Fechamento Rápido de Turno</span>
                <p className="text-[11px] text-gray-500 mt-1 mb-4 leading-relaxed">
                  Para auditar o caixa do bar ou operador, o faturamento físico em espécie deve bater rigorosamente com as contagens das maquininhas externas.
                </p>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600 font-medium'}>Espécie (Gaveta):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>R$ 450,00</span>
                  </div>
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Maquininha Stone (Cartões):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                      R$ {(sales.filter(s => s.status === 'pago' && ['debito', 'credito'].includes(s.paymentMethod)).reduce((acc, s) => acc + s.total, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Chave PIX (Banco):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                      R$ {(sales.filter(s => s.status === 'pago' && s.paymentMethod === 'pix').reduce((acc, s) => acc + s.total, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-gray-500 leading-normal border-t border-[#1C1C1C] pt-3 mt-4">
                ⚠️ As tarifas financeiras estimadas para este terminal estão fixadas em 1.25% para Débito e 2.99% para Crédito à Vista.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DRE (Demonstrativo do Resultado do Exercício) Gerencial Screen */
        <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="border-b border-[#1C1C1C] pb-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <span className="text-xs uppercase font-bold text-[#18F2A4] tracking-wider">Demonstrativo do Resultado do Exercício (DRE)</span>
            <p className="text-[11px] text-gray-400">Visão gerencial de competência operacional baseada em vendas e despesas reais de caixa.</p>
          </div>

          <div className="flex flex-col gap-3 text-xs max-w-2xl">
            {/* 1. Receita Bruta */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold text-gray-200 uppercase tracking-wider" style={{ color: theme === 'dark' ? 'white' : '#111' }}>(=) RECEITA OPERACIONAL BRUTA</span>
              <span className="font-mono font-bold text-sm whitespace-nowrap">R$ {dreData.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pl-4 text-gray-400">
              <span>(+) Faturamento de Vendas</span>
              <span className="font-mono whitespace-nowrap">R$ {(dreData.faturamentoBruto - dreData.otherRevenues).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {dreData.otherRevenues > 0 && (
              <div className="flex justify-between items-center pl-4 text-gray-400">
                <span>(+) Outras Receitas</span>
                <span className="font-mono whitespace-nowrap">R$ {dreData.otherRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* 2. Deduções / CMV */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#1C1C1C] text-red-400" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold uppercase tracking-wider">(-) CUSTO DE MERCADORIA VENDIDA (CMV)</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {dreData.totalCmv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 3. Margem de Contribuição */}
            <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? '#18F2A4' : '#15803d' }}>(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <div className="flex gap-4 font-mono font-bold items-center">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${theme === 'dark' ? 'bg-[#18F2A4]/15 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>{dreData.margemPercent.toFixed(1)}%</span>
                <span className="whitespace-nowrap font-black" style={{ color: theme === 'dark' ? '#18F2A4' : '#15803d' }}>R$ {dreData.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 4. Despesas Fixas */}
            <div className={`flex justify-between items-center py-2.5 border-b ${theme === 'dark' ? 'border-[#1C1C1C] text-red-400' : 'border-gray-200 text-red-600 font-medium'}`}>
              <span className="font-semibold uppercase tracking-wider">(-) DESPESAS FIXAS OPERACIONAIS</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {dreData.despesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 5. Despesas Variáveis */}
            <div className={`flex justify-between items-center py-2.5 border-b ${theme === 'dark' ? 'border-[#1C1C1C] text-red-400' : 'border-gray-200 text-red-600 font-medium'}`}>
              <span className="font-semibold uppercase tracking-wider">(-) DESPESAS VARIÁVEIS / TAXAS</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {dreData.despesasVariaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 6. Lucro Líquido */}
            <div className={`flex justify-between items-center py-3 border-y-2 border-dashed mt-4 text-sm font-bold ${
              dreData.lucroLiquido >= 0 
                ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700' 
                : theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <span className="uppercase tracking-wider">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <div className="flex gap-4 font-mono font-black items-center">
                <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-extrabold border ${
                  dreData.lucroLiquido >= 0 
                    ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                    : theme === 'dark' ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-100 text-red-900 border-red-200'
                }`}>
                  Rentab: {dreData.rentabilidade.toFixed(1)}%
                </span>
                <span className="whitespace-nowrap text-base">R$ {dreData.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Custom Transaction modal overlay */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border flex flex-col p-4 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <h3 className="text-sm font-bold mb-3">Lançamento Financeiro Manual</h3>
            
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex gap-4 p-1 rounded bg-black/30 mb-2">
                <button
                  type="button"
                  onClick={() => { setType('despesa'); setCategory('Despesas Variáveis'); }}
                  className={`flex-1 py-1 text-center rounded font-semibold ${type === 'despesa' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('receita'); setCategory('Outros'); }}
                  className={`flex-1 py-1 text-center rounded font-semibold ${type === 'receita' ? (theme === 'dark' ? 'bg-[#18F2A4] text-black' : 'bg-[#10B981] text-white') : 'text-gray-400'}`}
                >
                  Receita (Entrada)
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                >
                  {type === 'despesa' ? (
                    <>
                      <option value="Serviços públicos (Luz/Água)">Serviços públicos (Luz/Água)</option>
                      <option value="Aluguel">Aluguel</option>
                      <option value="Salários">Salários</option>
                      <option value="Manutenção do bar">Manutenção do bar</option>
                      <option value="Despesas Variáveis">Despesas Variáveis</option>
                    </>
                  ) : (
                    <>
                      <option value="Vendas">Vendas</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Gelo extra para o turno"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={value || ''}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="p-2 rounded border focus:outline-none font-mono font-bold"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className={`px-3 py-1.5 rounded text-xs border ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
