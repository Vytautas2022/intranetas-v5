export interface FacilityTemplate {
  id: string;
  name: string;
  club_id: string | null; // null = global
  priority: 'low' | 'medium' | 'high' | 'critical';
  sla_hours: number;
  sop_url?: string;
  sop_description?: string;
}

export interface PeriodicTemplate {
    id: string;
    name: string;
    frequency: string;
    applies_to: string[];
    assigned_to: string;
    type: "MANDATORY" | "INSPECTION";
}

export interface OrderConfig {
    product_id?: string;
    category?: string;
    source: "INTERNAL" | "SUPPLIER";
    assigned_to: string;
}

export interface FaultAssignment {
    type: "FACILITY" | "EQUIPMENT";
    assigned_to: string;
}
export const periodicTemplates: PeriodicTemplate[] = [
    { id: 'pt1', name: 'Kasdieninis valymas', frequency: 'daily', applies_to: ['akropolis'], assigned_to: 'u1', type: 'MANDATORY' },
    { id: 'pt2', name: 'Savaitinė patikra', frequency: 'weekly', applies_to: ['akropolis', 'kaunas'], assigned_to: 'u2', type: 'INSPECTION' }
];

export const orderConfig: OrderConfig[] = [
    { category: 'CLEANING', source: 'INTERNAL', assigned_to: 'u1' },
    { product_id: 'v1', source: 'SUPPLIER', assigned_to: 'u3' }
];

export const faultAssignment: FaultAssignment[] = [
    { type: 'FACILITY', assigned_to: 'u1' },
    { type: 'EQUIPMENT', assigned_to: 'u2' }
];

export const facilityTemplates: FacilityTemplate[] = [
  { id: 'ft1', name: 'Neveikia vandens aparatas', club_id: null, priority: 'high', sla_hours: 24, sop_url: 'https://example.com/sop1', sop_description: 'Patikrinkite ar vandens aparatas įjungtas į elektrą.' },
  { id: 'ft2', name: 'Sugedo dušas', club_id: null, priority: 'high', sla_hours: 24 },
  { id: 'ft3', name: 'Neveikia šildymas', club_id: null, priority: 'critical', sla_hours: 6 },
  { id: 'ft4', name: 'Sugedo apšvietimas', club_id: null, priority: 'medium', sla_hours: 48 },
  { id: 'ft5', name: 'Problema su ventiliacija', club_id: null, priority: 'medium', sla_hours: 24 },
  { id: 'ft6', name: 'Sugedo durys', club_id: null, priority: 'medium', sla_hours: 48 },
  { id: 'ft7', name: 'Neveikia muzika', club_id: null, priority: 'low', sla_hours: 168 },
  { id: 'ft8', name: 'Problema su spintelėmis', club_id: null, priority: 'medium', sla_hours: 48 },
  { id: 'ft9', name: 'Sugedo grindys', club_id: null, priority: 'high', sla_hours: 24 },
  { id: 'ft10', name: 'Neveikia kondicionierius', club_id: null, priority: 'high', sla_hours: 24 }
];

export interface Equipment {
  id: string;
  club_id: string;
  number: string;
  name: string;
  zone: string;
  image_url?: string;
  is_active?: boolean;
  qr_url?: string;
}

export type ProductCategory = "INVENTORY" | "VENDING" | "CLEANING" | "PRINT" | "OTHER" | "FIRST_AID_KIT";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  supplier_id: string;
  sku: string;
  mode?: "FAST" | "SLOW";
  image_url?: string;
  has_local_stock?: boolean;
  target_quantity?: number;
  local_stock_quantity?: number;
  is_active?: boolean;
  is_custom?: boolean;
  dimensions?: string;
  material?: string;
}

export const printMaterials = [
  "Lipdukas",
  "Laminuotas",
  "Plastikas",
  "Pastorintas",
  "Popierius",
  "Kitas"
];

export interface Supplier {
  id: string;
  name: string;
  email: string;
  is_internal: boolean;
  requires_approval: boolean;
}

export interface ClubInventorySetting {
  club_id: string;
  product_id: string;
  target_quantity: number;
  refill_quantity: number;
  local_stock?: number;
}

import { generateUniqueId } from '../logic/idLogic';
import { clubs } from './clubs';

