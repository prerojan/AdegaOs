import React, { useState, useEffect } from 'react';
import { Settings, Users, Store, ShieldAlert, Key, Plus, Save, ToggleLeft, ToggleRight, X, Trash2, Shield, Download, Laptop, Printer, Sliders, Play, Check, AlertCircle, FileText, Sparkles, RefreshCw, Volume2, Wifi, Usb, Bluetooth, HelpCircle, Award, Mail, Phone, Lock, Edit3, CheckCircle2, Server, Globe } from 'lucide-react';
import { CashierUser } from '../types';
import { triggerThermalPrint } from '../lib/thermalPrinter';

interface ManagerSettingsProps {
  usersList: CashierUser[];
  onToggleUserActive: (userId: string) => void;
  onAddUser: (user: CashierUser) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: 'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock') => void;
  theme: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function ManagerSettings({
  usersList,
  onToggleUserActive,
  onAddUser,
  onDeleteUser,
  onUpdateUserRole,
  theme,
  onToggleTheme
}: ManagerSettingsProps) {
  // Topic Tab Selector State
  type SETTINGS_TOPIC = 'general' | 'printers' | 'staff' | 'terminals';
  const [activeTopic, setActiveTopic] = useState<SETTINGS_TOPIC>('general');

  // Corporate states
  const [storeName, setStoreName] = useState(() => localStorage.getItem('adegaos_store_name') || 'Adega Central Premium');
  const [cnpj, setCnpj] = useState(() => localStorage.getItem('adegaos_cnpj') || '12.345.678/0001-99');
  const [address, setAddress] = useState(() => localStorage.getItem('adegaos_address') || 'Rua dos Boêmios, 100 - Centro, São Paulo - SP');

  // Real-time thermal roll text
  const [activeReceiptText, setActiveReceiptText] = useState<string>(() => {
    return localStorage.getItem('adegaos_last_receipt') || '';
  });

  useEffect(() => {
    const handleNewPrint = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail !== undefined) {
        setActiveReceiptText(customEvent.detail);
      }
    };
    window.addEventListener('adegaos_new_print', handleNewPrint);
    return () => {
      window.removeEventListener('adegaos_new_print', handleNewPrint);
    };
  }, []);

  // Global Printer Config States
  const [printerMode, setPrinterMode] = useState<'virtual' | 'bluetooth' | 'browser' | 'network'>(() => {
    return (localStorage.getItem('adegaos_printer_mode') as any) || 'virtual';
  });
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('adegaos_paper_size') as any) || '58mm';
  });
  const [charLimit, setCharLimit] = useState<number>(() => {
    return Number(localStorage.getItem('adegaos_char_limit') || '32');
  });
  const [extraFeed, setExtraFeed] = useState<number>(() => {
    return Number(localStorage.getItem('adegaos_extra_feed') || '4');
  });
  const [autoCut, setAutoCut] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_auto_cut') !== 'false';
  });
  const [autoDuplicate, setAutoDuplicate] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_auto_duplicate') === 'true';
  });
  const [headerText, setHeaderText] = useState<string>(() => {
    return localStorage.getItem('adegaos_header_text') || 'ADEGA CENTRAL PREMIUM\nCNPJ: 12.345.678/0001-99\nOBRIGADO PELA PREFERÊNCIA!';
  });
  const [footerText, setFooterText] = useState<string>(() => {
    return localStorage.getItem('adegaos_footer_text') || 'Desenvolvido por FluxOS\n--- CUPOM NÃO FISCAL ---';
  });

  // Sector Printer States (Caixa, Cozinha, Bar, Delivery)
  const [checkoutPrinterEnabled, setCheckoutPrinterEnabled] = useState<boolean>(() => localStorage.getItem('adegaos_print_checkout_enabled') !== 'false');
  const [checkoutPrinterName, setCheckoutPrinterName] = useState<string>(() => localStorage.getItem('adegaos_print_checkout_name') || 'Impr. Frente Caixa (Recibos)');
  const [checkoutPrinterType, setCheckoutPrinterType] = useState<'network' | 'usb' | 'bluetooth'>(() => (localStorage.getItem('adegaos_print_checkout_type') as any) || 'usb');
  const [checkoutPrinterIp, setCheckoutPrinterIp] = useState<string>(() => localStorage.getItem('adegaos_print_checkout_ip') || '192.168.1.200');

  const [kitchenPrinterEnabled, setKitchenPrinterEnabled] = useState<boolean>(() => localStorage.getItem('adegaos_print_kitchen_enabled') !== 'false');
  const [kitchenPrinterName, setKitchenPrinterName] = useState<string>(() => localStorage.getItem('adegaos_print_kitchen_name') || 'Impr. Cozinha (Preparo Lanches)');
  const [kitchenPrinterType, setKitchenPrinterType] = useState<'network' | 'usb' | 'bluetooth'>(() => (localStorage.getItem('adegaos_print_kitchen_type') as any) || 'network');
  const [kitchenPrinterIp, setKitchenPrinterIp] = useState<string>(() => localStorage.getItem('adegaos_print_kitchen_ip') || '192.168.1.201');

  const [barPrinterEnabled, setBarPrinterEnabled] = useState<boolean>(() => localStorage.getItem('adegaos_print_bar_enabled') !== 'false');
  const [barPrinterName, setBarPrinterName] = useState<string>(() => localStorage.getItem('adegaos_print_bar_name') || 'Impr. Adega/Bar (Bebidas)');
  const [barPrinterType, setBarPrinterType] = useState<'network' | 'usb' | 'bluetooth'>(() => (localStorage.getItem('adegaos_print_bar_type') as any) || 'network');
  const [barPrinterIp, setBarPrinterIp] = useState<string>(() => localStorage.getItem('adegaos_print_bar_ip') || '192.168.1.202');

  const [deliveryPrinterEnabled, setDeliveryPrinterEnabled] = useState<boolean>(() => localStorage.getItem('adegaos_print_delivery_enabled') !== 'false');
  const [deliveryPrinterName, setDeliveryPrinterName] = useState<string>(() => localStorage.getItem('adegaos_print_delivery_name') || 'Impr. Expedição (Delivery/Rotas)');
  const [deliveryPrinterType, setDeliveryPrinterType] = useState<'network' | 'usb' | 'bluetooth'>(() => (localStorage.getItem('adegaos_print_delivery_type') as any) || 'network');
  const [deliveryPrinterIp, setDeliveryPrinterIp] = useState<string>(() => localStorage.getItem('adegaos_print_delivery_ip') || '192.168.1.203');

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isTestPrintingSector, setIsTestPrintingSector] = useState<string | null>(null);

  // Collapsible guide state toggles
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);

  const handleSavePrinterSettings = () => {
    localStorage.setItem('adegaos_printer_mode', printerMode);
    localStorage.setItem('adegaos_paper_size', paperSize);
    localStorage.setItem('adegaos_char_limit', charLimit.toString());
    localStorage.setItem('adegaos_extra_feed', extraFeed.toString());
    localStorage.setItem('adegaos_auto_cut', autoCut ? 'true' : 'false');
    localStorage.setItem('adegaos_auto_duplicate', autoDuplicate ? 'true' : 'false');
    localStorage.setItem('adegaos_header_text', headerText);
    localStorage.setItem('adegaos_footer_text', footerText);

    localStorage.setItem('adegaos_print_checkout_enabled', checkoutPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_checkout_name', checkoutPrinterName);
    localStorage.setItem('adegaos_print_checkout_type', checkoutPrinterType);
    localStorage.setItem('adegaos_print_checkout_ip', checkoutPrinterIp);

    localStorage.setItem('adegaos_print_kitchen_enabled', kitchenPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_kitchen_name', kitchenPrinterName);
    localStorage.setItem('adegaos_print_kitchen_type', kitchenPrinterType);
    localStorage.setItem('adegaos_print_kitchen_ip', kitchenPrinterIp);

    localStorage.setItem('adegaos_print_bar_enabled', barPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_bar_name', barPrinterName);
    localStorage.setItem('adegaos_print_bar_type', barPrinterType);
    localStorage.setItem('adegaos_print_bar_ip', barPrinterIp);

    localStorage.setItem('adegaos_print_delivery_enabled', deliveryPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_delivery_name', deliveryPrinterName);
    localStorage.setItem('adegaos_print_delivery_type', deliveryPrinterType);
    localStorage.setItem('adegaos_print_delivery_ip', deliveryPrinterIp);

    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 4000);
  };

  const handleTriggerSectorTestPrint = async (sectorName: string, printerLabel: string) => {
    setIsTestPrintingSector(sectorName);
    const mockData = {
      number: '9901',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identifier: `TESTE SETOR ${sectorName.toUpperCase()}`,
      cashierId: 'CONFIGURACOES',
      subtotal: 120.00,
      discount: 0.00,
      total: 120.00,
      paymentMethod: 'pix',
      items: [
        { qty: 1, name: `[${sectorName.toUpperCase()}] ITEM DE TESTE DE CONEXAO`, unitPrice: 120.00 }
      ]
    };

    try {
      await triggerThermalPrint('sale', mockData);
      alert(`Teste de comunicação enviado com sucesso para ${printerLabel}!`);
    } catch (err: any) {
      console.error("Erro na impressão de teste:", err);
      alert(`Falha no teste de impressão: ${err.message}`);
    } finally {
      setIsTestPrintingSector(null);
    }
  };

  // PWA/Chrome Install states
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Staff User modal and edit state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock'>('waiter');

  // Edit PIN Modal State
  const [editingUserPinId, setEditingUserPinId] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState('');

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adegaos_store_name', storeName);
    localStorage.setItem('adegaos_cnpj', cnpj);
    localStorage.setItem('adegaos_address', address);
    alert('Dados institucionais da empresa atualizados com sucesso!');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || newUserPin.length < 4) {
      alert('Favor preencher o nome e um PIN numérico de no mínimo 4 dígitos.');
      return;
    }

    const payload: CashierUser = {
      id: `u-${Date.now()}`,
      name: newUserName,
      pin: newUserPin,
      role: newUserRole,
      active: true
    };

    onAddUser(payload);
    setShowUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPin('');
    alert(`Novo colaborador ${newUserName} cadastrado com sucesso.`);
  };

  const handleSaveEditedPin = (userId: string) => {
    if (editPinValue.length < 4) {
      alert('O PIN deve conter no mínimo 4 dígitos.');
      return;
    }
    const targetUser = usersList.find(u => u.id === userId);
    if (targetUser) {
      targetUser.pin = editPinValue;
      alert(`PIN do usuário ${targetUser.name} alterado com sucesso para ${editPinValue}.`);
    }
    setEditingUserPinId(null);
    setEditPinValue('');
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Centro de Configurações do Sistema</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Gerenciamento modular de parâmetros da empresa, rede de impressoras, PINs de colaboradores e terminais PDV.</p>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'
            }`}
          >
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        )}
      </div>

      {/* TOPIC SEPARATION NAVIGATION BAR (Tabs) */}
      <div className={`p-1.5 rounded-2xl border flex flex-wrap items-center gap-2 ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTopic('general')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'general'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Empresa & Geral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('printers')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'printers'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Rede de Impressoras & Setores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('staff')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'staff'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Colaboradores & PINs</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-black/20 text-current">{usersList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopic('terminals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTopic === 'terminals'
              ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-md' : 'bg-[#10B981] text-white shadow-md')
              : 'text-gray-400 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Terminais & Segurança PWA</span>
        </button>
      </div>

      {/* =========================================================
          TOPIC 1: EMPRESA & GERAL
          ========================================================= */}
      {activeTopic === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Institutional Store Data */}
          <form onSubmit={handleSaveCorporate} className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <Store className="w-4 h-4 text-[#18F2A4]" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Perfil da Empresa (Matriz / Filial)</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome de Exibição / Fantasia</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-bold ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">CNPJ / Registro Fiscal</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono font-bold ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Endereço Comercial Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`p-3 rounded-xl border outline-none ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              <Save className="w-4 h-4" />
              Salvar Dados Institucionais
            </button>
          </form>

          {/* Receipt Header & Footer Templates */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Cabeçalho e Rodapé dos Cupons</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Cabeçalho (Topo da Bobina)</label>
              <textarea
                rows={3}
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Texto do Rodapé (Final da Bobina)</label>
              <textarea
                rows={3}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className={`p-3 rounded-xl border outline-none font-mono text-xs ${
                  theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleSavePrinterSettings}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#111] border border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border border-gray-200 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <Save className="w-4 h-4" />
              Gravar Textos dos Cupons
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 2: REDE DE IMPRESSORAS & SETORES
          ========================================================= */}
      {activeTopic === 'printers' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Header Action Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#18F2A4]" />
                Automação e Roteamento de Impressoras Por Setor
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Cadastre e teste impressoras térmicas conectadas via USB, IP de Rede TCP/IP ou Bluetooth para cada setor do estabelecimento.</p>
            </div>

            <div className="flex items-center gap-3">
              {showSuccessBanner && (
                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" />
                  Salvo!
                </span>
              )}
              <button
                type="button"
                onClick={handleSavePrinterSettings}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                <Save className="w-4 h-4" />
                Salvar Rede de Impressoras
              </button>
            </div>
          </div>

          {/* Sector Printers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. SECTOR: CAIXA / BALCÃO */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider">Setor 1: Frente de Caixa / Balcão</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutPrinterEnabled(!checkoutPrinterEnabled)}
                  className="cursor-pointer"
                >
                  {checkoutPrinterEnabled ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome da Impressora do Caixa</label>
                  <input
                    type="text"
                    value={checkoutPrinterName}
                    onChange={(e) => setCheckoutPrinterName(e.target.value)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Conexão</label>
                    <select
                      value={checkoutPrinterType}
                      onChange={(e) => setCheckoutPrinterType(e.target.value as any)}
                      className={`p-2.5 rounded-xl border outline-none font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                      }`}
                    >
                      <option value="usb">USB Direct / WebUSB</option>
                      <option value="network">Rede IP TCP/IP</option>
                      <option value="bluetooth">Bluetooth Serial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">IP / Porta de Conexão</label>
                    <input
                      type="text"
                      value={checkoutPrinterIp}
                      onChange={(e) => setCheckoutPrinterIp(e.target.value)}
                      placeholder="192.168.1.200:9100"
                      className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerSectorTestPrint('caixa', checkoutPrinterName)}
                  disabled={isTestPrintingSector === 'caixa'}
                  className={`mt-2 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-black hover:bg-gray-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-[#18F2A4]" />
                  {isTestPrintingSector === 'caixa' ? 'Enviando ao Caixa...' : 'Testar Impressora do Caixa'}
                </button>
              </div>
            </div>

            {/* 2. SECTOR: COZINHA */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider">Setor 2: Cozinha & Preparo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKitchenPrinterEnabled(!kitchenPrinterEnabled)}
                  className="cursor-pointer"
                >
                  {kitchenPrinterEnabled ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome da Impressora da Cozinha</label>
                  <input
                    type="text"
                    value={kitchenPrinterName}
                    onChange={(e) => setKitchenPrinterName(e.target.value)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Conexão</label>
                    <select
                      value={kitchenPrinterType}
                      onChange={(e) => setKitchenPrinterType(e.target.value as any)}
                      className={`p-2.5 rounded-xl border outline-none font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                      }`}
                    >
                      <option value="network">Rede IP TCP/IP</option>
                      <option value="usb">USB Direct / WebUSB</option>
                      <option value="bluetooth">Bluetooth Serial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">IP / Porta de Conexão</label>
                    <input
                      type="text"
                      value={kitchenPrinterIp}
                      onChange={(e) => setKitchenPrinterIp(e.target.value)}
                      placeholder="192.168.1.201:9100"
                      className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerSectorTestPrint('cozinha', kitchenPrinterName)}
                  disabled={isTestPrintingSector === 'cozinha'}
                  className={`mt-2 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-black hover:bg-gray-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-[#18F2A4]" />
                  {isTestPrintingSector === 'cozinha' ? 'Enviando à Cozinha...' : 'Testar Impressora da Cozinha'}
                </button>
              </div>
            </div>

            {/* 3. SECTOR: ADEGA & BAR */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-xs font-black uppercase tracking-wider">Setor 3: Adega & Bar (Bebidas)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBarPrinterEnabled(!barPrinterEnabled)}
                  className="cursor-pointer"
                >
                  {barPrinterEnabled ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome da Impressora do Bar</label>
                  <input
                    type="text"
                    value={barPrinterName}
                    onChange={(e) => setBarPrinterName(e.target.value)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Conexão</label>
                    <select
                      value={barPrinterType}
                      onChange={(e) => setBarPrinterType(e.target.value as any)}
                      className={`p-2.5 rounded-xl border outline-none font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                      }`}
                    >
                      <option value="network">Rede IP TCP/IP</option>
                      <option value="usb">USB Direct / WebUSB</option>
                      <option value="bluetooth">Bluetooth Serial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">IP / Porta de Conexão</label>
                    <input
                      type="text"
                      value={barPrinterIp}
                      onChange={(e) => setBarPrinterIp(e.target.value)}
                      placeholder="192.168.1.202:9100"
                      className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerSectorTestPrint('bar', barPrinterName)}
                  disabled={isTestPrintingSector === 'bar'}
                  className={`mt-2 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-black hover:bg-gray-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-[#18F2A4]" />
                  {isTestPrintingSector === 'bar' ? 'Enviando ao Bar...' : 'Testar Impressora do Bar'}
                </button>
              </div>
            </div>

            {/* 4. SECTOR: DELIVERY & EXPEDIÇÃO */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-black uppercase tracking-wider">Setor 4: Expedição & Delivery</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryPrinterEnabled(!deliveryPrinterEnabled)}
                  className="cursor-pointer"
                >
                  {deliveryPrinterEnabled ? <ToggleRight className="w-6 h-6 text-[#18F2A4]" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome da Impressora de Delivery</label>
                  <input
                    type="text"
                    value={deliveryPrinterName}
                    onChange={(e) => setDeliveryPrinterName(e.target.value)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Conexão</label>
                    <select
                      value={deliveryPrinterType}
                      onChange={(e) => setDeliveryPrinterType(e.target.value as any)}
                      className={`p-2.5 rounded-xl border outline-none font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                      }`}
                    >
                      <option value="network">Rede IP TCP/IP</option>
                      <option value="usb">USB Direct / WebUSB</option>
                      <option value="bluetooth">Bluetooth Serial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">IP / Porta de Conexão</label>
                    <input
                      type="text"
                      value={deliveryPrinterIp}
                      onChange={(e) => setDeliveryPrinterIp(e.target.value)}
                      placeholder="192.168.1.203:9100"
                      className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                        theme === 'dark' ? 'bg-[#111] border-gray-800 text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerSectorTestPrint('expedição', deliveryPrinterName)}
                  disabled={isTestPrintingSector === 'expedição'}
                  className={`mt-2 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white hover:bg-[#1A1A1A]' : 'bg-gray-100 border-gray-200 text-black hover:bg-gray-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-[#18F2A4]" />
                  {isTestPrintingSector === 'expedição' ? 'Enviando à Expedição...' : 'Testar Impressora da Expedição'}
                </button>
              </div>
            </div>

          </div>

          {/* Paper Size & Hardware Parameters */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider block border-b pb-2" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              Parâmetros de Largura, Corte e Guilhotina
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Largura da Bobina</label>
                <select
                  value={paperSize}
                  onChange={(e) => {
                    const val = e.target.value as '58mm' | '80mm';
                    setPaperSize(val);
                    setCharLimit(val === '58mm' ? 32 : 48);
                  }}
                  className={`p-2.5 rounded-xl border outline-none font-bold ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                >
                  <option value="58mm">58mm (Padrão 32 colunas)</option>
                  <option value="80mm">80mm (Larga 48 colunas)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Corte de Guilhotina</label>
                <button
                  type="button"
                  onClick={() => setAutoCut(!autoCut)}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer ${
                    autoCut
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-800 bg-[#111] text-gray-500'
                  }`}
                >
                  <span>{autoCut ? 'Ativado (Ativo)' : 'Desativado'}</span>
                  {autoCut ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Avanço de Linhas (Feed)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={extraFeed}
                  onChange={(e) => setExtraFeed(Number(e.target.value))}
                  className={`p-2.5 rounded-xl border outline-none font-mono font-bold ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Duplicar Cupom de Caixa</label>
                <button
                  type="button"
                  onClick={() => setAutoDuplicate(!autoDuplicate)}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-between cursor-pointer ${
                    autoDuplicate
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-800 bg-[#111] text-gray-500'
                  }`}
                >
                  <span>{autoDuplicate ? '2x Vias Automáticas' : '1 Via Única'}</span>
                  {autoDuplicate ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 3: COLABORADORES & PINS
          ========================================================= */}
      {activeTopic === 'staff' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Header Action Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Acessos de Colaboradores & Autenticação por PIN
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Cadastre o staff com nome, e-mail, cargo e defina o código PIN secreto individual para autorizações operacionais.</p>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              <Plus className="w-4 h-4" />
              Novo Colaborador
            </button>
          </div>

          {/* Staff List Table */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-black/20 text-gray-500' : 'bg-gray-100 text-gray-600'}>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Colaborador</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Cargo / Permissão</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">PIN de Acesso</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest">Status</th>
                    <th className="p-3 font-bold uppercase text-[9px] tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id} className={`border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
                      <td className="p-3 font-bold">
                        <div className="flex flex-col">
                          <span className="text-sm">{user.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {user.id}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as any)}
                            className="p-1.5 rounded-lg text-xs bg-transparent border cursor-pointer focus:outline-none font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: theme === 'dark' ? '#111' : 'white',
                              borderColor: theme === 'dark' ? '#222' : '#E5E5E5',
                              color: theme === 'dark' ? '#DDD' : '#333'
                            }}
                          >
                            <option value="waiter">Garçom</option>
                            <option value="cashier">Caixa</option>
                            <option value="stock">Estoque</option>
                            <option value="finance">Finanças</option>
                            <option value="manager">Gerente</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        {editingUserPinId === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="password"
                              maxLength={6}
                              value={editPinValue}
                              onChange={(e) => setEditPinValue(e.target.value.replace(/\D/g, ''))}
                              placeholder="Novo PIN"
                              className="w-20 p-1 rounded border text-center font-bold text-xs bg-black text-white border-emerald-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditedPin(user.id)}
                              className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingUserPinId(null)}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-[10px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#18F2A4] tracking-widest text-sm">••••</span>
                            <button
                              onClick={() => {
                                setEditingUserPinId(user.id);
                                setEditPinValue(user.pin);
                              }}
                              className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                              title="Redefinir PIN"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                          {user.active ? 'PIN Ativo' : 'Bloqueado'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleUserActive(user.id)}
                            title={user.active ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                            className="p-1.5 rounded border border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                          >
                            {user.active ? <ToggleRight className="w-5 h-5 text-[#18F2A4]" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                          </button>

                          <button
                            onClick={() => {
                              (window as any).confirmModal(`Tem certeza de que deseja remover o colaborador "${user.name}"?`, () => {
                                onDeleteUser(user.id);
                                alert(`Colaborador ${user.name} removido com sucesso.`);
                              });
                            }}
                            className="p-1.5 rounded border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Remover Colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TOPIC 4: TERMINAIS & SEGURANÇA PWA
          ========================================================= */}
      {activeTopic === 'terminals' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
            theme === 'dark' ? 'bg-[#080808] border-[#111]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#F3F4F6' }}>
              <Laptop className="w-4 h-4 text-[#18F2A4]" />
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Modo Frente de Caixa Nativo (App PWA Standalone)</span>
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="flex-1 flex flex-col gap-3">
                <span className="text-sm font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Instalação e Uso em Computadores do Salão e Caixa</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  O FluxOS é uma PWA otimizada para execução em tela cheia e modo quiosque (Kiosk Mode). Ele permite acesso ultra-rápido aos garçons e caixas sem barras do navegador.
                </p>

                {deferredPrompt ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleTriggerInstall}
                      className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                        theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Instalar Aplicativo Oficial no Computador
                    </button>
                  </div>
                ) : isAppInstalled ? (
                  <div className="p-3 rounded-xl border bg-emerald-950/20 border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>FluxOS está em execução como aplicativo nativo standalone.</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border flex flex-col gap-2 bg-gray-500/5 border-gray-800 text-xs">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Passo a Passo Para Instalação:</span>
                    <ol className="list-decimal list-inside text-gray-300 space-y-1" style={{ color: theme === 'dark' ? '#DDD' : '#444' }}>
                      <li>No Google Chrome / Edge, abra o menu de opções no canto superior direito.</li>
                      <li>Clique em <strong>Salvar e Compartilhar</strong> &gt; <strong>Criar Atalho...</strong></li>
                      <li>Marque a caixa <strong>"Abrir como janela"</strong>.</li>
                      <li>Clique em <strong>Criar</strong> para ter o ícone do FluxOS na área de trabalho.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Status parameters */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 w-full md:w-64 shrink-0 text-xs ${
                theme === 'dark' ? 'bg-[#111] border-gray-800' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className="font-extrabold uppercase text-[10px] text-gray-400 tracking-wider">Status do Terminal</span>
                <div className="flex flex-col gap-2 text-gray-400">
                  <div className="flex justify-between items-center">
                    <span>Cache Offline S-Sync:</span>
                    <span className="font-bold text-emerald-400">Ativo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Conexão Local:</span>
                    <span className="font-bold text-sky-400">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Versão da PWA:</span>
                    <span className="font-mono text-white font-bold">v3.8.4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border flex flex-col p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#18F2A4]" />
                Cadastrar Colaborador & Liberar PIN
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Roberto Garçom"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="p-3 rounded-xl border focus:outline-none font-bold"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">E-mail de Contato (Opcional)</label>
                <input
                  type="email"
                  placeholder="carlos@adega.com.br"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="p-3 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">PIN Secreto (Min. 4 Dígitos) *</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Ex: 1234"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    className="p-3 rounded-xl border focus:outline-none font-mono text-center tracking-widest font-extrabold text-sm"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Cargo / Nível de Acesso</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="p-3 rounded-xl border focus:outline-none font-bold"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    <option value="waiter">Garçom (Salão)</option>
                    <option value="cashier">Operador de Caixa</option>
                    <option value="stock">Auxiliar de Estoque</option>
                    <option value="finance">Financeiro</option>
                    <option value="manager">Gerente de Turno</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs border cursor-pointer ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
