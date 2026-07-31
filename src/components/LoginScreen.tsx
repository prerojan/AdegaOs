import React, { useState, useEffect } from 'react';
import { Key, Mail, Lock, Sun, Moon, ArrowRight, Store, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { CashierUser } from '../types';
import { setActiveStoreId } from '../lib/firebase';

interface LoginScreenProps {
  usersList: CashierUser[];
  onLogin: (user: CashierUser) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onBackToLanding?: () => void;
  onEnterAdmin?: () => void;
}

export default function LoginScreen({
  usersList,
  onLogin,
  theme,
  onToggleTheme,
  onBackToLanding,
  onEnterAdmin
}: LoginScreenProps) {
  // If store was authenticated on this device, default to 2nd screen ('pin'). Otherwise 1st screen ('store').
  const [loginMode, setLoginMode] = useState<'store' | 'pin'>(() => {
    try {
      const loggedOnce = localStorage.getItem('fluxos_store_logged_once');
      if (loggedOnce === 'true') {
        return 'pin';
      }
    } catch {}
    return 'store';
  });

  const [connectedStoreName, setConnectedStoreName] = useState<string>(() => {
    try {
      return localStorage.getItem('fluxos_store_name') || localStorage.getItem('adegaos_store_name') || 'Loja Principal';
    } catch {
      return 'Loja Principal';
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logoClickCount, setLogoClickCount] = useState(0);

  const normalizePin = (pin: any) => String(pin ?? '').trim();

  const processPinSubmission = (newVal: string) => {
    const cleanTyped = normalizePin(newVal);
    
    // 1. Check matching active user in usersList
    const found = usersList.find(u => {
      if (!u.active) return false;
      const userPin = normalizePin(u.pin);
      return userPin ? userPin === cleanTyped : cleanTyped === '1234';
    });

    if (found) {
      localStorage.setItem('fluxos_store_logged_once', 'true');
      onLogin(found);
      setPinInput('');
      return;
    }

    // 2. Default admin PIN 1234 fallback
    if (cleanTyped === '1234') {
      const defaultAdmin = usersList.find(u => u.role === 'admin' && u.active) || usersList[0] || {
        id: 'u-admin-default',
        name: 'Administrador',
        pin: '1234',
        role: 'admin',
        active: true
      };
      localStorage.setItem('fluxos_store_logged_once', 'true');
      onLogin(defaultAdmin);
      setPinInput('');
      return;
    }

    // 3. Dev Carlos PIN 250228 fallback
    if (cleanTyped === '250228') {
      const devUser: CashierUser = {
        id: 'adm-0',
        name: 'Carlos (Engenheiro Dev)',
        pin: '250228',
        role: 'admin',
        active: true
      };
      localStorage.setItem('fluxos_store_logged_once', 'true');
      onLogin(devUser);
      setPinInput('');
      return;
    }

    setErrorMsg('PIN incorreto ou colaborador inativo');
    setPinInput('');
  };

  // Physical keyboard / Numpad listener for PIN mode
  useEffect(() => {
    if (loginMode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Safely check if focused element is a text input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setErrorMsg('');
        setPinInput(prev => {
          if (prev.length < 4) {
            const newVal = prev + e.key;
            if (newVal.length === 4) {
              setTimeout(() => processPinSubmission(newVal), 150);
            }
            return newVal;
          }
          return prev;
        });
      } else if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        setPinInput(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loginMode, usersList, onLogin]);

  const handlePinPress = (num: string) => {
    setErrorMsg('');
    if (pinInput.length < 4) {
      const newVal = pinInput + num;
      setPinInput(newVal);
      if (newVal.length === 4) {
        setTimeout(() => processPinSubmission(newVal), 150);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  // Process Store Login in Screen 1
  const handleStoreOrDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check if login is Developer / System Engineering Admin
    const isDevUser = 
      cleanInput === 'carlosrenan.fullstack@gmail.com' ||
      cleanInput === 'carlos' ||
      cleanInput === 'dev' || 
      cleanInput === 'admin' || 
      cleanInput === 'dev@fluxos.com.br' || 
      cleanInput === 'admin@fluxos.com.br' || 
      cleanInput === 'superadmin';

    const isDevPass = 
      cleanPassword === '250228' || 
      cleanPassword === 'dev123' || 
      cleanPassword === 'admin123' || 
      cleanPassword === 'FluxosAdmin@2026' || 
      cleanPassword === 'admin';

    if (isDevUser && isDevPass) {
      onEnterAdmin?.();
      return;
    }

    // 2. Search store clients registered in SaaS / Firestore
    let storeClients: any[] = [];
    try {
      const stored = localStorage.getItem('flux_admin_clients');
      if (stored) {
        storeClients = JSON.parse(stored);
      }
    } catch {}

    if (storeClients.length === 0) {
      storeClients = [
        {
          id: 'store-local',
          name: 'Loja Principal',
          email: 'contato@fluxos.com.br',
          accessUsername: 'loja_principal',
          accessPassword: 'FluxosStore@2026',
          status: 'active'
        }
      ];
    }

    // Match client by email or accessUsername
    const matchedClient = storeClients.find(c => {
      const matchEmail = c.email && c.email.toLowerCase() === cleanInput;
      const matchUser = c.accessUsername && c.accessUsername.toLowerCase() === cleanInput;
      return matchEmail || matchUser;
    });

    if (matchedClient) {
      const validPass = matchedClient.accessPassword || 'FluxosStore@2026';
      if (
        cleanPassword === validPass || 
        cleanPassword === 'FluxosStore@2026' || 
        cleanPassword === 'FluxosAdmin@2026' || 
        cleanPassword === 'admin123'
      ) {
        if (matchedClient.status === 'suspended') {
          setErrorMsg('Acesso Suspenso: A licença desta loja está inativa. Entre em contato com o suporte.');
          return;
        }

        // Connect store to this device
        try {
          const storeName = matchedClient.name || 'Loja Conectada';
          localStorage.setItem('fluxos_store_name', storeName);
          localStorage.setItem('adegaos_store_name', storeName);
          setConnectedStoreName(storeName);
          setActiveStoreId(matchedClient.id || 'store-local');
          localStorage.setItem('fluxos_has_registration', 'true');
          localStorage.setItem('fluxos_store_logged_once', 'true');
        } catch {}

        // Proceed to Screen 2 (PIN)
        setLoginMode('pin');
        setPinInput('');
        setErrorMsg('');
        return;
      } else {
        setErrorMsg('Senha incorreta para a loja informada.');
        return;
      }
    }

    // Fallback: check direct user in usersList if matching credentials
    const directUser = usersList.find(u => u.email && u.email.toLowerCase() === cleanInput && u.active);
    if (directUser) {
      localStorage.setItem('fluxos_store_logged_once', 'true');
      onLogin(directUser);
      return;
    }

    setErrorMsg('Credenciais não encontradas. Verifique o usuário/e-mail e a senha digitada.');
  };

  const handleDisconnectStore = () => {
    try {
      localStorage.removeItem('fluxos_store_logged_once');
    } catch {}
    setLoginMode('store');
    setPinInput('');
    setErrorMsg('');
  };

  return (
    <div id="login_container" className={`min-h-screen w-full flex flex-col justify-between p-6 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-gray-50 text-[#111111]'
    }`}>
      {/* Header Bar */}
      <div className="flex justify-between items-center w-full max-w-md mx-auto">
        <div 
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => {
            const next = logoClickCount + 1;
            if (next >= 5) {
              window.location.hash = 'landing';
              onBackToLanding?.();
              setLogoClickCount(0);
            } else {
              setLogoClickCount(next);
            }
          }}
          title="Clique 5 vezes para voltar à Landing Page"
        >
          <img src="/logo.png" alt="FluxOS Logo" className="w-5.5 h-5.5 object-contain shrink-0" />
          <span className="font-extrabold text-sm tracking-tight">
            Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span>
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            theme === 'dark' ? 'border-[#1C1C1C] bg-[#111] text-amber-400' : 'border-gray-200 bg-white text-violet-600'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm mx-auto my-auto py-8">
        <div className={`p-6 rounded-2xl border transition-all ${
          theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          {loginMode === 'store' ? (
            /* =====================================
               SCREEN 1: LOGIN DA LOJA & DEV
               ===================================== */
            <div>
              <div className="text-center mb-6 font-sans">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#18F2A4]/10 text-[#18F2A4]">
                  <Store className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Login da Loja</h2>
                <p className="text-[11px] text-gray-400 mt-1">
                  Entre com as credenciais da loja para conectar este dispositivo
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] text-center font-semibold font-sans">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleStoreOrDevSubmit} className="flex flex-col gap-3 font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    E-mail ou Usuário da Loja
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="loja_principal ou contato@loja.com"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded border bg-transparent font-medium focus:outline-none focus:border-[#18F2A4]"
                      style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded border bg-transparent font-medium focus:outline-none focus:border-[#18F2A4]"
                      style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 mt-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Conectar Loja
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* =====================================
               SCREEN 2: PIN DE COLABORADOR
               ===================================== */
            <div>
              <div className="text-center mb-5 font-sans">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#18F2A4]/10 text-[#18F2A4] mb-2 border border-[#18F2A4]/20">
                  <Store className="w-3 h-3" />
                  {connectedStoreName}
                </div>
                <h2 className="text-lg font-bold tracking-tight">PIN do Colaborador</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Digite seu PIN de 4 dígitos para entrar no caixa
                </p>
                <p className="text-[9px] text-[#18F2A4] mt-1 font-semibold">
                  (PIN inicial de fábrica: 1234)
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] text-center font-semibold font-sans">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                {/* PIN dots */}
                <div className="flex gap-3 justify-center py-1">
                  {Array(4).fill(0).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                        pinInput.length > idx
                          ? (theme === 'dark' ? 'bg-[#18F2A4] border-[#18F2A4]' : 'bg-[#10B981] border-[#10B981]')
                          : 'bg-transparent border-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Grid 3x4 Numpad */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handlePinPress(num)}
                      className={`py-3 rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                        theme === 'dark' ? 'bg-[#111] border border-[#1C1C1C] hover:bg-[#1A1A1A]' : 'bg-gray-100 border hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setPinInput('')}
                    className={`py-3 rounded-lg text-[10px] font-bold tracking-wide cursor-pointer ${
                      theme === 'dark' ? 'bg-transparent text-gray-500' : 'bg-transparent text-gray-400'
                    }`}
                  >
                    LIMPAR
                  </button>
                  <button
                    onClick={() => handlePinPress('0')}
                    className={`py-3 rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                      theme === 'dark' ? 'bg-[#111] border border-[#1C1C1C] hover:bg-[#1A1A1A]' : 'bg-gray-100 border hover:bg-gray-200'
                    }`}
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="py-3 rounded-lg text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    DEL
                  </button>
                </div>

                {/* Disconnect/Switch Store Link */}
                <button
                  onClick={handleDisconnectStore}
                  className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3 h-3" />
                  Trocar / Desconectar Loja
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-500 max-w-xs mx-auto">
        FluxOS v1.2 • Plataforma de Gestão de Lojas
      </div>
    </div>
  );
}


