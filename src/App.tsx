import { useState, useEffect, Component, useRef, useMemo } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  Settings,
  ArrowLeft,
  RefreshCw,
  Plus,
  Megaphone,
  LogOut,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

// Custom APIs, Utilities & Components
import { 
  fetchDashboardData, 
  saveDashboardData, 
  resetDashboardData, 
  setSimulationEnabled, 
  getSimulationEnabled,
  adjustDailySales
} from './api/mockData';
import type { Consultant, DashboardData, Announcement } from './api/mockData';
import { supabase } from './api/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { cn } from './lib/utils';
import { Card, CardContent } from './components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/Dialog';
import { AnnouncementCarousel } from './components/ui/AnnouncementCarousel';
import Login from './components/Login';
import DashboardTotals from './components/DashboardTotals';

export const formatCourseName = (name: string) => {
  return name
    .replace(/_/g, ' ')
    .replace(/\s*-\s*EAD/i, '')
    .split(' ')
    .map(word => {
      if (!word) return '';
      const lower = word.toLowerCase();
      if (['de', 'da', 'do', 'e', 'para', 'o', 'com', 'social'].includes(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function DashboardContent() {
  const [time, setTime] = useState(new Date());
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');

  // Fetch data using React Query (auto-updates every 10 seconds to simulate real-time operations)
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData', selectedMonth],
    queryFn: () => fetchDashboardData(selectedMonth),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Carousel states
  const [activeTab, setActiveTab] = useState<'presencial' | 'presencial-cursos' | 'ead' | 'ead-cursos'>('presencial');
  const [timerProgress, setTimerProgress] = useState(0);
  const lastSwitchTimeRef = useRef(Date.now());

  // Top courses computation
  const topCourses = useMemo(() => {
    if (!data?.courses) return [];
    const courseType = activeTab.startsWith('presencial') ? 'presencial' : 'ead';
    const filtered = data.courses.filter(c => c.type === courseType);
    return [...filtered].sort((a, b) => b.sales - a.sales).slice(0, 10);
  }, [data, activeTab]);

  const todayDay = time.getDate(); // 1 to 31
  const currentYear = time.getFullYear();
  const currentMonth = time.getMonth();

  // Dynamic calculations for selected month weekdays (removing Sat/Sun)
  const [yearStr, monthIndexStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthIndexStr, 10) - 1; // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isCurrentMonth = currentYear === year && currentMonth === month;

  const weekdays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // exclude Sun (0) and Sat (6)
  });

  const presencialScrollRef = useRef<HTMLDivElement | null>(null);
  const eadScrollRef = useRef<HTMLDivElement | null>(null);
  const presencialCoursesScrollRef = useRef<HTMLDivElement | null>(null);
  const eadCoursesScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef(0);
  const isPausedRef = useRef(false);

  // Auto-scroll loop for active tab listing (Presencial, EAD, or Course list)
  useEffect(() => {
    // Reset scroll when tab changes
    scrollPosRef.current = 0;
    isPausedRef.current = false;

    let initialContainer: HTMLDivElement | null = null;
    if (activeTab === 'presencial') {
      initialContainer = presencialScrollRef.current;
    } else if (activeTab === 'presencial-cursos') {
      initialContainer = presencialCoursesScrollRef.current;
    } else if (activeTab === 'ead') {
      initialContainer = eadScrollRef.current;
    } else if (activeTab === 'ead-cursos') {
      initialContainer = eadCoursesScrollRef.current;
    }

    if (initialContainer) {
      initialContainer.scrollTop = 0;
    }

    let animationFrameId: number;
    const scrollSpeed = 0.35; // slower and smoother scroll speed for comfortable reading

    const scroll = () => {
      let container: HTMLDivElement | null = null;
      if (activeTab === 'presencial') {
        container = presencialScrollRef.current;
      } else if (activeTab === 'presencial-cursos') {
        container = presencialCoursesScrollRef.current;
      } else if (activeTab === 'ead') {
        container = eadScrollRef.current;
      } else if (activeTab === 'ead-cursos') {
        container = eadCoursesScrollRef.current;
      }

      if (!container) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      if (isPausedRef.current) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      if (maxScroll <= 0) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      scrollPosRef.current += scrollSpeed;

      if (scrollPosRef.current >= maxScroll) {
        scrollPosRef.current = maxScroll;
        container.scrollTop = Math.round(scrollPosRef.current);
        isPausedRef.current = true;
        
        // Pause at the bottom for 3s, then return to the first item
        setTimeout(() => {
          scrollPosRef.current = 0;
          let containerRef: HTMLDivElement | null = null;
          if (activeTab === 'presencial') {
            containerRef = presencialScrollRef.current;
          } else if (activeTab === 'presencial-cursos') {
            containerRef = presencialCoursesScrollRef.current;
          } else if (activeTab === 'ead') {
            containerRef = eadScrollRef.current;
          } else if (activeTab === 'ead-cursos') {
            containerRef = eadCoursesScrollRef.current;
          }

          if (containerRef) {
            containerRef.scrollTop = 0;
          }
          isPausedRef.current = false;
        }, 3000);
      } else {
        container.scrollTop = Math.round(scrollPosRef.current);
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    const startDelay = setTimeout(() => {
      animationFrameId = requestAnimationFrame(scroll);
    }, 2500); // pause at the top for 2.5s before starting

    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab, isLoading]);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Bulletproof 45 seconds timer for tab alternation
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSwitchTimeRef.current;
      const progress = (elapsed / 45000) * 100;
      
      if (progress >= 100) {
        lastSwitchTimeRef.current = Date.now();
        setTimerProgress(0);
        setActiveTab((current) => {
          if (current === 'presencial') return 'presencial-cursos';
          if (current === 'presencial-cursos') return 'ead';
          if (current === 'ead') return 'ead-cursos';
          return 'presencial';
        });
      } else {
        setTimerProgress(progress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: 'presencial' | 'presencial-cursos' | 'ead' | 'ead-cursos') => {
    setActiveTab(tab);
    lastSwitchTimeRef.current = Date.now();
    setTimerProgress(0);
  };

  const handleConsultantClick = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium animate-pulse">Carregando Painel Comercial...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-red-950 text-red-200">
        <div className="text-center p-8 glass-card border-red-500 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Erro de Carregamento</h2>
          <p className="mb-4">Não foi possível carregar os dados comerciais em tempo real.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 space-y-6 flex flex-col min-h-[95vh] justify-between">
      
      <div className="space-y-6 flex-1 flex flex-col justify-start">
        {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project')) && (
          <div className="w-full bg-amber-50 text-amber-900 border border-amber-200/80 px-5 py-3 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <span className="flex items-center gap-2">
              ⚠️ <strong>Modo de Demonstração Ativo:</strong> O painel está exibindo dados locais simulados pois as variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram configuradas nas chaves da Vercel.
            </span>
            <a 
              href="https://vercel.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] uppercase font-black tracking-wider transition shrink-0"
            >
              Configurar na Vercel
            </a>
          </div>
        )}

        {import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project') && data?.presencial?.ranking?.[0]?.sales === 45 && (
          <div className="w-full bg-blue-50 text-blue-900 border border-blue-200/80 px-5 py-3 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <span className="flex items-center gap-2">
              ℹ️ <strong>Banco de Dados Conectado (Sem Dados):</strong> O painel está conectado ao seu Supabase, mas as tabelas parecem estar vazias. O sistema está exibindo os dados padrões de demonstração.
            </span>
            <button 
              onClick={() => window.location.hash = '#/admin'}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] uppercase font-black tracking-wider transition shrink-0 cursor-pointer"
            >
              Ir para Admin & Redefinir
            </button>
          </div>
        )}
        {/* 1. Header (Glassmorphic Layout) */}
        <header className="glass-header rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border border-white/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#007b3f] to-[#78be20] flex items-center justify-center shadow-md select-none">
              <span className="text-white font-extrabold text-xl font-display">U</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display flex items-center gap-1">
                Painel <span className="text-[#007b3f]">Unoeste</span>
              </h1>
              <p className="text-sm text-slate-500 font-bold tracking-wider uppercase">Painel de Matrículas Comercial</p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/50">
              <span className="live-indicator inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Atualizações em Tempo Real</span>
            </div>

            {/* Consolidated periods view button */}
            <button
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200/50 transition text-xs font-bold uppercase cursor-pointer active:scale-95 shadow-2xs"
            >
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Consolidado
            </button>

            {/* Admin navigation button */}
            <button
              onClick={() => window.location.hash = '#/admin'}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition text-xs font-bold uppercase cursor-pointer active:scale-95"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              Painel Admin
            </button>
          </div>

          {/* Date, Time and Month Selector */}
          <div className="flex items-center gap-6 text-slate-700 font-medium">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50">
              <Calendar className="h-4 w-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="2026-06">Junho / 2026</option>
                <option value="2026-07">Julho / 2026</option>
              </select>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-xl font-extrabold font-mono text-slate-950">
                {format(time, 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </header>

        {/* 2. Announcements Banner Section */}
        <section className="w-full">
          <AnnouncementCarousel announcements={data.announcements} />
        </section>

        {/* 3. Carousel Tab Controller (Navigation + Progress countdown) */}
        <section className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 border border-slate-200/50 rounded-2xl p-2.5 shadow-2xs glass-card">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleTabChange('presencial')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-3xs",
                  activeTab === 'presencial' 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", activeTab === 'presencial' ? "bg-white animate-pulse" : "bg-emerald-500")}></span>
                Presencial (Agentes)
              </button>
              <button 
                onClick={() => handleTabChange('presencial-cursos')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-3xs",
                  activeTab === 'presencial-cursos' 
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-600/25" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", activeTab === 'presencial-cursos' ? "bg-white animate-pulse" : "bg-teal-500")}></span>
                Presencial (Cursos)
              </button>
              <button 
                onClick={() => handleTabChange('ead')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-3xs",
                  activeTab === 'ead' 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/25" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", activeTab === 'ead' ? "bg-white animate-pulse" : "bg-orange-500")}></span>
                EAD (Agentes)
              </button>
              <button 
                onClick={() => handleTabChange('ead-cursos')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-3xs",
                  activeTab === 'ead-cursos' 
                    ? "bg-orange-700 text-white shadow-md shadow-orange-650/25" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", activeTab === 'ead-cursos' ? "bg-white animate-pulse" : "bg-amber-500")}></span>
                EAD (Cursos)
              </button>
            </div>

            <div className="flex items-center gap-4 pr-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Próxima Rotação</span>
                <span className="text-xs font-mono font-extrabold text-slate-800">
                  Alternando em {Math.max(0, Math.ceil((30 * (100 - timerProgress)) / 100))}s
                </span>
              </div>
              <div className="w-32 bg-slate-200/50 h-3 rounded-full overflow-hidden border border-slate-200/20">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-100 ease-linear",
                    activeTab.startsWith('presencial') ? "bg-emerald-500" : "bg-orange-500"
                  )}
                  style={{ width: `${timerProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Active Card Panel with Slide Transition (AnimatePresence) */}
        <main className="relative overflow-hidden w-full flex-1 flex flex-col justify-stretch">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab.startsWith('presencial') ? -120 : 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab.startsWith('presencial') ? 120 : -120 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.05 }}
              className="w-full flex-1 flex flex-col justify-stretch"
            >
              {activeTab === 'presencial' ? (
                <Card className="w-full flex-1 flex flex-col justify-between glow-presencial border-green-200/40 p-2">
                  {/* Card Header */}
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                        Canal Físico
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-950 font-display mt-2">
                        Ranking Presencial Geral
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500 font-medium">Último fechamento</p>
                      <p className="text-sm font-bold text-emerald-600 font-mono flex items-center gap-1.5 justify-end">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {data.presencial.lastUpdate}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col gap-6 flex-1 w-full animate-fadeIn">
                    <div className="w-full space-y-4">
                      {/* Left: Consultants Table */}
                      <div className="w-full space-y-4 overflow-hidden">
                        <div className="flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-slate-500">
                          <p className="uppercase tracking-wider text-sm font-extrabold text-slate-700">Quadro Classificatório - Presencial</p>
                          <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200/50 font-extrabold shadow-2xs">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              {data.presencial.ranking.filter(c => c.status === 'active').length} Ativos
                            </span>
                            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200/50 font-extrabold shadow-2xs">
                              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                              {data.presencial.ranking.filter(c => c.status === 'vacation').length} Férias
                            </span>
                          </div>
                        </div>

                        <div 
                          ref={presencialScrollRef}
                          className="overflow-x-auto overflow-y-auto w-full max-h-[520px] rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-thin"
                        >
                          <table className="w-full min-w-[1400px] border-collapse text-left">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-3xs">
                              <tr className="text-slate-500 text-sm font-black uppercase tracking-wider">
                                <th className="py-4 px-4 font-black w-24 text-center">Pos</th>
                                <th className="py-4 px-4 font-black text-base">Consultor</th>
                                {weekdays.map((day) => (
                                  <th 
                                    key={day} 
                                    className={cn(
                                      "py-4 px-1.5 font-black text-center text-xs min-w-[36px] transition-colors duration-300 border-l border-slate-200/60",
                                      day === todayDay && isCurrentMonth && "text-emerald-700 bg-emerald-100/50 font-black ring-1 ring-emerald-500/20"
                                    )}
                                  >
                                    {day}
                                  </th>
                                ))}
                                <th className="py-4 px-4 font-black text-center w-28">Mês</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {data.presencial.ranking.map((consultant, idx) => (
                                <tr 
                                  key={consultant.id}
                                  onClick={() => handleConsultantClick(consultant)}
                                  className={cn(
                                    "group transition-colors cursor-pointer",
                                    idx % 2 === 0 ? "bg-white" : "bg-emerald-50/20",
                                    "hover:bg-emerald-50/60"
                                  )}
                                >
                                  <td className="py-4 px-4 text-center">
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black",
                                      consultant.rank === 1 ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400/80 shadow-xs" :
                                      consultant.rank === 2 ? "bg-slate-200 text-slate-900 ring-2 ring-slate-400/80 shadow-xs" :
                                      consultant.rank === 3 ? "bg-orange-100 text-orange-955 border-orange-300 shadow-xs" :
                                      "bg-slate-100/70 text-slate-600 border border-slate-200/30"
                                    )}>
                                      {consultant.rank}º
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-13 w-13 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-base text-emerald-800 border-2 border-emerald-100/60 shadow-3xs">
                                        {consultant.avatar}
                                      </div>
                                      <div>
                                        <p className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight">
                                          {consultant.name}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  {weekdays.map((day) => (
                                    <td 
                                      key={day} 
                                      className={cn(
                                        "py-4 px-1.5 text-center font-black text-base transition-colors duration-300 border-l border-slate-100",
                                        day === todayDay && isCurrentMonth ? "bg-emerald-50/40 text-emerald-800 font-black" : "text-slate-600"
                                      )}
                                    >
                                      {consultant.dailySales?.[selectedMonth]?.[day] ?? 0}
                                    </td>
                                  ))}
                                  <td className="py-4 px-4 text-center">
                                    <span className="text-lg font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200/50 shadow-3xs">
                                      {Object.values(consultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === 'presencial-cursos' ? (
                <Card className="w-full flex-1 flex flex-col justify-between glow-presencial border-green-200/40 p-2">
                  {/* Card Header */}
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                        Canal Físico
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-950 font-display mt-2">
                        Ranking Cursos Presenciais
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500 font-medium">Período selecionado</p>
                      <p className="text-sm font-bold text-emerald-600 font-mono">
                        {selectedMonth === '2026-06' ? 'Junho / 2026' : 'Julho / 2026'}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col gap-6 flex-1 w-full animate-fadeIn">
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <p className="uppercase tracking-wider text-sm font-extrabold text-slate-700">Top 10 Cursos Mais Matriculados</p>
                      </div>

                      <div ref={presencialCoursesScrollRef} className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm pr-1 max-h-[520px] overflow-y-auto scrollbar-thin">
                        <div className="divide-y divide-slate-100 min-w-[800px] p-2">
                          {topCourses.map((course, index) => {
                            const maxSales = topCourses[0]?.sales || 1;
                            const percentage = Math.round((course.sales / maxSales) * 100);
                            return (
                              <div key={course.id} className="flex items-center justify-between py-4 px-6 hover:bg-slate-50/50 transition-colors">
                                {/* Position, icon and name */}
                                <div className="flex items-center gap-6 w-1/3 shrink-0">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black shrink-0 shadow-3xs",
                                    index === 0 ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400/80 shadow-xs" :
                                    index === 1 ? "bg-slate-200 text-slate-900 ring-2 ring-slate-400/80 shadow-xs" :
                                    index === 2 ? "bg-orange-100 text-orange-950 border-orange-300 shadow-xs" :
                                    "bg-slate-100/70 text-slate-600 border border-slate-200/30"
                                  )}>
                                    {index + 1}º
                                  </span>
                                  <span className="text-xl font-black text-slate-900 tracking-tight">
                                    {formatCourseName(course.name)}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="flex-1 px-8">
                                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200/30">
                                    <div 
                                      className="h-full rounded-full bg-emerald-600 transition-all duration-500 shadow-3xs" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Total Sales */}
                                <div className="w-32 text-right shrink-0">
                                  <span className="text-2xl font-black text-emerald-800 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-250/50 shadow-3xs font-mono">
                                    {course.sales}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === 'ead' ? (
                <Card className="w-full flex-1 flex flex-col justify-between glow-ead border-orange-200/40 p-2">
                  {/* Card Header */}
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
                        Canal Digital
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-950 font-display mt-2">
                        Ranking EAD Geral
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500 font-medium">Último fechamento</p>
                      <p className="text-sm font-bold text-orange-600 font-mono flex items-center gap-1.5 justify-end">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                        {data.ead.lastUpdate}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col gap-6 flex-1 w-full animate-fadeIn">
                    <div className="w-full space-y-4">
                      <div className="flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-slate-500">
                        <p className="uppercase tracking-wider text-sm font-extrabold text-slate-700">Quadro Classificatório - EAD</p>
                        <div className="flex gap-3 text-xs">
                          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-800 px-3.5 py-1.5 rounded-full border border-orange-200/50 font-extrabold shadow-2xs">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                            {data.ead.ranking.filter(c => c.status === 'active').length} Ativos
                          </span>
                          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200/50 font-extrabold shadow-2xs">
                            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                            {data.ead.ranking.filter(c => c.status === 'vacation').length} Férias
                          </span>
                        </div>
                      </div>

                      <div 
                        ref={eadScrollRef}
                        className="overflow-x-auto overflow-y-auto w-full max-h-[520px] rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-thin"
                      >
                        <table className="w-full min-w-[1400px] border-collapse text-left">
                          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-3xs">
                            <tr className="text-slate-500 text-sm font-black uppercase tracking-wider">
                              <th className="py-4 px-4 font-black w-24 text-center">Pos</th>
                              <th className="py-4 px-4 font-black text-base">Consultor</th>
                              {weekdays.map((day) => (
                                <th 
                                  key={day} 
                                  className={cn(
                                    "py-4 px-1.5 font-black text-center text-xs min-w-[36px] transition-colors duration-300 border-l border-slate-200/60",
                                    day === todayDay && isCurrentMonth && "text-orange-700 bg-orange-100/50 font-black ring-1 ring-orange-500/20"
                                  )}
                                >
                                  {day}
                                </th>
                              ))}
                              <th className="py-4 px-4 font-black text-center w-28">Mês</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.ead.ranking.map((consultant, idx) => (
                              <tr 
                                key={consultant.id}
                                onClick={() => handleConsultantClick(consultant)}
                                className={cn(
                                  "group transition-colors cursor-pointer",
                                  idx % 2 === 0 ? "bg-white" : "bg-orange-50/25",
                                  "hover:bg-orange-50/60"
                                )}>
                                <td className="py-4 px-4 text-center">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black",
                                    consultant.rank === 1 ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400/80 shadow-xs" :
                                    consultant.rank === 2 ? "bg-slate-200 text-slate-900 ring-2 ring-slate-400/80 shadow-xs" :
                                    consultant.rank === 3 ? "bg-orange-100 text-orange-950 border-orange-300 shadow-xs" :
                                    "bg-slate-100/70 text-slate-600 border border-slate-200/30"
                                  )}>
                                    {consultant.rank}º
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-13 w-13 rounded-full bg-orange-50 flex items-center justify-center font-bold text-base text-orange-800 border-2 border-orange-100/60 shadow-3xs">
                                      {consultant.avatar}
                                    </div>
                                    <div>
                                      <p className="text-xl font-black text-slate-900 group-hover:text-orange-700 transition-colors tracking-tight">
                                        {consultant.name}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                {weekdays.map((day) => (
                                  <td 
                                    key={day} 
                                    className={cn(
                                      "py-4 px-1.5 text-center font-black text-base transition-colors duration-300 border-l border-slate-100",
                                      day === todayDay && isCurrentMonth ? "bg-orange-50/40 text-orange-800 font-black" : "text-slate-600"
                                    )}
                                  >
                                    {consultant.dailySales?.[selectedMonth]?.[day] ?? 0}
                                  </td>
                                ))}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-lg font-black text-orange-800 bg-orange-50 px-4 py-2 rounded-xl border border-orange-200/50 shadow-3xs">
                                    {Object.values(consultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full flex-1 flex flex-col justify-between glow-ead border-orange-200/40 p-2">
                  {/* Card Header */}
                  <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
                        Canal Digital
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-950 font-display mt-2">
                        Ranking Cursos EAD
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500 font-medium">Período selecionado</p>
                      <p className="text-sm font-bold text-orange-600 font-mono">
                        {selectedMonth === '2026-06' ? 'Junho / 2026' : 'Julho / 2026'}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col gap-6 flex-1 w-full animate-fadeIn">
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <p className="uppercase tracking-wider text-sm font-extrabold text-slate-700">Top 10 Cursos Mais Matriculados</p>
                      </div>

                      <div ref={eadCoursesScrollRef} className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm pr-1 max-h-[520px] overflow-y-auto scrollbar-thin">
                        <div className="divide-y divide-slate-100 min-w-[800px] p-2">
                          {topCourses.map((course, index) => {
                            const maxSales = topCourses[0]?.sales || 1;
                            const percentage = Math.round((course.sales / maxSales) * 100);
                            return (
                              <div key={course.id} className="flex items-center justify-between py-4 px-6 hover:bg-slate-50/50 transition-colors">
                                {/* Position, icon and name */}
                                <div className="flex items-center gap-6 w-1/3 shrink-0">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black shrink-0 shadow-3xs",
                                    index === 0 ? "bg-amber-100 text-amber-900 ring-2 ring-amber-400/80 shadow-xs" :
                                    index === 1 ? "bg-slate-200 text-slate-900 ring-2 ring-slate-400/80 shadow-xs" :
                                    index === 2 ? "bg-orange-100 text-orange-950 border-orange-300 shadow-xs" :
                                    "bg-slate-100/70 text-slate-600 border border-slate-200/30"
                                  )}>
                                    {index + 1}º
                                  </span>
                                  <span className="text-xl font-black text-slate-900 tracking-tight">
                                    {formatCourseName(course.name)}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="flex-1 px-8">
                                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200/30">
                                    <div 
                                      className="h-full rounded-full bg-orange-500 transition-all duration-500 shadow-3xs" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Total Sales */}
                                <div className="w-32 text-right shrink-0">
                                  <span className="text-2xl font-black text-orange-800 bg-orange-50 px-5 py-2.5 rounded-xl border border-orange-250/50 shadow-3xs font-mono">
                                    {course.sales}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 5. Detail view Dialog for Consultant Profile */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedConsultant && (
          <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-md border-slate-200">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white border-2",
                  selectedConsultant.id >= 100 
                    ? "bg-gradient-to-tr from-orange-500 to-amber-600 border-orange-200" 
                    : "bg-gradient-to-tr from-emerald-500 to-green-600 border-green-200"
                )}>
                  {selectedConsultant.avatar}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold font-display text-slate-900">
                    {selectedConsultant.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Perfil detalhado de {selectedConsultant.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Profile Statistics */}
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                
                {/* Ranking card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Classificação</span>
                  <p className="text-2xl font-extrabold text-indigo-700 mt-1 font-display">
                    {selectedConsultant.rank}º Lugar
                  </p>
                  <span className="text-[9px] text-slate-400 mt-0.5">Ranking Geral {selectedConsultant.id >= 100 ? 'EAD' : 'Presencial'}</span>
                </div>

                {/* Sales card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Matrículas no Mês</span>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1 font-display">
                    {Object.values(selectedConsultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <span className="text-[9px] text-slate-400 mt-0.5">Total Geral: {selectedConsultant.sales}</span>
                </div>

              </div>

              {/* Progress to personal target */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Atingimento da Meta Pessoal (Mês)</span>
                  <span className="text-slate-900">
                    {Math.round((Object.values(selectedConsultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0) / (selectedConsultant.id >= 100 ? 100 : 40)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      selectedConsultant.id >= 100 ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min((Object.values(selectedConsultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0) / (selectedConsultant.id >= 100 ? 100 : 40)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Mês: {Object.values(selectedConsultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}</span>
                  <span>Meta: {selectedConsultant.id >= 100 ? 100 : 40}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsDialogOpen(false)}
                className={cn(
                  "px-4 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95",
                  selectedConsultant.id >= 100 
                    ? "bg-orange-50 hover:bg-orange-600" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                Voltar ao Painel
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
}

function AdminContent() {
  const [time, setTime] = useState(new Date());
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  
  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData', selectedMonth],
    queryFn: () => fetchDashboardData(selectedMonth),
  });

  const [localData, setLocalData] = useState<DashboardData | null>(null);
  const [simulationEnabled, setSimulationEnabledState] = useState(getSimulationEnabled());

  // Announcement Form State
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<Announcement | null>(null);
  
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceDesc, setAnnounceDesc] = useState('');
  const [announceAuthor, setAnnounceAuthor] = useState('');
  const [announceType, setAnnounceType] = useState<'info' | 'warning' | 'success' | 'alert'>('info');
  const [announceDate, setAnnounceDate] = useState('');

  // Daily Sales Edit State
  const [editingDailyAgent, setEditingDailyAgent] = useState<Consultant | null>(null);

  // Access Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminStatusMessage, setAdminStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempDailySales, setTempDailySales] = useState<{ [key: number]: number }>({});

  // Dynamic calculations for selected month weekdays (removing Sat/Sun)
  const [yearStr, monthIndexStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthIndexStr, 10) - 1; // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // exclude Sun (0) and Sat (6)
  });

  const handleOpenDailyEdit = (consultant: Consultant) => {
    setEditingDailyAgent(consultant);
    const sales: { [key: number]: number } = {};
    for (let d = 1; d <= 31; d++) {
      sales[d] = consultant.dailySales?.[selectedMonth]?.[d] ?? 0;
    }
    setTempDailySales(sales);
  };

  const handleSaveDailySales = () => {
    if (!localData || !editingDailyAgent) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    let agent = newData.presencial.ranking.find(a => a.id === editingDailyAgent.id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === editingDailyAgent.id);
    }
    
    if (agent) {
      if (!agent.dailySales) agent.dailySales = {};
      agent.dailySales[selectedMonth] = { ...tempDailySales };
      // Recalculate grand total sales across all months
      let total = 0;
      for (const m in agent.dailySales) {
        total += Object.values(agent.dailySales[m]).reduce((a, b) => a + b, 0);
      }
      agent.sales = total;
      
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
    
    setEditingDailyAgent(null);
  };

  useEffect(() => {
    if (data && !localData) {
      setLocalData(JSON.parse(JSON.stringify(data)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleUpdateSales = (id: number, delta: number) => {
    if (!localData) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    let agent = newData.presencial.ranking.find(a => a.id === id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === id);
    }

    if (agent) {
      const currentMonthSales = Object.values(agent.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0);
      const targetMonthSales = Math.max(0, currentMonthSales + delta);
      adjustDailySales(agent, targetMonthSales, selectedMonth);
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleInputChange = (id: number, value: string) => {
    if (!localData) return;
    const parsed = parseInt(value, 10);
    const sales = isNaN(parsed) ? 0 : Math.max(0, parsed);
    
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    let agent = newData.presencial.ranking.find(a => a.id === id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === id);
    }

    if (agent) {
      adjustDailySales(agent, sales, selectedMonth);
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleStatusChange = (id: number, newStatus: 'active' | 'vacation') => {
    if (!localData) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    let agent = newData.presencial.ranking.find(a => a.id === id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === id);
    }

    if (agent) {
      agent.status = newStatus;
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleUpdateCourseSales = (id: number, delta: number) => {
    if (!localData) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    const course = newData.courses?.find(c => c.id === id);
    if (course) {
      course.sales = Math.max(0, course.sales + delta);
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleCourseInputChange = (id: number, value: string) => {
    if (!localData) return;
    const parsed = parseInt(value, 10);
    const sales = isNaN(parsed) ? 0 : Math.max(0, parsed);
    
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    const course = newData.courses?.find(c => c.id === id);
    if (course) {
      course.sales = sales;
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAdmin(true);
    setAdminStatusMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
      });

      if (error) {
        setAdminStatusMessage({ type: 'error', text: `Erro: ${error.message}` });
      } else {
        setAdminStatusMessage({ 
          type: 'success', 
          text: `Sucesso! Administrador criado. Se as confirmações de e-mail estiverem ativas no seu painel Supabase, o usuário precisará confirmar o e-mail antes do primeiro login.` 
        });
        setNewAdminEmail('');
        setNewAdminPassword('');
      }
    } catch (err: any) {
      setAdminStatusMessage({ type: 'error', text: `Erro de rede: ${err.message || err}` });
    } finally {
      setIsCreatingAdmin(false);
    }
  };



  const handleToggleSimulation = (checked: boolean) => {
    setSimulationEnabled(checked);
    setSimulationEnabledState(checked);
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
  };

  const handleReset = () => {
    if (window.confirm("Deseja realmente redefinir todos os dados para os valores padrão de simulação?")) {
      resetDashboardData();
      setSimulationEnabled(false);
      setSimulationEnabledState(false);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }).then(() => {
        setLocalData(null);
      });
    }
  };

  // Announcement Actions
  const handleNewAnnounceClick = () => {
    setEditingAnnounce(null);
    setAnnounceTitle('');
    setAnnounceDesc('');
    setAnnounceAuthor('Diretoria Comercial');
    setAnnounceType('info');
    
    const now = new Date();
    const formattedDate = `Hoje, ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    setAnnounceDate(formattedDate);
    
    setIsAnnounceModalOpen(true);
  };

  const handleEditAnnounceClick = (announce: Announcement) => {
    setEditingAnnounce(announce);
    setAnnounceTitle(announce.title);
    setAnnounceDesc(announce.description);
    setAnnounceAuthor(announce.author);
    setAnnounceType(announce.type);
    setAnnounceDate(announce.date);
    setIsAnnounceModalOpen(true);
  };

  const handleSaveAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localData) return;

    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    if (editingAnnounce) {
      newData.announcements = newData.announcements.map(ann => {
        if (ann.id === editingAnnounce.id) {
          return {
            ...ann,
            title: announceTitle,
            description: announceDesc,
            author: announceAuthor,
            type: announceType,
            date: announceDate
          };
        }
        return ann;
      });
    } else {
      const newAnnounce: Announcement = {
        id: Date.now(),
        title: announceTitle,
        description: announceDesc,
        author: announceAuthor,
        type: announceType,
        date: announceDate
      };
      newData.announcements = [newAnnounce, ...newData.announcements];
    }

    saveDashboardData(newData);
    setLocalData(newData);
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    setIsAnnounceModalOpen(false);
  };

  const handleDeleteAnnounce = (id: number) => {
    if (!localData) return;
    if (!window.confirm("Deseja realmente excluir este recado?")) return;

    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    newData.announcements = newData.announcements.filter(ann => ann.id !== id);

    saveDashboardData(newData);
    setLocalData(newData);
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
  };

  if (isLoading || !localData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium animate-pulse">Carregando Dados de Administração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 space-y-6 flex flex-col min-h-[95vh] justify-between">
      <div className="space-y-6 flex-1 flex flex-col justify-start">
        
        {/* Header */}
        <header className="glass-header rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border border-white/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.hash = '#/'}
              className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shadow-xs border border-slate-200 transition cursor-pointer active:scale-95"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-2">
                Painel Admin <span className="text-[#007b3f] font-medium">Controle Comercial</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Painel Unoeste</p>
            </div>
          </div>

          {/* Date, Time and Month Selector */}
          <div className="flex items-center gap-6 text-slate-700 font-medium animate-fade-in">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50">
              <Calendar className="h-4 w-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="2026-06">Junho / 2026</option>
                <option value="2026-07">Julho / 2026</option>
              </select>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-xl font-extrabold font-mono text-slate-950">
                {format(time, 'HH:mm:ss')}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button
              onClick={() => {
                if (window.confirm("Deseja realmente sair?")) {
                  localStorage.removeItem('uno_mock_session');
                  supabase.auth.signOut().then(() => {
                    window.location.reload();
                  });
                }
              }}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
              title="Sair da sessão"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>

        {/* Configurations Card */}
        <Card className="w-full border-slate-200/50 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-lg font-extrabold text-slate-950 font-display flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                Configurações Globais do Painel
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Controle o comportamento das atualizações do painel comercial. A desativação da simulação permite travar os valores de matrículas e regiões editados manualmente.
              </p>
              <div className="bg-amber-50 text-amber-800 border border-amber-200/60 p-2.5 rounded-lg text-xs font-semibold leading-relaxed">
                <strong>Nota:</strong> Se você editou regiões ou nomes diretamente no código do arquivo <code>mockData.ts</code>, clique em <strong>Redefinir Valores</strong> abaixo para que o navegador recarregue os novos padrões.
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              {/* Simulation Toggle Switch */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-800">Simulação em Tempo Real</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{simulationEnabled ? "Ativa (Mocking)" : "Inativa (Estática)"}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulationEnabled}
                    onChange={(e) => handleToggleSimulation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Reset database button */}
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Redefinir Valores
              </button>
            </div>
          </div>
        </Card>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
          
          {/* PRESENCIAL EDIT */}
          <Card className="border-green-200/40 p-6 flex flex-col justify-start space-y-4 glow-presencial">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                Canal Físico
              </span>
              <h2 className="text-2xl font-extrabold text-slate-950 font-display mt-2">
                Ranking Presencial
              </h2>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {localData.presencial.ranking.map((consultant) => (
                <div 
                  key={consultant.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-2xs transition-all animate-fade-in gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-extrabold text-emerald-600">
                      {consultant.rank}º
                    </span>
                    <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-xs text-emerald-800 border border-emerald-100/50">
                      {consultant.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {consultant.name}
                      </p>
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="flex items-center gap-2">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleStatusChange(consultant.id, consultant.status === 'active' ? 'vacation' : 'active')}
                      className={cn(
                        "px-2 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 mr-1.5",
                        consultant.status === 'active'
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100/70"
                          : "bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100/70"
                      )}
                    >
                      {consultant.status === 'active' ? 'Ativo' : 'Férias'}
                    </button>

                    <button
                      onClick={() => handleUpdateSales(consultant.id, -5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleUpdateSales(consultant.id, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-sm transition cursor-pointer"
                    >
                      -1
                    </button>
                    
                    <input
                      type="number"
                      value={Object.values(consultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}
                      onChange={(e) => handleInputChange(consultant.id, e.target.value)}
                      className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="0"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1 min-w-[50px] text-right">
                      Geral: {consultant.sales}
                    </span>

                    <button
                      onClick={() => handleUpdateSales(consultant.id, 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-sm transition cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleUpdateSales(consultant.id, 5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleOpenDailyEdit(consultant)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer active:scale-95 ml-1"
                      title="Editar matrículas diárias"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* EAD EDIT */}
          <Card className="border-orange-200/40 p-6 flex flex-col justify-start space-y-4 glow-ead">
            <div>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
                Canal Digital
              </span>
              <h2 className="text-2xl font-extrabold text-slate-950 font-display mt-2">
                Ranking EAD
              </h2>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {localData.ead.ranking.map((consultant) => (
                <div 
                  key={consultant.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-2xs transition-all animate-fade-in gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-extrabold text-orange-600">
                      {consultant.rank}º
                    </span>
                    <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center font-bold text-xs text-orange-800 border border-orange-100/50">
                      {consultant.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {consultant.name}
                      </p>
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="flex items-center gap-2">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleStatusChange(consultant.id, consultant.status === 'active' ? 'vacation' : 'active')}
                      className={cn(
                        "px-2 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 mr-1.5",
                        consultant.status === 'active'
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100/70"
                          : "bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100/70"
                      )}
                    >
                      {consultant.status === 'active' ? 'Ativo' : 'Férias'}
                    </button>

                    <button
                      onClick={() => handleUpdateSales(consultant.id, -5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleUpdateSales(consultant.id, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-sm transition cursor-pointer"
                    >
                      -1
                    </button>
                    
                    <input
                      type="number"
                      value={Object.values(consultant.dailySales?.[selectedMonth] || {}).reduce((a, b) => a + b, 0)}
                      onChange={(e) => handleInputChange(consultant.id, e.target.value)}
                      className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1 min-w-[50px] text-right">
                      Geral: {consultant.sales}
                    </span>

                    <button
                      onClick={() => handleUpdateSales(consultant.id, 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-sm transition cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleUpdateSales(consultant.id, 5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleOpenDailyEdit(consultant)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer active:scale-95 ml-1"
                      title="Editar matrículas diárias"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* COURSES SALES EDIT SECTION */}
        <Card className="w-full border-slate-200/50 p-6 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-950 font-display flex items-center gap-2">
              🏆 Editar Matrículas por Curso
            </h3>
            <p className="text-sm text-slate-500">
              Modifique a quantidade de matrículas registradas para cada curso no período selecionado.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Presencial Courses */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                Cursos Presenciais
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {localData.courses?.filter(c => c.type === 'presencial').map(course => (
                  <div key={course.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-3xs">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]" title={formatCourseName(course.name)}>
                      {formatCourseName(course.name)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateCourseSales(course.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        value={course.sales}
                        onChange={(e) => handleCourseInputChange(course.id, e.target.value)}
                        className="w-12 h-7 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="0"
                      />
                      <button
                        onClick={() => handleUpdateCourseSales(course.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EAD Courses */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
                Cursos EAD
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {localData.courses?.filter(c => c.type === 'ead').map(course => (
                  <div key={course.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-3xs">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]" title={formatCourseName(course.name)}>
                      {formatCourseName(course.name)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateCourseSales(course.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        value={course.sales}
                        onChange={(e) => handleCourseInputChange(course.id, e.target.value)}
                        className="w-12 h-7 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="0"
                      />
                      <button
                        onClick={() => handleUpdateCourseSales(course.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-xs transition cursor-pointer"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ACCESS MANAGEMENT SECTION */}
        <Card className="w-full border-slate-200/50 p-6 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-950 font-display flex items-center gap-2">
              👤 Cadastrar Novo Administrador
            </h3>
            <p className="text-sm text-slate-500">
              Cadastre outras credenciais de e-mail e senha no Supabase Auth para que outras pessoas tenham acesso ao Painel Admin.
            </p>
          </div>

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="exemplo@unoeste.br"
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Senha de Acesso</label>
              <input
                type="password"
                required
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingAdmin}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 animate-pulse-slow"
            >
              {isCreatingAdmin ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                'Criar Administrador'
              )}
            </button>
          </form>

          {adminStatusMessage && (
            <div className={cn(
              "p-3 rounded-xl text-xs font-bold border",
              adminStatusMessage.type === 'success' 
                ? "bg-emerald-50 text-emerald-800 border-emerald-250/50 shadow-3xs" 
                : "bg-red-50 text-red-855 border-red-250/50 shadow-3xs"
            )}>
              {adminStatusMessage.text}
            </div>
          )}
        </Card>

        {/* Mural de Recados Section */}
        <Card className="w-full border-slate-200/50 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 font-display flex items-center gap-2">
                <Megaphone className="h-5.5 w-5.5 text-slate-500" />
                Mural de Recados (Carrossel)
              </h3>
              <p className="text-sm text-slate-500">
                Gerencie os avisos e recados que rotacionam no topo do painel principal.
              </p>
            </div>
            
            <button
              onClick={handleNewAnnounceClick}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Adicionar Recado
            </button>
          </div>

          {/* Announcements list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localData.announcements.map((announce) => (
              <div 
                key={announce.id}
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between space-y-3 bg-white/60",
                  announce.type === 'success' ? 'border-emerald-200/70 bg-emerald-50/20' :
                  announce.type === 'warning' ? 'border-amber-200/70 bg-amber-50/20' :
                  announce.type === 'alert' ? 'border-red-200/70 bg-red-50/20' :
                  'border-blue-200/70 bg-blue-50/20'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                      announce.type === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      announce.type === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      announce.type === 'alert' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    )}>
                      {announce.type === 'success' ? 'Sucesso' :
                       announce.type === 'warning' ? 'Atenção' :
                       announce.type === 'alert' ? 'Perigo' : 'Info'}
                    </span>
                    
                    <span className="text-[10px] text-slate-400 font-bold">
                      {announce.date}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800">
                    {announce.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {announce.description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2">
                    Autor: {announce.author}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleEditAnnounceClick(announce)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteAnnounce(announce.id)}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {localData.announcements.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                Nenhum recado cadastrado. Clique em "Adicionar Recado" acima.
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Announcement Create/Edit Dialog */}
      <Dialog open={isAnnounceModalOpen} onOpenChange={setIsAnnounceModalOpen}>
        <DialogContent onClose={() => setIsAnnounceModalOpen(false)} className="max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-slate-900">
              {editingAnnounce ? "Editar Recado" : "Adicionar Novo Recado"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preencha os campos abaixo para cadastrar ou editar um aviso no mural.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAnnounce} className="space-y-4 py-2">
            {/* Title field */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-700">Título</label>
              <input
                type="text"
                required
                placeholder="Ex: 🚨 Superação da Meta!"
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description field */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-700">Descrição</label>
              <textarea
                required
                rows={3}
                placeholder="Insira os detalhes do aviso..."
                value={announceDesc}
                onChange={(e) => setAnnounceDesc(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Author field */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-700">Autor</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marketing"
                  value={announceAuthor}
                  onChange={(e) => setAnnounceAuthor(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date field */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-700">Data/Hora</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hoje, 15:45"
                  value={announceDate}
                  onChange={(e) => setAnnounceDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Type selector */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-700">Tipo de Alerta</label>
              <div className="grid grid-cols-4 gap-2">
                {(['info', 'success', 'warning', 'alert'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAnnounceType(type)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95",
                      announceType === type
                        ? type === 'success' ? 'bg-emerald-600 border-emerald-600 text-white' :
                          type === 'warning' ? 'bg-amber-500 border-amber-500 text-white' :
                          type === 'alert' ? 'bg-red-600 border-red-600 text-white' :
                          'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {type === 'success' ? 'Sucesso' :
                     type === 'warning' ? 'Atenção' :
                     type === 'alert' ? 'Perigo' : 'Info'}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAnnounceModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm active:scale-95"
              >
                Salvar Recado
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Daily Sales Editor Dialog */}
      <Dialog open={!!editingDailyAgent} onOpenChange={(open) => !open && setEditingDailyAgent(null)}>
        <DialogContent onClose={() => setEditingDailyAgent(null)} className="max-w-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-slate-900">
              Editar Matrículas Diárias: {editingDailyAgent?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gerencie a quantidade de matrículas efetuadas em cada dia útil do mês.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50 scrollbar-thin">
              {weekdays.map((day) => {
                const now = new Date();
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                return (
                  <div 
                    key={day} 
                    className={cn(
                      "p-2.5 rounded-lg border bg-white flex flex-col items-center justify-between gap-1.5 shadow-2xs",
                      isToday ? "border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-500/20" : "border-slate-100"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      isToday ? "text-indigo-700" : "text-slate-400"
                    )}>
                      Dia {day}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTempDailySales(prev => ({
                            ...prev,
                            [day]: Math.max(0, (prev[day] || 0) - 1)
                          }));
                        }}
                        className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs transition active:scale-90 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-800">
                        {tempDailySales[day] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempDailySales(prev => ({
                            ...prev,
                            [day]: (prev[day] || 0) + 1
                          }));
                        }}
                        className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs transition active:scale-90 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Novo Total Sumarizado</p>
                <p className="text-lg font-black text-indigo-700">
                  {weekdays.reduce((sum, day) => sum + (tempDailySales[day] || 0), 0)} matrículas
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDailyAgent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailySales}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  public state = { hasError: false, error: null as Error | null };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-red-50 border border-red-200 text-red-800 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 font-display">Ocorreu um erro na aplicação (Runtime Error):</h2>
          <p className="text-sm font-semibold mb-2">{this.state.error?.toString()}</p>
          <pre className="text-xs bg-red-100/50 p-4 rounded-xl overflow-auto max-h-[300px] font-mono leading-relaxed">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
          >
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardTotalsWrapper() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData', '2026-07'],
    queryFn: () => fetchDashboardData('2026-07'),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium animate-pulse text-slate-300">Carregando dados consolidados...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-red-950 text-red-200">
        <div className="text-center p-8 glass-card border-red-500 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Erro de Carregamento</h2>
          <p className="mb-4">Não foi possível carregar os dados consolidados.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <DashboardTotals data={data} />;
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen to Supabase Realtime changes to auto-invalidate Query cache
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Supabase Auth Session & Mock session fallback
  useEffect(() => {
    const isMock = localStorage.getItem('uno_mock_session') === 'true';
    if (isMock) {
      setSession({
        user: { email: 'enricogarcia@unoeste.br', id: 'mock-admin' },
        expires_at: 9999999999
      } as any);
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('uno_mock_session') === 'true') {
        return;
      }
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = hash === '#/admin';
  const isDashboard = hash === '#/dashboard';

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {isAdmin ? (
          authLoading ? (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-lg font-medium animate-pulse text-slate-300">Verificando autenticação...</p>
              </div>
            </div>
          ) : session ? (
            <AdminContent />
          ) : (
            <Login />
          )
        ) : isDashboard ? (
          <DashboardTotalsWrapper />
        ) : (
          <DashboardContent />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
