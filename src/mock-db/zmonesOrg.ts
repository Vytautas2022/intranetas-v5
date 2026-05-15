export interface Colleague {
  id: string; name: string; position: string; phone: string;
  email: string; location: string; departments: string[];
  comment: string; created_at: string; updated_at: string;
}
export interface OfficeObject { id: string; name: string; created_at: string; updated_at: string; }
export interface OfficeBlock {
  id: string; office_id: string; title: string; content: string;
  order_index: number; is_sensitive: boolean; created_at: string; updated_at: string;
}
export interface OfficeContact { id: string; office_id: string; type: string; name: string; phone: string; email: string; }
export interface DetailedOffice { office: OfficeObject; blocks: OfficeBlock[]; contacts: OfficeContact[]; }
export interface Club { id: string; name: string; city: string; created_at: string; updated_at: string; }
export interface ClubBlock {
  id: string; club_id: string; title: string; full_text: string; short_text?: string;
  order_index: number; is_sensitive: boolean; is_risk?: boolean; created_at: string; updated_at: string;
}
export interface ClubContact { id: string; club_id: string; type: string; name: string; phone: string; email: string; notes?: string; }
export interface ClubZone { id: string; club_id: string; name: string; info: string; plotas: string; vieta?: string; aukstas?: string; pastabos?: string; }
export interface DetailedClub { club: Club; blocks: ClubBlock[]; contacts: ClubContact[]; zones: ClubZone[]; }

const now = new Date().toISOString();

export const seedColleagues: Colleague[] = [
  { id:'col-1', name:'Vytautas Sukockas', position:'Direktorius', phone:'+37060000001', email:'v.sukockas@sportgates.lt', location:'Kaunas', departments:['Vadovybė'], comment:'CEO UAB Praktiškas / SportGates247', created_at:now, updated_at:now },
  { id:'col-2', name:'Jonas Petraitis', position:'OPS koordinatorius', phone:'+37060000002', email:'j.petraitis@sportgates.lt', location:'Vilnius', departments:['Operacijos'], comment:'Atsakingas už Vilniaus klubų priežiūrą', created_at:now, updated_at:now },
  { id:'col-3', name:'Rasa Kazlauskienė', position:'Finansų vadovė', phone:'+37060000003', email:'r.kazlauskiene@sportgates.lt', location:'Kaunas', departments:['Finansai'], comment:'Buhalterija, ataskaitos, mokesčiai', created_at:now, updated_at:now },
  { id:'col-4', name:'Tomas Butkus', position:'Marketingo specialistas', phone:'+37060000004', email:'t.butkus@sportgates.lt', location:'Vilnius', departments:['Marketingas'], comment:'Social media, reklaminės kampanijos', created_at:now, updated_at:now },
  { id:'col-5', name:'Gintarė Navickaitė', position:'Klientų aptarnavimo vadovė', phone:'+37060000005', email:'g.navickaite@sportgates.lt', location:'Klaipėda', departments:['Klientų aptarnavimas'], comment:'Klaipėdos regiono koordinatorė', created_at:now, updated_at:now },
  { id:'col-6', name:'Andrius Jankauskas', position:'IT specialistas', phone:'+37060000006', email:'a.jankauskas@sportgates.lt', location:'Vilnius', departments:['IT'], comment:'NSoft sistema, prieigos valdymas, serveriai', created_at:now, updated_at:now },
];

export const seedOffices: OfficeObject[] = [
  { id:'off-1', name:'Vilniaus biuras', created_at:now, updated_at:now },
  { id:'off-2', name:'Kauno biuras', created_at:now, updated_at:now },
];

export const seedDetailedOffices: Record<string, DetailedOffice> = {
  'off-1': {
    office: { id:'off-1', name:'Vilniaus biuras', created_at:now, updated_at:now },
    blocks: [
      { id:'ob-1', office_id:'off-1', title:'Adresas', content:'Mindaugo g. 15, Vilnius, 4 aukštas', is_sensitive:false, order_index:0, created_at:now, updated_at:now },
      { id:'ob-2', office_id:'off-1', title:'Darbo laikas', content:'I–V 9:00–18:00', is_sensitive:false, order_index:1, created_at:now, updated_at:now },
      { id:'ob-3', office_id:'off-1', title:'WiFi', content:'Tinklas: SportGates_Office\nSlaptažodis: SG2024!secure', is_sensitive:true, order_index:2, created_at:now, updated_at:now },
      { id:'ob-4', office_id:'off-1', title:'Parkavimas', content:'Nemokamas kieme, įvažiavimas iš Mindaugo g.', is_sensitive:false, order_index:3, created_at:now, updated_at:now },
    ],
    contacts: [
      { id:'oc-1', office_id:'off-1', type:'Administratorė', name:'Gintarė Navickaitė', phone:'+37060000005', email:'g.navickaite@sportgates.lt' },
    ],
  },
  'off-2': {
    office: { id:'off-2', name:'Kauno biuras', created_at:now, updated_at:now },
    blocks: [
      { id:'ob-5', office_id:'off-2', title:'Adresas', content:'Brastos g. 24-1, Kaunas, 3 aukštas', is_sensitive:false, order_index:0, created_at:now, updated_at:now },
      { id:'ob-6', office_id:'off-2', title:'Darbo laikas', content:'I–V 9:00–17:00', is_sensitive:false, order_index:1, created_at:now, updated_at:now },
      { id:'ob-7', office_id:'off-2', title:'Durų kodas', content:'Įėjimas: #4521*\nKabinetas: #7834*', is_sensitive:true, order_index:2, created_at:now, updated_at:now },
    ],
    contacts: [
      { id:'oc-2', office_id:'off-2', type:'Vadovas', name:'Vytautas Sukockas', phone:'+37060000001', email:'v.sukockas@sportgates.lt' },
    ],
  },
};

