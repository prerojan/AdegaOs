import React, { useState } from 'react';
import { Settings, Users, Store, ShieldAlert, Key, Plus, Save, ToggleLeft, ToggleRight, X, Trash2, Shield, Download, Laptop } from 'lucide-react';
import { CashierUser } from '../types';

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
        <div className={`p-4 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
            <Laptop className="w-4 h-4 text-[#18F2A4]" />
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Acesso de Produção (Modo Frente de Caixa / PDV)</span>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-start">
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
                  <span><strong>Desempenho Otimizado:</strong> Abre instantaneamente sem carregar extensões do Chrome.</span>
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
