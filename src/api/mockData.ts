import axios from 'axios';

export interface Consultant {
  id: number;
  rank: number;
  name: string;
  avatar: string;
  sales: number;
  dailySales: Record<number, number>; // keys 1 to 31
  status: 'active' | 'vacation';
  value: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  region?: string;
  lastSaleTime?: string;
}

export interface Metric {
  enrollments: number;
  goal: number;
  percentage: number;
  growth: number;
  dailyAverage: number;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  author: string;
}

export interface DashboardData {
  presencial: {
    ranking: Consultant[];
    metrics: Metric;
    lastUpdate: string;
  };
  ead: {
    ranking: Consultant[];
    metrics: Metric;
    lastUpdate: string;
  };
  announcements: Announcement[];
}

const calculateMetrics = (ranking: Consultant[], goal: number): Metric => {
  const enrollments = ranking.reduce((acc, curr) => acc + curr.sales, 0);
  return {
    enrollments,
    goal,
    percentage: parseFloat(((enrollments / goal) * 100).toFixed(1)),
    growth: 12.4,
    dailyAverage: parseFloat((enrollments / 30).toFixed(1))
  };
};

const generateDailySales = (totalSales: number) => {
  const result: Record<number, number> = {};
  for (let i = 1; i <= 31; i++) {
    result[i] = 0;
  }
  let remaining = totalSales;
  
  while (remaining > 0) {
    const day = Math.floor(Math.random() * 31) + 1;
    result[day] += 1;
    remaining -= 1;
  }
  return result;
};

export const adjustDailySales = (consultant: Consultant, newSales: number) => {
  if (!consultant.dailySales) {
    consultant.dailySales = {};
    for (let i = 1; i <= 31; i++) {
      consultant.dailySales[i] = 0;
    }
  }
  const diff = newSales - consultant.sales;
  const todayDay = new Date().getDate(); // 1 to 31

  if (diff > 0) {
    consultant.dailySales[todayDay] = (consultant.dailySales[todayDay] || 0) + diff;
  } else if (diff < 0) {
    let toSubtract = Math.abs(diff);
    // Work backwards starting from today
    const order = [todayDay, ...Array.from({ length: 31 }, (_, i) => 31 - i).filter(d => d !== todayDay)];
    for (const day of order) {
      if (toSubtract <= 0) break;
      const available = consultant.dailySales[day] || 0;
      const sub = Math.min(available, toSubtract);
      consultant.dailySales[day] = available - sub;
      toSubtract -= sub;
    }
    if (toSubtract > 0) {
      consultant.dailySales[todayDay] = Math.max(0, (consultant.dailySales[todayDay] || 0) - toSubtract);
    }
  }
  consultant.sales = newSales;
};

