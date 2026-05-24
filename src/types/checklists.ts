export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  items: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowCardWithChecklists {
  id: string;
  checklists?: Checklist[];
  history?: any[];
  updatedAt?: string | number;
  updatedBy?: string;
}
