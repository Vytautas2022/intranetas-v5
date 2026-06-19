
import React, { useMemo, useState } from 'react';
import { 
  AlertCircle, 
  ShoppingCart, 
  RefreshCcw, 
  History, 
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  TrendingDown,
  Star,
  Zap,
  Building2,
  Wrench,
  X,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CeoDashboardProps, KpiMetric } from './types';
import { cn } from '../../lib/utils';
import { Status } from '../../types/faults';
import { generateOccurrences } from '../periodic/utils/occurrenceHelper';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { getSlaDeadline } from '../../logic/slaEngine';

const KpiCard = ({ metric, onClick }: { metric: KpiMetric, onClick?: () => void }) => {
  const colorClasses: Record<string, string> = {
    green: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-rose-600 bg-rose-50 border-rose-100",
    yellow: "text-amber-600 bg-amber-50 border-amber-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group",
        onClick && "active:scale-95"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border", colorClasses[metric.color])}>
          <metric.icon size={20} />
        </div>
        {metric.trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-black uppercase px-2 py-1 rounded-lg",
            metric.trend.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
          )}>
            {metric.trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {metric.trend.value}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-900 leading-none mb-1 tracking-tight">{metric.value}</h3>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{metric.label}</p>
      </div>
    </div>
  );
};

const formatEuro = (value: number) =>
  new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const getOrderAmount = (order: any) => {
  if (typeof order.actualCost === "number") return order.actualCost;
  if (typeof order.estimatedBudget === "number") return order.estimatedBudget;

  return (order.items || []).reduce(
    (sum: number, item: any) =>
      sum + (item.actualUnitPrice || item.unitPrice || 0) * (item.quantity || 0),
    0,
  );
};

