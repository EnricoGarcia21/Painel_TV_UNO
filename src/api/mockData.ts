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
  lastSaleTime: string;
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

// In-memory data store that we will mutate slightly to simulate real-time updates
let database: DashboardData = {
  presencial: {
    ranking: [
      { id: 1, rank: 1, name: 'Guilherme Silva', avatar: 'GS', sales: 48, value: 72000, conversionRate: 18.5, trend: 'up', region: 'São Paulo', lastSaleTime: 'há 4 min' },
      { id: 2, rank: 2, name: 'Mariana Costa', avatar: 'MC', sales: 44, value: 66000, conversionRate: 16.2, trend: 'up', region: 'Rio de Janeiro', lastSaleTime: 'há 12 min' },
      { id: 3, rank: 3, name: 'Roberto Souza', avatar: 'RS', sales: 39, value: 58500, conversionRate: 14.8, trend: 'stable', region: 'Belo Horizonte', lastSaleTime: 'há 20 min' },
      { id: 4, rank: 4, name: 'Amanda Oliveira', avatar: 'AO', sales: 35, value: 52500, conversionRate: 13.1, trend: 'down', region: 'Campinas', lastSaleTime: 'há 1 hora' },
      { id: 5, rank: 5, name: 'Lucas Fernandes', avatar: 'LF', sales: 31, value: 46500, conversionRate: 12.4, trend: 'up', region: 'Curitiba', lastSaleTime: 'há 2 horas' },
    ],
    metrics: {
      enrollments: 197,
      goal: 220,
      percentage: 89.5,
      growth: 12.4,
      dailyAverage: 9.8
    },
    lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  },
  ead: {
    ranking: [
      { id: 101, rank: 1, name: 'Beatriz Santos', avatar: 'BS', sales: 112, value: 56000, conversionRate: 24.1, trend: 'up', region: 'Nacional', lastSaleTime: 'há 2 min' },
      { id: 102, rank: 2, name: 'Felipe Amorim', avatar: 'FA', sales: 98, value: 49000, conversionRate: 21.8, trend: 'up', region: 'Nacional', lastSaleTime: 'há 8 min' },
      { id: 103, rank: 3, name: 'Juliana Vieira', avatar: 'JV', sales: 95, value: 47500, conversionRate: 20.3, trend: 'stable', region: 'Nacional', lastSaleTime: 'há 15 min' },
      { id: 104, rank: 4, name: 'Rodrigo Lima', avatar: 'RL', sales: 87, value: 43500, conversionRate: 18.9, trend: 'down', region: 'Nacional', lastSaleTime: 'há 45 min' },
      { id: 105, rank: 5, name: 'Patricia Ramos', avatar: 'PR', sales: 82, value: 41000, conversionRate: 17.5, trend: 'up', region: 'Nacional', lastSaleTime: 'há 1 hora' },
    ],
    metrics: {
      enrollments: 474,
      goal: 500,
      percentage: 94.8,
      growth: 18.7,
      dailyAverage: 23.7
    },
    lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  },
  announcements: [
    {
      id: 1,
      title: '🚨 Superação da Meta Semanal!',
      description: 'Parabéns a todo o time comercial. O EAD superou a meta semanal em 15% e o Presencial está a apenas 2 matrículas de atingir seu objetivo parcial. Vamos acelerar nas próximas horas!',
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
      title: '🏆 Destaque do Dia: Beatriz Santos',
      description: 'A consultora Beatriz Santos fechou 12 matrículas nas últimas 24 horas, consolidando sua liderança no ranking EAD. Que marca incrível, parabéns Beatriz!',
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
  ]
};

// Function to slightly fluctuate data dynamically (simulates real-time commercial movements)
const updateDynamicData = () => {
  const now = new Date();
  
  // Decide whether to add a sale to Presencial or EAD (70% chance of a new sale on any check)
  const isNewSale = Math.random() < 0.6;
  if (isNewSale) {
    const isEad = Math.random() > 0.4; // 60% chance it's EAD
    
    if (isEad) {
      // Pick a random consultant in EAD ranking to award a sale
      const index = Math.floor(Math.random() * 5);
      database.ead.ranking[index].sales += 1;
      database.ead.ranking[index].value += 500;
      database.ead.ranking[index].lastSaleTime = 'Agora mesmo';
      database.ead.ranking[index].trend = 'up';
      
      // Update overall metrics
      database.ead.metrics.enrollments += 1;
      database.ead.metrics.percentage = parseFloat(((database.ead.metrics.enrollments / database.ead.metrics.goal) * 100).toFixed(1));
      database.ead.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Sort EAD ranking based on sales
      database.ead.ranking.sort((a, b) => b.sales - a.sales);
      database.ead.ranking.forEach((c, idx) => {
        c.rank = idx + 1;
      });
    } else {
      // Pick a random consultant in Presencial ranking to award a sale
      const index = Math.floor(Math.random() * 5);
      database.presencial.ranking[index].sales += 1;
      database.presencial.ranking[index].value += 1500;
      database.presencial.ranking[index].lastSaleTime = 'Agora mesmo';
      database.presencial.ranking[index].trend = 'up';
      
      // Update overall metrics
      database.presencial.metrics.enrollments += 1;
      database.presencial.metrics.percentage = parseFloat(((database.presencial.metrics.enrollments / database.presencial.metrics.goal) * 100).toFixed(1));
      database.presencial.lastUpdate = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Sort Presencial ranking based on sales
      database.presencial.ranking.sort((a, b) => b.sales - a.sales);
      database.presencial.ranking.forEach((c, idx) => {
        c.rank = idx + 1;
      });
    }
  }

  // Set other random times
  const formats = ['há 2 min', 'há 5 min', 'há 10 min', 'há 15 min', 'há 30 min', 'há 1 hora'];
  database.presencial.ranking.forEach((c) => {
    if (c.lastSaleTime !== 'Agora mesmo' && Math.random() < 0.25) {
      c.lastSaleTime = formats[Math.floor(Math.random() * formats.length)];
    }
  });
  database.ead.ranking.forEach((c) => {
    if (c.lastSaleTime !== 'Agora mesmo' && Math.random() < 0.25) {
      c.lastSaleTime = formats[Math.floor(Math.random() * formats.length)];
    }
  });
};

// Simulate Axios response
export const fetchDashboardData = async (): Promise<DashboardData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  updateDynamicData();
  return JSON.parse(JSON.stringify(database)); // Deep copy to trigger state changes
};

// Axios base config mockup
export const api = axios.create({
  baseURL: '/api'
});
