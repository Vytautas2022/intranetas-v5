export interface Insight {
  id: string;
  targetId: string; // template_id OR issue_type_id OR equipment_id
  targetType: 'FACILITY' | 'EQUIPMENT' | 'EQUIPMENT_ISSUE';
  text: string;
  createdAt: number;
  createdBy: string;
}

export const initialFacilityInsights: Insight[] = [];
export const initialEquipmentInsights: Insight[] = [];
