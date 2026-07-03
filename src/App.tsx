import { useState, useEffect, Component, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Activity, 
  ChevronRight,
  Minus,
  Settings,
  ArrowLeft,
  RefreshCw,
  Plus,
  Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom APIs, Utilities & Components
import { 
  fetchDashboardData, 
  saveDashboardData, 
  resetDashboardData, 
  setSimulationEnabled, 
  getSimulationEnabled 
} from './api/mockData';
import type { Consultant, DashboardData, Announcement } from './api/mockData';
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#007b3f] to-[#78be20] flex items-center justify-center shadow-md select-none">
              <span className="text-white font-extrabold text-xl font-display">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-1">
                Painel <span className="text-[#007b3f]">Unoeste</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Painel de Matrículas Comercial</p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/50">
              <span className="live-indicator inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Atualizações em Tempo Real</span>
            </div>

            {/* Admin navigation button */}
            <button
              onClick={() => window.location.hash = '#/admin'}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition text-xs font-bold uppercase cursor-pointer active:scale-95"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              Painel Admin
            </button>
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

                    {/* Right: Spacious Classificatory Table */}
                    <div className="w-full lg:w-[50%] space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quadro Classificatório - Presencial</p>
                      <div className="space-y-3 pr-1">
                        {data.presencial.ranking.filter(consultant => consultant.sales > 0).slice(0, 5).map((consultant) => (
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

                    {/* Right: Spacious Classificatory Table */}
                    <div className="w-full lg:w-[50%] space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quadro Classificatório - EAD</p>
                      <div className="space-y-3 pr-1">
                        {data.ead.ranking.filter(consultant => consultant.sales > 0).slice(0, 5).map((consultant) => (
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
                    Última {selectedConsultant.lastSaleTime || 'há pouco'}
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
  
  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
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

  useEffect(() => {
    if (data && !localData) {
      setLocalData(JSON.parse(JSON.stringify(data)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleUpdateSales = (id: number, delta: number) => {
    if (!localData) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    // Find in presencial
    let agent = newData.presencial.ranking.find(a => a.id === id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === id);
    }

    if (agent) {
      agent.sales = Math.max(0, agent.sales + delta);
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
      agent.sales = sales;
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const handleRegionChange = (id: number, newRegion: string) => {
    if (!localData) return;
    const newData = JSON.parse(JSON.stringify(localData)) as DashboardData;
    
    let agent = newData.presencial.ranking.find(a => a.id === id);
    if (!agent) {
      agent = newData.ead.ranking.find(a => a.id === id);
    }

    if (agent) {
      agent.region = newRegion;
      saveDashboardData(newData);
      setLocalData(newData);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
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
      setSimulationEnabled(true);
      setSimulationEnabledState(true);
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">Hub:</span>
                        <input
                          type="text"
                          value={consultant.region || ''}
                          onChange={(e) => handleRegionChange(consultant.id, e.target.value)}
                          className="text-[10px] text-slate-600 font-bold bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-none w-28 px-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="flex items-center gap-2">
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
                      value={consultant.sales}
                      onChange={(e) => handleInputChange(consultant.id, e.target.value)}
                      className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="0"
                    />

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
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">Hub:</span>
                        <input
                          type="text"
                          value={consultant.region || ''}
                          onChange={(e) => handleRegionChange(consultant.id, e.target.value)}
                          className="text-[10px] text-slate-600 font-bold bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 focus:outline-none w-28 px-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="flex items-center gap-2">
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
                      value={consultant.sales}
                      onChange={(e) => handleInputChange(consultant.id, e.target.value)}
                      className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                    />

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
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

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
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAdmin = hash === '#/admin';

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {isAdmin ? <AdminContent /> : <DashboardContent />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
