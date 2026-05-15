export type Role = 'READ' | 'WRITE' | 'ADMIN';

export interface Colleague {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  location: string;
  departments: string[];
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeObject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeBlock {
  id: string;
  office_id: string;
  title: string;
  content: string;
  order_index: number;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeContact {
  id: string;
  office_id: string;
  type: string;
  name: string;
  phone: string;
  email: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface ClubBlock {
  id: string;
  club_id: string;
  title: string;
  content: string;
  short_content?: string;
  order_index: number;
  is_sensitive: boolean;
  is_risk?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubContact {
  id: string;
  club_id: string;
  type: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface ClubZone {
  id: string;
  club_id: string;
  name: string;
  info: string;
  plotas: string;
  vieta?: string;
  aukstas?: string;
  pastabos?: string;
}
