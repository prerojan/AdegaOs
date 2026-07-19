import React, { useState, useEffect } from 'react';
import { Key, Mail, Lock, Sparkles, Sun, Moon, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { CashierUser } from '../types';

interface LoginScreenProps {
  usersList: CashierUser[];
  onLogin: (user: CashierUser) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function LoginScreen({
  usersList,
  onLogin,
  theme,
  onToggleTheme
}: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'pin' | 'credentials'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Physical keyboard / Numpad listener for PIN mode
  useEffect(() => {
    if (loginMode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Safely check if focused element is a text input (avoid breaking input typing elsewhere, if any)
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
              // Auto-authenticate when 4 digits are completed
              setTimeout(() => {
                const found = usersList.find(u => u.pin === newVal && u.active);
                if (found) {
                  onLogin(found);
                  setPinInput('');
                } else {
                  setErrorMsg('PIN inválido ou funcionário inativo');
                  setPinInput('');
                }
              }, 200);
            }
            return newVal;
          }
          return prev;
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPinInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        setPinInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loginMode, usersList, onLogin]);

  // Auto-fill demo credentials helper
  const handleDemoCredentials = (role: 'manager' | 'waiter' | 'kitchen' | 'bar') => {
    setErrorMsg('');
    if (role === 'manager') {
      setLoginMode('credentials');
      setEmail('gerente@adegaos.com.br');
      setPassword('admin123');
    } else {
      setLoginMode('pin');
      const pins = { waiter: '3333', kitchen: '7777', bar: '8888' };
      setPinInput(pins[role]);
      setTimeout(() => {
        const found = usersList.find(u => u.pin === pins[role] && u.active);
        if (found) onLogin(found);
      }, 300);
    }
  };

  const handlePinPress = (num: string) => {
    setErrorMsg('');
    if (pinInput.length < 4) {
      const newVal = pinInput + num;
      setPinInput(newVal);
      if (newVal.length === 4) {
        // Auto-authenticate when 4 digits are completed
        setTimeout(() => {
          const found = usersList.find(u => u.pin === newVal && u.active);
          if (found) {
            onLogin(found);
            setPinInput('');
          } else {
            setErrorMsg('PIN inválido ou funcionário inativo');
            setPinInput('');
          }
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check manager email and password (mock verification)
    if (email === 'gerente@adegaos.com.br' && password === 'admin123') {
      const managerUser = usersList.find(u => u.role === 'manager' || u.role === 'admin');
      if (managerUser) {
        onLogin(managerUser);
      } else {
        setErrorMsg('Erro de sistema: usuário gerente não encontrado');
      }
    } else {
      setErrorMsg('E-mail ou senha incorretos. Use o botão demo ou gerente@adegaos.com.br / admin123');
    }
  };

  return (
    <div id="login_container" className={`min-h-screen w-full flex flex-col justify-between p-6 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-gray-50 text-[#111111]'
    }`}>
      {/* Upper header */}
      <div className="flex justify-between items-center w-full max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#18F2A4]" />
          <span className="font-extrabold text-sm tracking-tight">Adega<span className="text-[#18F2A4]">OS</span></span>
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

      {/* Main card box */}
      <div className="w-full max-w-sm mx-auto my-auto py-8">
        <div className={`p-6 rounded-2xl border transition-all ${
          theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          {/* Top Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-tight">Entrar no AdegaOS</h2>
            <p className="text-[11px] text-gray-400 mt-1">Selecione o seu método de acesso operacional</p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 p-1 rounded-lg border mb-5 gap-1" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <button
              onClick={() => { setLoginMode('pin'); setErrorMsg(''); }}
              className={`text-[11px] py-1.5 rounded font-semibold transition-all cursor-pointer ${
                loginMode === 'pin'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-500 text-white')
                  : 'text-gray-400'
              }`}
            >
              PIN de Colaborador
            </button>
            <button
              onClick={() => { setLoginMode('credentials'); setErrorMsg(''); }}
              className={`text-[11px] py-1.5 rounded font-semibold transition-all cursor-pointer ${
                loginMode === 'credentials'
                  ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-500 text-white')
                  : 'text-gray-400'
              }`}
            >
              E-mail de Gestão
            </button>
          </div>

          {/* Error visual feedback */}
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] text-center font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Render Active Login Screen Form */}
          {loginMode === 'pin' ? (
            /* PIN Numpad view */
            <div className="flex flex-col items-center gap-4">
              {/* PIN circles dots */}
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

              {/* Grid 3x4 layout */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-2">
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
            </div>
          ) : (
            /* Email & Password credentials form view */
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">E-mail Administrativo</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gerente@adegaos.com.br"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded border bg-transparent font-medium focus:outline-none focus:border-[#18F2A4]"
                    style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Senha de Acesso</label>
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
                Autenticar Painel
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Demo Fast Sandbox Login Shortcuts */}
        <div className={`mt-5 p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
          theme === 'dark' ? 'bg-[#040404] border-[#1C1C1C]' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center gap-1 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#18F2A4]" />
            Atalhos para Simulação de Perfis:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoCredentials('manager')}
              className={`p-2 rounded border text-[10px] font-semibold text-left transition-all hover:bg-[#111]/40 cursor-pointer ${
                theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-300 bg-white'
              }`}
            >
              💼 <span className="font-bold">Vanessa (Gerente)</span>
              <span className="block text-[8px] text-gray-400 mt-0.5">Painel Geral (admin123)</span>
            </button>
            <button
              onClick={() => handleDemoCredentials('waiter')}
              className={`p-2 rounded border text-[10px] font-semibold text-left transition-all hover:bg-[#111]/40 cursor-pointer ${
                theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-300 bg-white'
              }`}
            >
              📱 <span className="font-bold">João (Garçom)</span>
              <span className="block text-[8px] text-gray-400 mt-0.5">Lançamento PWA (PIN 3333)</span>
            </button>
            <button
              onClick={() => handleDemoCredentials('kitchen')}
              className={`p-2 rounded border text-[10px] font-semibold text-left transition-all hover:bg-[#111]/40 cursor-pointer ${
                theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-300 bg-white'
              }`}
            >
              🍳 <span className="font-bold">Ana (Cozinha)</span>
              <span className="block text-[8px] text-gray-400 mt-0.5">Fila de Comida (PIN 7777)</span>
            </button>
            <button
              onClick={() => handleDemoCredentials('bar')}
              className={`p-2 rounded border text-[10px] font-semibold text-left transition-all hover:bg-[#111]/40 cursor-pointer ${
                theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-300 bg-white'
              }`}
            >
              🍺 <span className="font-bold">Felipe (Barman)</span>
              <span className="block text-[8px] text-gray-400 mt-0.5">Fila de Bebidas (PIN 8888)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-[10px] text-gray-500 max-w-xs mx-auto">
        AdegaOS v1.2 • Todos os direitos reservados.
      </div>
    </div>
  );
}
