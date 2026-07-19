import React, { useState, useEffect } from 'react';
import { Settings, Users, Store, ShieldAlert, Key, Plus, Save, ToggleLeft, ToggleRight, X, Trash2, Shield, Download, Laptop, Printer, Sliders, Play, Check, AlertCircle, FileText, Sparkles, RefreshCw, Volume2, Wifi, Usb, Bluetooth, HelpCircle, Award } from 'lucide-react';
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
  // Corporate states
  const [storeName, setStoreName] = useState('Adega Central Premium');
  const [cnpj, setCnpj] = useState('12.345.678/0001-99');
  const [address, setAddress] = useState('Rua dos Boêmios, 100 - Centro, São Paulo - SP');

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

  // Printer & Sector Config States loaded from localStorage
  const [printerMode, setPrinterMode] = useState<'virtual' | 'bluetooth' | 'browser'>(() => {
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
    return localStorage.getItem('adegaos_footer_text') || 'Desenvolvido por AdegaOS\n--- CUPOM NÃO FISCAL ---';
  });

  // Sector Printer States
  const [kitchenPrinterEnabled, setKitchenPrinterEnabled] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_print_kitchen_enabled') !== 'false';
  });
  const [kitchenPrinterName, setKitchenPrinterName] = useState<string>(() => {
    return localStorage.getItem('adegaos_print_kitchen_name') || 'Impr. Cozinha (Setor Cozinha)';
  });
  const [barPrinterEnabled, setBarPrinterEnabled] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_print_bar_enabled') !== 'false';
  });
  const [barPrinterName, setBarPrinterName] = useState<string>(() => {
    return localStorage.getItem('adegaos_print_bar_name') || 'Impr. Adega/Bar (Setor Balcão)';
  });
  const [checkoutPrinterEnabled, setCheckoutPrinterEnabled] = useState<boolean>(() => {
    return localStorage.getItem('adegaos_print_checkout_enabled') !== 'false';
  });
  const [checkoutPrinterName, setCheckoutPrinterName] = useState<string>(() => {
    return localStorage.getItem('adegaos_print_checkout_name') || 'Impr. Frente Caixa (Recibos)';
  });

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);

  // Collapsible guide state toggles (hidden by default)
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  const handleSavePrinterSettings = () => {
    localStorage.setItem('adegaos_printer_mode', printerMode);
    localStorage.setItem('adegaos_paper_size', paperSize);
    localStorage.setItem('adegaos_char_limit', charLimit.toString());
    localStorage.setItem('adegaos_extra_feed', extraFeed.toString());
    localStorage.setItem('adegaos_auto_cut', autoCut ? 'true' : 'false');
    localStorage.setItem('adegaos_auto_duplicate', autoDuplicate ? 'true' : 'false');
    localStorage.setItem('adegaos_header_text', headerText);
    localStorage.setItem('adegaos_footer_text', footerText);
    localStorage.setItem('adegaos_print_kitchen_enabled', kitchenPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_kitchen_name', kitchenPrinterName);
    localStorage.setItem('adegaos_print_bar_enabled', barPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_bar_name', barPrinterName);
    localStorage.setItem('adegaos_print_checkout_enabled', checkoutPrinterEnabled ? 'true' : 'false');
    localStorage.setItem('adegaos_print_checkout_name', checkoutPrinterName);

    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 4000);
  };

  const handleTriggerTestPrint = async () => {
    setIsTestPrinting(true);
    const mockData = {
      number: '8812',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identifier: 'CUPOM DE TESTE DE BOBINA',
      cashierId: 'CONFIGURACOES',
      subtotal: 185.00,
      discount: 10.00,
      total: 175.00,
      paymentMethod: 'pix',
      items: [
        { qty: 2, name: 'CERVEJA ARTESANAL IPA', unitPrice: 22.50 },
        { qty: 1, name: 'PANCETA CROCANTE INTEIRA', unitPrice: 65.00 },
        { qty: 3, name: 'REFRIGERANTE LATA 350ML', unitPrice: 7.00 },
        { qty: 1, name: 'BURGER ADEGA MONSTER', unitPrice: 54.00 }
      ]
    };

    try {
      await triggerThermalPrint('sale', mockData);
    } catch (err: any) {
      console.error("Erro na impressão de teste:", err);
      alert('Erro ao simular impressão térmica: ' + err.message);
    } finally {
      setIsTestPrinting(false);
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

    window.addEventListener('beforebeforeinstallprompt' as any, handleBeforeInstallPrompt); // fallback standard listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode (installed)
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

  // New user PIN state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock'>('waiter');

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dados da empresa salvos com sucesso!');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || newUserPin.length !== 4) {
      alert('Favor preencher o nome e um PIN numérico de exatamente 4 dígitos.');
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
    setNewUserPin('');
    alert('Novo usuário / PIN operacional habilitado!');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Configurações Gerais</h2>
        <p className="text-xs text-gray-400 font-medium">Controle de credenciais de PIN operacional dos atendentes, parâmetros fiscais e preferências.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Corporate Profile */}
        <form onSubmit={handleSaveCorporate} className={`p-4 rounded-xl border flex flex-col gap-4 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <Store className="w-4 h-4 text-[#18F2A4]" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Perfil da Empresa (Filial)</span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="text-gray-400 font-semibold">Nome de Exibição / Fantasia</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="p-2 rounded border focus:outline-none"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            />
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="text-gray-400 font-semibold">CNPJ Fictício</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="p-2 rounded border focus:outline-none font-mono"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            />
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="text-gray-400 font-semibold">Endereço Comercial</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="p-2 rounded border focus:outline-none"
              style={{ backgroundColor: theme === 'dark' ? '#080808' : 'white', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 rounded font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
            }`}
          >
            <Save className="w-4 h-4" />
            Salvar Dados Institucionais
          </button>
        </form>

        {/* Box 2: User PIN keys security list */}
        <div className={`p-4 rounded-xl border flex flex-col gap-4 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">PINs e Acessos do Staff</span>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
              className={`px-3 py-1 text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-all ${
                theme === 'dark' ? 'bg-[#1A1A1A] hover:bg-[#222]' : 'bg-gray-100 border hover:bg-gray-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Acesso (PIN)
            </button>
          </div>

          {/* Users credentials list */}
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
            {usersList.map(user => (
              <div
                key={user.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  theme === 'dark' ? 'bg-[#080808]/80 border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{user.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex items-center gap-2.5 mt-1 text-gray-500 font-mono text-[10px]">
                    <span>PIN: <span className="font-bold text-[#18F2A4] font-mono tracking-widest">{user.pin}</span></span>
                  </div>
                </div>

                {/* Actions container: Permissões, Ativo/Inativo, Demissão */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  {/* Permissões selector */}
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.id, e.target.value as any)}
                      className="p-1 rounded text-[10px] bg-transparent border cursor-pointer focus:outline-none font-bold uppercase tracking-wider"
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

                  {/* Active Toggle */}
                  <button
                    onClick={() => onToggleUserActive(user.id)}
                    title={user.active ? 'Bloquear PIN' : 'Desbloquear PIN'}
                    className="cursor-pointer text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    {user.active ? (
                      <ToggleRight className="w-6 h-6 text-[#18F2A4]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-600" />
                    )}
                  </button>

                  {/* Dismiss (Demissão) */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Tem certeza de que deseja demitir/remover o funcionário "${user.name}"?`)) {
                        onDeleteUser(user.id);
                        alert(`Funcionário ${user.name} foi demitido do sistema.`);
                      }
                    }}
                    title="Demitir Funcionário"
                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 5: Custom Printer & Sector roll config (FULL FEATURED TICKET MANAGEMENT) */}
        <div className={`p-5 rounded-xl border flex flex-col gap-5 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#18F2A4]" />
              <div>
                <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider block">Central de Impressão e Bobina (Automação ESC/POS)</span>
                <span className="text-[10px] text-gray-500 block">Configure o roteamento automático de pedidos por setor e customize as bobinas térmicas.</span>
              </div>
            </div>

            {showSuccessBanner && (
              <div className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" />
                Configurações gravadas!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Form controls (Left Column) */}
            <div className="xl:col-span-7 flex flex-col gap-5">
              
              {/* Row 1: Global Printing Method */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#18F2A4]" />
                  Método Padrão de Comunicação da Impressora
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrinterMode('virtual')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      printerMode === 'virtual'
                        ? 'border-[#18F2A4] bg-[#18F2A4]/5 text-[#18F2A4]'
                        : theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A] text-gray-400 hover:bg-[#111]' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-extrabold text-[11px]">Simulador Virtual</span>
                    <span className="text-[9px] opacity-75">Gera cupons na tela do operador para controle.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterMode('bluetooth')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      printerMode === 'bluetooth'
                        ? 'border-[#18F2A4] bg-[#18F2A4]/5 text-[#18F2A4]'
                        : theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A] text-gray-400 hover:bg-[#111]' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-extrabold text-[11px]">ESC/POS Bluetooth</span>
                    <span className="text-[9px] opacity-75">Transmissão serial direta para impressora Bluetooth.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterMode('browser')}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      printerMode === 'browser'
                        ? 'border-[#18F2A4] bg-[#18F2A4]/5 text-[#18F2A4]'
                        : theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A] text-gray-400 hover:bg-[#111]' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-extrabold text-[11px]">Diálogo do Sistema</span>
                    <span className="text-[9px] opacity-75">Abre a caixa de impressão clássica do navegador.</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Sector Printer Allocation Map */}
              <div className="flex flex-col gap-2.5 text-xs">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Configuração de Destinos por Setor Operacional
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Cozinha Sector */}
                  <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${
                    theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                      <span className="font-black text-[10px] tracking-wider text-[#18F2A4]">SETOR COZINHA</span>
                      <button
                        type="button"
                        onClick={() => setKitchenPrinterEnabled(!kitchenPrinterEnabled)}
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          kitchenPrinterEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {kitchenPrinterEnabled ? 'ATIVO' : 'DESATIVO'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 font-semibold">Nome lógico:</span>
                      <input
                        type="text"
                        disabled={!kitchenPrinterEnabled}
                        value={kitchenPrinterName}
                        onChange={(e) => setKitchenPrinterName(e.target.value)}
                        className="p-1.5 rounded text-[11px] border focus:outline-none disabled:opacity-40 font-bold"
                        style={{
                          backgroundColor: theme === 'dark' ? '#111' : 'white',
                          borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                          color: theme === 'dark' ? 'white' : 'black'
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500 leading-normal">
                      Imprime pedidos de refeições e porções quentes na cozinha.
                    </span>
                  </div>

                  {/* Bar/Adega Sector */}
                  <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${
                    theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                      <span className="font-black text-[10px] tracking-wider text-sky-400">SETOR ADEGA/BAR</span>
                      <button
                        type="button"
                        onClick={() => setBarPrinterEnabled(!barPrinterEnabled)}
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          barPrinterEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {barPrinterEnabled ? 'ATIVO' : 'DESATIVO'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 font-semibold">Nome lógico:</span>
                      <input
                        type="text"
                        disabled={!barPrinterEnabled}
                        value={barPrinterName}
                        onChange={(e) => setBarPrinterName(e.target.value)}
                        className="p-1.5 rounded text-[11px] border focus:outline-none disabled:opacity-40 font-bold"
                        style={{
                          backgroundColor: theme === 'dark' ? '#111' : 'white',
                          borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                          color: theme === 'dark' ? 'white' : 'black'
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500 leading-normal">
                      Imprime comandas de cervejas, vinhos e drinks diretamente no bar.
                    </span>
                  </div>

                  {/* Frente de Caixa / Caixa principal */}
                  <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${
                    theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                      <span className="font-black text-[10px] tracking-wider text-amber-400">FRENTE CAIXA</span>
                      <button
                        type="button"
                        onClick={() => setCheckoutPrinterEnabled(!checkoutPrinterEnabled)}
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          checkoutPrinterEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {checkoutPrinterEnabled ? 'ATIVO' : 'DESATIVO'}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 font-semibold">Nome lógico:</span>
                      <input
                        type="text"
                        disabled={!checkoutPrinterEnabled}
                        value={checkoutPrinterName}
                        onChange={(e) => setCheckoutPrinterName(e.target.value)}
                        className="p-1.5 rounded text-[11px] border focus:outline-none disabled:opacity-40 font-bold"
                        style={{
                          backgroundColor: theme === 'dark' ? '#111' : 'white',
                          borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                          color: theme === 'dark' ? 'white' : 'black'
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500 leading-normal">
                      Imprime cupom fiscal simplificado ou recibo de mesa quitada.
                    </span>
                  </div>

                </div>
              </div>

              {/* Row 3: Physical roll formatting properties */}
              <div className="flex flex-col gap-2.5 text-xs">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Configurações Físicas da Bobina de Papel
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 font-semibold text-[10px]">Largura da Bobina</span>
                    <select
                      value={paperSize}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setPaperSize(val);
                        setCharLimit(val === '58mm' ? 32 : 48);
                      }}
                      className="p-2 rounded border focus:outline-none font-bold"
                      style={{
                        backgroundColor: theme === 'dark' ? '#111' : 'white',
                        borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                        color: theme === 'dark' ? 'white' : 'black'
                      }}
                    >
                      <option value="58mm">58mm (Portátil / Mini)</option>
                      <option value="80mm">80mm (Mesa / Industrial)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 font-semibold text-[10px]">Colunas por Linha (Caracteres)</span>
                    <select
                      value={charLimit}
                      onChange={(e) => setCharLimit(Number(e.target.value))}
                      className="p-2 rounded border focus:outline-none font-mono"
                      style={{
                        backgroundColor: theme === 'dark' ? '#111' : 'white',
                        borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                        color: theme === 'dark' ? 'white' : 'black'
                      }}
                    >
                      <option value={32}>32 colunas (padrão 58mm)</option>
                      <option value={40}>40 colunas (compacto)</option>
                      <option value={42}>42 colunas (médio)</option>
                      <option value={48}>48 colunas (padrão 80mm)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                    <span className="text-gray-500 font-semibold text-[10px]">Avanço de Linhas (Fim do Cupom)</span>
                    <select
                      value={extraFeed}
                      onChange={(e) => setExtraFeed(Number(e.target.value))}
                      className="p-2 rounded border focus:outline-none"
                      style={{
                        backgroundColor: theme === 'dark' ? '#111' : 'white',
                        borderColor: theme === 'dark' ? '#222' : '#D1D5DB',
                        color: theme === 'dark' ? 'white' : 'black'
                      }}
                    >
                      <option value={1}>1 linha em branco</option>
                      <option value={2}>2 linhas em branco</option>
                      <option value={4}>4 linhas em branco (Padrão)</option>
                      <option value={6}>6 linhas em branco (Recomendado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                  
                  {/* Auto-cut Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    <div>
                      <span className="text-[11px] font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Auto-Corte de Papel (ESC/POS)</span>
                      <span className="text-[9px] text-gray-500">Aciona a guilhotina física automaticamente.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoCut(!autoCut)}
                      className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                    >
                      {autoCut ? (
                        <ToggleRight className="w-6 h-6 text-[#18F2A4]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Auto-duplicate (Via dupla) Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    <div>
                      <span className="text-[11px] font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Imprimir Via Dupla (Controle)</span>
                      <span className="text-[9px] text-gray-500">Imprime automaticamente 1 via para o cliente e 1 interna.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoDuplicate(!autoDuplicate)}
                      className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                    >
                      {autoDuplicate ? (
                        <ToggleRight className="w-6 h-6 text-[#18F2A4]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Row 4: Custom Header / Footer messages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    Texto do Cabeçalho
                  </span>
                  <textarea
                    rows={3}
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="p-2 rounded border focus:outline-none font-mono text-[10px]"
                    style={{
                      backgroundColor: theme === 'dark' ? '#080808' : 'white',
                      borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB',
                      color: theme === 'dark' ? '#E5E5E5' : 'black'
                    }}
                    placeholder="Nome da Adega, CNPJ, telefone..."
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    Texto do Rodapé
                  </span>
                  <textarea
                    rows={3}
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="p-2 rounded border focus:outline-none font-mono text-[10px]"
                    style={{
                      backgroundColor: theme === 'dark' ? '#080808' : 'white',
                      borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB',
                      color: theme === 'dark' ? '#E5E5E5' : 'black'
                    }}
                    placeholder="Obrigado, Volte sempre..."
                  />
                </div>
              </div>

              {/* Action Save Button */}
              <button
                type="button"
                onClick={handleSavePrinterSettings}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                <Save className="w-4 h-4" />
                Salvar Configurações de Impressão e Bobina
              </button>

              {/* Guia Completo de Conexão Física de Impressoras Térmicas */}
              <div className={`rounded-xl border flex flex-col overflow-hidden mt-3 transition-all ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Header Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsHardwareGuideOpen(!isHardwareGuideOpen)}
                  className="flex items-center justify-between w-full p-4 text-left cursor-pointer transition-colors hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>
                        Guia de Hardware: Como Garantir Impressão Instantânea
                      </span>
                      <span className="text-[9px] text-gray-500 block mt-0.5">
                        {isHardwareGuideOpen ? 'Clique para fechar o guia de hardware' : 'Clique para abrir o guia de hardware e conexões recomendadas'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold transition-transform duration-200 ${isHardwareGuideOpen ? 'rotate-180 text-[#18F2A4]' : 'text-gray-500'}`}>
                    ▼
                  </span>
                </button>

                {isHardwareGuideOpen && (
                  <div className="p-4 border-t flex flex-col gap-4 text-[11px] leading-relaxed text-gray-400" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    <div className="flex flex-col gap-3.5">
                      {/* Option 1: USB */}
                      <div className="flex gap-2.5 items-start">
                        <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 shrink-0">
                          <Usb className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block text-amber-400">
                            USB (Frente de Caixa / Balcão) — ULTRA-ESTÁVEL
                          </span>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Como funciona:</strong> Cabo físico ligado direto do computador à impressora térmica.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Por que escolher:</strong> É 100% confiável, imune a interferências de sinal e possui impressão instantânea de alta velocidade. Recomendado para o terminal de caixa principal usando o modo <strong>"Diálogo do Sistema"</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Ethernet / Network */}
                      <div className="flex gap-2.5 items-start">
                        <div className="p-1.5 rounded bg-[#18F2A4]/10 text-[#18F2A4] shrink-0">
                          <Wifi className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block text-[#18F2A4]">
                            Rede/Ethernet (Cozinha & Bar) — O MELHOR PARA A PRODUÇÃO 🏆
                          </span>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Como funciona:</strong> Cabo de rede ligando a impressora direto no roteador Wi-Fi do estabelecimento.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Por que escolher:</strong> Permite que múltiplos tablets, celulares dos garçons ou computadores enviem pedidos ao mesmo tempo para a mesma impressora na cozinha ou bar. Tem altíssima velocidade e cobre grandes distâncias sem perda de sinal.
                          </p>
                        </div>
                      </div>

                      {/* Option 3: Bluetooth */}
                      <div className="flex gap-2.5 items-start">
                        <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 shrink-0">
                          <Bluetooth className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block text-sky-400">
                            Bluetooth (Celulares e Tablets) — PRÁTICO & SEM FIOS
                          </span>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Passo a passo rápido:</strong> Ative o Bluetooth do celular/tablet → Procure novos dispositivos e pareie a impressora térmica (geralmente senha <code className="bg-gray-800 text-gray-300 px-1 py-0.2 rounded font-mono text-[9px]">0000</code> ou <code className="bg-gray-800 text-gray-300 px-1 py-0.2 rounded font-mono text-[9px]">1234</code>) → Ative o modo <strong>"ESC/POS Bluetooth"</strong> no painel.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            <strong className="text-gray-300">Atenção:</strong> Ótimo para operadores móveis, mas o aparelho deve ficar a menos de 10 metros da impressora para evitar quedas de transmissão.
                          </p>
                        </div>
                      </div>

                      {/* Pro-Tip banner */}
                      <div className="p-2.5 rounded-lg border border-[#18F2A4]/20 bg-[#18F2A4]/5 text-[10px] text-[#18F2A4] font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>
                          Dica de Produção: Quando você lança um produto no Caixa ou Comanda, ele é enviado automaticamente para a fila correspondente à categoria! Garanta que a impressora correspondente esteja marcada como "Ativo" acima.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Live Monospace Ticket Preview (Right Column) */}
            <div className="xl:col-span-5 flex flex-col gap-3 items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 self-start">
                <Sparkles className="w-3.5 h-3.5 text-[#18F2A4]" />
                Visualização da Bobina (Tempo Real)
              </span>
              
              {/* Monospace virtual receipt scroll container */}
              <div 
                className={`p-5 rounded-2xl relative shadow-lg overflow-hidden flex flex-col gap-3 font-mono border-t-[8px] border-dashed border-[#DDD] ${
                  theme === 'dark' ? 'bg-white text-black' : 'bg-gray-150 text-gray-900 border-gray-300'
                }`}
                style={{ 
                  fontFamily: '"Courier New", Courier, monospace',
                  maxWidth: paperSize === '58mm' ? '280px' : '360px',
                  width: '100%'
                }}
              >
                {activeReceiptText ? (
                  <pre 
                    className="text-[10px] leading-tight text-left whitespace-pre-wrap break-all font-mono"
                    style={{ fontFamily: '"Courier New", Courier, monospace', margin: 0, padding: 0 }}
                  >
                    {activeReceiptText}
                  </pre>
                ) : (
                  <>
                    {/* Simulated jagged zig-zag bottom paper tear using linear gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x bg-[linear-gradient(45deg,transparent_33.333%,#ccc_33.333%,#ccc_66.666%,transparent_66.666%)] bg-[size:8px_8px] opacity-20" />

                    {/* Simulated Print Header */}
                    <div className="text-center text-[10px] leading-snug whitespace-pre-line border-b border-dashed border-gray-400 pb-2 mb-1 uppercase font-bold">
                      {headerText || 'ADEGA CENTRAL'}
                    </div>

                    {/* Simulated Ticket Meta */}
                    <div className="text-[10px] leading-tight text-left flex flex-col gap-0.5 border-b border-dashed border-gray-400 pb-2 mb-1">
                      <span>DATA: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-extrabold uppercase">MESA: MESA 12 (SIMULAÇÃO)</span>
                      <span>ATENDENTE: MARCOS GARÇOM</span>
                    </div>

                    {/* Order products list */}
                    <div className="text-[10px] leading-snug flex flex-col gap-1 border-b border-dashed border-gray-400 pb-2 mb-1">
                      <div className="flex justify-between font-bold">
                        <span>QTD PRODUTO</span>
                        <span>VALOR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2x VINHO CONCHA Y TORO</span>
                        <span>R$ 118,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x BATATA FRITA GRANDE</span>
                        <span>R$  42,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3x CERVEJA ORIGINAL 600ML</span>
                        <span>R$  45,00</span>
                      </div>
                    </div>

                    {/* Math Totals */}
                    <div className="text-[10px] leading-snug flex flex-col gap-0.5 border-b border-dashed border-gray-400 pb-2 mb-1">
                      <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>R$ 205,00</span>
                      </div>
                      <div className="flex justify-between font-black text-xs">
                        <span>TOTAL GERAL:</span>
                        <span>R$ 205,00</span>
                      </div>
                    </div>

                    {/* Optional duplicate copy display */}
                    {autoDuplicate && (
                      <div className="text-[8px] text-gray-500 text-center border-b border-dashed border-gray-400 pb-2 mb-1 font-bold tracking-widest uppercase">
                        *** VIA COZINHA (DUPLICATA) ***
                      </div>
                    )}

                    {/* Footer and non-fiscal tag */}
                    <div className="text-center text-[10px] leading-snug whitespace-pre-line pb-1 uppercase font-bold">
                      {footerText || 'CUPOM NÃO FISCAL'}
                    </div>

                    {/* Extra feed margin lines spacing representation */}
                    <div className="flex flex-col">
                      {Array.from({ length: extraFeed }).map((_, i) => (
                        <div key={i} className="text-[10px] leading-tight text-gray-400 select-none text-center">
                          &nbsp;
                        </div>
                      ))}
                    </div>

                    {/* Cut line decoration if auto-cut active */}
                    {autoCut && (
                      <div className="border-t border-dashed border-red-500 relative pt-1 mt-1 text-[8px] text-red-500 text-center font-bold font-sans tracking-wide uppercase">
                        ✂----- CORTE AUTOMÁTICO GUILHOTINA -----
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleTriggerTestPrint}
                disabled={isTestPrinting}
                className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isTestPrinting
                    ? 'bg-amber-500/25 border-amber-500/40 text-amber-400 animate-pulse'
                    : theme === 'dark'
                      ? 'bg-black border-[#222] text-[#18F2A4] hover:bg-[#111] hover:border-[#18F2A4]/40'
                      : 'bg-white border-gray-200 text-sky-600 hover:bg-gray-100 hover:border-sky-300'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestPrinting ? 'animate-spin' : ''}`} />
                {isTestPrinting ? 'Imprimindo Cupom de Teste...' : 'Imprimir Cupom de Teste'}
              </button>
            </div>

          </div>
        </div>

        {/* Box 3: Preferences / Theme (Requested replacement for header toggle) */}
        <div className={`p-4 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Aparência & Preferências Visuais</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
            <div>
              <span className="text-xs font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Tema de Cores do Painel</span>
              <span className="text-[10px] text-gray-500">Alterne entre o tema escuro operacional e o tema claro para escritório.</span>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-black border-[#222] text-amber-400 hover:bg-[#111]'
                  : 'bg-white border-gray-200 text-violet-600 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <ToggleRight className="w-5 h-5 text-[#18F2A4]" />
                  <span>Tema Escuro (Recomendado)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                  <span>Tema Claro</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Box 4: Production Readiness / PWA Install / Chrome Shortcut */}
        <div className={`rounded-xl border flex flex-col overflow-hidden lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          {/* Collapsible Header */}
          <button
            type="button"
            onClick={() => setIsInstallGuideOpen(!isInstallGuideOpen)}
            className="flex items-center justify-between w-full p-4 text-left cursor-pointer transition-colors hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#18F2A4]" />
              <div>
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider block">
                  Acesso de Produção (Modo Frente de Caixa / PDV)
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {isInstallGuideOpen ? 'Clique para fechar o guia de instalação' : 'Clique para abrir o guia de instalação do AdegaOS como App nativo (tela cheia)'}
                </span>
              </div>
            </div>
            <span className={`text-xs font-bold transition-transform duration-200 ${isInstallGuideOpen ? 'rotate-180 text-[#18F2A4]' : 'text-gray-500'}`}>
              ▼
            </span>
          </button>

          {isInstallGuideOpen && (
            <div className="p-4 border-t flex flex-col md:flex-row gap-5 items-start border-dashed" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-xs font-bold block" style={{ color: theme === 'dark' ? 'white' : '#111' }}>Como Instalar o AdegaOS como App no seu Windows/Mac/Linux</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Para rodar o sistema em tela cheia dedicada e de forma ultra-rápida (sem barra de abas ou navegação do navegador), instale o atalho nativo usando o Google Chrome.
                </p>

                {deferredPrompt ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleTriggerInstall}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                        theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Instalar AdegaOS Oficial (Atalho do Chrome)
                    </button>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Seu navegador Google Chrome é compatível para instalação direta!</span>
                  </div>
                ) : isAppInstalled ? (
                  <div className="p-2.5 rounded-lg border bg-emerald-950/15 border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 mt-2">
                    <span>✓ AdegaOS já está rodando em Modo Standalone / Instalado com sucesso!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Passo a Passo Manual (Recomendado para Chrome/Edge):</span>
                    <ol className="list-decimal list-inside text-[11px] text-gray-300 space-y-1.5 pl-1" style={{ color: theme === 'dark' ? '#DDD' : '#444' }}>
                      <li>No canto superior direito do seu Chrome, clique nos <strong>Três Pontinhos (Menu)</strong>.</li>
                      <li>Vá em <strong>Salvar e Compartilhar</strong> ou <strong>Mais Ferramentas</strong>.</li>
                      <li>Clique em <strong>Criar Atalho...</strong></li>
                      <li>Marque a opção <strong>"Abrir como janela"</strong> (Importante para rodar sem barras do Chrome!).</li>
                      <li>Clique em <strong>Criar</strong>. Pronto! O ícone do AdegaOS estará na sua Área de Trabalho para uso em produção real.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Visual indicators for standalone POS */}
              <div className={`p-3 rounded-xl border flex flex-col gap-2 w-full md:w-56 shrink-0 text-[10px] leading-snug ${
                theme === 'dark' ? 'bg-[#080808] border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
              }`}>
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Vantagens do Modo Janela / PDV</span>
                <div className="flex flex-col gap-2 text-gray-400">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Desempenio Otimizado:</strong> Abre instantaneamente sem carregar extensões do Chrome.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Foco do Atendente:</strong> Impede que o garçom ou operador feche a aba acidentalmente ou mude de site.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Visual de Aplicativo:</strong> Ocupa 100% da tela do computador, integrando com teclados físicos.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* User PIN Add Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border flex flex-col p-4 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Key className="w-4 h-4 text-[#18F2A4]" />
                Habilitar Novo PIN Operacional
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Nome do Funcionário *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Garçom"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">PIN Secreto (4 dígitos) *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Ex: 8888"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    className="p-2 rounded border focus:outline-none font-mono text-center tracking-widest font-bold"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Nível de Acesso (Cargo)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="p-2 rounded border focus:outline-none"
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

              <div className="flex gap-2 justify-end pt-2 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
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
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
