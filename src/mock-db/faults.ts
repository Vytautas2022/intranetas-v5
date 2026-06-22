import type { Checklist } from "../types/checklists";

export interface FaultMedia {
  type: "image" | "video";
  url: string;
  name: string;
}

export interface FaultComment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  mentions: string[];
  parentId?: string | null;
  media?: FaultMedia[];
  system?: boolean;
  edited: boolean;
  history: { text: string; timestamp: number }[];
  deleted: boolean;
  source?: "QR" | "USER";
}

export interface FaultWatcher {
  userId: string;
  mode: "all" | "done_only";
}

export interface FaultHistoryItem {
  id: string;
  timestamp: number;
  user: string;
  actionType: string;
  oldStatus?: string;
  newStatus?: string;
  oldSlaDeadline?: number;
  newSlaDeadline?: number;
  reason?: string;
  nextAction?: string;
  type?: string; 
  from?: string;
  to?: string;
  date?: string;
}

export interface StatusHistoryItem {
  from: string | null;
  to: string;
  date: string;
  user: string;
}

export interface ReportHistoryItem {
  id: string;
  timestamp: number;
  author: string;
  comment?: string;
  media: FaultMedia[];
  source: "QR" | "USER";
}

export interface Fault {
  id: string;
  title: string;
  description: string;
  clubId: string;
  clubName: string;
  status: string;
  type: string;
  entityType: "fault" | "task" | "project" | "sop";
  createdAt: number;
  updatedAt: number;
  created_at?: string;
  updated_at?: string;
  status_history?: StatusHistoryItem[];
  closedAt?: number;
  slaDeadline?: number;
  phase?: 'Renkama info' | 'Planuojama' | 'Vykdoma';
  nextAction?: {
    text: string;
    dueDate: string;
  };
  relatedFaultId?: string;
  sop?: {
    url: string;
    updatedAt: number | null;
    updatedBy: string | null;
  };
  sopUrl?: string; // Legacy
  sopStatus?: "EXISTS" | "MISSING" | "NEEDS_UPDATE";
  assigneeId: string;
  assigneeName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  history: FaultHistoryItem[];
  slaHours: number;
  assignedTo: string | { id: string; name: string; role: string }; // Support legacy and new structured format
  comments: FaultComment[];
  media: FaultMedia[];
  watchers: FaultWatcher[];
  rejected: boolean;
  rejectReason: string;
  updatedBy: string;
  code: string;
  archivedAt?: number;
  archivedBy?: string;
  archiveReason?: string;
  coverImage?: string;
  category?: string;
  typeId?: string;
  equipmentId?: string;
  assetObjectId?: string;
  issue_type_id?: string;
  converted_to_task_id?: string;
  converted_at?: number;
  converted_by?: string;
  source_task_id?: string;
  equipment_id?: string;
  location_id?: string;
  repeat_count?: number;
  report_count?: number;
  photos?: FaultMedia[];
  videos?: FaultMedia[];
  report_history?: ReportHistoryItem[];
  source?: "USER" | "QR" | "PERIODIC";
  periodic_type?: "MANDATORY" | "OPTIONAL";
  region?: string;
  inspection_decision?: "NOT_CHECKED" | "OK_NO_ACTION" | "ACTION_NEEDED" | "EXECUTE" | "REJECT";
  rejection_comment?: string;
  task_description?: string;
  task_description_updated_at?: number;
  task_description_updated_by?: string;
  // Flattened periodic fields (replaces nested periodic object and legacy template_id/due_date)
  periodicInstanceId?: string;
  periodicTemplateId?: string;
  periodicType?: "MANDATORY" | "OPTIONAL" | "CRITICAL" | "IMPORTANT" | "STANDARD";
  periodicDueDate?: number;
  periodicInspectionDecision?: "OK_NO_ACTION" | "ACTION_NEEDED" | "EXECUTE" | "REJECT";
  checklists?: Checklist[];
}

