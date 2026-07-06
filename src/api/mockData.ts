import { supabase } from './supabaseClient';
import axios from 'axios';

export interface Consultant {
  id: number;
  rank: number;
  name: string;
  avatar: string;
  sales: number; // Grand total sales across all months
  dailySales: Record<string, Record<number, number>>; // key: "YYYY-MM" (e.g. "2026-07"), value: Record<day, quantity>
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

export interface CourseSale {
  id: number;
  name: string;
  type: 'presencial' | 'ead';
  sales: number;
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
  courses?: CourseSale[];
}

const calculateMetrics = (ranking: Consultant[], goal: number, monthStr: string = "2026-07"): Metric => {
  // Metric enrollments should sum the sales for the selected month
  const enrollments = ranking.reduce((acc, curr) => {
    const monthlyData = curr.dailySales?.[monthStr] || {};
    const monthSum = Object.values(monthlyData).reduce((a, b) => a + b, 0);
    return acc + monthSum;
  }, 0);

  return {
    enrollments,
    goal,
    percentage: parseFloat(((enrollments / goal) * 100).toFixed(1)),
    growth: 12.4,
    dailyAverage: parseFloat((enrollments / 30).toFixed(1))
  };
};

export const generateDailySales = (totalSales: number, year: number, month: number) => {
  const result: Record<number, number> = {};
  for (let i = 1; i <= 31; i++) {
    result[i] = 0;
  }
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays: number[] = [];
  
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays.push(d);
    }
  }

  if (weekdays.length === 0) return result;

  let remaining = totalSales;
  while (remaining > 0) {
    const randomIndex = Math.floor(Math.random() * weekdays.length);
    const day = weekdays[randomIndex];
    result[day] += 1;
    remaining -= 1;
  }
  return result;
};

export const adjustDailySales = (consultant: Consultant, newMonthSales: number, monthStr: string) => {
  if (!consultant.dailySales) {
    consultant.dailySales = {};
  }
  if (!consultant.dailySales[monthStr]) {
    consultant.dailySales[monthStr] = {};
    for (let i = 1; i <= 31; i++) {
      consultant.dailySales[monthStr][i] = 0;
    }
  }

  const currentMonthSales = Object.values(consultant.dailySales[monthStr]).reduce((a, b) => a + b, 0);
  const diff = newMonthSales - currentMonthSales;

  const [yearStr, monthIndexStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthIndexStr, 10) - 1; // 0-indexed

  const now = new Date();
  let todayDay = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  // If the change is exactly +1 or -1 in the current month, apply it to today
  if (isCurrentMonth && Math.abs(diff) === 1) {
    const dayOfWeek = now.getDay();
    // If weekend, backtrack to Friday
    if (dayOfWeek === 6) {
      todayDay = Math.max(1, todayDay - 1);
    } else if (dayOfWeek === 0) {
      todayDay = Math.max(1, todayDay - 2);
    }
    if (diff > 0) {
      consultant.dailySales[monthStr][todayDay] = (consultant.dailySales[monthStr][todayDay] || 0) + diff;
    } else {
      consultant.dailySales[monthStr][todayDay] = Math.max(0, (consultant.dailySales[monthStr][todayDay] || 0) - 1);
    }
  } else {
    // If it's a larger change or other month, redistribute the monthly total
    consultant.dailySales[monthStr] = generateDailySales(newMonthSales, year, month);
  }

  // Recalculate grand total sales across all months
  let totalSales = 0;
  for (const m in consultant.dailySales) {
    totalSales += Object.values(consultant.dailySales[m]).reduce((a, b) => a + b, 0);
  }
  consultant.sales = totalSales;
};

export const presencialCourseNames = [
  "Administracao", "Agronomia", "Analise_desenvolvimento_sistema", "Arquitetura_urbanismo",
  "Biomedicina", "Biotecnologia", "Ciencias_computacao", "Ciencias_biologicas - Bacharelado",
  "Ciencias_biologicas - Licenciatura", "Ciencias_contabeis", "Comunicacao_social_publidade_propaganda",
  "Comunicacao_social_jornalismo", "Design", "Design_grafico", "Direito", "Educacao_fisica - Bacharelado",
  "Educacao_fisica - Licenciatura", "Enfermagem", "Engenharia_civil", "Engenharia_producao",
  "Engenharia_eletrica", "Engenharia_mecanica", "Engenharia_mecatronica", "Engenharia_quimica",
  "Estetica_cosmetica", "Farmacia", "Fisioterapia", "Fonoaudiologia", "Gastronomia", "Marketing",
  "Medicina_veterinaria", "Nutricao", "Odontologia", "Pedagogia", "Psicologia", "Sistemas_informacao",
  "Terapia_Ocupacional", "Zootecnia"
];

