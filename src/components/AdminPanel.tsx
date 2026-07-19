import React, { useState, useMemo } from 'react';
import { 
  Users, Landmark, Key, ShieldAlert, Plus, Trash2, CheckCircle2, 
  MapPin, Phone, DollarSign, Package, UserCheck, Settings, ArrowLeft, 
  TrendingUp, BarChart3, Edit, ToggleLeft, ToggleRight, Sparkles,
  Terminal, Lock, Activity, ShieldCheck, Database, AlertTriangle,
  Play, Pause, Clock, PieChart, HelpCircle, FileText, CheckCircle,
  HardDrive, Server, ShieldCheck as ShieldCheckIcon, Globe, Wifi, 
  Search, Sliders, MessageSquare, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { CashierUser } from '../types';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  usersList: CashierUser[];
  onAddUser: (user: CashierUser) => void;
  onDeleteUser: (userId: string) => void;
  onBackToLanding: () => void;
}

interface FluxClientStore {
  id: string;
  name: string;
  cnpj: string;
  ownerName: string;
  email: string;
  plan: 'Bronze' | 'Prata' | 'Gold' | 'Enterprise';
  status: 'active' | 'suspended';
  monthlyValue: number;
  usersCount: number;
  totalOrders: number;
  lastSync: string;
}

