import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, ShoppingCart, Percent, Clock, ChevronRight, BarChart3, LineChart, Sparkles } from 'lucide-react';
import { Product, Sale, FinancialTransaction } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ManagerDashboardProps {
  products: Product[];
  sales: Sale[];
  financialTransactions: FinancialTransaction[];
  theme: 'dark' | 'light';
  onGoToTab: (tab: string) => void;
}

export default function ManagerDashboard({
  products,
  sales,
  financialTransactions,
  theme,
  onGoToTab
}: ManagerDashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom'>('30d');
  const [activeChartTab, setActiveChartTab] = useState<'financeiro' | 'eficiencia'>('financeiro');
  
  // Custom date states (default to last 30 days)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate start/end date objects for current and previous period comparison
  const dateRanges = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let curStart = new Date();
    let curEnd = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (timeRange === 'today') {
      curStart = todayStart;
      curEnd = todayEnd;
      
      prevStart = new Date(todayStart);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(todayEnd);
      prevEnd.setDate(prevEnd.getDate() - 1);
    } else if (timeRange === '7d') {
      curStart = new Date(todayStart);
      curStart.setDate(curStart.getDate() - 6);
      curEnd = todayEnd;

      prevStart = new Date(curStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(curStart);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    } else if (timeRange === '30d') {
      curStart = new Date(todayStart);
      curStart.setDate(curStart.getDate() - 29);
      curEnd = todayEnd;

      prevStart = new Date(curStart);
      prevStart.setDate(prevStart.getDate() - 30);
      prevEnd = new Date(curStart);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    } else { // custom
      curStart = startDate ? new Date(startDate + 'T00:00:00') : new Date(todayStart);
      curEnd = endDate ? new Date(endDate + 'T23:59:59') : new Date(todayEnd);

      const diffMs = curEnd.getTime() - curStart.getTime();
      prevStart = new Date(curStart.getTime() - diffMs - 1000);
      prevEnd = new Date(curStart.getTime() - 1000);
    }

    return { curStart, curEnd, prevStart, prevEnd };
  }, [timeRange, startDate, endDate]);

  // Filter sales based on current period range
  const filteredSales = useMemo(() => {
    const { curStart, curEnd } = dateRanges;
    return sales.filter(s => {
      if (s.status !== 'pago') return false;
      const saleDate = new Date(s.timestamp);
      return saleDate >= curStart && saleDate <= curEnd;
    });
  }, [sales, dateRanges]);

  // Filter sales based on previous period range (for comparison)
  const previousSales = useMemo(() => {
    const { prevStart, prevEnd } = dateRanges;
    return sales.filter(s => {
      if (s.status !== 'pago') return false;
      const saleDate = new Date(s.timestamp);
      return saleDate >= prevStart && saleDate <= prevEnd;
    });
  }, [sales, dateRanges]);

  // Compute stats dynamically for current period
  const stats = useMemo(() => {
    let revenue = 0;
    let cost = 0;

    filteredSales.forEach(s => {
      revenue += s.total;
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          cost += prod.costPrice * item.quantity;
        } else {
          cost += item.unitPrice * 0.5 * item.quantity;
        }
      });
    });

    // Proportional or direct expenses
    const totalExpenses = financialTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .filter(t => {
        const txDate = new Date(t.date + 'T12:00:00');
        return txDate >= dateRanges.curStart && txDate <= dateRanges.curEnd;
      })
      .reduce((acc, t) => acc + t.value, 0);

    // Fallback/proportional expenses if none are registered in this micro-range
    const finalExpenses = totalExpenses > 0 ? totalExpenses : financialTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => {
        if (timeRange === 'today') return acc + (t.value / 30);
        if (timeRange === '7d') return acc + (t.value / 4);
        if (timeRange === '30d') return acc + t.value;
        // custom duration multiplier
        const durationDays = Math.ceil((dateRanges.curEnd.getTime() - dateRanges.curStart.getTime()) / (1000 * 60 * 60 * 24));
        return acc + (t.value * (durationDays / 30));
      }, 0);

    const grossProfit = revenue - cost;
    const netProfit = grossProfit - finalExpenses;
    const cmv = revenue > 0 ? (cost / revenue) * 100 : 0;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Accounts Payables / Receivables
    const accountsPayable = financialTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pendente')
      .reduce((acc, t) => acc + t.value, 0);

    const accountsReceivable = financialTransactions
      .filter(t => t.type === 'receita' && t.status === 'pendente')
      .reduce((acc, t) => acc + t.value, 0);

    // Critical stock
    const criticalProducts = products.filter(p => {
      const totalUnits = (p.stockBoxes * p.boxQuantity) + p.stockUnits;
      return totalUnits <= p.minStockUnits;
    });

    return {
      revenue,
      cost,
      grossProfit,
      netProfit: isNaN(netProfit) ? 0 : netProfit,
      cmv,
      margin,
      accountsPayable,
      accountsReceivable,
      criticalCount: criticalProducts.length,
      criticalProducts: criticalProducts.slice(0, 4)
    };
  }, [filteredSales, products, financialTransactions, timeRange, dateRanges]);

  // Compute stats dynamically for previous period
  const prevStats = useMemo(() => {
    let revenue = 0;
    let cost = 0;

    previousSales.forEach(s => {
      revenue += s.total;
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          cost += prod.costPrice * item.quantity;
        } else {
          cost += item.unitPrice * 0.5 * item.quantity;
        }
      });
    });

    const totalExpenses = financialTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .filter(t => {
        const txDate = new Date(t.date + 'T12:00:00');
        return txDate >= dateRanges.prevStart && txDate <= dateRanges.prevEnd;
      })
      .reduce((acc, t) => acc + t.value, 0);

    const finalExpenses = totalExpenses > 0 ? totalExpenses : financialTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => {
        if (timeRange === 'today') return acc + (t.value / 30);
        if (timeRange === '7d') return acc + (t.value / 4);
        if (timeRange === '30d') return acc + t.value;
        const durationDays = Math.ceil((dateRanges.prevEnd.getTime() - dateRanges.prevStart.getTime()) / (1000 * 60 * 60 * 24));
        return acc + (t.value * (durationDays / 30));
      }, 0);

    const grossProfit = revenue - cost;
    const netProfit = grossProfit - finalExpenses;
    const cmv = revenue > 0 ? (cost / revenue) * 100 : 0;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      netProfit,
      cmv,
      margin
    };
  }, [previousSales, products, financialTransactions, timeRange, dateRanges]);

  // Vendas por forma de pagamento percentage computation
  const paymentMethodStats = useMemo(() => {
    const methods: Record<string, number> = { pix: 0, dinheiro: 0, debito: 0, credito: 0, fiado: 0 };
    filteredSales.forEach(s => {
      if (methods[s.paymentMethod] !== undefined) {
        methods[s.paymentMethod] += s.total;
      } else {
        methods.pix += s.total;
      }
    });
    const totalPay = Object.values(methods).reduce((a, b) => a + b, 0);
    return Object.entries(methods).map(([key, val]) => ({
      name: key === 'debito' ? 'Débito' : key === 'credito' ? 'Crédito' : key === 'fiado' ? 'Fiado (À Prazo)' : key.toUpperCase(),
      value: val,
      percentage: totalPay > 0 ? (val / totalPay) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Top products
  const topProducts = useMemo(() => {
    const productSalesMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + item.quantity;
      });
    });

    return Object.entries(productSalesMap).map(([id, qty]) => {
      const prod = products.find(p => p.id === id);
      return {
        name: prod ? prod.name : 'Produto Removido',
        category: prod ? prod.category : 'N/A',
        quantity: qty,
        revenue: qty * (prod ? prod.sellPrice : 0)
      };
    }).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [filteredSales, products]);

  // Busy hours calculation
  const busyHours = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredSales.forEach(s => {
      const hour = new Date(s.timestamp).getHours();
      hours[hour]++;
    });
    // Find max value to scale
    const maxVal = Math.max(...hours, 1);
    return hours.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count,
      percent: (count / maxVal) * 100
    })).filter(h => h.count > 0 || [18, 19, 20, 21, 22, 23].includes(parseInt(h.hour)));
  }, [filteredSales]);

  // Dynamic Trend Chart data generator affected by selected date period
  const chartPoints = useMemo(() => {
    const { curStart, curEnd } = dateRanges;
    const dataPoints: { 
      date: string; 
      "Receita Bruta (R$)": number; 
      "Custo (R$)": number; 
      "CMV (%)": number; 
      "Margem (%)": number;
    }[] = [];

    const isToday = timeRange === 'today';
    
    if (isToday) {
      // Group by hours for today in 2-hour blocks
      for (let hour = 8; hour <= 23; hour += 2) {
        let blockRevenue = 0;
        let blockCost = 0;
        
        sales.forEach(s => {
          if (s.status !== 'pago') return;
          const saleDate = new Date(s.timestamp);
          if (saleDate.toDateString() === curStart.toDateString()) {
            const h = saleDate.getHours();
            if (h >= hour && h < hour + 2) {
              blockRevenue += s.total;
              s.items.forEach(item => {
                const prod = products.find(p => p.id === item.productId);
                if (prod) blockCost += prod.costPrice * item.quantity;
              });
            }
          }
        });

        const label = `${String(hour).padStart(2, '0')}h-${String(hour + 2).padStart(2, '0')}h`;
        const marginVal = blockRevenue > 0 ? ((blockRevenue - blockCost) / blockRevenue) * 100 : 0;
        const cmvVal = blockRevenue > 0 ? (blockCost / blockRevenue) * 100 : 0;

        dataPoints.push({
          date: label,
          "Receita Bruta (R$)": blockRevenue,
          "Custo (R$)": blockCost,
          "CMV (%)": parseFloat(cmvVal.toFixed(1)),
          "Margem (%)": parseFloat(marginVal.toFixed(1))
        });
      }
    } else {
      // Group by days within selected period
      const startDay = new Date(curStart);
      const endDay = new Date(curEnd);
      
      const loopDate = new Date(startDay);
      // Safeguard for long custom ranges
      let count = 0;
      while (loopDate <= endDay && count < 366) {
        count++;
        const loopDateStr = loopDate.toDateString();
        let dayRevenue = 0;
        let dayCost = 0;

        sales.forEach(s => {
          if (s.status !== 'pago') return;
          const saleDate = new Date(s.timestamp);
          if (saleDate.toDateString() === loopDateStr) {
            dayRevenue += s.total;
            s.items.forEach(item => {
              const prod = products.find(p => p.id === item.productId);
              if (prod) dayCost += prod.costPrice * item.quantity;
            });
          }
        });

        const label = loopDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        const marginVal = dayRevenue > 0 ? ((dayRevenue - dayCost) / dayRevenue) * 100 : 0;
        const cmvVal = dayRevenue > 0 ? (dayCost / dayRevenue) * 100 : 0;

        dataPoints.push({ 
          date: label, 
          "Receita Bruta (R$)": dayRevenue, 
          "Custo (R$)": dayCost,
          "CMV (%)": parseFloat(cmvVal.toFixed(1)),
          "Margem (%)": parseFloat(marginVal.toFixed(1))
        });

        loopDate.setDate(loopDate.getDate() + 1);
      }
    }

    const maxVal = Math.max(...dataPoints.map(p => p["Receita Bruta (R$)"]), 2000);

    return {
      points: dataPoints,
      maxVal
    };
  }, [sales, products, dateRanges, timeRange]);

  const primaryColor = theme === 'dark' ? '#18F2A4' : '#10B981';
  const secondaryColor = '#888888';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Painel Executivo</h2>
          <p className="text-xs text-gray-400">Dados consolidados de faturamento, custos e lucratividade operacional.</p>
        </div>

        {/* Time filters */}
        <div className="flex flex-wrap items-center gap-2">
          {timeRange === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`px-2 py-1 rounded border focus:outline-none font-mono ${
                  theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-black'
                }`}
              />
              <span className="text-gray-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`px-2 py-1 rounded border focus:outline-none font-mono ${
                  theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-black'
                }`}
              />
            </div>
          )}

          <div className={`flex rounded-lg p-1 border ${
            theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-100 border-gray-200'
          }`}>
            {(['today', '7d', '30d', 'custom'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  timeRange === range
                    ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4] border-b-2 border-[#18F2A4]' : 'bg-white text-[#10B981] shadow-sm')
                    : 'text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                {range === 'today' ? 'Hoje' : range === '7d' ? '7d' : range === '30d' ? '30d' : 'Período'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Receita Bruta</span>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {(() => {
              const change = prevStats.revenue === 0 ? (stats.revenue > 0 ? 100 : 0) : ((stats.revenue - prevStats.revenue) / prevStats.revenue) * 100;
              return change >= 0 ? (
                <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{change.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {change.toFixed(1)}%
                </span>
              );
            })()}
            <span className="text-gray-400">vs. período anterior</span>
          </div>
        </div>

        {/* Profit */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Lucro Líquido Est.</span>
            <TrendingUp className="w-4 h-4 text-[#18F2A4]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${stats.netProfit >= 0 ? (theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600') : 'text-red-500'}`}>
              R$ {stats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {(() => {
              const change = prevStats.netProfit === 0 ? (stats.netProfit > 0 ? 100 : 0) : ((stats.netProfit - prevStats.netProfit) / Math.abs(prevStats.netProfit)) * 100;
              return change >= 0 ? (
                <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{change.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {change.toFixed(1)}%
                </span>
              );
            })()}
            <span className="text-gray-400">vs. período anterior</span>
          </div>
        </div>

        {/* CMV % */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">CMV Gerencial</span>
            <Percent className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono">{stats.cmv.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {(() => {
              const diff = stats.cmv - prevStats.cmv;
              return diff <= 0 ? (
                <span className="text-emerald-500 font-bold">
                  {diff.toFixed(1)}% variação
                </span>
              ) : (
                <span className="text-orange-500 font-bold">
                  +{diff.toFixed(1)}% variação
                </span>
              );
            })()}
            <span className="text-gray-400">vs. período anterior</span>
          </div>
        </div>

        {/* Critical Stock */}
        <button
          onClick={() => onGoToTab('estoque')}
          className={`p-4 rounded-xl border flex flex-col gap-1 text-left relative overflow-hidden transition-colors cursor-pointer group ${
            theme === 'dark' 
              ? 'bg-[#111111] border-[#1A1A1A] hover:bg-[#151515]' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Estoque Crítico</span>
            <AlertTriangle className={`w-4 h-4 ${stats.criticalCount > 0 ? 'text-amber-500 animate-pulse' : 'text-gray-500'}`} />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${stats.criticalCount > 0 ? 'text-amber-500' : ''}`}>
              {stats.criticalCount} <span className="text-xs font-normal text-gray-400">itens</span>
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 group-hover:text-white transition-colors">
            <span>Ver itens sob limite mínimo</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </button>
      </div>

      {/* Auxiliary Mini Row for bills and drawer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-3 rounded-lg border flex justify-between items-center text-xs ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-400">Caixa Aberto Operacional:</span>
          </div>
          <span className="font-bold font-mono text-[#18F2A4]">R$ 450,00</span>
        </div>

        <div className={`p-3 rounded-lg border flex justify-between items-center text-xs ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Contas a Receber:</span>
          </div>
          <span className="font-bold font-mono text-emerald-500">R$ {stats.accountsReceivable.toLocaleString('pt-BR')}</span>
        </div>

        <div className={`p-3 rounded-lg border flex justify-between items-center text-xs ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Contas a Pagar (Pendentes):</span>
          </div>
          <span className="font-bold font-mono text-red-500">R$ {stats.accountsPayable.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Main Grid: Charts & Top-Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Receita x CMV x Margem) using Recharts */}
        <div className={`p-5 rounded-xl border lg:col-span-2 flex flex-col justify-between ${
          theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C]' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#18F2A4]" />
                Faturamento
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">Visão analítica operacional no período selecionado.</p>
            </div>

            {/* Sub-tab switcher */}
            <div className={`flex rounded-lg p-0.5 border text-[11px] ${
              theme === 'dark' ? 'bg-[#050505] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
            }`}>
              <button
                onClick={() => setActiveChartTab('financeiro')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeChartTab === 'financeiro'
                    ? theme === 'dark' 
                      ? 'bg-[#111111] text-[#18F2A4]' 
                      : 'bg-white text-[#10B981] shadow-xs'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Faturamento x Custo
              </button>
              <button
                onClick={() => setActiveChartTab('eficiencia')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeChartTab === 'eficiencia'
                    ? theme === 'dark' 
                      ? 'bg-[#111111] text-[#18F2A4]' 
                      : 'bg-white text-[#10B981] shadow-xs'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <LineChart className="w-3 h-3" />
                CMV x Margem (%)
              </button>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="relative w-full h-56 mt-4">
            {chartPoints.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'financeiro' ? (
                  <AreaChart
                    data={chartPoints.points}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={theme === 'dark' ? 0.35 : 0.25}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={theme === 'dark' ? 0.2 : 0.15}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={theme === 'dark' ? '#161616' : '#F1F1F1'}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 10 }}
                      dx={-5}
                      tickFormatter={(val) => `R$${val >= 1000 ? (val / 1000) + 'k' : val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        active && payload && payload.length ? (
                          <div className={`p-2.5 rounded-lg border text-xs shadow-xl font-sans ${
                            theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] text-white' : 'bg-white border-gray-200 text-gray-900'
                          }`}>
                            <p className="font-bold mb-1.5 text-gray-400">{label}</p>
                            {payload.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center gap-6 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  {item.name}:
                                </span>
                                <span className="font-mono font-bold" style={{ color: item.color }}>
                                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="Receita Bruta (R$)"
                      stroke={primaryColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Receita Bruta"
                    />
                    <Area
                      type="monotone"
                      dataKey="Custo (R$)"
                      stroke="#F97316"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorCost)"
                      name="Custo Mercadoria"
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={chartPoints.points}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={theme === 'dark' ? '#161616' : '#F1F1F1'}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888888', fontSize: 10 }}
                      dx={-5}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        active && payload && payload.length ? (
                          <div className={`p-2.5 rounded-lg border text-xs shadow-xl font-sans ${
                            theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] text-white' : 'bg-white border-gray-200 text-gray-900'
                          }`}>
                            <p className="font-bold mb-1.5 text-gray-400">{label}</p>
                            {payload.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center gap-6 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  {item.name}:
                                </span>
                                <span className="font-mono font-bold" style={{ color: item.color }}>
                                  {item.value}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      )}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: 10, fontWeight: 500 }}
                    />
                    <Bar
                      dataKey="Margem (%)"
                      fill={theme === 'dark' ? '#18F2A4' : '#10B981'}
                      radius={[4, 4, 0, 0]}
                      name="Margem Operacional (%)"
                      maxBarSize={30}
                    />
                    <Bar
                      dataKey="CMV (%)"
                      fill="#F97316"
                      radius={[4, 4, 0, 0]}
                      name="CMV (%)"
                      maxBarSize={30}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs py-10">
                Dados insuficientes para renderizar gráficos.
              </div>
            )}
          </div>

          <div className="flex gap-4 items-center justify-end text-[10px] font-mono mt-3 pt-2.5 border-t border-[#1F1F1F]/40">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#18F2A4]" style={{ backgroundColor: primaryColor }} />
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Faturamento Bruto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>CMV (Custo de Custo)</span>
            </div>
          </div>
        </div>

        {/* Vendas por Canal / Forma de pagamento */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Formas de Pagamento</span>
            <p className="text-[11px] text-gray-500 mb-4">Divisão percentual de recebíveis por transação.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-center">
            {paymentMethodStats.some(p => p.value > 0) ? (
              <>
                <div className="w-[110px] h-[110px] relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodStats.filter(p => p.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethodStats.filter(p => p.value > 0).map((entry, index) => {
                          const colors = {
                            'PIX': '#18F2A4',
                            'DINHEIRO': '#10B981',
                            'CRÉDITO': '#3B82F6',
                            'DÉBITO': '#8B5CF6',
                            'FIADO (À PRAZO)': '#EF4444'
                          };
                          const key = entry.name.toUpperCase();
                          const color = colors[key as keyof typeof colors] || '#6B7280';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className={`p-2 rounded border text-[10px] shadow-md font-sans ${
                                theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] text-white' : 'bg-white border-gray-200 text-gray-900'
                              }`}>
                                <p className="font-bold">{payload[0].name}</p>
                                <p className="font-mono">R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                    <span className="text-[8px] uppercase font-bold text-gray-400">Total</span>
                    <span className="text-[9px] font-bold font-mono">
                      R$ {paymentMethodStats.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Custom Color-Coded Legend Table */}
                <div className="flex-1 w-full flex flex-col gap-1.5 justify-center">
                  {paymentMethodStats.map(item => {
                    const colors = {
                      'PIX': '#18F2A4',
                      'DINHEIRO': '#10B981',
                      'CRÉDITO': '#3B82F6',
                      'DÉBITO': '#8B5CF6',
                      'FIADO (À PRAZO)': '#EF4444'
                    };
                    const color = colors[item.name.toUpperCase() as keyof typeof colors] || '#6B7280';
                    return (
                      <div key={item.name} className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium text-gray-400 truncate">{item.name}</span>
                        </div>
                        <div className="font-mono text-right font-semibold ml-2 flex-shrink-0 flex items-center gap-1">
                          <span style={{ color: theme === 'dark' ? 'white' : '#111' }}>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-gray-500">({item.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 flex-1">Nenhum recebimento registrado.</div>
            )}
          </div>

          <div className={`p-2 rounded-lg border text-[9px] mt-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            🚨 <span className="font-semibold">Conciliação:</span> Valores excluem as taxas padrão das maquininhas (débito: ~1.2%, crédito: ~2.8%).
          </div>
        </div>
      </div>

      {/* Second Row: Critical Items list & Last Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Sold Products */}
        <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Produtos Mais Vendidos</span>
            <p className="text-[11px] text-gray-500">Top 5 itens mais retirados no período de filtragem.</p>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {topProducts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topProducts.map((prod, idx) => {
                  const maxQty = Math.max(...topProducts.map(p => p.quantity), 1);
                  const percentage = (prod.quantity / maxQty) * 100;
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                            idx === 0 ? 'bg-amber-500/15 text-amber-500' :
                            idx === 1 ? 'bg-slate-300/15 text-slate-300' :
                            idx === 2 ? 'bg-amber-700/15 text-amber-700' :
                            theme === 'dark' ? 'bg-[#1C1C1C] text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold block truncate text-[11px]" style={{ color: theme === 'dark' ? '#E5E7EB' : '#1F2937' }}>
                              {prod.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px] shrink-0 ml-2">
                          <span className="font-bold" style={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}>{prod.quantity} un</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#161616]' : 'bg-gray-100'}`}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: theme === 'dark' ? '#18F2A4' : '#10B981'
                            }}
                          />
                        </div>
                        <span className="text-[8px] text-gray-500 font-mono w-14 text-right shrink-0">
                          R$ {prod.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">Nenhum produto vendido no período.</div>
            )}
          </div>
        </div>

        {/* Peak Hours Heatmap */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Picos de Atendimento</span>
            <p className="text-[11px] text-gray-500 mb-3">Fluxo de lançamentos de pedidos ao longo do dia.</p>
          </div>

          <div className="h-[120px] w-full">
            {(() => {
              const hoursMap = Array(24).fill(0).map((_, i) => ({
                hour: `${String(i).padStart(2, '0')}h`,
                "Pedidos": 0
              }));
              
              filteredSales.forEach(s => {
                const hour = new Date(s.timestamp).getHours();
                hoursMap[hour]["Pedidos"]++;
              });

              const activeHours = hoursMap.filter((h, index) => {
                return h["Pedidos"] > 0 || (index >= 11 && index <= 23);
              });

              if (activeHours.some(h => h["Pedidos"] > 0)) {
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeHours}
                      margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme === 'dark' ? '#161616' : '#F1F1F1'}
                      />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888888', fontSize: 9 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888888', fontSize: 9 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className={`p-2 rounded border text-[10px] shadow-md font-sans ${
                                theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] text-white' : 'bg-white border-gray-200 text-gray-900'
                              }`}>
                                <p className="font-bold">{payload[0].payload.hour}</p>
                                <p className="text-[#18F2A4]">Pedidos: <span className="font-bold">{payload[0].value}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Pedidos"
                        stroke={primaryColor}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorPedidos)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              } else {
                return <div className="text-center py-8 text-xs text-gray-500">Sem atividade registrada.</div>;
              }
            })()}
          </div>

          <div className="text-[9px] text-gray-400 leading-normal border-t border-[#1C1C1C] pt-2 mt-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            💡 <span className="font-semibold text-gray-200" style={{ color: theme === 'dark' ? 'white' : '#222' }}>Recomendação:</span> Otimizar escala de garçons no turno de maior fluxo para garantir agilidade operacional.
          </div>
        </div>

        {/* Stock Reposition Alerts */}
        <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div>
            <span className={`text-xs uppercase tracking-wider ${
              theme === 'dark' ? 'text-red-400 font-bold' : 'text-red-700 font-extrabold'
            }`}>Alertas de Reposição</span>
            <p className="text-[11px] text-gray-500">Itens abaixo do estoque mínimo operacional.</p>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {stats.criticalProducts.map(prod => {
              const currentStock = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
              return (
                <div key={prod.id} className={`flex justify-between items-center p-2.5 rounded-lg border text-xs ${
                  theme === 'dark' 
                    ? 'bg-red-950/10 border-red-500/20' 
                    : 'bg-red-50 border-red-200 shadow-sm'
                }`}>
                  <div className="min-w-0 pr-2">
                    <span className={`font-bold line-clamp-1 text-[11px] ${
                      theme === 'dark' ? 'text-red-200' : 'text-red-950'
                    }`}>{prod.name}</span>
                    <span className={`text-[9px] font-bold block mt-0.5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-red-800'
                    }`}>Min: {prod.minStockUnits} un / Atual: {currentStock} un</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      theme === 'dark' ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-red-700 text-white'
                    }`}>CRÍTICO</span>
                  </div>
                </div>
              );
            })}
            {stats.criticalCount === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 flex-1 flex flex-col justify-center items-center gap-2">
                <Package className="w-8 h-8 text-emerald-500" />
                <span className="text-emerald-400 font-medium">Estoque saudável!</span>
                <span className="text-[10px] text-gray-500">Nenhum produto abaixo do mínimo operacional.</span>
              </div>
            )}
          </div>
          {stats.criticalCount > 4 && (
            <button onClick={() => onGoToTab('estoque')} className={`text-[10px] hover:underline font-bold text-right block ${
              theme === 'dark' ? 'text-red-400' : 'text-red-700'
            }`}>
              Ver mais {stats.criticalCount - 4} produtos...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
