export interface SOP {
  id: string;
  faultTypeId: string;
  clubId: string;
  title: string;
  url: string;
  updatedAt: number;
}

export const sops: SOP[] = [
  {
    id: 'sop1',
    faultTypeId: 'soliariumas',
    clubId: 'akropolis',
    title: 'Soliariumo priežiūros SOP',
    url: 'https://example.com/sop/soliariumas',
    updatedAt: Date.now()
  }
];