export const faults: Fault[] = [
  {
    id: 'f1',
    title: 'Soliariumas Nr. 1 neįsijungia',
    description: 'Klientė bandė įjungti, bet jokia reakcija.',
    clubId: 'akropolis',
    clubName: 'Akropolis',
    status: 'new',
    type: 'soliariumas',
    entityType: 'fault',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 2,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status_history: [
      { from: null, to: 'new', date: new Date(Date.now() - 3600000 * 48).toISOString(), user: 'Admin' }
    ],
    assigneeId: 'm1',
    assigneeName: 'Jonas Jonaitis',
    priority: 'high',
    slaHours: 4,
    assignedTo: 'Jonas Jonaitis',
    comments: [],
    media: [],
    watchers: [],
    sop: {
      url: 'https://example.com/sop/soliariumas',
      updatedAt: Date.now() - 3600000 * 24,
      updatedBy: 'Admin'
    },
    rejected: false,
    rejectReason: '',
    updatedBy: 'Admin',
    code: 'F-1',
    sopUrl: 'https://example.com/sop/soliariumas',
    sopStatus: 'EXISTS',
    history: [
      {
        id: 'h1',
        timestamp: Date.now() - 3600000 * 48,
        user: 'Admin',
        actionType: 'CREATED'
      }
    ]
  },
  {
    id: 'f2',
    title: 'Nukritęs veidrodis salėje',
    description: 'Didelis veidrodis atsilaisvino ir nukrito.',
    clubId: 'panorama',
    clubName: 'Panorama',
    status: 'fixed',
    type: 'baldai',
    entityType: 'fault',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 12,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    status_history: [
      { from: null, to: 'new', date: new Date(Date.now() - 3600000 * 72).toISOString(), user: 'Admin' },
      { from: 'in_progress', to: 'fixed', date: new Date(Date.now() - 3600000 * 12).toISOString(), user: 'Jonas' }
    ],
    closedAt: Date.now() - 3600000 * 12,
    assigneeId: 'm1',
    assigneeName: 'Jonas Jonaitis',
    priority: 'critical',
    slaHours: 24,
    assignedTo: 'Jonas Jonaitis',
    comments: [
      { id: 'c1', text: 'Meistras iškviestas rytojui.', author: 'Jonas', createdAt: Date.now() - 3600000, mentions: [], edited: false, history: [], deleted: false },
      { id: 'c2', text: 'Puiku, laukiame.', author: 'Admin', createdAt: Date.now() - 1800000, mentions: ['Jonas'], parentId: 'c1', edited: false, history: [], deleted: false }
    ],
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=400', name: 'mirror.jpg' }
    ],
    watchers: [{ userId: 'Admin', mode: 'all' }],
    sop: {
      url: 'https://example.com/sop/mirrors',
      updatedAt: Date.now() - 3600000 * 48,
      updatedBy: 'Jonas'
    },
    rejected: false,
    rejectReason: '',
    updatedBy: 'Jonas',
    code: 'F-2',
    sopUrl: 'https://example.com/sop/mirrors',
    sopStatus: 'NEEDS_UPDATE',
    history: [
      {
        id: 'h2',
        timestamp: Date.now() - 3600000 * 72,
        user: 'Admin',
        actionType: 'CREATED'
      },
      {
        id: 'h3',
        timestamp: Date.now() - 3600000 * 12,
        user: 'Jonas',
        actionType: 'STATUS_CHANGE',
        oldStatus: 'in_progress',
        newStatus: 'fixed'
      }
    ]
  },
  {
    id: 'f3',
    title: 'Sugedusi bėgimo tako juosta',
    description: 'Juosta slysta bėgant didesniu greičiu.',
    clubId: 'oas',
    clubName: 'Ozas',
    status: 'waiting_details',
    type: 'treniruokliai',
    entityType: 'fault',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 24,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status_history: [
      { from: null, to: 'new', date: new Date(Date.now() - 3600000 * 120).toISOString(), user: 'Admin' },
      { from: 'in_progress', to: 'waiting_details', date: new Date(Date.now() - 3600000 * 24).toISOString(), user: 'Petras' }
    ],
    assigneeId: 'm2',
    assigneeName: 'Petras Petraitis',
    priority: 'medium',
    slaHours: 48,
    assignedTo: 'Petras Petraitis',
    comments: [],
    media: [],
    watchers: [],
    sop: {
      url: '',
      updatedAt: null,
      updatedBy: null
    },
    rejected: false,
    rejectReason: '',
    updatedBy: 'Petras',
    code: 'F-3',
    sopStatus: 'MISSING',
    history: [
      {
        id: 'h4',
        timestamp: Date.now() - 3600000 * 120,
        user: 'Admin',
        actionType: 'CREATED'
      },
      {
        id: 'h5',
        timestamp: Date.now() - 3600000 * 24,
        user: 'Petras',
        actionType: 'SLA_CHANGED_WAITING_FOR_DETAILS',
        oldStatus: 'in_progress',
        newStatus: 'waiting_details',
        reason: 'Laukiama atsarginės dalies iš tiekėjo',
        nextAction: 'Užsakyti dalį',
        newSlaDeadline: Date.now() + 3600000 * 48
      }
    ]
  }
];
