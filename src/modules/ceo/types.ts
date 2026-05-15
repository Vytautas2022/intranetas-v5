
import { Fault } from '../../types/faults';
import { Order } from '../../mock-db/orders';
import { PeriodicTaskInstance } from '../../mock-db/periodicTasks';
import { PeriodicTemplate } from '../../mock-db/periodicTemplates';
import { SOP } from '../../mock-db/sops';
import { CustomerSurvey } from '../../mock-db/surveys';

export interface KpiMetric {
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: 'green' | 'yellow' | 'red' | 'blue';
  icon: any;
}

export interface CeoDashboardProps {
  faults: Fault[];
  tasks: Fault[];
  orders: Order[];
  periodicInstances: PeriodicTaskInstance[];
  periodicTemplates: PeriodicTemplate[];
  audits: any[];
  sops: SOP[];
  clubs: any[];
  surveys: CustomerSurvey[];
  onNavigate: (tab: string, filters?: any) => void;
}
