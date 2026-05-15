export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: "normal" | "priority" | "sla";
  read: boolean;
  createdAt: number;
  faultId: string;
}

export const notifications: Notification[] = [
  { 
    id: 'n1', 
    userId: 'Vardenis Pavardenis', 
    text: 'Naujas komentaras gedime F-2', 
    type: 'normal',
    read: false, 
    createdAt: Date.now() - 3600000, 
    faultId: 'f2' 
  },
  { 
    id: 'n2', 
    userId: 'Vardenis Pavardenis', 
    text: 'Gedimas F-1 priskirtas jums', 
    type: 'priority',
    read: true, 
    createdAt: Date.now() - 7200000, 
    faultId: 'f1' 
  },
  { 
    id: 'n3', 
    userId: 'Vardenis Pavardenis', 
    text: 'Nuotrauka pridėta prie F-1', 
    type: 'normal',
    read: false, 
    createdAt: Date.now() - 10800000, 
    faultId: 'f1' 
  },
];