export const eadCourseNames = [
  "Administracao - EAD", "Agrocomputacao - EAD", "Agronomia - EAD", "Analise_desenvolvimento_sistema - EAD",
  "Arquitetura_urbanismo - EAD", "Artes_visuais - Licenciatura - EAD", "Automação_Industrial - EAD",
  "Banco_de_Dados - EAD", "Biomedicina - EAD", "Ciencias_computacao - EAD", "Ciencias_biologicas - Bacharelado - EAD",
  "Ciencias_biologicas - Licenciatura - EAD", "Ciencias_contabeis - EAD", "Ciências_Econômicas - EAD",
  "Comercio_exterior - EAD", "Design_interiores - EAD", "Design_moda - EAD", "Design_grafico - EAD",
  "Educacao_financeira - EAD", "Educacao_fisica - Bacharelado - EAD", "Engenharia_civil - EAD",
  "Engenharia_producao - EAD", "Engenharia_software - EAD", "Engenharia_eletrica - EAD",
  "Engenharia_mecanica - EAD", "Engenharia_mecatronica - EAD", "Estetica_cosmetica - EAD",
  "Farmacia - EAD", "Fisioterapia - EAD", "Fonoaudiologia - EAD", "Fotografia - EAD",
  "Gastronomia - EAD", "Gestão_Ambiental - EAD", "Gestao_comercial - EAD", "Gestão_da_Produção_Industrial - EAD",
  "Gestao_qualidade - EAD", "Gestão_da_Segurança_Privada - EAD", "Gestao_TI - EAD",
  "Gestao_recursos_humanos - EAD", "Gestão_de_Serviços_Judiciais_e_Notariais - EAD",
  "Gestao_agronegocio - EAD", "Gestao_financeira - EAD", "Gestao_hospitalar - EAD",
  "Gestão_Portuária - EAD", "Gestao_publica - EAD", "Historia - Licenciatura - EAD",
  "Inteligência_Artificial - EAD", "Comunicacao_social_jornalismo - EAD",
  "Letras_portugues/ingles - Licenciatura - EAD", "Logistica - EAD", "Marketing - EAD",
  "Matematica - Licenciatura - EAD", "Musica - Licenciatura- EAD", "Nutricao - EAD",
  "Pedagogia - EAD", "Processos_gerenciais - EAD", "Psicopedagogia - EAD",
  "Comunicacao_social_publidade_propaganda - EAD", "Quimica - Bacharelado- EAD",
  "Quimica - Licenciatura - EAD", "Radiologia - EAD", "Relações_Internacionais - EAD",
  "Segurança_Cibernética - EAD", "Serviço_Social - EAD", "Sistemas_para_Internet - EAD",
  "Teologia - EAD", "Terapia_Ocupacional - EAD", "Zootecnia - EAD"
];

