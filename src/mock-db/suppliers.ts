export type SupplierCategory = "INVENTORY" | "CLEANING" | "MAINTENANCE" | "EQUIPMENT" | "PRINT" | "VENDING" | "IT" | "OTHER";

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  website?: string;
  categories: SupplierCategory[];
  contractUrl?: string;
  notes?: string;
  is_internal: boolean;
  requires_approval: boolean;
  is_active: boolean;
  paymentTermsDays?: number;
  avgDeliveryDays?: number;
}

export const suppliersList: Supplier[] = [
  {
    id: "s1",
    name: "Švaros Prekės UAB",
    email: "info@svarosprekes.lt",
    categories: ["CLEANING"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 30,
    avgDeliveryDays: 2
  },
  {
    id: "s2",
    name: "Multisportas B2B",
    email: "b2b@multisportas.lt",
    categories: ["EQUIPMENT", "INVENTORY"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 14,
    avgDeliveryDays: 5
  },
  {
    id: "s3",
    name: "GymBeam Lietuva",
    email: "b2b@gymbeam.lt",
    categories: ["VENDING", "INVENTORY"],
    is_internal: false,
    requires_approval: false,
    is_active: true,
    paymentTermsDays: 7,
    avgDeliveryDays: 3
  },
  {
    id: "s4",
    name: "Sporto Technika",
    email: "servisas@sportotechnika.lt",
    categories: ["MAINTENANCE", "EQUIPMENT"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 30,
    avgDeliveryDays: 7
  },
  {
    id: "s5",
    name: "Mūsų Centrinis Sandėlis",
    email: "sandelys@fitsport.lt",
    categories: ["INVENTORY", "CLEANING"],
    is_internal: true,
    requires_approval: false,
    is_active: true,
    paymentTermsDays: 0,
    avgDeliveryDays: 1
  },
  {
    id: "s6",
    name: "Print idėjos",
    email: "uzsakymai@printidejos.lt",
    categories: ["PRINT"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 14,
    avgDeliveryDays: 3
  },
  {
    id: "s7",
    name: "IT Sprendimai",
    email: "support@itsprendimai.lt",
    categories: ["IT"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 30,
    avgDeliveryDays: 1
  },
  {
    id: "s8",
    name: "Kitos paslaugos UAB",
    email: "info@kitas.lt",
    categories: ["OTHER"],
    is_internal: false,
    requires_approval: true,
    is_active: true,
    paymentTermsDays: 30,
    avgDeliveryDays: 4
  }
];
