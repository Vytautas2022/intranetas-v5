import { Attachment, CommentItem, HistoryItem } from '../types/common';

export type OrderStatus = 
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ORDERED" | 
  "WAITING_DELIVERY" | "DELIVERED" | "DELIVERED_TO_CLUB" | "SENT_TO_ACCOUNTING" | "CLOSED";

export type OrderUrgency = "low" | "normal" | "urgent" | "critical";

export type OrderCategory = 
  "INVENTORY" | "CLEANING" | "MAINTENANCE" | "EQUIPMENT" | "PRINT" | 
  "VENDING" | "IT" | "OTHER" | "FIRST_AID_KIT";

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  actualUnitPrice?: number;
  supplierId: string;
  supplierName: string;
  supplierUrl?: string;
  notes?: string;
  status: "PENDING" | "ORDERED" | "DELIVERED" | "CANCELLED";
}

export interface OrderApprovalStep {
  approverId: string;
  approverName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment?: string;
  timestamp?: number;
}

export interface Order {
  id: string;
  code: string;
  clubId: string;
  clubName: string;
  category: OrderCategory;
  urgency: OrderUrgency;
  status: OrderStatus;
  estimatedBudget: number;
  actualCost?: number;
  currency: "EUR";
  items: OrderItem[];
  attachments: Attachment[];
  approvalChain: OrderApprovalStep[];
  approvalRequired: boolean;
  requestedBy: string;
  requestedAt: number;
  approvedAt?: number;
  orderedAt?: number;
  deliveredAt?: number;
  deliveredToClubAt?: number;
  sentToAccountingAt?: number;
  closedAt?: number;
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceConfirmedBy?: string;
  comments: CommentItem[];
  history: HistoryItem[];
  notes?: string;
  updatedAt: number;
  updatedBy: string;
  periodic?: {
    isPeriodic: boolean;
    templateId: string;
    templateTitle?: string;
  };
}

export interface OrderPriceHistoryEntry {
  id: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  clubId: string;
  date: number;
}