const SEED_PRODUCT_NAMES: Record<ProductCategory, string[]> = {
  FIRST_AID_KIT: [
    'Pleistrai',
    'Bintas',
    'Dezinfekcinis purškalas',
    'Tvarstis'
  ],
  INVENTORY: [
    'Popieriniai rankšluosčiai',
    'Skystas muilas',
    'Dezinfekcinis skystis',
    'Kilimėliai',
    'Gumos',
    'Rankenos',
    'Šluostės',
    'Valymo priemonė',
    'Kibiras'
  ],
  VENDING: [
    'Vanduo 0.5l',
    'Vanduo 1l',
    'Baltyminis batonėlis',
    'Gėrimas izotoninis',
    'Energetinis gėrimas',
    'Užkandis',
    'Riešutai',
    'Sultys',
    'Kava'
  ],
  CLEANING: [
    'Grindų ploviklis',
    'WC valiklis',
    'Stiklo valiklis',
    'Popierius',
    'Šluostė',
    'Šepetys',
    'Dezinfekcija',
    'Kibirai',
    'Pirštinės'
  ],
  PRINT: [
    'Plakatai',
    'Lipdukai',
    'Banneriai',
    'Reklaminė medžiaga',
    'Vizitinės kortelės',
    'Instrukcijos',
    'Afišos',
    'Etiketės',
    'Brošiūros'
  ],
  OTHER: [
    'Biuro popierius',
    'Rašikliai',
    'Segtuvai',
    'Vokai',
    'Baterijos',
    'Lemputės',
    'Klijai',
    'Žirklės',
    'Lipni juosta'
  ]
};

