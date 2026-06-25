import { useState, useEffect, Component, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Activity, 
  Sparkles,
  ChevronRight,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom APIs, Utilities & Components
import { fetchDashboardData } from './api/mockData';
import type { Consultant } from './api/mockData';
import { cn } from './lib/utils';
import { Card, CardContent } from './components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/Dialog';
import { Podium3D } from './components/ui/Podium3D';
import { AnnouncementCarousel } from './components/ui/AnnouncementCarousel';

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
  
  // Carousel states
  const [activeTab, setActiveTab] = useState<'presencial' | 'ead'>('presencial');
  const [timerProgress, setTimerProgress] = useState(0);
  const lastSwitchTimeRef = useRef(Date.now());

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Bulletproof 30 seconds timer for tab alternation
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSwitchTimeRef.current;
      const progress = (elapsed / 30000) * 100;
      
      if (progress >= 100) {
        lastSwitchTimeRef.current = Date.now();
        setTimerProgress(0);
        setActiveTab((current) => (current === 'presencial' ? 'ead' : 'presencial'));
      } else {
        setTimerProgress(progress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: 'presencial' | 'ead') => {
    setActiveTab(tab);
    lastSwitchTimeRef.current = Date.now();
    setTimerProgress(0);
  };

  // Fetch data using React Query (auto-updates every 10 seconds to simulate real-time operations)
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

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
        {/* 1. Header (Glassmorphic Layout) */}
        <header className="glass-header rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border border-white/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-2">
                UNIVERSE <span className="text-slate-400 font-medium">Corp</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Painel Comercial Corporativo</p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/50">
            <span className="live-indicator inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Atualizações em Tempo Real</span>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-6 text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-sm capitalize">
                {format(time, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-base font-extrabold font-mono text-slate-950">
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
            <div className="flex gap-2">
              <button 
                onClick={() => handleTabChange('presencial')}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-98",
                  activeTab === 'presencial' 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", activeTab === 'presencial' ? "bg-white animate-pulse" : "bg-emerald-500")}></span>
                Ranking Presencial (Canal Físico)
              </button>
              <button 
                onClick={() => handleTabChange('ead')}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-98",
                  activeTab === 'ead' 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", activeTab === 'ead' ? "bg-white animate-pulse" : "bg-orange-500")}></span>
                Ranking EAD (Canal Digital)
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
                    activeTab === 'presencial' ? "bg-emerald-500" : "bg-orange-500"
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
              initial={{ opacity: 0, x: activeTab === 'presencial' ? -120 : 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'presencial' ? 120 : -120 }}
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

                  <CardContent className="p-6 flex flex-col lg:flex-row gap-12 items-center justify-between flex-1">
                    {/* Left: 3D Podium */}
                    <div className="w-full lg:w-[45%] flex items-center justify-center pb-6 lg:pb-0 lg:pr-6">
                      <Podium3D 
                        consultants={data.presencial.ranking.slice(0, 3)} 
                        theme="green"
                        onConsultantClick={handleConsultantClick}
                      />
                    </div>

                    {/* Right: Spacious Classificatory Table (All 5 consultants) */}
                    <div className="w-full lg:w-[50%] space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quadro Classificatório - Presencial</p>
                      <div className="space-y-3 pr-1">
                        {data.presencial.ranking.map((consultant) => (
                          <div 
                            key={consultant.id}
                            onClick={() => handleConsultantClick(consultant)}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200/60 shadow-2xs hover:shadow-xs cursor-pointer transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              {/* Rank Pos */}
                              <span className={cn(
                                "w-6 text-center text-base font-extrabold",
                                consultant.rank <= 3 ? "text-emerald-600" : "text-slate-400"
                              )}>
                                {consultant.rank}º
                              </span>
                              {/* Avatar */}
                              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-sm text-emerald-800 border border-emerald-100/50">
                                {consultant.avatar}
                              </div>
                              {/* Consultant Name & Hub */}
                              <div>
                                <p className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  {consultant.name}
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  Hub: {consultant.region}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-base font-extrabold text-slate-900">{consultant.sales} matrículas</p>
                                <p className="text-[11px] text-slate-500 font-semibold font-mono mt-0.5">
                                  R$ {consultant.value.toLocaleString('pt-BR')}
                                </p>
                              </div>

                              <div className={cn(
                                "p-2 rounded-xl border",
                                consultant.trend === 'up' ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" :
                                consultant.trend === 'down' ? "bg-red-50 text-red-600 border-red-100/50" :
                                "bg-slate-50 text-slate-400 border-slate-100"
                              )}>
                                {consultant.trend === 'up' && <TrendingUp className="h-4.5 w-4.5" />}
                                {consultant.trend === 'down' && <TrendingDown className="h-4.5 w-4.5" />}
                                {consultant.trend === 'stable' && <Minus className="h-4.5 w-4.5" />}
                              </div>
                              <ChevronRight className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                      ))}
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

                  <CardContent className="p-6 flex flex-col lg:flex-row gap-12 items-center justify-between flex-1">
                    {/* Left: 3D Podium */}
                    <div className="w-full lg:w-[45%] flex items-center justify-center pb-6 lg:pb-0 lg:pr-6">
                      <Podium3D 
                        consultants={data.ead.ranking.slice(0, 3)} 
                        theme="orange"
                        onConsultantClick={handleConsultantClick}
                      />
                    </div>

                    {/* Right: Spacious Classificatory Table (All 5 consultants) */}
                    <div className="w-full lg:w-[50%] space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quadro Classificatório - EAD</p>
                      <div className="space-y-3 pr-1">
                        {data.ead.ranking.map((consultant) => (
                          <div 
                            key={consultant.id}
                            onClick={() => handleConsultantClick(consultant)}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200/60 shadow-2xs hover:shadow-xs cursor-pointer transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              {/* Rank Pos */}
                              <span className={cn(
                                "w-6 text-center text-base font-extrabold",
                                consultant.rank <= 3 ? "text-orange-600" : "text-slate-400"
                              )}>
                                {consultant.rank}º
                              </span>
                              {/* Avatar */}
                              <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center font-bold text-sm text-orange-800 border border-orange-100/50">
                                {consultant.avatar}
                              </div>
                              {/* Consultant Name & Hub */}
                              <div>
                                <p className="text-base font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
                                  {consultant.name}
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  Hub: {consultant.region}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-base font-extrabold text-slate-900">{consultant.sales} matrículas</p>
                                <p className="text-[11px] text-slate-500 font-semibold font-mono mt-0.5">
                                  R$ {consultant.value.toLocaleString('pt-BR')}
                                </p>
                              </div>

                              <div className={cn(
                                "p-2 rounded-xl border",
                                consultant.trend === 'up' ? "bg-orange-50 text-orange-600 border-orange-100/50" :
                                consultant.trend === 'down' ? "bg-red-50 text-red-600 border-red-100/50" :
                                "bg-slate-50 text-slate-400 border-slate-100"
                              )}>
                                {consultant.trend === 'up' && <TrendingUp className="h-4.5 w-4.5" />}
                                {consultant.trend === 'down' && <TrendingDown className="h-4.5 w-4.5" />}
                                {consultant.trend === 'stable' && <Minus className="h-4.5 w-4.5" />}
                              </div>
                              <ChevronRight className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                      ))}
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
                  <DialogDescription className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Hub: {selectedConsultant.region || 'Matriz'}
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
                  <span className="text-[10px] uppercase font-bold text-slate-500">Matrículas Realizadas</span>
                  <p className="text-2xl font-extrabold text-slate-950 mt-1 font-display">
                    {selectedConsultant.sales}
                  </p>
                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
                    <Activity className="h-2.5 w-2.5 animate-pulse" />
                    Última {selectedConsultant.lastSaleTime}
                  </span>
                </div>

                {/* Billing card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Receita Gerada</span>
                  <p className="text-xl font-extrabold text-slate-950 mt-1 font-mono">
                    R$ {selectedConsultant.value.toLocaleString('pt-BR')}
                  </p>
                  <span className="text-[9px] text-slate-400 mt-0.5">Ticket médio: R$ {(selectedConsultant.value / selectedConsultant.sales).toFixed(0)}</span>
                </div>

                {/* Conversion card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Taxa de Conversão</span>
                  <p className="text-2xl font-extrabold text-indigo-950 mt-1 font-display">
                    {selectedConsultant.conversionRate}%
                  </p>
                  <span className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    +2.1% esta semana
                  </span>
                </div>

              </div>

              {/* Progress to personal target */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Atingimento da Meta Pessoal</span>
                  <span className="text-slate-900">{Math.round((selectedConsultant.sales / (selectedConsultant.id >= 100 ? 100 : 40)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      selectedConsultant.id >= 100 ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min((selectedConsultant.sales / (selectedConsultant.id >= 100 ? 100 : 40)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Atual: {selectedConsultant.sales}</span>
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
                    ? "bg-orange-500 hover:bg-orange-600" 
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

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
