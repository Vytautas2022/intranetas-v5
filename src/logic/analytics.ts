import { Fault, AnalyticsData, AuditEntry, RecurringTask, Status } from '../types/faults';
import { SLAResult } from './slaLogic';

export const calculateAnalytics = (
  allFaults: Fault[],
  auditTrail: AuditEntry[],
  tasks: Fault[],
  dateFrom: string,
  dateTo: string,
  getRemainingTime: (f: Fault) => SLAResult,
  getFaultMeta: (id: string) => any,
  clubs: any[]
): AnalyticsData => {
  const start = new Date(dateFrom).getTime();
  const end = new Date(dateTo).getTime() + 86400000;
  
  const periodFaults = allFaults.filter(f => f.createdAt >= start && f.createdAt <= end && !f.isDeleted);
  const periodTasks = tasks.filter(t => t.createdAt >= start && t.createdAt <= end);
  
  const typeCounts: Record<string, number> = {};
  const clubCounts: Record<string, number> = {};
  const recurringCounts: Record<string, number> = {};
  const waitingDetailsReasons: Record<string, number> = {};
  let sopCount = 0;
  
  // SOP Analytics calculations
  const sopTasks = periodTasks.filter(t => t.type === 'SOP_CREATE' || t.type === 'SOP_UPDATE');
  const newSopsCreated = sopTasks.filter(t => t.type === 'SOP_CREATE').length;
  const sopUpdateTasks = sopTasks.filter(t => t.type === 'SOP_UPDATE').length;
  const overdueSopTasks = sopTasks.filter(t => t.status !== 'ATLIKTA' && Date.now() > t.slaDeadline).length;
  
  const completedSopTasks = sopTasks.filter(t => t.status === 'ATLIKTA' && t.closedAt);
  const sopOnTime = completedSopTasks.filter(t => t.closedAt! <= t.slaDeadline).length;
  const sopSlaCompliance = completedSopTasks.length > 0 ? Math.round((sopOnTime / completedSopTasks.length) * 100) : 0;
  
  const totalSopCreationTime = completedSopTasks.reduce((acc, t) => acc + (t.closedAt! - t.createdAt), 0);
  const avgSopCreationTimeDays = completedSopTasks.length > 0 
    ? Math.round((totalSopCreationTime / completedSopTasks.length) / (1000 * 60 * 60 * 24) * 10) / 10 
    : 0;

  let totalResolutionTime = 0;
  let closedCount = 0;
  let closedOnTimeCount = 0;
  
  // Performance & Compliance
  periodFaults.forEach(f => {
    if (f.status === Status.FIXED && f.closedAt) {
      closedCount++;
      totalResolutionTime += (f.closedAt - f.createdAt);
      
      const slaDeadline = f.slaDeadline || (f.createdAt + f.slaHours * 3600000);
      if (f.closedAt <= slaDeadline) {
        closedOnTimeCount++;
      }
    }
  });

  const avgResolutionTime = closedCount > 0 ? Math.round((totalResolutionTime / closedCount) / (1000 * 60 * 60)) : 0; 
  const slaCompliancePercentage = closedCount > 0 ? Math.round((closedOnTimeCount / closedCount) * 100) : 0;

  // Bottleneck Analytics (Waiting for Details)
  // Use both audit trail AND history inside fault if available
  const wdEntries: { faultId: string; timestamp: number; reason?: string }[] = [];
  
  // 1. From audit trail
  auditTrail.forEach(a => {
    if (a.action === 'MOVED_TO_WAITING_DETAILS' && a.timestamp >= start && a.timestamp <= end) {
      wdEntries.push({ faultId: a.faultId, timestamp: a.timestamp, reason: a.metadata?.reason });
    }
  });
  
  // 2. From fault history (to ensure we don't miss any)
  periodFaults.forEach(f => {
    f.history.forEach(h => {
      if (h.actionType === 'SLA_CHANGED_WAITING_FOR_DETAILS' && h.timestamp >= start && h.timestamp <= end) {
        // Avoid duplicates if already in audit
        if (!wdEntries.find(e => e.faultId === f.id && Math.abs(e.timestamp - h.timestamp) < 1000)) {
          wdEntries.push({ faultId: f.id, timestamp: h.timestamp, reason: h.reason });
        }
      }
    });
  });

  const moveCount = wdEntries.length;
  wdEntries.forEach(e => {
    if (e.reason) {
      waitingDetailsReasons[e.reason] = (waitingDetailsReasons[e.reason] || 0) + 1;
    }
  });

  const topReasons = Object.entries(waitingDetailsReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const currentWaitingCount = periodFaults.filter(f => f.status === Status.WAITING_DETAILS).length;
  const overdueWaitingCount = periodFaults.filter(f => f.status === Status.WAITING_DETAILS && getRemainingTime(f).overdue).length;

  // Repeated entry check
  const faultEntryCounts: Record<string, number> = {};
  wdEntries.forEach(e => {
    faultEntryCounts[e.faultId] = (faultEntryCounts[e.faultId] || 0) + 1;
  });
  const repeatedWaitingCount = Object.values(faultEntryCounts).filter(c => c > 1).length;

  let totalDurationWD = 0;
  let durationCountWD = 0;
  periodFaults.filter(f => f.status === Status.WAITING_DETAILS).forEach(f => {
    const entries = wdEntries.filter(e => e.faultId === f.id).sort((a, b) => a.timestamp - b.timestamp);
    if (entries.length > 0) {
      totalDurationWD += (Date.now() - entries[0].timestamp);
      durationCountWD++;
    }
  });
  const avgDaysWD = durationCountWD > 0 ? Math.round((totalDurationWD / durationCountWD) / (1000 * 60 * 60 * 24) * 10) / 10 : 0;
  const wdPercentage = periodFaults.length > 0 ? Math.round((moveCount / periodFaults.length) * 100) : 0;
  
  // Root Causes & Clubs
  periodFaults.forEach(f => {
    const typeId = f.typeId || f.type;
    typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
    
    const clubName = f.clubName || clubs.find(c => c.id === f.clubId)?.name || 'Nepriskirta';
    clubCounts[clubName] = (clubCounts[clubName] || 0) + 1;

    if (getFaultMeta(typeId)?.sopUrl) sopCount++;
  });

  periodTasks.forEach(t => {
    const typeId = t.type;
    recurringCounts[typeId] = (recurringCounts[typeId] || 0) + 1;
  });

  const topRecurring = Object.entries(recurringCounts)
    .map(([id, count]) => ({
      name: getFaultMeta(id)?.name || id,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Month labels
  const months = ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'];
  const periodDataMap: Record<string, { total: number; delayed: number; closed: number; closedOnTime: number }> = {};
  
  periodFaults.forEach(f => {
    const d = new Date(f.createdAt);
    const m = months[d.getMonth()];
    if (!periodDataMap[m]) periodDataMap[m] = { total: 0, delayed: 0, closed: 0, closedOnTime: 0 };
    periodDataMap[m].total++;
    if (getRemainingTime(f).overdue && f.status !== Status.FIXED) periodDataMap[m].delayed++;
    
    if (f.status === Status.FIXED && f.closedAt) {
      periodDataMap[m].closed++;
      const slaDeadline = f.slaDeadline || (f.createdAt + f.slaHours * 3600000);
      if (f.closedAt <= slaDeadline) periodDataMap[m].closedOnTime++;
    }
  });

  const periodData = Object.entries(periodDataMap).map(([name, stats]) => ({
    name,
    total: stats.total,
    delayed: stats.delayed,
    slaCompliance: stats.closed > 0 ? Math.round((stats.closedOnTime / stats.closed) * 100) : 0
  })).sort((a, b) => months.indexOf(a.name) - months.indexOf(b.name));

  return {
    typesChart: Object.entries(typeCounts).map(([id, value]) => ({ name: getFaultMeta(id)?.name || id, value })),
    clubsChart: Object.entries(clubCounts).map(([name, value]) => ({ name, value })),
    periodData,
    topRecurring,
    stats: {
      total: periodFaults.length,
      delayed: periodFaults.filter(f => getRemainingTime(f).overdue && f.status !== Status.FIXED && f.status !== Status.REJECTED).length,
      recurring: periodTasks.length,
      mostCommon: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] 
        ? getFaultMeta(Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0])?.name || 'Nepriskirta'
        : 'Nepriskirta',
      sopCoverage: periodFaults.length > 0 ? Math.round((sopCount / periodFaults.length) * 100) : 0,
      avgResolutionTime,
      slaCompliance: slaCompliancePercentage,
      waitingDetailsMetrics: {
        moveCount,
        avgDays: avgDaysWD,
        overdueCount: overdueWaitingCount,
        repeatedCount: repeatedWaitingCount,
        topReasons,
        percentage: wdPercentage,
        currentCount: currentWaitingCount
      },
      rootCauses: {
        topSlaReasons: topReasons
      },
      sopAnalytics: {
        newSopsCreated,
        sopUpdateTasks,
        slaCompliance: sopSlaCompliance,
        overdueTasks: overdueSopTasks,
        avgCreationTimeDays: avgSopCreationTimeDays
      }
    }
  };
};