interface FluxSupportTicket {
  id: string;
  clientName: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

interface FluxInvoice {
  id: string;
  clientName: string;
  value: number;
  dueDate: string;
  status: 'pago' | 'pendente' | 'vencido';
}

export default function AdminPanel({ 
  theme, 
  usersList, 
  onAddUser, 
  onDeleteUser, 
  onBackToLanding 
}: AdminPanelProps) {
  
  // Security Authentication Gate
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const handleDevLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === 'dev123' || passwordInput.toLowerCase() === 'admin') {
      setIsAdminAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de segurança inválida para o FluxOS Dev Console!');
    }
  };

  // Tab State
  type ERP_TAB = 'overview' | 'clients' | 'financial' | 'servers' | 'tickets' | 'configs';
  const [activeTab, setActiveTab] = useState<ERP_TAB>('overview');

  // Client list state
  const [clients, setClients] = useState<FluxClientStore[]>([
    {
      id: 'store-1',
      name: 'Adega Central Premium',
      cnpj: '12.345.678/0001-99',
      ownerName: 'José Roberto de Souza',
      email: 'roberto@adegacentral.com.br',
      plan: 'Gold',
      status: 'active',
      monthlyValue: 149.00,
      usersCount: 8,
      totalOrders: 1420,
      lastSync: 'Há 2 min'
    },
    {
      id: 'store-2',
      name: 'Empório das Bebidas Jardins',
      cnpj: '98.765.432/0001-10',
      ownerName: 'Mariana Alencar',
      email: 'contato@emporiojardins.com',
      plan: 'Prata',
      status: 'active',
      monthlyValue: 99.00,
      usersCount: 4,
      totalOrders: 890,
      lastSync: 'Há 5 min'
    },
    {
      id: 'store-3',
      name: 'Distribuidora São Jorge Ltda',
      cnpj: '33.221.112/0001-88',
      ownerName: 'Jorge Ferreira Martins',
      email: 'saojorgedist@gmail.com',
      plan: 'Enterprise',
      status: 'active',
      monthlyValue: 299.00,
      usersCount: 15,
      totalOrders: 4120,
      lastSync: 'Há 1 min'
    },
    {
      id: 'store-4',
      name: 'Bar e Conveniência Vila Madalena',
      cnpj: '45.123.789/0002-11',
      ownerName: 'Ricardo Silveira',
      email: 'financeiro@vilaconveniência.com.br',
      plan: 'Bronze',
      status: 'suspended',
      monthlyValue: 49.00,
      usersCount: 2,
      totalOrders: 120,
      lastSync: 'Há 3 dias'
    }
  ]);

  // Support Tickets State
  const [tickets, setTickets] = useState<FluxSupportTicket[]>([
    {
      id: 'tkt-101',
      clientName: 'Adega Central Premium',
      subject: 'Dúvida na configuração da impressora térmica Bluetooth no Windows',
      priority: 'medium',
      status: 'open',
      createdAt: '19/07/2026 10:45'
    },
    {
      id: 'tkt-102',
      clientName: 'Distribuidora São Jorge Ltda',
      subject: 'Solicitação de aumento de limite de SKUs cadastrados',
      priority: 'high',
      status: 'in_progress',
      createdAt: '19/07/2026 09:12'
    },
    {
      id: 'tkt-103',
      clientName: 'Empório das Bebidas Jardins',
      subject: 'Problema ao exportar DRE financeiro para planilha Excel',
      priority: 'low',
      status: 'resolved',
      createdAt: '18/07/2026 16:30'
    }
  ]);

  // Invoices/Billing State
  const [invoices, setInvoices] = useState<FluxInvoice[]>([
    { id: 'inv-301', clientName: 'Distribuidora São Jorge Ltda', value: 299.00, dueDate: '25/07/2026', status: 'pendente' },
    { id: 'inv-302', clientName: 'Adega Central Premium', value: 149.00, dueDate: '15/07/2026', status: 'pago' },
    { id: 'inv-303', clientName: 'Empório das Bebidas Jardins', value: 99.00, dueDate: '10/07/2026', status: 'pago' },
    { id: 'inv-304', clientName: 'Bar e Conveniência Vila Madalena', value: 49.00, dueDate: '05/07/2026', status: 'vencido' }
  ]);

  // Client Modal States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState<string | null>(null);

  // Form fields
  const [clientForm, setClientForm] = useState({
    name: '',
    cnpj: '',
    ownerName: '',
    email: '',
    plan: 'Prata' as 'Bronze' | 'Prata' | 'Gold' | 'Enterprise',
    status: 'active' as 'active' | 'suspended',
    monthlyValue: 99.00,
    usersCount: 4
  });

  // KPI Calculations
  const platformMMR = useMemo(() => {
    return clients
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.monthlyValue, 0);
  }, [clients]);

  const activeClientsCount = useMemo(() => {
    return clients.filter(c => c.status === 'active').length;
  }, [clients]);

  const totalOrdersProcessed = useMemo(() => {
    return clients.reduce((sum, c) => sum + c.totalOrders, 0);
  }, [clients]);

  // Server health statuses
  const serverNodes = [
    { name: 'API Gateway Central', type: 'Load Balancer', status: 'operational', load: '18%', latency: '8ms', icon: Globe },
    { name: 'Core DB Cluster (Postgres)', type: 'Database Node', status: 'operational', load: '24%', latency: '3ms', icon: Database },
    { name: 'Redis Cache Memory', type: 'Cache Store', status: 'operational', load: '8%', latency: '1ms', icon: HardDrive },
    { name: 'WebSocket Realtime Node', type: 'S-Sync Gateway', status: 'operational', load: '14%', latency: '12ms', icon: Wifi },
    { name: 'Thermal Cloud Printer Spool', type: 'CUPS Service', status: 'operational', load: '4%', latency: '15ms', icon: Server }
  ];

  // Client actions
  const handleToggleClientStatus = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextStatus = c.status === 'active' ? 'suspended' : 'active';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleOpenAddClient = () => {
    setClientForm({
      name: '',
      cnpj: '',
      ownerName: '',
      email: '',
      plan: 'Prata',
      status: 'active',
      monthlyValue: 99.00,
      usersCount: 4
    });
    setIsEditingClient(null);
    setIsAddingClient(true);
  };

  const handleOpenEditClient = (client: FluxClientStore) => {
    setClientForm({
      name: client.name,
      cnpj: client.cnpj,
      ownerName: client.ownerName,
      email: client.email,
      plan: client.plan,
      status: client.status,
      monthlyValue: client.monthlyValue,
      usersCount: client.usersCount
    });
    setIsEditingClient(client.id);
    setIsAddingClient(true);
  };

  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingClient) {
      // Edit existing
      setClients(prev => prev.map(c => {
        if (c.id === isEditingClient) {
          return {
            ...c,
            ...clientForm
          };
        }
        return c;
      }));
    } else {
      // Create new
      const newClient: FluxClientStore = {
        id: `store-${Date.now()}`,
        name: clientForm.name,
        cnpj: clientForm.cnpj,
        ownerName: clientForm.ownerName,
        email: clientForm.email,
        plan: clientForm.plan,
        status: clientForm.status,
        monthlyValue: clientForm.monthlyValue,
        usersCount: clientForm.usersCount,
        totalOrders: 0,
        lastSync: 'Recém criado'
      };
      setClients(prev => [...prev, newClient]);
    }
    setIsAddingClient(false);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Tem certeza de que deseja remover permanentemente este cliente da rede FluxOS?')) {
      setClients(prev => prev.filter(c => c.id !== clientId));
    }
  };

  // Ticket actions
  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
  };

  const handleStartTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'in_progress' };
      }
      return t;
    }));
  };

  // Dev logs terminal entries
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM INIT] FluxOS core engine booted safely.',
    '[S-SYNC] Listening for remote POS handshakes on port 3000.',
    '[DB] Persistent storage connection: OK (latência 3ms).',
    '[WS] Gateway active. 142 persistent connections verified.',
    '[INFRA] Cache hit rate is currently 94.2%.'
  ]);

  const handleClearLogs = () => {
    setTerminalLogs(['[SYSTEM] Logs limpos pelo administrador.']);
  };

  // Unauthenticated screen
  if (!isAdminAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#000] text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl border text-center flex flex-col gap-6 transition-all ${
          theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Key className="w-6 h-6 text-[#18F2A4]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">FluxOS Dev Console</span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Painel de engenharia e controle operacional para administradores do sistema FluxOS.
            </p>
          </div>

          <form onSubmit={handleDevLoginSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chave de Segurança Administrador</label>
              <input 
                type="password"
                placeholder="Insira a senha do console..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none focus:border-[#18F2A4] transition-all font-mono ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
                autoFocus
              />
              {authError && <span className="text-[10px] text-red-500 font-bold block mt-1">✕ {authError}</span>}
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              <Lock className="w-4 h-4" /> Desbloquear Console
            </button>
          </form>

          <div className="border-t pt-4 border-dashed" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <button
              onClick={onBackToLanding}
              className="text-xs font-bold text-gray-500 hover:text-[#18F2A4] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex transition-all duration-300 ${
      theme === 'dark' ? 'bg-[#000] text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      
      {/* 1. Lateral Sidebar Navbar */}
      <aside className={`w-64 shrink-0 border-r flex flex-col justify-between font-sans ${
        theme === 'dark' ? 'bg-[#070707] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex flex-col">
          {/* Sidebar Header Brand */}
          <div className={`p-5 border-b flex items-center gap-2.5 ${
            theme === 'dark' ? 'border-[#161616]' : 'border-gray-200'
          }`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black shadow-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-gray-900 dark:text-white">Flux<span className="text-[#18F2A4]">OS</span> ERP</span>
              <span className="text-[9px] text-gray-500 block font-bold tracking-wider mt-0.5 uppercase">Administrador</span>
            </div>
          </div>

          {/* Nav Menu Items */}
          <nav className="p-3 flex flex-col gap-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'overview'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Activity className="w-4 h-4" /> Dashboard Geral
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'clients'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Users className="w-4 h-4" /> Lojas / Clientes
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'financial'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Tesouraria & Faturamento
            </button>

            <button
              onClick={() => setActiveTab('servers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'servers'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Server className="w-4 h-4" /> Status de Servidor
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'tickets'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chamados de Suporte
              <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">2</span>
            </button>

            <button
              onClick={() => setActiveTab('configs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === 'configs'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800')
                  : 'text-gray-500 hover:text-[#18F2A4] hover:bg-gray-500/5'
              }`}
            >
              <Settings className="w-4 h-4" /> Configurações Globais
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Action */}
        <div className={`p-4 border-t flex flex-col gap-2 ${
          theme === 'dark' ? 'border-[#161616]' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2 p-1 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>FluxOS Central Online</span>
          </div>
          <button
            onClick={onBackToLanding}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme === 'dark' ? 'bg-[#1C1C1C] text-gray-300 hover:bg-[#252525]' : 'bg-gray-150 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Top Header Bar */}
        <header className={`px-6 py-4 border-b flex justify-between items-center ${
          theme === 'dark' ? 'bg-[#000000]/40 border-[#161616]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="text-gray-400">FluxOS Engine Console</span>
            <span className="text-gray-500">/</span>
            <span className="text-[#18F2A4]">
              {activeTab === 'overview' && 'Dashboard Geral'}
              {activeTab === 'clients' && 'Lojas & Clientes'}
              {activeTab === 'financial' && 'Faturamento & MMR'}
              {activeTab === 'servers' && 'Status de Servidores'}
              {activeTab === 'tickets' && 'Chamados'}
              {activeTab === 'configs' && 'Configurações'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-[#18F2A4]/15 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Conexão Segura SSL-AES
            </div>
          </div>
        </header>

        {/* Content Tabs Switcher */}
        <div className="p-6 flex flex-col gap-6">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Bento Grid Platform KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">MMR da Plataforma</span>
                    <span className={`text-2xl font-extrabold mt-1 font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>R$ {platformMMR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ 100% de pagamentos adimplentes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Lojas Ativas</span>
                    <span className={`text-2xl font-extrabold mt-1 font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeClientsCount} Clientes</span>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1">1 suspenso por inadimplência</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Transações Processadas</span>
                    <span className={`text-2xl font-extrabold mt-1 font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{totalOrdersProcessed.toLocaleString()} Vendas</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Sem falhas de roteamento</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#18F2A4]/15 text-[#18F2A4]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Média Latência API</span>
                    <span className={`text-2xl font-extrabold mt-1 font-mono ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'}`}>6.8 ms</span>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Excelente (Meta &lt; 20ms)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Server health and Logs panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Active clients real-time synchronization */}
                <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col gap-4 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">Status Recente de Sincronia</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Operações registradas em tempo real pelas lojas parceiras</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {clients.map((c) => (
                      <div key={c.id} className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                        theme === 'dark' ? 'bg-[#0C0C0C]/50 border-gray-800/20' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">CNPJ: {c.cnpj}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-[11px]">
                          <div className="flex flex-col text-right">
                            <span className="font-medium text-gray-500">Volume Total</span>
                            <span className="font-bold text-gray-900 dark:text-white font-mono">{c.totalOrders} Vendas</span>
                          </div>
                          
                          <div className="flex flex-col text-right">
                            <span className="font-medium text-gray-500">Sincronia</span>
                            <span className="font-black text-emerald-400 font-mono">{c.lastSync}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Activity Log Term */}
                <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col gap-3 ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-[#18F2A4]" />
                      <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">Logs do Motor de Execução</span>
                    </div>
                    <button 
                      onClick={handleClearLogs}
                      className="text-[9px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest cursor-pointer"
                    >
                      Limpar logs
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black border border-gray-800 flex-1 flex flex-col gap-2 min-h-[220px] font-mono text-[10px] text-emerald-400 overflow-y-auto no-scrollbar">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 leading-relaxed">
                        <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-gray-300">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLIENTS */}
          {activeTab === 'clients' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Lojas de Bebidas Clientes do FluxOS</h2>
                  <p className="text-xs text-gray-500">Configure os parâmetros operacionais e permissões de cada estabelecimento cadastrado.</p>
                </div>
                <button
                  onClick={handleOpenAddClient}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Cadastrar Nova Loja
                </button>
              </div>

              {/* Table of active SaaS Stores */}
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-[#080808]' : 'bg-gray-150'}>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Razão Social / CNPJ</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Responsável / Contato</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Plano</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Valor Mensal</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Limites de Acesso</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider">Status</th>
                      <th className="p-4 font-bold uppercase text-[10px] text-gray-500 tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className={`hover:bg-gray-500/5 ${
                        theme === 'dark' ? 'border-b border-[#0C0C0C]' : 'border-b border-gray-200'
                      }`}>
                        <td className="p-4 flex flex-col">
                          <span className="font-extrabold text-gray-900 dark:text-white">{c.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5">CNPJ: {c.cnpj}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{c.ownerName}</span>
                            <span className="text-[10px] text-gray-500">{c.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            c.plan === 'Enterprise' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                            c.plan === 'Gold' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            c.plan === 'Prata' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                            'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                          }`}>
                            {c.plan}
                          </span>
                        </td>
                        <td className="p-4 font-bold font-mono text-gray-900 dark:text-white">
                          R$ {c.monthlyValue.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 font-mono">
                            <span>Membros: {c.usersCount} usuários</span>
                            <span>Pedidos: {c.totalOrders} processados</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                            c.status === 'active' ? 'text-emerald-400' : 'text-red-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {c.status === 'active' ? 'Ativo' : 'Suspenso'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleClientStatus(c.id)}
                              className={`p-1.5 rounded-lg border cursor-pointer ${
                                c.status === 'active' 
                                  ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10' 
                                  : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                              }`}
                              title={c.status === 'active' ? 'Suspender Licença' : 'Ativar Licença'}
                            >
                              {c.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleOpenEditClient(c)}
                              className="p-1.5 rounded-lg border text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10 cursor-pointer"
                              title="Editar Detalhes"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteClient(c.id)}
                              className="p-1.5 rounded-lg border text-red-400 border-red-500/20 hover:bg-red-500/10 cursor-pointer"
                              title="Excluir Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Client Modal */}
              {isAddingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className={`w-full max-w-md p-6 rounded-2xl border flex flex-col gap-4 text-left ${
                    theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
                  }`}>
                    <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                      <span className="font-extrabold text-sm uppercase tracking-wider">{isEditingClient ? 'Editar Licença de Cliente' : 'Cadastrar Nova Loja'}</span>
                      <button onClick={() => setIsAddingClient(false)} className="text-gray-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>

                    <form onSubmit={handleSaveClientForm} className="flex flex-col gap-4 text-xs font-sans">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Razão Social da Loja</label>
                        <input 
                          type="text" 
                          required
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          className={`p-2.5 rounded-xl border outline-none font-sans font-bold ${
                            theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                          }`}
                          placeholder="Ex: Adega São Paulo Norte Ltda"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">CNPJ do Estabelecimento</label>
                          <input 
                            type="text" 
                            required
                            value={clientForm.cnpj}
                            onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })}
                            className={`p-2.5 rounded-xl border outline-none font-mono ${
                              theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                            }`}
                            placeholder="00.000.000/0001-00"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Nome do Proprietário</label>
                          <input 
                            type="text" 
                            required
                            value={clientForm.ownerName}
                            onChange={(e) => setClientForm({ ...clientForm, ownerName: e.target.value })}
                            className={`p-2.5 rounded-xl border outline-none font-sans font-bold ${
                              theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                            }`}
                            placeholder="Ex: Carlos Roberto"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Email Principal de Contato</label>
                        <input 
                          type="email" 
                          required
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          className={`p-2.5 rounded-xl border outline-none font-sans ${
                            theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                          }`}
                          placeholder="adega@contato.com.br"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Plano Contratado</label>
                          <select 
                            value={clientForm.plan}
                            onChange={(e) => {
                              const plan = e.target.value as any;
                              let val = 99.00;
                              if (plan === 'Bronze') val = 49.00;
                              if (plan === 'Gold') val = 149.00;
                              if (plan === 'Enterprise') val = 299.00;
                              setClientForm({ ...clientForm, plan, monthlyValue: val });
                            }}
                            className={`p-2.5 rounded-xl border outline-none font-sans font-bold ${
                              theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <option value="Bronze">Bronze (R$ 49,00/mês)</option>
                            <option value="Prata">Prata (R$ 99,00/mês)</option>
                            <option value="Gold">Gold (R$ 149,00/mês)</option>
                            <option value="Enterprise">Enterprise (R$ 299,00/mês)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Limite de Membros</label>
                          <input 
                            type="number" 
                            required
                            value={clientForm.usersCount}
                            onChange={(e) => setClientForm({ ...clientForm, usersCount: Number(e.target.value) })}
                            className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                              theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2 transition-all ${
                          theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Salvar Licença
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANCIAL */}
          {activeTab === 'financial' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Tesouraria & Faturamento FluxOS</h2>
                <p className="text-xs text-gray-500">Métricas financeiras globais da plataforma e controle de mensalidades.</p>
              </div>

              {/* Financial KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">MMR Total Estimado</span>
                  <p className="text-2xl font-extrabold mt-1 text-emerald-400">R$ {(platformMMR).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Soma de licenças de lojas ativas</p>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Taxa de Churn da Plataforma</span>
                  <p className="text-2xl font-extrabold mt-1 text-violet-400">0.0 %</p>
                  <p className="text-[10px] text-gray-500 mt-1">Nenhum cancelamento nos últimos 60 dias</p>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">LTV Médio por Cliente</span>
                  <p className="text-2xl font-extrabold mt-1 text-blue-400">R$ 1.840,00</p>
                  <p className="text-[10px] text-gray-500 mt-1">Fidelidade média de 14.5 meses</p>
                </div>
              </div>

              {/* Billing table */}
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: theme === 'dark' ? '#161616' : '#E5E5E5' }}>
                <div className={`p-4 border-b font-bold text-xs ${
                  theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-gray-150'
                }`}>
                  Faturas e Controle de Mensalidades Recentes
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-gray-50'}>
                      <th className="p-3.5 font-bold uppercase text-[10px] text-gray-500">Código Fatura</th>
                      <th className="p-3.5 font-bold uppercase text-[10px] text-gray-500">Estabelecimento</th>
                      <th className="p-3.5 font-bold uppercase text-[10px] text-gray-500">Valor Cobrado</th>
                      <th className="p-3.5 font-bold uppercase text-[10px] text-gray-500">Vencimento</th>
                      <th className="p-3.5 font-bold uppercase text-[10px] text-gray-500 text-right">Status do Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className={`hover:bg-gray-500/5 ${
                        theme === 'dark' ? 'border-b border-[#0C0C0C]' : 'border-b border-gray-200'
                      }`}>
                        <td className="p-3.5 font-mono text-gray-400">{inv.id}</td>
                        <td className="p-3.5 font-bold text-gray-900 dark:text-white">{inv.clientName}</td>
                        <td className="p-3.5 font-bold font-mono text-gray-900 dark:text-white">R$ {inv.value.toFixed(2)}</td>
                        <td className="p-3.5 text-gray-500">{inv.dueDate}</td>
                        <td className="p-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            inv.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' :
                            inv.status === 'pendente' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SERVERS */}
          {activeTab === 'servers' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Status dos Servidores & Monitoramento</h2>
                  <p className="text-xs text-gray-500">Servidores do ecossistema FluxOS operando em clusters redundantes de Cloud Run.</p>
                </div>
                <button
                  onClick={() => alert('Realizando verificação completa no cluster de servidores...')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border hover:bg-gray-500/5 cursor-pointer ${
                    theme === 'dark' ? 'border-gray-800 text-white' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Forçar Varredura (Healthcheck)
                </button>
              </div>

              {/* Node cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {serverNodes.map((node, index) => {
                  const NodeIcon = node.icon;
                  return (
                    <div key={index} className={`p-4 rounded-2xl border flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <NodeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white">{node.name}</span>
                            <span className="text-[10px] text-gray-500">{node.type}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-wider">
                          online
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t pt-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                        <div className="flex flex-col">
                          <span className="text-gray-500 uppercase text-[9px] tracking-wider font-bold">Consumo de CPU</span>
                          <span className="font-bold text-gray-800 dark:text-white mt-0.5">{node.load}</span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-gray-500 uppercase text-[9px] tracking-wider font-bold">Latência Interna</span>
                          <span className="font-bold text-emerald-400 mt-0.5">{node.latency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Central de Atendimento a Clientes</h2>
                <p className="text-xs text-gray-500">Suporte técnico de segundo nível para operadores e administradores de adegas parceiras.</p>
              </div>

              {/* Support list */}
              <div className="flex flex-col gap-3">
                {tickets.map((t) => (
                  <div key={t.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${
                    theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 font-bold">#{t.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          t.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                          t.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-gray-500/15 text-gray-400'
                        }`}>
                          prioridade {t.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">• Criado em {t.createdAt}</span>
                      </div>

                      <span className="text-xs font-extrabold text-gray-900 dark:text-white leading-relaxed">{t.subject}</span>
                      <span className="text-[10px] text-gray-500">Solicitante: <strong className="text-gray-400">{t.clientName}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                      {t.status === 'open' && (
                        <button
                          onClick={() => handleStartTicket(t.id)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white hover:bg-indigo-600 transition-all cursor-pointer"
                        >
                          Atender Chamado
                        </button>
                      )}

                      {t.status === 'in_progress' && (
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-wider rounded-lg animate-pulse">
                            Em Atendimento
                          </span>
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer"
                          >
                            Resolver
                          </button>
                        </div>
                      )}

                      {t.status === 'resolved' && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                          <CheckCircle className="w-4 h-4" /> Resolvido
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CONFIGS */}
          {activeTab === 'configs' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Configurações Globais da Infraestrutura</h2>
                <p className="text-xs text-gray-500">Parâmetros de execução e chaves criptográficas do barramento central.</p>
              </div>

              {/* Config fields panel */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
                theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">API Gateway Endpoint (HTTPS)</label>
                    <input 
                      type="text" 
                      className={`p-2.5 rounded-xl border outline-none font-mono ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                      }`}
                      value="https://api.fluxos.com.br/v1"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Intervalo Heartbeat S-SYNC (Segundos)</label>
                    <input 
                      type="number" 
                      className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                      }`}
                      value={30}
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Chave de Token JWT Secreta</label>
                    <input 
                      type="password" 
                      className={`p-2.5 rounded-xl border outline-none font-mono text-gray-500 ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800' : 'bg-gray-50 border-gray-200'
                      }`}
                      value="jwt_secret_token_fluxos_saas_32_chars_long"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Backup Automático DB (Frequência)</label>
                    <select 
                      className={`p-2.5 rounded-xl border outline-none font-sans font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200'
                      }`}
                      disabled
                    >
                      <option>A cada 1 hora (Recomendado para produção)</option>
                      <option>A cada 24 horas</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end gap-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                  <button
                    onClick={() => alert('Configurações de infraestrutura salvas com sucesso!')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                      theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                    }`}
                  >
                    Salvar Alterações Globais
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
