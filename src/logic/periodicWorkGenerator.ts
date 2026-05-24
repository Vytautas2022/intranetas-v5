import { PeriodicTemplate } from '../mock-db/periodicTemplates';
import { Fault, Status, Priority } from '../types/faults';
import { Club } from '../mock-db/clubs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { equipmentList, equipmentIssueTypesList } from '../mock-db/admin';
import { Order } from '../mock-db/orders';
import { cloneChecklistTemplatesForGeneratedCard } from './checklistLogic';
import { workflowTypes as defaultWorkflowTypes } from '../mock-db/workflowTypes';
import {
  resolvePeriodicDestinationWorkflowTypeId,
  type ResolvePeriodicDestinationWorkflowContext,
} from './appWorkflowHelpers';

export interface GenerationResult {
  newFaults: Fault[];
  newOrders: Order[];
  skippedCount: number;
  totalFound: number;
}

export const generatePeriodicWorksForClub = (
  templates: PeriodicTemplate[],
  existingFaults: Fault[],
  existingOrders: Order[],
  club: Club,
  userName: string,
  workflowContext?: ResolvePeriodicDestinationWorkflowContext
): GenerationResult => {
  const newFaults: Fault[] = [];
  const newOrders: Order[] = [];
  let skippedCount = 0;
  let totalFound = 0;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthKey = format(now, 'yyyy-MM');

  // Filter templates that apply to this club
  const applicableTemplates = templates.filter(t => {
    if (!t.isActive) return false;

    if (t.targetMode === 'ALL_CLUBS') return true;
    if (t.targetMode === 'SELECTED_CLUBS' && t.targetClubIds.includes(club.id)) return true;
    if (t.targetMode === 'REGIONS' && t.targetRegions.includes(club.region)) return true;

    return false;
  });

  totalFound = applicableTemplates.length;

  applicableTemplates.forEach(template => {
    // Check for duplicates in current month
    let isDuplicate = false;
    
    if (template.targetSubmodule === 'UZSAKYMAI') {
        isDuplicate = existingOrders.some(o => {
            const isSameTemplate = o.periodic?.templateId === template.id;
            const isSameClub = o.clubId === club.id;
            const isPeriodMatch = o.requestedAt >= monthStart.getTime() && o.requestedAt <= monthEnd.getTime();
            const isSameOrderType = template.orderType === (o.category === 'VENDING' ? 'VENDING' : (o.category === 'FIRST_AID_KIT' ? 'FIRST_AID_KIT' : 'SMULKUS'));
            
            return isSameTemplate && isSameClub && isPeriodMatch && isSameOrderType;
        });
    } else {
        isDuplicate = existingFaults.some(f => {
          const isSameTemplate = f.template_id === template.id || (f.periodic && f.periodic.templateId === template.id);
          const isSameClub = f.clubId === club.id;
          const isPeriodMatch = f.createdAt >= monthStart.getTime() && f.createdAt <= monthEnd.getTime();
          const isSourceMatch = f.source === 'PERIODIC' || f.generatedAutomatically;
          
          // For equipment faults, also check equipmentId and issueType
          if (template.targetSubmodule === 'EQUIPMENT_FAULT') {
            const isSameEquipment = f.equipmentId === template.equipmentId;
            const isSameIssueType = f.issue_type_id === template.issueTypeId || f.typeId === template.issueTypeId;
            return isSameTemplate && isSameClub && isPeriodMatch && isSourceMatch && isSameEquipment && isSameIssueType;
          }
    
          return isSameTemplate && isSameClub && isPeriodMatch && isSourceMatch;
        });
    }

    if (isDuplicate) {
      skippedCount++;
      return;
    }

    // Determine due date (default to end of month if not specified)
    const dueDate = template.default_day 
      ? new Date(now.getFullYear(), now.getMonth(), template.default_day).getTime()
      : monthEnd.getTime();

    if (template.targetSubmodule === 'UZSAKYMAI') {
        const newOrder: Order = {
            id: `ord-gen-${template.id}-${club.id}-${monthKey}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            code: `ORD-${format(now, 'yyyy')}-${template.id.slice(-4)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
            clubId: club.id,
            clubName: club.name,
            category: template.orderType === 'VENDING' ? 'VENDING' : (template.orderType === 'FIRST_AID_KIT' ? 'FIRST_AID_KIT' : 'INVENTORY'),
            urgency: template.priority === 'CRITICAL' ? 'critical' : 'normal',
            status: 'DRAFT',
            estimatedBudget: template.estimatedBudget || 0,
            currency: 'EUR',
            items: [],
            attachments: [],
            approvalChain: [],
            approvalRequired: false,
            requestedBy: 'SISTEMA',
            requestedAt: Date.now(),
            comments: [],
            history: [{
                id: `h-gen-${Date.now()}`,
                timestamp: Date.now(),
                user: 'SISTEMA',
                actionType: 'CREATED',
                reason: `Automatiškai sugeneruotas užsakymas (${template.orderType === 'VENDING' ? 'Vending' : (template.orderType === 'FIRST_AID_KIT' ? 'Vaistinėlės turinys' : 'Smulkus inventorius')})`
            }],
            updatedAt: Date.now(),
            updatedBy: 'SISTEMA',
            checklists: cloneChecklistTemplatesForGeneratedCard(template),
            periodic: {
              isPeriodic: true,
              templateId: template.id,
              templateTitle: template.name || template.title
            }
        } as any; // FIXME: cast as Order because of structure/missing fields

        newOrders.push(newOrder);
    } else {
        // ... fault creation logic ...
        let finalTitle = template.name || template.title || 'Periodinė užduotis';
        let finalSla = template.slaHours || 72;
        let finalPriority: Priority = template.priority === 'CRITICAL' ? 'critical' : 'medium';
        let equipmentId = template.equipmentId;
        let equipmentName = '';
        let issueTypeId = template.issueTypeId;
    
        if (template.targetSubmodule === 'EQUIPMENT_FAULT') {
          const issue = equipmentIssueTypesList.find(i => i.id === template.issueTypeId);
          if (issue) {
            finalSla = issue.sla_hours;
            finalPriority = issue.priority as Priority;
          }
    
          if (template.equipmentId) {
            const eq = equipmentList.find(e => e.id === template.equipmentId);
            if (eq) {
              equipmentName = `${eq.name} #${eq.number}`;
              finalTitle = equipmentName;
            }
          } else {
            finalTitle = (issue ? issue.name : 'Treniruoklių darbai') + ' - ' + club.name;
          }
        }
    
        const workflowResolution = resolvePeriodicDestinationWorkflowTypeId(template, {
          workflowTypes: workflowContext?.workflowTypes || defaultWorkflowTypes,
          fallbackLegacyCategory: workflowContext?.fallbackLegacyCategory || 'OTHER',
        });

        const newFault: Fault = {
          id: `gen-${template.id}-${club.id}-${monthKey}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: finalTitle,
          description: template.description,
          clubId: club.id,
          clubName: club.name,
          status: Status.NEW,
          type: template.targetSubmodule === 'EQUIPMENT_FAULT' ? 'EQUIPMENT_FAULT' : (template.department || 'Operacijos'),
          entityType: 'task',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          priority: finalPriority,
          source: 'PERIODIC',
          template_id: template.id,
          due_date: dueDate,
          region: club.region,
          generatedAutomatically: true,
          assigneeId: template.assigned_to || '',
          assigneeName: template.assignedTo?.name || 'Nepriskirta',
          assignedTo: template.assignedTo?.name || 'Nepriskirta',
          slaHours: finalSla,
          equipmentId: equipmentId,
          issue_type_id: issueTypeId,
          typeId: issueTypeId, // For compatibility
          history: [
            {
              id: `h-gen-${Date.now()}`,
              timestamp: Date.now(),
              user: 'SISTEMA',
              actionType: 'CREATED',
              reason: `Automatiškai sugeneruota periodinė užduotis (${template.targetSubmodule === 'EQUIPMENT_FAULT' ? 'Treniruoklių darbai' : 'Patalpų darbai'})`
            }
          ],
          comments: [],
          media: [],
          watchers: [],
          rejected: false,
          rejectReason: '',
          updatedBy: 'SISTEMA',
          code: `P-${format(now, 'MM')}-${template.id.slice(-4)}`,
          category: template.targetSubmodule === 'EQUIPMENT_FAULT' ? 'EQUIPMENT_FAULT' : (template.department || 'OPERATIONS'),
          workflowTypeId: workflowResolution.workflowTypeId,
          checklists: cloneChecklistTemplatesForGeneratedCard(template),
          periodic: {
            isPeriodic: true,
            templateId: template.id,
            templateTitle: template.name || template.title,
            generatedFromTemplate: true,
            dueDate: dueDate
          }
        };
    
        newFaults.push(newFault);
    }
  });

  return {
    newFaults,
    newOrders,
    skippedCount,
    totalFound
  };
};
