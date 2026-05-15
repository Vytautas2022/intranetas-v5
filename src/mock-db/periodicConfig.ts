export const initialPeriodicTemplates = [
  {
    id: "TPL_1",
    name: "Kasdienis sporto salės valymas",
    description: "Išvalyti kardio zoną, nušluostyti treniruoklius",
    default_frequency: "daily",
    applies_to: "ALL"
  },
  {
    id: "TPL_2",
    name: "Savaitinis baseino priežiūros patikrinimas",
    description: "Patikrinti vandens filtrus ir chemijos balansą",
    default_frequency: "weekly",
    applies_to: "ALL"
  }
];

export interface ClubTaskConfig {
  id: string;
  template_id: string;
  club_id: string;
  name: string;
  description: string;
  frequency: string;
  status: "DRAFT" | "APPROVED";
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  modified: boolean;
}

export const initialClubTaskConfigs: ClubTaskConfig[] = [];
