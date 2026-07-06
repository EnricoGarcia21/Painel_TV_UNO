import { useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Mock bypass for specified admin credentials
    if (email.trim() === 'enricogarcia@unoeste.br' && password === 'uno!este2026') {
      localStorage.setItem('uno_mock_session', 'true');
      window.location.reload();
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Por favor, tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Por favor, confirme seu e-mail antes de fazer login.');
        } else {
          setErrorMessage(error.message);
        }
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao tentar realizar o login. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl flex flex-col gap-6 z-10 mx-4"
      >
        {/* Back button */}
        <div>
          <button
            onClick={() => window.location.hash = '#/'}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel Público
          </button>
        </div>

        {/* Logo and Header */}
        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            Painel Unoeste
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight font-display">
            Acesso Administrativo
          </h2>
          <p className="text-sm text-slate-400">
            Entre com suas credenciais para gerenciar o painel comercial.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs font-medium leading-relaxed"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email input */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-300">
              E-mail corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-bold text-slate-300">
                Senha
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-700/50 disabled:to-teal-700/50 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-emerald-500/10 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <LogIn className="w-4.5 h-4.5" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
