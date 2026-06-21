import { PeriodicTemplate } from '../mock-db/periodicTemplates';
import { Fault, Status, Priority } from '../types/faults';
import { Club } from '../mock-db/clubs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getLegacyEquipmentIssueTypes } from '../mock-db/assetIssueTypes';
import { getEquipmentAssetObjects } from '../mock-db/assetObjects';
import { Order } from '../mock-db/orders';
import { cloneChecklistTemplatesForGeneratedCard } from './checklistLogic';
import { workflowTypes as defaultWorkflowTypes } from '../mock-db/workflowTypes';
import { users as defaultUsers, type User } from '../mock-db/users';
import {
  resolvePeriodicDestinationWorkflowTypeId,
  type ResolvePeriodicDestinationWorkflowContext,
} from './appWorkflowHelpers';
import { getEquipmentIdentityFields, getFaultEquipmentId } from './equipmentFaultIdentity';
import {
  createPeriodicInstanceFromTemplate,
  linkPeriodicInstanceOutput,
  resolvePeriodicDestinationType,
} from '../mock-db/periodicInstances';

const equipmentIssueTypesList = getLegacyEquipmentIssueTypes();
const equipmentList = getEquipmentAssetObjects();

const resolvePeriodicWorkflowAssignee = (
  template: PeriodicTemplate,
  club: Club,
  workflowContext?: ResolvePeriodicDestinationWorkflowContext,
): User | undefined => {
  const activeUsers = defaultUsers.filter((user) => user.is_active !== false);
  const templateAssigneeId =
    template.assigneeId ||
    template.assigned_to ||
    template.assignedTo?.id ||
    template.defaultResponsibleId;

  const templateAssignee = templateAssigneeId
    ? activeUsers.find(
        (user) => user.id === templateAssigneeId || user.name === templateAssigneeId,
      )
    : undefined;
  if (templateAssignee) return templateAssignee;

  const workflowResolution = resolvePeriodicDestinationWorkflowTypeId(template, {
    workflowTypes: workflowContext?.workflowTypes || defaultWorkflowTypes,
    fallbackLegacyCategory: workflowContext?.fallbackLegacyCategory || 'OTHER',
  });
  const workflowOwnerId = workflowResolution.workflowTypeId
    ? (workflowContext?.workflowTypes || defaultWorkflowTypes).find(
        (workflow) => workflow.id === workflowResolution.workflowTypeId,
      )?.ownerUserId
    : undefined;
  const workflowOwner = workflowOwnerId
    ? activeUsers.find((user) => user.id === workflowOwnerId)
    : undefined;
  if (workflowOwner) return workflowOwner;

  return club.coordinator_id
    ? activeUsers.find((user) => user.id === club.coordinator_id)
    : undefined;
};

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
    const destinationType = resolvePeriodicDestinationType(template);
    const isOrderDestination = destinationType === 'ORDER';
    const isEquipmentCompatibilityTemplate =
      !template.destinationType && template.targetSubmodule === 'EQUIPMENT_FAULT';
    // Check for duplicates in current month
    let isDuplicate = false;
    
    if (isOrderDestination) {
        isDuplicate = existingOrders.some(o => {
            const isSameTemplate = (o as any).periodicTemplateId === template.id;
            const isSameClub = o.clubId === club.id;
            const isPeriodMatch = o.requestedAt >= monthStart.getTime() && o.requestedAt <= monthEnd.getTime();
            const isSameOrderType = template.orderType === (o.category === 'VENDING' ? 'VENDING' : (o.category === 'FIRST_AID_KIT' ? 'FIRST_AID_KIT' : 'SMULKUS'));
            
            return isSameTemplate && isSameClub && isPeriodMatch && isSameOrderType;
        });
    } else {
        isDuplicate = existingFaults.some(f => {
          const isSameTemplate =
            f.periodicTemplateId === template.id ||
            (f as any).template_id === template.id;
          const isSameClub = f.clubId === club.id;
          const isPeriodMatch = f.createdAt >= monthStart.getTime() && f.createdAt <= monthEnd.getTime();
          const isSourceMatch = f.source === 'PERIODIC' || f.generatedAutomatically;
          
          // For equipment faults, also check equipmentId and issueType
          if (isEquipmentCompatibilityTemplate) {
            const isSameEquipment = getFaultEquipmentId(f) === template.equipmentId;
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

    if (isOrderDestination) {
        const orderId = `ord-gen-${template.id}-${club.id}-${monthKey}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const periodicInstance = linkPeriodicInstanceOutput(
          createPeriodicInstanceFromTemplate({
            template,
            club,
            dueAt: dueDate,
          }),
          { orderId },
        );
        const newOrder: Order = {
            id: orderId,
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
            periodicInstanceId: periodicInstance.id,
            periodic: {
              isPeriodic: true,
              instanceId: periodicInstance.id,
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
    
        if (isEquipmentCompatibilityTemplate) {
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
        const assignee = resolvePeriodicWorkflowAssignee(
          template,
          club,
          workflowContext,
        );
        const faultId = `gen-${template.id}-${club.id}-${monthKey}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const periodicInstance = linkPeriodicInstanceOutput(
          createPeriodicInstanceFromTemplate({
            template: {
              ...template,
              slaHours: finalSla,
              priority: finalPriority === 'critical' ? 'CRITICAL' : template.priority,
            },
            club,
            responsibleUser: assignee,
            dueAt: dueDate,
          }),
          { workflowCardId: faultId },
        );

        const newFault: Fault = {
          id: faultId,
          title: finalTitle,
          description: template.description,
          clubId: club.id,
          clubName: club.name,
          status: Status.NEW,
          type: isEquipmentCompatibilityTemplate ? 'EQUIPMENT_FAULT' : (template.department || 'Operacijos'),
          entityType: 'fault',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          priority: finalPriority,
          source: 'PERIODIC' as const,
          periodicInstanceId: periodicInstance.id,
          periodicTemplateId: template.id,
          periodicType: template.criticality ?? (template.isMandatory ? 'CRITICAL' : 'STANDARD'),
          periodicDueDate: typeof dueDate === 'number' ? dueDate : new Date(dueDate).getTime(),
          region: club.region,
          generatedAutomatically: true,
          assigned_to: assignee?.id || '',
          assigneeId: assignee?.id || '',
          assigneeName: assignee?.name || '',
          assignedTo: assignee?.name || '',
          slaHours: finalSla,
          ...getEquipmentIdentityFields(equipmentId),
          issue_type_id: issueTypeId,
          typeId: issueTypeId, // For compatibility
          history: [
            {
              id: `h-gen-${Date.now()}`,
              timestamp: Date.now(),
              user: 'SISTEMA',
              actionType: 'CREATED',
              reason: `Automatiškai sugeneruota periodinė užduotis (${isEquipmentCompatibilityTemplate ? 'Treniruoklių darbai' : 'Patalpų darbai'})`
            }
          ],
          comments: [],
          media: [],
          watchers: [],
          rejected: false,
          rejectReason: '',
          updatedBy: 'SISTEMA',
          code: `P-${format(now, 'MM')}-${template.id.slice(-4)}`,
          category: isEquipmentCompatibilityTemplate ? 'EQUIPMENT_FAULT' : (template.department || 'OPERATIONS'),
          workflowTypeId: workflowResolution.workflowTypeId,
          checklists: cloneChecklistTemplatesForGeneratedCard(template),
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