export const productsList: Product[] = [
  { id: 'p1', name: 'Popierinis rankšluostis', category: 'INVENTORY', supplier_id: 's5', sku: 'PR-001', image_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop', has_local_stock: true, target_quantity: 10, local_stock_quantity: 4, is_active: true },
  { id: 'p2', name: 'Skystas muilas', category: 'INVENTORY', supplier_id: 's5', sku: 'SM-001', image_url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=100&h=100&fit=crop', has_local_stock: true, target_quantity: 5, local_stock_quantity: 3, is_active: true },
  { id: 'p3', name: 'Dezinfekcinis skystis', category: 'INVENTORY', supplier_id: 's5', sku: 'DS-001', image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=100&h=100&fit=crop', has_local_stock: false, target_quantity: 2, local_stock_quantity: 0, is_active: true },
  { id: 'v1', name: 'Vanduo 0.5l', category: 'VENDING', supplier_id: 's3', sku: 'V-001', mode: 'FAST', has_local_stock: true, target_quantity: 24, local_stock_quantity: 10, is_active: true },
  { id: 'v2', name: 'Baltyminis batonėlis', category: 'VENDING', supplier_id: 's3', sku: 'V-002', mode: 'SLOW', has_local_stock: true, target_quantity: 20, local_stock_quantity: 15, is_active: true },
  { id: 'c1', name: 'Grindų ploviklis', category: 'CLEANING', supplier_id: 's5', sku: 'P-001', has_local_stock: false, target_quantity: 5, local_stock_quantity: 0, is_active: true },
  { id: 'c2', name: 'Langų valiklis', category: 'CLEANING', supplier_id: 's5', sku: 'P-002', has_local_stock: false, target_quantity: 3, local_stock_quantity: 0, is_active: true }
];

// Seed logic: ensure 10 products per category
(function seedProducts() {
  const categories: ProductCategory[] = ['INVENTORY', 'VENDING', 'CLEANING', 'PRINT', 'OTHER'];
  
  categories.forEach(cat => {
    const existingCount = productsList.filter(p => p.category === cat).length;
    const names = SEED_PRODUCT_NAMES[cat];
    const targetSupplier = (cat === 'INVENTORY' || cat === 'CLEANING') ? 's5' : (cat === 'VENDING' ? 's3' : (cat === 'PRINT' ? 's4' : 's5'));
    
    // Add custom names until we have 9 (leaving space for "Kita")
    let addedCount = 0;
    for (const name of names) {
      if (productsList.filter(p => p.category === cat).length >= 9) break;
      if (!productsList.find(p => p.name === name && p.category === cat)) {
        productsList.push({
          id: generateUniqueId('sp'),
          name,
          category: cat,
          supplier_id: targetSupplier,
          sku: `SKU-${cat.substring(0, 2)}-${addedCount++}`,
          is_active: true,
          has_local_stock: cat === 'INVENTORY' || cat === 'VENDING',
          target_quantity: 10,
          local_stock_quantity: 5,
          dimensions: cat === 'PRINT' ? 'A4 (210x297mm)' : undefined,
          material: cat === 'PRINT' ? 'Popierius' : undefined
        });
      }
    }
    
    // Ensure "Kita" exists for each category
    if (!productsList.find(p => p.category === cat && p.is_custom)) {
      productsList.push({
        id: generateUniqueId('custom'),
        name: 'Kita',
        category: cat,
        supplier_id: targetSupplier,
        sku: `CUSTOM-${cat}`,
        is_active: true,
        is_custom: true
      });
    }
  });
})();

export const clubInventorySettingsList: ClubInventorySetting[] = [
  { club_id: 'akropolis', product_id: 'p1', target_quantity: 10, refill_quantity: 5, local_stock: 4 },
  { club_id: 'akropolis', product_id: 'p2', target_quantity: 5, refill_quantity: 2, local_stock: 3 },
  { club_id: 'akropolis', product_id: 'v1', target_quantity: 24, refill_quantity: 12, local_stock: 10 },
  { club_id: 'akropolis', product_id: 'v2', target_quantity: 20, refill_quantity: 10, local_stock: 15 },
  { club_id: 'akropolis', product_id: 'c1', target_quantity: 5, refill_quantity: 2 }
];

export const equipmentList: Equipment[] = [
  { id: 'eq1', club_id: 'akropolis', number: 'T-01', name: 'Bėgimo takas', zone: 'Kardio', is_active: true, qr_url: 'https://ais-dev-5fnoqc6djlykzqnou4gowq-509992423626.europe-west2.run.app/report?id=123' },
  { id: 'eq2', club_id: 'akropolis', number: 'EQ-02', name: 'Dviratis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq3', club_id: 'akropolis', number: 'EQ-03', name: 'Elipsinis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq4', club_id: 'akropolis', number: 'EQ-04', name: 'Leg press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq5', club_id: 'akropolis', number: 'EQ-05', name: 'Smith machine', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq6', club_id: 'akropolis', number: 'EQ-06', name: 'Bench press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq7', club_id: 'akropolis', number: 'EQ-07', name: 'Cable machine', zone: 'Funkcinė zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq8', club_id: 'akropolis', number: 'EQ-08', name: 'Row machine', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq9', club_id: 'akropolis', number: 'EQ-09', name: 'Shoulder press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq10', club_id: 'akropolis', number: 'EQ-10', name: 'Lat pulldown', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq11', club_id: 'panorama', number: 'EQ-01', name: 'Bėgimo takelis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq12', club_id: 'panorama', number: 'EQ-02', name: 'Dviratis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq13', club_id: 'panorama', number: 'EQ-03', name: 'Elipsinis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq14', club_id: 'panorama', number: 'EQ-04', name: 'Leg press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq15', club_id: 'panorama', number: 'EQ-05', name: 'Smith machine', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq16', club_id: 'panorama', number: 'EQ-06', name: 'Bench press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq17', club_id: 'panorama', number: 'EQ-07', name: 'Cable machine', zone: 'Funkcinė zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq18', club_id: 'panorama', number: 'EQ-08', name: 'Row machine', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq19', club_id: 'panorama', number: 'EQ-09', name: 'Shoulder press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq20', club_id: 'panorama', number: 'EQ-10', name: 'Lat pulldown', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq21', club_id: 'kaunas', number: 'EQ-01', name: 'Bėgimo takelis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq22', club_id: 'kaunas', number: 'EQ-02', name: 'Dviratis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq23', club_id: 'kaunas', number: 'EQ-03', name: 'Elipsinis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq24', club_id: 'kaunas', number: 'EQ-04', name: 'Leg press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq25', club_id: 'kaunas', number: 'EQ-05', name: 'Smith machine', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq26', club_id: 'kaunas', number: 'EQ-06', name: 'Bench press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq27', club_id: 'kaunas', number: 'EQ-07', name: 'Cable machine', zone: 'Funkcinė zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq28', club_id: 'kaunas', number: 'EQ-08', name: 'Row machine', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq29', club_id: 'kaunas', number: 'EQ-09', name: 'Shoulder press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq30', club_id: 'kaunas', number: 'EQ-10', name: 'Lat pulldown', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq31', club_id: 'klaipeda', number: 'EQ-01', name: 'Bėgimo takelis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq32', club_id: 'klaipeda', number: 'EQ-02', name: 'Dviratis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq33', club_id: 'klaipeda', number: 'EQ-03', name: 'Elipsinis', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq34', club_id: 'klaipeda', number: 'EQ-04', name: 'Leg press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq35', club_id: 'klaipeda', number: 'EQ-05', name: 'Smith machine', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq36', club_id: 'klaipeda', number: 'EQ-06', name: 'Bench press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq37', club_id: 'klaipeda', number: 'EQ-07', name: 'Cable machine', zone: 'Funkcinė zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq38', club_id: 'klaipeda', number: 'EQ-08', name: 'Row machine', zone: 'Kardio', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq39', club_id: 'klaipeda', number: 'EQ-09', name: 'Shoulder press', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' },
  { id: 'eq40', club_id: 'klaipeda', number: 'EQ-10', name: 'Lat pulldown', zone: 'Jėgos zona', is_active: true, image_url: 'https://placehold.co/100x100?text=EQ' }
];

// Equipment Seed Logic: Ensure every active club has at least 10 equipment items
export function seedEquipmentData() {
  const equipmentTemplates = [
    "Bėgimo takas",
    "Dviratis",
    "Elipsinis",
    "Leg press",
    "Smith machine",
    "Bench press",
    "Cable machine",
    "Row machine",
    "Shoulder press",
    "Lat pulldown"
  ];

  const zones = ["Kardio", "Jėga", "Funkcinė"];
  const activeClubs = clubs.filter(c => c.is_active);

  activeClubs.forEach(club => {
    // Use the exported equipmentList which is now initialized
    const existing = equipmentList.filter(e => e.club_id === club.id);
    
    if (existing.length < 10) {
      let currentNumber = 1;
      while (equipmentList.filter(e => e.club_id === club.id).length < 10) {
        const number = `EQ-${currentNumber.toString().padStart(2, '0')}`;
        const alreadyExists = equipmentList.find(e => e.club_id === club.id && e.number === number);
        
        if (!alreadyExists) {
          const name = equipmentTemplates[(equipmentList.filter(e => e.club_id === club.id).length) % equipmentTemplates.length];
          equipmentList.push({
            id: generateUniqueId('eq'),
            club_id: club.id,
            name: name,
            number: number,
            zone: zones[currentNumber % zones.length],
            image_url: "https://placehold.co/100x100?text=EQ",
            is_active: true
          });
        }
        currentNumber++;
        if (currentNumber > 100) break; // Safety break
      }
    }
  });

  // Image Rule: Ensure every equipment item has an image_url
  equipmentList.forEach(e => {
    if (!e.image_url) {
      e.image_url = "https://placehold.co/100x100?text=EQ";
    }
  });
}

// Execute seeding after all variables are defined
// Moving to the absolute end to avoid any initialization order issues
seedEquipmentData();


export interface EquipmentIssueType {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sla_hours: number;
  applies_to?: 'FACILITY' | 'EQUIPMENT' | 'BOTH';
}

export const equipmentIssueTypesList: EquipmentIssueType[] = [
  { id: 'ei1', name: 'Neveikia', priority: 'high', sla_hours: 24, applies_to: 'BOTH' },
  { id: 'ei2', name: 'Veikia, bet kelia nepatogumų', priority: 'medium', sla_hours: 48, applies_to: 'BOTH' },
  { id: 'ei3', name: 'Veikia', priority: 'low', sla_hours: 168, applies_to: 'BOTH' }
];

export const suppliersList: Supplier[] = [
  { id: 's1', name: 'Švaros prekių tiekėjas UAB', email: 'svara@example.com', is_internal: false, requires_approval: true },
  { id: 's2', name: 'Techninės įrangos servisas', email: 'service@example.com', is_internal: false, requires_approval: true },
  { id: 's3', name: 'Vendingo paslaugos', email: 'vending@example.com', is_internal: false, requires_approval: true },
  { id: 's4', name: 'Valymo paslaugos', email: 'valymas@example.com', is_internal: false, requires_approval: true },
  { id: 's5', name: 'Mūsų Centrinis Sandėlis', email: 'sandelys@example.com', is_internal: true, requires_approval: false }
];