const makeClub = (id: string, name: string, city: string, nuomotojas: string, plotas: string): DetailedClub => ({
  club: { id, name, city, created_at:now, updated_at:now },
  blocks: [
    { id:`${id}-b1`, club_id:id, title:'Nuomos sutartis', full_text:`Nuomotojas: ${nuomotojas}\nNuomos terminas: 10 metų\nMokestis: konfidencialus`, is_sensitive:true, is_risk:false, order_index:0, created_at:now, updated_at:now },
    { id:`${id}-b2`, club_id:id, title:'Plotas ir išplanavimas', full_text:`Bendras plotas: ~${plotas} kv.m\nTreniruoklių salė, rūbinės vyrams ir moterims, sanitariniai mazgai`, is_sensitive:false, is_risk:false, order_index:1, created_at:now, updated_at:now },
    { id:`${id}-b3`, club_id:id, title:'Darbo režimas', full_text:'24/7 su prieigos kortele arba aplikacija', is_sensitive:false, is_risk:false, order_index:2, created_at:now, updated_at:now },
  ],
  contacts: [
    { id:`${id}-c1`, club_id:id, type:'Nuomotojas', name:nuomotojas, phone:'+3705XXXXXXX', email:`info@${id.replace('club-','')}.lt` },
    { id:`${id}-c2`, club_id:id, type:'Budinčioji tarnyba', name:'Avarinė paslauga', phone:'+37052300000', email:'avarija@sportgates.lt' },
  ],
  zones: [
    { id:`${id}-z1`, club_id:id, name:'Treniruoklių salė', info:'Pagrindinė sporto zona su kardio ir jėgos įranga', plotas:`~${Math.round(parseInt(plotas)*0.55)} kv.m`, aukstas:'1' },
    { id:`${id}-z2`, club_id:id, name:'Rūbinės ir dušai', info:'Vyrams ir moterims atskirai, spintelės su užraktu', plotas:`~80 kv.m`, aukstas:'1' },
  ],
});

export const seedClubs: Club[] = [
  { id:'club-mdg', name:'Mindaugo', city:'Vilnius', created_at:now, updated_at:now },
  { id:'club-alk', name:'Aleksotas', city:'Kaunas', created_at:now, updated_at:now },
  { id:'club-siau', name:'Šiaurės', city:'Vilnius', created_at:now, updated_at:now },
  { id:'club-vyt', name:'Vytauto', city:'Kaunas', created_at:now, updated_at:now },
  { id:'club-ogm', name:'Ogmios miestas', city:'Vilnius', created_at:now, updated_at:now },
  { id:'club-kre', name:'Krevės', city:'Vilnius', created_at:now, updated_at:now },
  { id:'club-dan', name:'Dangeručio', city:'Vilnius', created_at:now, updated_at:now },
  { id:'club-sta', name:'Stanevičiaus', city:'Kaunas', created_at:now, updated_at:now },
  { id:'club-klp', name:'Klaipėda', city:'Klaipėda', created_at:now, updated_at:now },
];

export const seedDetailedClubs: Record<string, DetailedClub> = {
  'club-mdg': makeClub('club-mdg','Mindaugo','Vilnius','UAB Mindaugo NT','1100'),
  'club-alk': makeClub('club-alk','Aleksotas','Kaunas','UAB Aleksoto verslas','950'),
  'club-siau': makeClub('club-siau','Šiaurės','Vilnius','UAB Šiaurės centras','870'),
  'club-vyt': makeClub('club-vyt','Vytauto','Kaunas','UAB Vytauto patalpos','1050'),
  'club-ogm': makeClub('club-ogm','Ogmios miestas','Vilnius','UAB Ogmios miestas','1200'),
  'club-kre': makeClub('club-kre','Krevės','Vilnius','UAB Krevės NT','780'),
  'club-dan': makeClub('club-dan','Dangeručio','Vilnius','UAB Dangeručio verslas','920'),
  'club-sta': makeClub('club-sta','Stanevičiaus','Kaunas','UAB Stanevičiaus patalpos','830'),
  'club-klp': makeClub('club-klp','Klaipėda','Klaipėda','UAB Liepų parkas','1591'),
};