// Default starting database with real names for reset, containing Jun 2026 and Jul 2026 data
const loadDefaultDatabase = (): DashboardData => {
  const initialPresencial = [
    { id: 1, name: 'Fabricia', avatar: 'FA', sales: 45, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 2, name: 'Rafaella', avatar: 'RA', sales: 41, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 3, name: 'Cauã', avatar: 'CA', sales: 38, status: 'active' as const, value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 4, name: 'Giovanna S', avatar: 'GS', sales: 34, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 5, name: 'Murilo G.', avatar: 'MG', sales: 30, status: 'active' as const, value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 6, name: 'Giovanna C', avatar: 'GC', sales: 27, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 7, name: 'Emanoel', avatar: 'EM', sales: 25, status: 'vacation' as const, value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 8, name: 'Isadora', avatar: 'IS', sales: 22, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 9, name: 'Nicoly', avatar: 'NI', sales: 19, status: 'active' as const, value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 10, name: 'Júlia', avatar: 'JU', sales: 16, status: 'vacation' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 11, name: 'Luís', avatar: 'LU', sales: 14, status: 'active' as const, value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 12, name: 'João', avatar: 'JO', sales: 12, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 13, name: 'Gabriel', avatar: 'GA', sales: 9, status: 'active' as const, value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 14, name: 'Majori', avatar: 'MA', sales: 6, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 15, name: 'Murillo A.', avatar: 'MU', sales: 3, status: 'vacation' as const, value: 0, conversionRate: 0, trend: 'stable' as const }
  ].map(c => {
    const june = Math.floor(c.sales / 2);
    const july = c.sales - june;
    const dailySales: Record<string, Record<number, number>> = {
      "2026-06": generateDailySales(june, 2026, 5),
      "2026-07": generateDailySales(july, 2026, 6)
    };
    return { ...c, rank: 0, dailySales };
  });

  const initialEad = [
    { id: 101, name: 'Guilherme', avatar: 'GL', sales: 110, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 102, name: 'Caroline', avatar: 'CR', sales: 98, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 103, name: 'Mario', avatar: 'MR', sales: 92, status: 'active' as const, value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 104, name: 'Alline', avatar: 'AL', sales: 85, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 105, name: 'Mariana', avatar: 'MN', sales: 80, status: 'vacation' as const, value: 0, conversionRate: 0, trend: 'down' as const },
    { id: 106, name: 'Felipe', avatar: 'FL', sales: 72, status: 'active' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 107, name: 'Tamyres', avatar: 'TM', sales: 65, status: 'active' as const, value: 0, conversionRate: 0, trend: 'stable' as const },
    { id: 108, name: 'Micheline', avatar: 'MC', sales: 58, status: 'vacation' as const, value: 0, conversionRate: 0, trend: 'up' as const },
    { id: 109, name: 'Vinícius', avatar: 'VN', sales: 50, status: 'active' as const, value: 0, conversionRate: 0, trend: 'down' as const }
  ].map(c => {
    const june = Math.floor(c.sales / 2);
    const july = c.sales - june;
    const dailySales: Record<string, Record<number, number>> = {
      "2026-06": generateDailySales(june, 2026, 5),
      "2026-07": generateDailySales(july, 2026, 6)
    };
    return { ...c, rank: 0, dailySales };
  });

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

  const defaultCourses: CourseSale[] = [
    ...presencialCourseNames.map((name, index) => ({
      id: index + 1,
      name,
      type: 'presencial' as const,
      sales: 0
    })),
    ...eadCourseNames.map((name, index) => ({
      id: index + 100,
      name,
      type: 'ead' as const,
      sales: 0
    }))
  ];

  return {
    presencial: {
      ranking: initialPresencial,
      metrics: calculateMetrics(initialPresencial, 300, "2026-07"),
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    ead: {
      ranking: initialEad,
      metrics: calculateMetrics(initialEad, 700, "2026-07"),
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    announcements,
    courses: defaultCourses
  };
};

export const fetchDashboardData = async (selectedMonth: string = "2026-07"): Promise<DashboardData> => {
  // Fetch consultants from Supabase
  const { data: consultantsData, error: cError } = await supabase
    .from('consultants')
    .select('*');

  if (cError) {
    console.error("Error fetching consultants from Supabase:", cError);
  }

  // Fetch announcements from Supabase
  const { data: announcementsData, error: aError } = await supabase
    .from('announcements')
    .select('*')
    .order('id', { ascending: true });

  if (aError) {
    console.error("Error fetching announcements from Supabase:", aError);
  }

  const dbConsultants = consultantsData || [];
  
  if (dbConsultants.length === 0) {
    console.warn("No consultants found in Supabase. Auto-seeding default database in the background.");
    resetDashboardData().catch(err => console.error("Error auto-seeding database:", err));
    return loadDefaultDatabase();
  }

  const dbAnnouncements = announcementsData || [];

  // Map database format to frontend interface format
  const mappedConsultants: Consultant[] = dbConsultants.map(c => ({
    id: Number(c.id),
    rank: 0, // rank will be computed after sorting
    name: c.name,
    avatar: c.avatar,
    sales: c.sales, // Overall cumulative sales
    dailySales: c.daily_sales || {}, // Nested monthly daily sales object
    status: c.status,
    value: Number(c.value),
    conversionRate: Number(c.conversion_rate),
    trend: c.trend,
    lastSaleTime: c.last_sale_time || undefined
  }));

  // Separate Presencial and EAD using the database "type" field
  const presencialRanking = mappedConsultants.filter(c => {
    const dbItem = dbConsultants.find(dc => Number(dc.id) === c.id);
    return dbItem?.type === 'presencial';
  });

  const eadRanking = mappedConsultants.filter(c => {
    const dbItem = dbConsultants.find(dc => Number(dc.id) === c.id);
    return dbItem?.type === 'ead';
  });

  // Sort and apply ranks BASED ON SELECTED MONTH'S SALES
  const getMonthlySales = (c: Consultant) => {
    const monthData = c.dailySales?.[selectedMonth] || {};
    return Object.values(monthData).reduce((a, b) => a + b, 0);
  };

  presencialRanking.sort((a, b) => getMonthlySales(b) - getMonthlySales(a));
  presencialRanking.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  eadRanking.sort((a, b) => getMonthlySales(b) - getMonthlySales(a));
  eadRanking.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let mappedCourses: CourseSale[] = [];
  const { data: coursesData, error: coError } = await supabase
    .from('course_sales')
    .select('*');

  if (coError || !coursesData || coursesData.length === 0) {
    // Try localStorage fallback
    const localFallback = localStorage.getItem('local_courses_fallback');
    if (localFallback) {
      try {
        mappedCourses = JSON.parse(localFallback);
      } catch (e) {
        mappedCourses = [];
      }
    }

    if (mappedCourses.length === 0) {
      mappedCourses = [
        ...presencialCourseNames.map((name, index) => ({
          id: index + 1,
          name,
          type: 'presencial' as const,
          sales: 0
        })),
        ...eadCourseNames.map((name, index) => ({
          id: index + 100,
          name,
          type: 'ead' as const,
          sales: 0
        }))
      ];
    }
  } else {
    mappedCourses = coursesData.map(c => ({
      id: Number(c.id),
      name: c.name,
      type: c.type,
      sales: Number(c.sales || 0)
    }));
  }

  return {
    presencial: {
      ranking: presencialRanking,
      metrics: calculateMetrics(presencialRanking, 300, selectedMonth),
      lastUpdate: timeString
    },
    ead: {
      ranking: eadRanking,
      metrics: calculateMetrics(eadRanking, 700, selectedMonth),
      lastUpdate: timeString
    },
    announcements: dbAnnouncements.map(a => ({
      id: Number(a.id),
      title: a.title,
      description: a.description,
      date: a.date,
      type: a.type,
      author: a.author
    })),
    courses: mappedCourses
  };
};

export const saveDashboardData = async (newData: DashboardData) => {
  // Combine Presencial and EAD lists to sync to consultants table
  const allConsultants = [
    ...newData.presencial.ranking.map(c => ({ ...c, type: 'presencial' })),
    ...newData.ead.ranking.map(c => ({ ...c, type: 'ead' }))
  ];

  const dbConsultants = allConsultants.map(c => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    type: c.type,
    sales: c.sales, // Overall cumulative sales
    daily_sales: c.dailySales || {}, // Nested object
    status: c.status,
    value: c.value,
    conversion_rate: c.conversionRate,
    trend: c.trend,
    last_sale_time: c.lastSaleTime || null
  }));

  // Perform upsert of all consultants
  const { error: cError } = await supabase
    .from('consultants')
    .upsert(dbConsultants);

  if (cError) {
    console.error("Error upserting consultants to Supabase:", cError);
  }

  // Delete deleted announcements and upsert the current ones
  const dbAnnouncements = newData.announcements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    type: a.type,
    author: a.author
  }));

  // Delete all announcements first
  const { error: delError } = await supabase
    .from('announcements')
    .delete()
    .neq('id', 0);

  if (delError) {
    console.error("Error clearing old announcements from Supabase:", delError);
  }

  if (dbAnnouncements.length > 0) {
    const { error: insError } = await supabase
      .from('announcements')
      .insert(dbAnnouncements);

    if (insError) {
      console.error("Error inserting announcements into Supabase:", insError);
    }
  }

  // Sync course_sales if present
  if (newData.courses && newData.courses.length > 0) {
    const dbCourses = newData.courses.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      sales: c.sales
    }));

    // Save to local localStorage as fallback
    localStorage.setItem('local_courses_fallback', JSON.stringify(dbCourses));

    const { error: coError } = await supabase
      .from('course_sales')
      .upsert(dbCourses);

    if (coError) {
      console.warn("Could not sync course_sales to Supabase (normal if table does not exist):", coError.message);
    }
  }
};

export const resetDashboardData = async () => {
  // Clear tables
  const { error: delConsultantsErr } = await supabase
    .from('consultants')
    .delete()
    .neq('id', 0);
  if (delConsultantsErr) console.error(delConsultantsErr);

  const { error: delAnnouncementsErr } = await supabase
    .from('announcements')
    .delete()
    .neq('id', 0);
  if (delAnnouncementsErr) console.error(delAnnouncementsErr);

  // Load defaults and save them to Supabase
  const defaultData = loadDefaultDatabase();
  await saveDashboardData(defaultData);
};

export const setSimulationEnabled = (enabled: boolean) => {
  localStorage.setItem('univ_sales_simulation_enabled', String(enabled));
};

export const getSimulationEnabled = (): boolean => {
  return localStorage.getItem('univ_sales_simulation_enabled') === 'true';
};

export const api = axios.create({
  baseURL: '/api'
});