const CfoKpiCard = ({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "income" | "critical" | "expense" | "cashflow";
  icon: React.ElementType;
}) => {
  const toneClasses = {
    income: "border-emerald-100 bg-emerald-50 text-emerald-700",
    critical: "border-rose-100 bg-rose-50 text-rose-700",
    expense: "border-amber-100 bg-amber-50 text-amber-700",
    cashflow: "border-blue-100 bg-blue-50 text-blue-700",
  };

  return (
    <div className="cfo-kpi rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("rounded-2xl border p-3", toneClasses[tone])}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="mb-1 text-3xl font-black leading-none text-slate-900">
          {value}
        </p>
        <p className="text-[11px] font-black uppercase leading-none tracking-widest text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, onAction }: { title: string, subtitle: string, onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-6 px-4">
    <div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{title}</h2>
      <p className="text-xs font-medium text-slate-400">{subtitle}</p>
    </div>
    {onAction && (
      <button 
        onClick={onAction}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
      >
        Peržiūrėti visus <ChevronRight size={14} />
      </button>
    )}
  </div>
);

export const CeoDashboard: React.FC<CeoDashboardProps> = ({ 
  faults, 
  tasks, 
  orders, 
  periodicInstances, 
  periodicTemplates,
  audits, 
  sops,
  clubs,
  surveys,
  onNavigate 
}) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [comparison, setComparison] = useState<'previous' | 'yearOverYear' | 'none'>('previous');
  const [regionFilter, setRegionFilter] = useState<'All' | 'Vilnius' | 'Kaunas' | 'Klaipėda'>('All');
  const [customDates, setCustomDates] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const stats = useMemo(() => {
    // --- 0. PREPARING TIME PERIODS ---
    const now = Date.now();
    let startDate: number;
    let endDate = now;

    if (timeRange === 'custom') {
      startDate = startOfDay(parseISO(customDates.from)).getTime();
      endDate = endOfDay(parseISO(customDates.to)).getTime();
    } else if (timeRange === 'month') {
      startDate = now - (30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'quarter') {
      startDate = now - (90 * 24 * 60 * 60 * 1000);
    } else {
      startDate = now - (365 * 24 * 60 * 60 * 1000);
    }

    const last30d = startDate;
    const prev30d = last30d - (endDate - startDate);
    const last90d = now - (90 * 24 * 60 * 60 * 1000);
    const prev90d = last90d - (90 * 24 * 60 * 60 * 1000);

    // --- CFO KPI ---
    const periodOrders = (orders || []).filter(
      (order) => order && order.requestedAt >= startDate && order.requestedAt <= endDate,
    );
    const receivedMoney = periodOrders
      .filter(
        (order) =>
          order.category === "VENDING" &&
          ["DELIVERED_TO_CLUB", "SENT_TO_ACCOUNTING", "CLOSED"].includes(order.status),
      )
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
    const criticalExpenses = periodOrders
      .filter((order) => order.urgency === "critical" || order.urgency === "urgent")
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
    const operatingExpenses = periodOrders
      .filter((order) => order.urgency !== "critical" && order.urgency !== "urgent")
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
    const normalizedCashFlow =
      receivedMoney - criticalExpenses - operatingExpenses;

    // --- 1. FAULT ANALYTICS ---
    const faultsThisMonth = (faults || []).filter(f => f && f.createdAt >= last30d).length;
    const faultsLastMonth = (faults || []).filter(f => f && f.createdAt >= prev30d && f.createdAt < last30d).length;
    const faultTrendValue = faultsLastMonth > 0 ? ((faultsLastMonth - faultsThisMonth) / faultsLastMonth) * 100 : 0;

    const equipmentFaults = (faults || []).filter(f => f && f.createdAt >= last30d && (f.type === 'EQUIPMENT_FAULT' || f.type === 'treniruokliai')).length;
    const facilityFaults = (faults || []).filter(f => f && f.createdAt >= last30d && (f.type === 'FACILITY_FAULT' || f.type === 'baldai' || f.type === 'valymas')).length;

    // --- 2. SLA PERFORMANCE ---
    const closedThisMonth = (faults || []).filter(f => f && f.status === Status.FIXED && f.closedAt && f.closedAt >= last30d);
    const onTimeThisMonth = closedThisMonth.filter(f => {
      const deadline = getSlaDeadline(f);
      return f.closedAt! <= deadline;
    }).length;
    
    const slaSuccessRate = closedThisMonth.length > 0 ? Math.round((onTimeThisMonth / closedThisMonth.length) * 100) : 100;
    
    const openFaults = (faults || []).filter(f => f && f.status !== Status.FIXED && f.status !== Status.REJECTED);
    const overdueCount = openFaults.filter(f => {
      const deadline = getSlaDeadline(f);
      return now > deadline;
    }).length;
    const overduePercentage = openFaults.length > 0 ? Math.round((overdueCount / openFaults.length) * 100) : 0;

    // --- 3. CLIENT RATINGS ---
    const recentSurveys = (surveys || []).filter(s => s && s.timestamp >= last90d);
    const prevSurveys = (surveys || []).filter(s => s && s.timestamp >= prev90d && s.timestamp < last90d);

    const calculateAvg = (items: any[]) => {
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, s) => {
        const r = s.ratings;
        return acc + (r.repairSpeed + r.equipmentQuality + r.inventoryQuality + r.cleanliness + r.ventilation + r.trainers + r.clientBehavior + r.service) / 8;
      }, 0);
      return Math.round((sum / items.length) * 10) / 10;
    };

    const avgScore = calculateAvg(recentSurveys);
    const prevScore = calculateAvg(prevSurveys);
    const ratingsTrend = prevScore > 0 ? ((avgScore - prevScore) / prevScore) * 100 : 0;

    // Category breakdown
    const categories = ['repairSpeed', 'equipmentQuality', 'inventoryQuality', 'cleanliness', 'ventilation', 'trainers', 'clientBehavior', 'service'];
    const categoryScores = categories.map(cat => {
      const current = recentSurveys.length > 0 ? recentSurveys.reduce((acc, s) => acc + (s.ratings as any)[cat], 0) / recentSurveys.length : 0;
      const previous = prevSurveys.length > 0 ? prevSurveys.reduce((acc, s) => acc + (s.ratings as any)[cat], 0) / prevSurveys.length : 0;
      return { 
        name: cat, 
        score: Math.round(current * 10) / 10,
        trend: previous > 0 ? (current - previous) : 0
      };
    });

    // --- 4. GLOBAL KPI SCORE & STATUS ---
    const faultTrendScore = Math.min(100, Math.max(0, 50 + faultTrendValue * 2.5));
    const slaScore = slaSuccessRate;
    const ratingsScore = (avgScore / 5) * 100;

    const globalScore = Math.round((faultTrendScore * 0.3) + (slaScore * 0.3) + (ratingsScore * 0.4));
    let statusLabel = 'STABILI';
    let statusColor = 'yellow';
    if (globalScore > 80) { statusLabel = 'GERĖJA'; statusColor = 'green'; }
    else if (globalScore < 60) { statusLabel = 'BLOGĖJA'; statusColor = 'red'; }

    // --- 5. REGION VIEW ---
    const regions = ['Vilnius', 'Kaunas', 'Klaipėda'];
    const regionMetrics = regions.map(regionName => {
      const regionClubs = (clubs || []).filter(c => c && c.region === regionName);
      const clubIds = regionClubs.map(c => c.id);
      
      const regionFaults = (faults || []).filter(f => f && clubIds.includes(f.clubId) && f.createdAt >= last30d).length;
      const regionSla = (faults || []).filter(f => f && clubIds.includes(f.clubId) && f.status === Status.FIXED && f.closedAt && f.closedAt >= last30d);
      const regionOnTime = regionSla.filter(f => (f.closedAt! <= getSlaDeadline(f))).length;
      
      const regionSurveys = (surveys || []).filter(s => s && clubIds.includes(s.clubId) && s.timestamp >= last90d);
      
      return {
        name: regionName,
        faults: regionFaults,
        sla: regionSla.length > 0 ? Math.round((regionOnTime / regionSla.length) * 100) : 100,
        rating: calculateAvg(regionSurveys)
      };
    });

    // --- 6. INSIGHTS ---
    const topImprovements = categoryScores.filter(c => c.trend > 0).sort((a,b) => b.trend - a.trend).slice(0, 2);
    const topDeclines = categoryScores.filter(c => c.trend < 0).sort((a,b) => a.trend - b.trend).slice(0, 2);

    // --- 7. SOP ANALYTICS ---
    const totalPeriodic = (periodicTemplates || []).length;
    const hasSopCount = (periodicTemplates || []).filter(p => p.sop?.exists).length;
    const noSopCount = totalPeriodic - hasSopCount;
    const sopCoverage = totalPeriodic > 0 ? Math.round((hasSopCount / totalPeriodic) * 100) : 0;
    
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const updatedLastMonth = (periodicTemplates || []).filter(p => p.sop?.updatedAt && p.sop.updatedAt >= oneMonthAgo);

    const clubMissingSops: Record<string, number> = {};
    (periodicTemplates || []).forEach(p => {
      if (!p.sop?.exists && p.targetClubIds) {
        p.targetClubIds.forEach(cid => {
          clubMissingSops[cid] = (clubMissingSops[cid] || 0) + 1;
        });
      }
    });

    const topClubsMissingSops = Object.entries(clubMissingSops)
      .map(([id, count]) => ({ id, name: clubs.find(c => c.id === id)?.name || id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const oldestSops = (periodicTemplates || []).filter(p => p.sop?.exists && p.sop.updatedAt)
      .sort((a, b) => (a.sop!.updatedAt!) - (b.sop!.updatedAt!))
      .slice(0, 5);

    // --- 8. PERIODIC TASKS ANALYSIS ---
    const periodicOccurrences = generateOccurrences(
      periodicTemplates || [],
      new Date(startDate),
      new Date(endDate),
      clubs || []
    );

    const periodicStats = {
      planned: periodicOccurrences.filter(o => o.status === 'planned').length,
      completedOnTime: periodicOccurrences.filter(o => o.status === 'completed_on_time').length,
      overdue: periodicOccurrences.filter(o => o.status === 'overdue').length,
      completedLate: periodicOccurrences.filter(o => o.status === 'completed_late').length,
      cancelled: periodicOccurrences.filter(o => o.status === 'cancelled').length,
      deactivatedTasks: (periodicTemplates || []).filter(t => !t.isActive && t.deactivatedAt && t.deactivatedAt >= startDate).length
    };

    // TOP Objects by Cancellations
    const cancellationsByClub: Record<string, number> = {};
    const overdueByClub: Record<string, number> = {};

    periodicOccurrences.forEach(o => {
      if (o.status === 'cancelled') {
        cancellationsByClub[o.objectId] = (cancellationsByClub[o.objectId] || 0) + 1;
      }
      if (o.status === 'overdue') {
        overdueByClub[o.objectId] = (overdueByClub[o.objectId] || 0) + 1;
      }
    });

    const topClubsCancellations = Object.entries(cancellationsByClub)
      .map(([id, count]) => ({ 
        id, 
        name: clubs.find(c => c.id === id)?.name || id, 
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topClubsOverdue = Object.entries(overdueByClub)
      .map(([id, count]) => ({ 
        id, 
        name: clubs.find(c => c.id === id)?.name || id, 
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      global: {
        score: globalScore,
        status: statusLabel,
        color: statusColor
      },
      finance: {
        receivedMoney,
        criticalExpenses,
        operatingExpenses,
        normalizedCashFlow
      },
      faults: {
        thisMonth: faultsThisMonth,
        lastMonth: faultsLastMonth,
        trend: Math.round(faultTrendValue),
        equipment: equipmentFaults,
        facility: facilityFaults
      },
      sla: {
        successRate: slaSuccessRate,
        overduePercent: overduePercentage,
        overdueCount
      },
      sop: {
        total: totalPeriodic,
        hasSop: hasSopCount,
        noSop: noSopCount,
        coverage: sopCoverage,
        updatedRecent: updatedLastMonth,
        topClubsMissing: topClubsMissingSops,
        oldest: oldestSops
      },
      periodic: {
        ...periodicStats,
        topClubsCancellations,
        topClubsOverdue
      },
      ratings: {
        avg: avgScore,
        trend: Math.round(ratingsTrend),
        categories: categoryScores
      },
      regions: regionMetrics,
      insights: {
        improvements: topImprovements,
        declines: topDeclines
      }
    };
  }, [faults, surveys, clubs, periodicTemplates, orders, Status, timeRange, customDates]);

  const kpis: KpiMetric[] = [
    { 
      label: 'Operacijų būklė', 
      value: stats.global.status, 
      color: stats.global.color as any,
      icon: TrendingUp,
      trend: { value: stats.global.score, isUp: stats.global.score > 50 }
    },
    { 
      label: 'SOP Padengimas', 
      value: `${stats.sop.coverage}%`, 
      color: stats.sop.coverage > 90 ? 'green' : stats.sop.coverage > 70 ? 'yellow' : 'red',
      icon: FileText,
    },
    { 
      label: 'SLA Laikomasi', 
      value: `${stats.sla.successRate}%`, 
      color: stats.sla.successRate > 90 ? 'green' : stats.sla.successRate > 80 ? 'yellow' : 'red',
      icon: CheckCircle2,
    },
    { 
      label: 'Klientų vertinimas', 
      value: stats.ratings.avg, 
      color: stats.ratings.avg > 4 ? 'green' : stats.ratings.avg > 3 ? 'yellow' : 'red',
      icon: Star,
      trend: { value: Math.abs(stats.ratings.trend), isUp: stats.ratings.trend > 0 }
    }
  ];

  const getMetricLabel = (name: string) => {
    const labels: Record<string, string> = {
      repairSpeed: 'Remonto greitis',
      equipmentQuality: 'Įrangos kokybė',
      inventoryQuality: 'Inventoriaus kokybė',
      cleanliness: 'Švara',
      ventilation: 'Vėdinimas',
      trainers: 'Treneriai',
      clientBehavior: 'Klientų elgesys',
      service: 'Aptarnavimas'
    };
    return labels[name] || name;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 space-y-12"
    >
      {/* 0. FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="text-sm font-bold bg-slate-50 border-none rounded-xl p-2 outline-none">
          <option value="month">Šis mėnuo</option>
          <option value="quarter">Šis ketvirtis</option>
          <option value="year">Praėję metai</option>
          <option value="custom">Pasirinkti datą</option>
        </select>
        
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={customDates.from} 
              onChange={(e) => setCustomDates(prev => ({ ...prev, from: e.target.value }))}
              className="text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl p-2 outline-none"
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date" 
              value={customDates.to} 
              onChange={(e) => setCustomDates(prev => ({ ...prev, to: e.target.value }))}
              className="text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl p-2 outline-none"
            />
          </div>
        )}
        <select value={comparison} onChange={(e) => setComparison(e.target.value as any)} className="text-sm font-bold bg-slate-50 border-none rounded-xl p-2 outline-none">
          <option value="previous">vs praėjęs laikotarpis</option>
          <option value="yearOverYear">vs praėję metai</option>
        </select>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value as any)} className="text-sm font-bold bg-slate-50 border-none rounded-xl p-2 outline-none">
          <option value="All">Visi regionai</option>
          <option value="Vilnius">Vilnius</option>
          <option value="Kaunas">Kaunas</option>
          <option value="Klaipėda">Klaipėda</option>
        </select>
      </div>

      {/* 1. KPI (TOP) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CfoKpiCard
          label="Gauti pinigai"
          value={formatEuro(stats.finance.receivedMoney)}
          tone="income"
          icon={TrendingUp}
        />
        <CfoKpiCard
          label="Kritinės išlaidos"
          value={formatEuro(stats.finance.criticalExpenses)}
          tone="critical"
          icon={AlertTriangle}
        />
        <CfoKpiCard
          label="Veiklos išlaidos"
          value={formatEuro(stats.finance.operatingExpenses)}
          tone="expense"
          icon={ShoppingCart}
        />
        <CfoKpiCard
          label="Normalizuotas Cash Flow"
          value={formatEuro(stats.finance.normalizedCashFlow)}
          tone="cashflow"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {(kpis || []).map((kpi, idx) => (
          <KpiCard key={idx} metric={kpi} />
        ))}
      </div>

      {/* NEW: PRIEŽASTINIAI RYŠIAI */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <SectionHeader title="Priežastiniai ryšiai" subtitle="KPI Pyramid" />
        <p className="text-sm text-slate-500 mb-8 italic">KPI Pyramid section (Development In Progress)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-4 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg mb-4">Klientų vertinimai</h3>
                <div className="space-y-3">
                  {stats.ratings.categories.map((cat, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded hover:bg-slate-100">
                      <span className="text-slate-600">{getMetricLabel(cat.name)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{cat.score}</span>
                        <span className={cn("font-bold", cat.trend > 0 ? "text-emerald-600" : "text-rose-600")}>{cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
            <div className="p-4 border-l-4 border-amber-500">
                <h3 className="font-bold text-lg mb-4">Driver KPI</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">SLA Laikymasis</span>
                    <span className={cn("font-bold", stats.sla.successRate > 90 ? "text-emerald-600" : "text-amber-600")}>{stats.sla.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Gedimų kiekis</span>
                    <span className="font-bold text-slate-900">{stats.faults.thisMonth}</span>
                  </div>
                </div>
            </div>
            <div className="p-4 border-l-4 border-slate-500">
                <h3 className="font-bold text-lg mb-4">Operacijos</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onNavigate('darbai')} className="p-3 text-xs bg-slate-50 rounded text-slate-600 hover:bg-slate-100">Gedimai</button>
                    <button onClick={() => onNavigate('orders')} className="p-3 text-xs bg-slate-50 rounded text-slate-600 hover:bg-slate-100">Užsakymai</button>
                    <button onClick={() => onNavigate('periodic')} className="p-3 text-xs bg-slate-50 rounded text-slate-600 hover:bg-slate-100">Periodiniai</button>
                    <button onClick={() => onNavigate('audit')} className="p-3 text-xs bg-slate-50 rounded text-slate-600 hover:bg-slate-100">Auditai</button>
                </div>
            </div>
        </div>
      </div>

      {/* 2. SOP & FAULTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOP ANALYTICS */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <SectionHeader 
            title="SOP Valdymas" 
            subtitle="Standartizacijos padengimas ir kokybė"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Iš viso užduočių</p>
                <h4 className="text-4xl font-black text-slate-900 leading-none">{stats.sop.total}</h4>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Su SOP</span>
                  <span className="text-emerald-600 font-black">{stats.sop.hasSop}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Be SOP</span>
                  <span className="text-rose-600 font-black">{stats.sop.noSop}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col justify-between shadow-xl shadow-slate-200">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Atnaujinta šį mėn.</p>
                <h4 className="text-4xl font-black text-[#d9f945] leading-none">{stats.sop.updatedRecent.length}</h4>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <RefreshCcw size={16} className="text-[#d9f945]" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium uppercase leading-tight">
                  Sėslus procesų <br/> tobulinimas
                </p>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Padengimas %</p>
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="relative w-20 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Covered', value: stats.sop.coverage },
                            { name: 'Missing', value: 100 - stats.sop.coverage }
                          ]}
                          innerRadius={30}
                          outerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#d9f945" />
                          <Cell fill="#F1F5F9" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black text-slate-900">{stats.sop.coverage}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-center text-slate-400 font-bold uppercase mt-2">Target: 100%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle size={14} className="text-amber-500" />
                 TOP Klubai be SOP
              </h5>
              <div className="space-y-2">
                {stats.sop.topClubsMissing.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-700">{c.name}</span>
                    <span className="text-xs font-black text-rose-600">{c.count} vnt.</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Clock size={14} className="text-slate-400" />
                 Seniausi SOP
              </h5>
              <div className="space-y-2">
                {stats.sop.oldest.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onNavigate('periodic', { search: p.name })}>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Last: {new Date(p.sop?.updatedAt!).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECENT SOP UPDATES DRILL-DOWN */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
          <SectionHeader 
            title="SOP Atnaujinimai" 
            subtitle="Drill-down: paskutinis mėn."
          />
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
             {stats.sop.updatedRecent.length > 0 ? (
               stats.sop.updatedRecent.map((p, i) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group" onClick={() => onNavigate('periodic', { search: p.name })}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-black text-emerald-600 uppercase">Atnaujinta</span>
                     <span className="text-[9px] font-bold text-slate-400">{new Date(p.sop?.updatedAt!).toLocaleDateString()}</span>
                   </div>
                   <h6 className="text-xs font-black text-slate-900 line-clamp-1 mb-1">{p.name}</h6>
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold text-slate-500 uppercase">{p.department}</span>
                     <span className="text-[9px] font-bold text-slate-700">{p.sop?.updatedBy}</span>
                   </div>
                 </div>
               ))
             ) : (
               <div className="flex flex-col items-center justify-center py-10 opacity-50">
                 <FileText size={32} className="text-slate-200 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Šį mėnesį atnaujinimų <br/> neužfiksuota</p>
               </div>
             )}
          </div>

          <button 
            onClick={() => onNavigate('periodic')}
            className="mt-6 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
          >
            Visas sąrašas
          </button>
        </div>
      </div>

      {/* 6. PERIODIC TASKS KPI */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Periodinių darbų KPI</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Vykdymas ir atšaukimai ({timeRange === 'custom' ? `${customDates.from} - ${customDates.to}` : timeRange})</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
    <KpiCard metric={{ label: 'Suplanuota', value: stats.periodic.planned, color: 'indigo' as any, icon: Clock }} />
    <KpiCard metric={{ label: 'Atlikta laiku', value: stats.periodic.completedOnTime, color: 'emerald' as any, icon: CheckCircle2 }} />
    <KpiCard metric={{ label: 'Vėluoja', value: stats.periodic.overdue, color: 'rose' as any, icon: AlertTriangle }} />
    <KpiCard metric={{ label: 'Atlikta vėliau', value: stats.periodic.completedLate, color: 'orange' as any, icon: Clock }} />
    <KpiCard metric={{ label: 'Atšaukta', value: stats.periodic.cancelled, color: 'slate' as any, icon: X }} />
    <KpiCard metric={{ label: 'Deaktyvuota', value: stats.periodic.deactivatedTasks, color: 'rose' as any, icon: Trash2 }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Dažniausi atšaukimai padaliniuose</h3>
              <div className="space-y-4">
                {stats.periodic.topClubsCancellations.length > 0 ? (
                  stats.periodic.topClubsCancellations.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-slate-400 font-bold shadow-sm">{i+1}</div>
                         <span className="text-sm font-bold text-slate-700">{c.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{c.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">Nėra duomenų</p>
                )}
              </div>
           </div>
           
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Daugiausiai vėlavimų padaliniuose</h3>
              <div className="space-y-4">
                {stats.periodic.topClubsOverdue.length > 0 ? (
                  stats.periodic.topClubsOverdue.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-slate-400 font-bold shadow-sm">{i+1}</div>
                         <span className="text-sm font-bold text-slate-700">{c.name}</span>
                      </div>
                      <span className="text-sm font-black text-rose-600">{c.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">Nėra duomenų</p>
                )}
              </div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. GEDIMAI */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <SectionHeader 
            title="Gedimai" 
            subtitle="Šio mėnesio dinamika"
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Įranga</p>
                 <span className="text-xl font-black text-slate-900">{stats.faults.equipment}</span>
               </div>
               <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
                 <Wrench size={20} />
               </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patalpos</p>
                 <span className="text-xl font-black text-slate-900">{stats.faults.facility}</span>
               </div>
               <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-xl">
                 <Building2 size={20} />
               </div>
            </div>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Praėjęs', count: stats.faults.lastMonth },
                { name: 'Šis', count: stats.faults.thisMonth }
              ]}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="count" radius={[10, 10, 10, 10]}>
                  <Cell fill="#E2E8F0" />
                  <Cell fill="#3B82F6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. SLA */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <SectionHeader 
            title="SLA" 
            subtitle="Vykdymo kokybė"
          />
          
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
             <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'On Time', value: stats.sla.successRate },
                        { name: 'Delayed', value: 100 - stats.sla.successRate }
                      ]}
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F1F5F9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{stats.sla.successRate}%</span>
                </div>
             </div>
             <p className="text-center text-xs font-medium text-slate-500">
               Šiuo metu vėluoja <span className="font-bold text-rose-600">{stats.sla.overdueCount}</span> užduotys ({stats.sla.overduePercent}%)
             </p>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <span>Šio mėnesio tikslas</span>
               <span>95%</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500" style={{ width: `${stats.sla.successRate}%` }} />
             </div>
          </div>
        </div>

        {/* 4. KLIENTŲ VERTINIMAI */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <SectionHeader 
            title="Klientų vertinimai" 
            subtitle="Pasitenkinimo indeksas"
          />

          <div className="grid grid-cols-2 gap-3">
            {stats.ratings.categories.slice(0, 4).map((cat, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase truncate">{getMetricLabel(cat.name)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-slate-900">{cat.score}</span>
                  {cat.trend !== 0 && (
                    <span className={cn("text-[10px] font-bold", cat.trend > 0 ? "text-emerald-600" : "text-rose-600")}>
                      {cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp size={16} className="text-emerald-600" />
              <span className="text-xs font-black text-emerald-900 uppercase">Trendas vs Praėjęs ketv.</span>
            </div>
            <p className="text-lg font-black text-emerald-600">
              {stats.ratings.trend > 0 ? '+' : ''}{stats.ratings.trend}%
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 5. REGIONAI */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <SectionHeader 
            title="Regionai" 
            subtitle="Veiklos palyginimas pagal miestus"
          />
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Regionas</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gedimai</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Vertinimas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.regions.map((region, i) => (
                  <tr key={i} className="group">
                    <td className="py-4 text-xs font-black text-slate-900">{region.name}</td>
                    <td className="py-4 text-xs font-bold text-slate-600">{region.faults}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full", region.sla > 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${region.sla}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{region.sla}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                       <span className={cn(
                         "px-2 py-1 rounded-lg text-[10px] font-black",
                         region.rating > 4 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                       )}>
                         ★ {region.rating}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. INSIGHT BLOCK */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <SectionHeader 
            title="Įžvalgos" 
            subtitle="Automatinė analizė"
          />

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <ArrowUpRight size={14} /> Didžiausias gerėjimas
              </p>
              {stats.insights.improvements.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-900">{getMetricLabel(item.name)}</span>
                  <span className="text-xs font-black text-emerald-600">+{item.trend.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <ArrowDownRight size={14} /> Reikia dėmesio
              </p>
              {stats.insights.declines.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-xs font-bold text-rose-900">{getMetricLabel(item.name)}</span>
                  <span className="text-xs font-black text-rose-600">{item.trend.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Rekomendacija</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {stats.global.status === 'GERĖJA' 
                    ? "Operacijos stabilizuojasi. Rekomenduojama fokusuotis į klientų elgsenos gerinimą per komunikaciją."
                    : "Pastebimas SLA prastėjimas. Rekomenduojama peržiūrėti resursų paskirstymą Kauno regione."}
                </p>
             </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