export const ordersList: Order[] = [
  {
    id: "ord-1",
    code: "ORD-2026-001",
    clubId: "OGM",
    clubName: "SG Ogmios",
    category: "INVENTORY",
    urgency: "normal",
    status: "APPROVED",
    estimatedBudget: 450,
    currency: "EUR",
    items: [{ id: "it-1", productName: "Popieriniai rankšluosčiai", quantity: 10, supplierId: "s5", supplierName: "Mūsų Centrinis Sandėlis", status: "PENDING" }],
    attachments: [],
    approvalChain: [{ approverId: "u3", approverName: "Admin User", status: "APPROVED", timestamp: Date.now() - 3600000 }],
    approvalRequired: true,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 86400000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 3600000,
    updatedBy: "Admin User"
  },
  {
    id: "ord-2",
    code: "ORD-2026-002",
    clubId: "SG_VYT",
    clubName: "SG Vytauto pr",
    category: "EQUIPMENT",
    urgency: "urgent",
    status: "PENDING_APPROVAL",
    estimatedBudget: 800,
    currency: "EUR",
    items: [{ id: "it-2", productName: "Bėgimo takas (dalys)", quantity: 1, supplierId: "s2", supplierName: "Multisportas B2B", status: "PENDING" }],
    attachments: [],
    approvalChain: [],
    approvalRequired: true,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 3600000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 3600000,
    updatedBy: "Admin User"
  },
  {
    id: "ord-3",
    code: "ORD-2026-003",
    clubId: "MND",
    clubName: "SG Mindaugo",
    category: "VENDING",
    urgency: "low",
    status: "CLOSED",
    estimatedBudget: 200,
    actualCost: 195,
    currency: "EUR",
    items: [{ id: "it-3", productName: "Baltyminis batonėlis", quantity: 50, supplierId: "s3", supplierName: "GymBeam Lietuva", status: "DELIVERED" }],
    attachments: [],
    approvalChain: [{ approverId: "u3", approverName: "Admin User", status: "APPROVED", timestamp: Date.now() - 86400000 }],
    approvalRequired: false,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 172800000,
    approvedAt: Date.now() - 172800000,
    closedAt: Date.now() - 86400000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 86400000,
    updatedBy: "Admin User"
  },
  {
    id: "ord-4",
    code: "ORD-2026-004",
    clubId: "STN",
    clubName: "SG Stanevičiaus",
    category: "CLEANING",
    urgency: "normal",
    status: "ORDERED",
    estimatedBudget: 300,
    currency: "EUR",
    items: [{ id: "it-4", productName: "Skystas muilas", quantity: 20, supplierId: "s1", supplierName: "Švaros Prekės UAB", status: "ORDERED" }],
    attachments: [],
    approvalChain: [{ approverId: "u3", approverName: "Admin User", status: "APPROVED", timestamp: Date.now() - 86400000 }],
    approvalRequired: true,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 172800000,
    orderedAt: Date.now() - 86400000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 86400000,
    updatedBy: "Admin User"
  },
  {
    id: "ord-5",
    code: "ORD-2026-005",
    clubId: "DNG",
    clubName: "SG Dangeručio",
    category: "PRINT",
    urgency: "normal",
    status: "DRAFT",
    estimatedBudget: 150,
    currency: "EUR",
    items: [{ id: "it-5", productName: "Instrukcijos", quantity: 10, supplierId: "s6", supplierName: "Print idėjos", status: "PENDING" }],
    attachments: [],
    approvalChain: [],
    approvalRequired: false,
    requestedBy: "Admin User",
    requestedAt: Date.now(),
    comments: [],
    history: [],
    updatedAt: Date.now(),
    updatedBy: "Admin User"
  },
  {
    id: "ord-6",
    code: "ORD-2026-006",
    clubId: "ALEKS",
    clubName: "SG Aleksotas",
    category: "MAINTENANCE",
    urgency: "critical",
    status: "PENDING_APPROVAL",
    estimatedBudget: 1200,
    currency: "EUR",
    items: [{ id: "it-6", productName: "Pagrindinis variklis", quantity: 1, supplierId: "s4", supplierName: "Sporto Technika", status: "PENDING" }],
    attachments: [],
    approvalChain: [],
    approvalRequired: true,
    requestedBy: "Admin User",
    requestedAt: Date.now(),
    comments: [],
    history: [],
    updatedAt: Date.now(),
    updatedBy: "Admin User"
  },
  {
    id: "ord-7",
    code: "ORD-2026-007",
    clubId: "SIAU",
    clubName: "SG Šiaurės pr",
    category: "OTHER",
    urgency: "low",
    status: "SENT_TO_ACCOUNTING",
    estimatedBudget: 100,
    actualCost: 100,
    currency: "EUR",
    items: [{ id: "it-7", productName: "Lemputės", quantity: 5, supplierId: "s8", supplierName: "Kitos paslaugos UAB", status: "DELIVERED" }],
    attachments: [],
    approvalChain: [{ approverId: "u3", approverName: "Admin User", status: "APPROVED", timestamp: Date.now() - 259200000 }],
    approvalRequired: false,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 345600000,
    sentToAccountingAt: Date.now() - 86400000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 86400000,
    updatedBy: "Admin User"
  },
  {
    id: "ord-8",
    code: "ORD-2026-008",
    clubId: "KRE",
    clubName: "SG Krėvės pr",
    category: "IT",
    urgency: "urgent",
    status: "WAITING_DELIVERY",
    estimatedBudget: 600,
    currency: "EUR",
    items: [{ id: "it-8", productName: "Terminalo ekranas", quantity: 1, supplierId: "s7", supplierName: "IT Sprendimai", status: "ORDERED" }],
    attachments: [],
    approvalChain: [{ approverId: "u3", approverName: "Admin User", status: "APPROVED", timestamp: Date.now() - 172800000 }],
    approvalRequired: true,
    requestedBy: "Admin User",
    requestedAt: Date.now() - 259200000,
    orderedAt: Date.now() - 172800000,
    comments: [],
    history: [],
    updatedAt: Date.now() - 172800000,
    updatedBy: "Admin User"
  }
];

export const priceHistoryList: OrderPriceHistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
  id: `ph-${i}`,
  productName: `Prekė ${i}`,
  supplierId: `s${(i % 8) + 1}`,
  supplierName: `Tiekėjas ${i % 8}`,
  quantity: Math.floor(Math.random() * 10) + 1,
  unitPrice: Math.floor(Math.random() * 100) + 10,
  orderId: `ord-${Math.floor(Math.random() * 8) + 1}`,
  clubId: "OGM",
  date: Date.now() - Math.floor(Math.random() * 30 * 86400000)
}));
