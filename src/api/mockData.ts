import axios from 'axios';

export interface Consultant {
  id: number;
  rank: number;
  name: string;
  avatar: string;
  sales: number;
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
    { id: 1, rank: 1, name: 'Fabricia', avatar: 'FA', sales: 45, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 2, rank: 2, name: 'Rafaella', avatar: 'RA', sales: 41, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 3, rank: 3, name: 'Cauã', avatar: 'CA', sales: 38, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente'},
    { id: 4, rank: 4, name: 'Giovanna S', avatar: 'GS', sales: 34, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 5, rank: 5, name: 'Murilo G.', avatar: 'MG', sales: 30, value: 0, conversionRate: 0, trend: 'down' as const, region: 'Presidente Prudente'},
    { id: 6, rank: 6, name: 'Giovanna C', avatar: 'GC', sales: 27, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 7, rank: 7, name: 'Emanoel', avatar: 'EM', sales: 25, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente'},
    { id: 8, rank: 8, name: 'Isadora', avatar: 'IS', sales: 22, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 9, rank: 9, name: 'Nicoly', avatar: 'NI', sales: 19, value: 0, conversionRate: 0, trend: 'down' as const, region: 'Presidente Prudente' },
    { id: 10, rank: 10, name: 'Júlia', avatar: 'JU', sales: 16, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 11, rank: 11, name: 'Luís', avatar: 'LU', sales: 14, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente'},
    { id: 12, rank: 12, name: 'João', avatar: 'JO', sales: 12, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 13, rank: 13, name: 'Gabriel', avatar: 'GA', sales: 9, value: 0, conversionRate: 0, trend: 'down' as const, region: 'Presidente Prudente'},
    { id: 14, rank: 14, name: 'Majori', avatar: 'MA', sales: 6, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 15, rank: 15, name: 'Murillo A.', avatar: 'MU', sales: 3, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente' }
  ];

  const initialEad = [
    { id: 101, rank: 1, name: 'Guilherme', avatar: 'GL', sales: 110, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 102, rank: 2, name: 'Caroline', avatar: 'CR', sales: 98, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 103, rank: 3, name: 'Mario', avatar: 'MR', sales: 92, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente'},
    { id: 104, rank: 4, name: 'Alline', avatar: 'AL', sales: 85, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente'},
    { id: 105, rank: 5, name: 'Mariana', avatar: 'MN', sales: 80, value: 0, conversionRate: 0, trend: 'down' as const, region: 'Presidente Prudente'},
    { id: 106, rank: 6, name: 'Felipe', avatar: 'FL', sales: 72, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 107, rank: 7, name: 'Tamyres', avatar: 'TM', sales: 65, value: 0, conversionRate: 0, trend: 'stable' as const, region: 'Presidente Prudente' },
    { id: 108, rank: 8, name: 'Micheline', avatar: 'MC', sales: 58, value: 0, conversionRate: 0, trend: 'up' as const, region: 'Presidente Prudente' },
    { id: 109, rank: 9, name: 'Vinícius', avatar: 'VN', sales: 50, value: 0, conversionRate: 0, trend: 'down' as const, region: 'Presidente Prudente'}
  ];

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
    
    if (isEad) {
      const index = Math.floor(Math.random() * database.ead.ranking.length);
      database.ead.ranking[index].sales += 1;
      database.ead.ranking[index].lastSaleTime = 'Agora mesmo';
      database.ead.ranking[index].trend = 'up';
      
      database.ead.ranking.sort((a, b) => b.sales - a.sales);
      database.ead.ranking.forEach((c, idx) => {
        c.rank = idx + 1;
      });

      database.ead.metrics = calculateMetrics(database.ead.ranking, 700);
      database.ead.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
      const index = Math.floor(Math.random() * database.presencial.ranking.length);
      database.presencial.ranking[index].sales += 1;
      database.presencial.ranking[index].lastSaleTime = 'Agora mesmo';
      database.presencial.ranking[index].trend = 'up';
      
      database.presencial.ranking.sort((a, b) => b.sales - a.sales);
      database.presencial.ranking.forEach((c, idx) => {
        c.rank = idx + 1;
      });

      database.presencial.metrics = calculateMetrics(database.presencial.ranking, 300);
      database.presencial.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  
  // Reload database from localStorage to make sure we reflect edits made in admin instantly
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