// Load initial database or from localStorage
const loadDatabase = (): DashboardData => {
  const saved = localStorage.getItem('univ_sales_dashboard_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure ranking is sorted on load
      parsed.presencial.ranking.sort((a: any, b: any) => b.sales - a.sales);
      parsed.ead.ranking.sort((a: any, b: any) => b.sales - a.sales);
      return parsed;
    } catch (e) {
      console.error("Failed to parse saved database, resetting", e);
    }
  }

  // Default starting database with real names
  const initialPresencial = [
    { id: 1, rank: 1, name: 'Fabricia', avatar: 'FA', sales: 45, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 2, rank: 2, name: 'Rafaella', avatar: 'RA', sales: 41, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 3, rank: 3, name: 'Cauã', avatar: 'CA', sales: 38, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 4, rank: 4, name: 'Giovanna S', avatar: 'GS', sales: 34, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 5, rank: 5, name: 'Murilo G.', avatar: 'MG', sales: 30, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 6, rank: 6, name: 'Giovanna C', avatar: 'GC', sales: 27, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 7, rank: 7, name: 'Emanoel', avatar: 'EM', sales: 25, status: 'vacation' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 8, rank: 8, name: 'Isadora', avatar: 'IS', sales: 22, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 9, rank: 9, name: 'Nicoly', avatar: 'NI', sales: 19, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 10, rank: 10, name: 'Júlia', avatar: 'JU', sales: 16, status: 'vacation' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 11, rank: 11, name: 'Luís', avatar: 'LU', sales: 14, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 12, rank: 12, name: 'João', avatar: 'JO', sales: 12, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 13, rank: 13, name: 'Gabriel', avatar: 'GA', sales: 9, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 14, rank: 14, name: 'Majori', avatar: 'MA', sales: 6, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 15, rank: 15, name: 'Murillo A.', avatar: 'MU', sales: 3, status: 'vacation' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const }
  ].map(c => ({ ...c, dailySales: generateDailySales(c.sales) }));

  const initialEad = [
    { id: 101, rank: 1, name: 'Guilherme', avatar: 'GL', sales: 110, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 102, rank: 2, name: 'Caroline', avatar: 'CR', sales: 98, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 103, rank: 3, name: 'Mario', avatar: 'MR', sales: 92, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 104, rank: 4, name: 'Alline', avatar: 'AL', sales: 85, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 105, rank: 5, name: 'Mariana', avatar: 'MN', sales: 80, status: 'vacation' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 106, rank: 6, name: 'Felipe', avatar: 'FL', sales: 72, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 107, rank: 7, name: 'Tamyres', avatar: 'TM', sales: 65, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 108, rank: 8, name: 'Micheline', avatar: 'MC', sales: 58, status: 'vacation' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 109, rank: 9, name: 'Vinícius', avatar: 'VN', sales: 50, status: 'active' as const, region: 'Presidente Prudente', value: 0, conversionRate: 0, trend: 'down' as const }
  ].map(c => ({ ...c, dailySales: generateDailySales(c.sales) }));

  const announcements: Announcement[] = [
    {
      id: 1,
      title: '🚨 Superação da Meta Semanal!',
      description: 'Parabéns a todo o time comercial. O EAD superou a meta semanal em 15% e o Presencial está a apenas algumas matrículas de atingir seu objetivo parcial. Vamos acelerar nas próximas horas!',
      date: 'Hoje, 15:45',
      type: 'success',
      author: 'Diretoria Comercial'
    },
    {
      id: 2,
      title: '⚡ Nova Campanha de Desconto EAD',
      description: 'Campanha "Inverno com Conhecimento" liberada no sistema! Descontos especiais de até 35% para matrículas efetuadas até sexta-feira. Compartilhem com suas bases de leads.',
      date: 'Hoje, 11:20',
      type: 'info',
      author: 'Marketing'
    },
    {
      id: 3,
      title: '🏆 Destaque do Dia: Guilherme',
      description: 'O consultor Guilherme fechou novas matrículas nas últimas 24 horas, consolidando sua liderança no ranking EAD. Que marca incrível, parabéns Guilherme!',
      date: 'Hoje, 09:00',
      type: 'alert',
      author: 'Recursos Humanos'
    },
    {
      id: 4,
      title: '📅 Treinamento Comercial Amanhã',
      description: 'Amanhã teremos nosso alinhamento semanal às 08:30 via Teams. Pauta: Técnicas de contorno de objeções para fechamento de matrículas presenciais.',
      date: 'Ontem, 17:00',
      type: 'warning',
      author: 'Treinamento & Qualidade'
    }
  ];

  const db = {
    presencial: {
      ranking: initialPresencial,
      metrics: calculateMetrics(initialPresencial, 300),
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    ead: {
      ranking: initialEad,
      metrics: calculateMetrics(initialEad, 700),
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    announcements
  };

  localStorage.setItem('univ_sales_dashboard_data', JSON.stringify(db));
  return db;
};

let database: DashboardData = loadDatabase();

const updateDynamicData = () => {
  const enabled = localStorage.getItem('univ_sales_simulation_enabled') !== 'false';
  if (!enabled) return;

  const now = new Date();
  const isNewSale = Math.random() < 0.6;
  if (isNewSale) {
    const isEad = Math.random() > 0.4;
    const todayDay = now.getDate(); // 1 to 31

    if (isEad) {
      const activeConsultants = database.ead.ranking.filter(c => c.status === 'active');
      if (activeConsultants.length > 0) {
        const index = Math.floor(Math.random() * activeConsultants.length);
        const consultant = activeConsultants[index];
        consultant.sales += 1;
        if (!consultant.dailySales) {
          consultant.dailySales = {};
          for (let i = 1; i <= 31; i++) consultant.dailySales[i] = 0;
        }
        consultant.dailySales[todayDay] = (consultant.dailySales[todayDay] || 0) + 1;
        consultant.lastSaleTime = 'Agora mesmo';
        consultant.trend = 'up';
        
        database.ead.ranking.sort((a, b) => b.sales - a.sales);
        database.ead.ranking.forEach((c, idx) => {
          c.rank = idx + 1;
        });

        database.ead.metrics = calculateMetrics(database.ead.ranking, 700);
        database.ead.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } else {
      const activeConsultants = database.presencial.ranking.filter(c => c.status === 'active');
      if (activeConsultants.length > 0) {
        const index = Math.floor(Math.random() * activeConsultants.length);
        const consultant = activeConsultants[index];
        consultant.sales += 1;
        if (!consultant.dailySales) {
          consultant.dailySales = {};
          for (let i = 1; i <= 31; i++) consultant.dailySales[i] = 0;
        }
        consultant.dailySales[todayDay] = (consultant.dailySales[todayDay] || 0) + 1;
        consultant.lastSaleTime = 'Agora mesmo';
        consultant.trend = 'up';
        
        database.presencial.ranking.sort((a, b) => b.sales - a.sales);
        database.presencial.ranking.forEach((c, idx) => {
          c.rank = idx + 1;
        });

        database.presencial.metrics = calculateMetrics(database.presencial.ranking, 300);
        database.presencial.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }
    
    localStorage.setItem('univ_sales_dashboard_data', JSON.stringify(database));
  }

  const formats = ['há 2 min', 'há 5 min', 'há 10 min', 'há 15 min', 'há 30 min', 'há 1 hora'];
  let changedTimes = false;
  database.presencial.ranking.forEach((c) => {
    if (c.lastSaleTime !== 'Agora mesmo' && Math.random() < 0.15) {
      c.lastSaleTime = formats[Math.floor(Math.random() * formats.length)];
      changedTimes = true;
    }
  });
  database.ead.ranking.forEach((c) => {
    if (c.lastSaleTime !== 'Agora mesmo' && Math.random() < 0.15) {
      c.lastSaleTime = formats[formats.length - 1];
      changedTimes = true;
    }
  });

  if (changedTimes) {
    localStorage.setItem('univ_sales_dashboard_data', JSON.stringify(database));
  }
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const saved = localStorage.getItem('univ_sales_dashboard_data');
  if (saved) {
    try {
      database = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  updateDynamicData();
  return JSON.parse(JSON.stringify(database));
};

export const saveDashboardData = (newData: DashboardData) => {
  newData.presencial.ranking.sort((a, b) => b.sales - a.sales);
  newData.presencial.ranking.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  newData.ead.ranking.sort((a, b) => b.sales - a.sales);
  newData.ead.ranking.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  newData.presencial.metrics = calculateMetrics(newData.presencial.ranking, 300);
  newData.ead.metrics = calculateMetrics(newData.ead.ranking, 700);

  database = newData;
  localStorage.setItem('univ_sales_dashboard_data', JSON.stringify(database));
};

export const resetDashboardData = () => {
  localStorage.removeItem('univ_sales_dashboard_data');
  database = loadDatabase();
};

export const setSimulationEnabled = (enabled: boolean) => {
  localStorage.setItem('univ_sales_simulation_enabled', String(enabled));
};

export const getSimulationEnabled = (): boolean => {
  return localStorage.getItem('univ_sales_simulation_enabled') !== 'false';
};

export const api = axios.create({
  baseURL: '/api'
});
