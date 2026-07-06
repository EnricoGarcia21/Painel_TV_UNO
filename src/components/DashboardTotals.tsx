import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Calendar, BarChart3, Tv, Globe, TrendingUp } from 'lucide-react';
import type { DashboardData } from '../api/mockData';

interface DashboardTotalsProps {
  data: DashboardData;
}

export default function DashboardTotals({ data }: DashboardTotalsProps) {
  // Aggregate data by period (month)
  const periodData = useMemo(() => {
    const totals: Record<string, { period: string; presencial: number; ead: number; total: number }> = {};

    // Combine rankings to get all consultants
    const allConsultants = [
      ...data.presencial.ranking,
      ...data.ead.ranking
    ];

    allConsultants.forEach(c => {
      const type = c.id >= 100 ? 'ead' : 'presencial';
      if (c.dailySales) {
        Object.entries(c.dailySales).forEach(([period, days]) => {
          if (!totals[period]) {
            // Format period key (e.g. "2026-07" to "Julho / 2026")
            const [year, month] = period.split('-');
            const monthNames: Record<string, string> = {
              '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
              '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
              '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
            };
            const label = `${monthNames[month] || month} / ${year}`;
            
            totals[period] = {
              period: label,
              presencial: 0,
              ead: 0,
              total: 0
            };
          }
          const sum = Object.values(days).reduce((a, b) => a + b, 0);
          totals[period][type] += sum;
          totals[period].total += sum;
        });
      }
    });

    // Sort periods chronologically (keys like "2026-06", "2026-07")
    return Object.keys(totals)
      .sort()
      .map(key => totals[key]);
  }, [data]);

  // General metrics
  const metrics = useMemo(() => {
    let totalPresencial = 0;
    let totalEad = 0;
    
    periodData.forEach(p => {
      totalPresencial += p.presencial;
      totalEad += p.ead;
    });

    const totalEnrollments = totalPresencial + totalEad;

    return {
      totalEnrollments,
      totalPresencial,
      totalEad,
      presencialShare: totalEnrollments ? Math.round((totalPresencial / totalEnrollments) * 100) : 0,
      eadShare: totalEnrollments ? Math.round((totalEad / totalEnrollments) * 100) : 0
    };
  }, [periodData]);

  return (
    <div className="max-w-[1920px] mx-auto p-6 space-y-6 flex flex-col min-h-[95vh] justify-between font-sans">
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
                Dashboard Consolidado <span className="text-[#007b3f] font-medium">Matrículas por Período</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Painel Unoeste</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100/50 text-emerald-800 text-xs font-black uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-emerald-600 animate-pulse" />
            Consolidado
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total card */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-indigo-500/10 blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Total de Matrículas</span>
              <p className="text-4xl font-black mt-2 font-display tracking-tight text-white">
                {metrics.totalEnrollments}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium border-t border-slate-800 pt-3">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Soma de todos os canais e períodos ativos
            </div>
          </div>

          {/* Presencial card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-emerald-500/5 blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Presencial
              </span>
              <p className="text-4xl font-black mt-2 font-display tracking-tight text-slate-950">
                {metrics.totalPresencial}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5"><Tv className="w-4 h-4 text-emerald-600" /> Canal Físico</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{metrics.presencialShare}% share</span>
            </div>
          </div>

          {/* EAD card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-orange-500/5 blur-xl pointer-events-none group-hover:bg-orange-500/10 transition-all duration-500" />
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                EAD / Digital
              </span>
              <p className="text-4xl font-black mt-2 font-display tracking-tight text-slate-950">
                {metrics.totalEad}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-orange-500" /> Canal Digital</span>
              <span className="font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{metrics.eadShare}% share</span>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart card */}
          <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              Comparativo de Captação por Período
            </h3>
            <div className="h-[360px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={periodData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '16px', 
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#94a3b8' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{value === 'presencial' ? 'Presencial' : 'EAD'}</span>}
                  />
                  <Bar 
                    dataKey="presencial" 
                    name="presencial" 
                    fill="#007b3f" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                  />
                  <Bar 
                    dataKey="ead" 
                    name="ead" 
                    fill="#f97316" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Breakdown Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              Detalhamento de Períodos
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Período</th>
                    <th className="py-3 px-4 text-center">Pres.</th>
                    <th className="py-3 px-4 text-center">EAD</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                  {periodData.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.period}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-700 font-bold font-mono">{p.presencial}</td>
                      <td className="py-3.5 px-4 text-center text-orange-600 font-bold font-mono">{p.ead}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-950 font-mono">{p.total}</td>
                    </tr>
                  ))}
                  {periodData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-slate-400 font-medium">
                        Nenhum período disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
