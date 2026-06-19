/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Menu,
  Plus,
  Search,
  Filter,
  Star,
  ArrowRight,
  ArrowLeft,
  Clock,
  Building2,
  AlertCircle,
  Network,
  CheckCircle2,
  BarChart3,
  LayoutDashboard,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  History,
  Image as ImageIcon,
  Video,
  Trash2,
  Camera,
  Film,
  Upload,
  X,
  User as UserIcon,
  FileText,
  Bell,
  MailWarning,
  Check,
  Eye,
  EyeOff,
  PieChart as PieChartIcon,
  MessageSquare,
  Keyboard,
  Settings,
  Settings2,
  Lightbulb,
  Zap,
  QrCode,
  ShoppingCart,
  Package,
  SprayCan,
  Printer,
  RefreshCcw,
  Monitor,
  Building,
  MapPin,
  Users,
  Users2,
  Wrench,
  Dumbbell,
  Activity,
  HeartPulse,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import * as XLSX from "xlsx";
import { clubs, Club } from "./mock-db/clubs";
import { regionManagers } from "./mock-db/regionManagers";
import {
  faults as MOCK_FAULTS,
  Fault as MockFault,
  FaultComment,
  FaultMedia,
  FaultWatcher,
  FaultHistoryItem,
} from "./mock-db/faults";
import { addComment, editComment, deleteComment } from "./logic/commentLogic";
import { updateFaultSOP } from "./logic/sopLogic";
import { setWatchMode, unwatchFault } from "./logic/watchLogic";
import { createAuditLogEntry } from "./logic/auditLogic";
import { createAppAuditEntry } from "./logic/auditEngine";
import { generateId, generateUniqueId } from "./logic/idLogic";
import {
  hydrateMockCollection,
  writeMockStorage,
} from "./logic/mockDbHydration";
import {
  loadFromStorage,
  saveToStorage,
  clearStorage,
  KEYS,
} from "./services/persistenceService";
import { addMedia, MEDIA_LIMITS } from "./logic/mediaLogic";
import { compressAndResizeImage } from "./logic/imageProcessing";
import {
  addMediaToComment,
  COMMENT_MEDIA_LIMITS,
} from "./logic/commentMediaLogic";
import {
  notifications as initialNotifications,
  Notification as AppNotification,
} from "./mock-db/notifications";
import {
  toggleRead,
  markAllAsRead,
  getUnreadCount,
  markAllAsUnread,
  addNotification,
  markAsRead,
} from "./logic/notificationLogic";
import { getRemainingTime, checkSLA, getSLAHeat } from "./logic/slaLogic";
import { getSlaDeadline } from "./logic/slaEngine";
import { rejectFault, validateStatusChange } from "./logic/statusLogic";
import {
  formatWorkflowStatusLabel,
  normalizeWorkflowStatusId,
} from "./logic/statusLabels";
import {
  isRegisteredWorkflowStatus,
  UNKNOWN_STATUS_LANE_ID,
} from "./logic/workflowStatusRegistry";
import { getSOP } from "./logic/sopLogic";
import { users } from "./mock-db/users";
import type { User } from "./mock-db/users";
import { initialCities } from "./mock-db/cities";
import type { City } from "./mock-db/cities";
import { surveys as initialSurveys } from "./mock-db/surveys";
import { filterFaultTypes } from "./logic/faultSearchLogic";
import { moveFault, createFaultHistory } from "./logic/kanbanLogic";
import {
  convertTaskToTaskModule,
  ConversionMode,
  returnTaskToDarbai,
  promoteSomedayToProject,
} from "./logic/conversionLogic";
import {
  canApproveWorkflowItemPreview,
  canCloseWorkflowCardPreview,
  canCreateWorkflowCardResolver,
  canEditWorkflowCardPreview,
} from "./logic/permissionPreviewResolver";
import { getAssignableUsersForClub } from "./logic/userScopeLogic";

import { cn } from "./lib/utils";
import { HomeActionModal } from "./components/HomeActionModal";
import { WorkflowSelector } from "./components/WorkflowSelector";
import { WaitingForPartsModal } from "./components/WaitingForPartsModal";
import { SopDecisionModal } from "./components/SopDecisionModal";
import { InsightModal } from "./components/InsightModal";
import { faultTypes, FaultTypeDefinition } from "./mock-db/faultTypes";
import {
  getFaultMeta,
  getPriorityLabel,
  getPriorityColor,
} from "./logic/faultLogic";
import { inventoryTemplates } from "./mock-db/inventoryTemplates";
import {
  calculateMissing,
  OrderPayload,
  OrderCategoryState,
  getProductAnalytics,
} from "./logic/inventoryLogic";
import { productTransfers } from "./mock-db/transfers";

// --- Types & Constants ---

import {
  Status,
  Priority,
  Fault,
  Attachment,
  AnalyticsData,
  AuditEntry,
  RecurringTask,
} from "./types/faults";
import { calculateAnalytics } from "./logic/analytics";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { mockTasks } from "./mock-db/tasks";
import { qrEquipment } from "./mock-db/qr-mapping";
import {
  findActiveQrAssetTask,
  getQrWorkflow,
  handleQrReport,
} from "./logic/qrLogic";
import {
  findActiveEquipmentFault,
  getEquipmentIdentityFields,
  getFaultEquipmentId,
} from "./logic/equipmentFaultIdentity";
import {
  findActiveFacilityFault,
  getFacilityAssetObjectIdFromLegacy,
  getFacilityIdentityFields,
} from "./logic/facilityFaultIdentity";
import { AdminModule } from "./components/AdminModule";
import { OpsFlowView } from "./components/OpsFlowView";
import { EquipmentSearchModal } from "./components/EquipmentSearchModal";
import {
  workflowTypes as initialWorkflowTypes,
  getWorkflowTypeByLegacyCategory,
  type WorkflowObjectType,
  WorkflowType,
} from "./mock-db/workflowTypes";
import {
  applyWorkflowMigration,
  filterBoardEntities,
  getActiveDarbaiWorkflowIds,
  getActiveWorkflowTypesForModule,
  getBoardKanbanLanes,
  getScopedEntities,
  hasUnmappedWorkflowStatuses,
  normalizeWorkflowStatusConfig,
  splitScopedEntities,
} from "./logic/appWorkflowHelpers";

import { OrderProvider } from "./modules/orders/OrderContext";
import { OrderModule } from "./modules/orders/OrderModule";
import { PeriodicTaskProvider } from "./modules/periodic-tasks/PeriodicTaskContext";
import { PeriodicModule } from "./modules/periodic/PeriodicModule";
import { ZmonesOrgModule } from "./modules/zmones-org/ZmonesOrgModule";
import {
  getActiveModuleIdForPath,
  getActiveTabIdForPath,
  getAdminInventorySubTabForRouteTab,
  getAdminTabIdForRouteTab,
  getAdminTabRoutePath,
  getRouteSyncPath,
  getRouteTabIdForAdminTab,
  type AdminModuleTabId,
} from "./modules/moduleRegistry";
import { AppSidebar } from "./components/sidebar/AppSidebar";
import {
  getActiveSubmodule,
  getFilteredSidebarItems,
  getSidebarItems,
  getSidebarSubModules,
  getSidebarTitle,
} from "./components/sidebar/sidebarLogic";
import { getRuntimeModuleForPath } from "./modules/moduleRuntime";
import { PeriodicDecisionBlock } from "./components/PeriodicDecisionBlock";
import { generatePeriodicWorksForClub } from "./logic/periodicWorkGenerator";
import { mockPeriodicTemplates } from "./mock-db/periodicTemplates";
import { mockPeriodicHistory } from "./mock-db/periodicHistory";

import { suppliersList } from "./mock-db/suppliers";
import {
  Product,
  ClubInventorySetting,
  ProductCategory,
  Supplier,
  productsList as MOCK_PRODUCTS,
  clubInventorySettingsList as MOCK_INVENTORY_SETTINGS,
  suppliersList as MOCK_SUPPLIERS,
  printMaterials,
} from "./mock-db/admin";
import {
  getIssueTypesForAssetType,
  getLegacyIssueTypes,
  type AssetIssueType,
} from "./mock-db/assetIssueTypes";
import {
  getAssetObjectsForAssetType,
  getEquipmentAssetObjects,
  getFacilityAssetObjects,
  type AssetObject,
} from "./mock-db/assetObjects";
import { assetTypes } from "./mock-db/assetTypes";
import {
  initialFacilityInsights,
  initialEquipmentInsights,
  Insight,
} from "./mock-db/insights";

import { CeoDashboard } from "./modules/ceo/CeoDashboard";
import { sops as MOCK_SOPS } from "./mock-db/sops";
import { ordersList as MOCK_ORDERS } from "./mock-db/orders";
import { AuthProvider } from "./auth/AuthProvider";
import { LoginPage } from "./auth/LoginPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/authContext";

const equipmentIssueTypesList = getLegacyIssueTypes();
const equipmentList = getEquipmentAssetObjects();
const facilityAssetObjects = getFacilityAssetObjects();
const facilityTemplates = facilityAssetObjects.filter(
  (object) => !object.locationId,
);
const facilityLocations = facilityAssetObjects.filter(
  (object) => object.locationId,
);
const facilityRegistrationObjects = facilityAssetObjects;
import type { AuthUser } from "./auth/types";
import {
  canAccessModule,
  canManageAllClubs,
  canManagePeriodicTasks,
} from "./logic/permissionEngine";

const CLUBS = clubs;
const SUPPLIERS = MOCK_SUPPLIERS;

const getWorkflowCreateModuleId = (
  workflow?: Pick<WorkflowType, "objectType"> | null,
): "orders" | "darbai" =>
  workflow?.objectType === "ORDER" ? "orders" : "darbai";

const getRegistrationCompatibilityCategory = (
  workflow?: Pick<WorkflowType, "id" | "objectType"> | null,
): string => {
  if (workflow?.objectType === "EQUIPMENT") return "EQUIPMENT_FAULT";
  if (workflow?.objectType === "FACILITY") return "FACILITY_FAULT";
  if (workflow?.objectType === "ORDER") return "ORDER";
  return workflow?.id || "GENERIC";
};

const INITIAL_FAULTS: Fault[] = MOCK_FAULTS as Fault[];

const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    faultId: "f1",
    timestamp: Date.now() - 3600000 * 4,
    user: "Admin",
    action: "created",
    description: "Užregistruotas naujas gedimas",
  },
  {
    id: "a2",
    faultId: "f2",
    timestamp: Date.now() - 3600000 * 24,
    user: "Sistemos administratorius",
    action: "created",
    description: "Užregistruotas naujas gedimas",
  },
  {
    id: "a3",
    faultId: "f2",
    timestamp: Date.now() - 3600000 * 12,
    user: "Sistemos administratorius",
    action: "status_change",
    description: 'Statusas pakeistas į "Vykdoma"',
    changes: { status: { from: Status.NEW, to: Status.IN_PROGRESS } },
  },
];

// --- Sub-components ---

const PriorityBadge = ({ priority }: { priority: string }) => {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
        getPriorityColor(priority),
      )}
    >
      {getPriorityLabel(priority)}
    </span>
  );
};
const NotificationIcon = ({
  type,
}: {
  type: "normal" | "priority" | "sla";
}) => {
  switch (type) {
    case "priority":
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertCircle size={14} />
        </div>
      );
    case "sla":
      return (
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
          <Clock size={14} />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <Bell size={14} />
        </div>
      );
  }
};

const StatusBadge = ({ status, role }: { status: string; role: string }) => {
  const isCoordinator = role === "Koordinatorius";
  const displayStatus =
    isCoordinator && (status === "NAUJAS" || status === Status.NEW)
      ? "LAUKIAMA"
      : formatWorkflowStatusLabel(status);

  return (
    <div
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight",
        status === "NAUJAS" || status === Status.NEW
          ? "bg-slate-100 text-slate-600"
          : status === "VYKDOMA" || status === Status.IN_PROGRESS
            ? "bg-amber-100 text-amber-700"
            : status === Status.FIXED
              ? "bg-slate-100 text-slate-700"
              : status === Status.REJECTED
                ? "bg-red-100 text-red-700"
                : status === Status.WAITING_DETAILS
                  ? "bg-slate-100 text-slate-600"
                  : "bg-slate-100 text-slate-700",
      )}
    >
      {displayStatus}
    </div>
  );
};

// --- Detail Panel Component ---

const formatCommentDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const RenderReplies = ({
  comments,
  parentId,
  onReply,
  currentUser,
  onEdit,
  onDelete,
  editingCommentId,
  handleEditComment,
  setEditingCommentId,
  historyOpenCommentId,
  setHistoryOpenCommentId,
}: {
  comments: FaultComment[];
  parentId: string;
  onReply: (id: string, author: string) => void;
  currentUser: { name: string; role: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editingCommentId: string | null;
  handleEditComment: (id: string, text: string) => void;
  setEditingCommentId: (id: string | null) => void;
  historyOpenCommentId: string | null;
  setHistoryOpenCommentId: (id: string | null) => void;
}) => {
  const replies = comments.filter((c) => c.parentId === parentId);
  if (replies.length === 0) return null;

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="text-slate-900 font-bold bg-brand-lime/20 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatCommentDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return "Ką tik";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m.`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}val.`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="ml-8 space-y-4 border-l-2 border-slate-100/50 pl-4 mt-2">
      {replies.map((r, rIdx) => (
        <div key={`reply-${r.id ? r.id : `new-${rIdx}`}`} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] text-slate-700 font-black shrink-0 shadow-sm">
              {r.author.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-900">
                  {r.author}
                </span>
                <span className="text-[9px] font-medium text-slate-400">
                  {formatCommentDate(r.createdAt)}
                </span>
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl rounded-tl-none shadow-sm border group relative",
                  r.system
                    ? "bg-red-50 border-red-100 italic"
                    : "bg-slate-100/50 border-slate-200/50",
                  r.deleted && "opacity-50",
                )}
              >
                {r.system && (
                  <div className="text-[7px] font-black uppercase text-red-400 mb-0.5 tracking-widest">
                    Sistemos pranešimas
                  </div>
                )}

                {editingCommentId === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-lime/20 resize-none"
                      defaultValue={r.text}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEditComment(r.id, e.currentTarget.value);
                        } else if (e.key === "Escape") {
                          setEditingCommentId(null);
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600"
                      >
                        Atšaukti
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {highlightMentions(r.text)}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5">
                  {r.edited && !r.deleted && (
                    <button
                      onClick={() =>
                        setHistoryOpenCommentId(
                          historyOpenCommentId === r.id ? null : r.id,
                        )
                      }
                      className="text-[9px] font-black uppercase text-slate-400 hover:text-brand-lime transition-colors"
                    >
                      Redaguota
                    </button>
                  )}
                  {!r.deleted && !editingCommentId && (
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onReply(r.id, r.author)}
                        className="text-[9px] font-black uppercase text-slate-400 hover:text-brand-lime transition-colors"
                      >
                        Atsakyti
                      </button>
                      {r.author === currentUser.name && (
                        <>
                          <button
                            onClick={() => onEdit(r.id)}
                            className="text-[9px] font-black uppercase text-slate-400 hover:text-amber-600"
                          >
                            Redaguoti
                          </button>
                          <button
                            onClick={() => onDelete(r.id)}
                            className="text-[9px] font-black uppercase text-slate-400 hover:text-red-600"
                          >
                            Ištrinti
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {historyOpenCommentId === r.id && r.history.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-2 border-t border-slate-200/50 space-y-2 overflow-hidden"
                    >
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                        Redagavimo istorija
                      </span>
                      {r.history.map((h, hIdx) => (
                        <div
                          key={`history-${r.id}-${h.timestamp}-${hIdx}`}
                          className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200/20"
                        >
                          <span className="font-bold text-[8px] text-slate-400 block">
                            {formatCommentDate(h.timestamp)}
                          </span>
                          <p className="italic">"{h.text}"</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reply Media */}
                {r.media && r.media.length > 0 && !r.deleted && (
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {r.media.map((m, idx) => (
                      <div
                        key={`reply-media-${idx}`}
                        className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm"
                      >
                        {m.type === "image" ? (
                          <img
                            src={m.url}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            alt="Reply"
                            referrerPolicy="no-referrer"
                            onClick={() => window.open(m.url, "_blank")}
                          />
                        ) : (
                          <video
                            src={m.url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <RenderReplies
            comments={comments}
            parentId={r.id}
            onReply={onReply}
            currentUser={currentUser}
            onEdit={onEdit}
            onDelete={onDelete}
            editingCommentId={editingCommentId}
            handleEditComment={handleEditComment}
            setEditingCommentId={setEditingCommentId}
            historyOpenCommentId={historyOpenCommentId}
            setHistoryOpenCommentId={setHistoryOpenCommentId}
          />
        </div>
      ))}
    </div>
  );
};

const FaultDetailPanel = ({
  isOpen,
  onClose,
  fault,
  onUpdate,
  currentUser,
  onReject,
  onAddNotification,
  onRequestClosure,
  onRequestWaitingDetails,
  onConvertToTask,
  onNavigateToTask,
  onReturnToDarbai,
  onPromoteToProject,
  facilityInsights,
  equipmentInsights,
  onAddInsight,
}: {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault | null;
  onUpdate: (updates: Partial<Fault>) => void;
  currentUser: { id: string; name: string; role: string };
  onReject: () => void;
  onAddNotification: (
    text: string,
    type: "normal" | "priority" | "sla",
    faultId: string,
  ) => void;
  onRequestClosure: (id: string) => void;
  onRequestWaitingDetails: (id: string) => void;
  onConvertToTask: (id: string) => void;
  onNavigateToTask: (id: string) => void;
  onReturnToDarbai: (id: string) => void;
  onPromoteToProject: (id: string) => void;
  facilityInsights: Insight[];
  equipmentInsights: Insight[];
  onAddInsight: (text: string) => void;
}) => {
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentMedia, setCommentMedia] = useState<FaultMedia[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(fault?.title || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(fault?.description || "");
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [historyOpenCommentId, setHistoryOpenCommentId] = useState<
    string | null
  >(null);
  const [sopInput, setSopInput] = useState("");
  const [isSopEditing, setIsSopEditing] = useState(false);
  const [isWatchDropdownOpen, setIsWatchDropdownOpen] = useState(false);
  const [newWatcherMode, setNewWatcherMode] = useState<"all" | "done_only">(
    "all",
  );
  const [watcherSearch, setWatcherSearch] = useState("");

  const [insightLimit, setInsightLimit] = useState(3);
  const [isManualInsightOpen, setIsManualInsightOpen] = useState(false);
  const [manualInsightText, setManualInsightText] = useState("");

  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const commentVideoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (fault) {
      setTempTitle(fault.title);
      setTempDescription(fault.description || "");
    }
  }, [fault?.id]);

  useEffect(() => {
    if (!isOpen || !fault) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setIsShortcutsOpen(false);
        return;
      }

      if (
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLInputElement && e.target.type !== "checkbox")
      )
        return;

      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        textareaRef.current?.focus();
      } else if (key === "e") {
        e.preventDefault();
        setIsEditingTitle(true);
      } else if (key === "d") {
        e.preventDefault();
        setIsEditingDescription(true);
      } else if (key === "m") {
        e.preventDefault();
        statusSelectRef.current?.focus();
      } else if (key === "v") {
        e.preventDefault();
        if (fault.status !== Status.IN_PROGRESS)
          handleUpdate({ status: Status.IN_PROGRESS });
      } else if (key === "s") {
        e.preventDefault();
        if (fault.status !== Status.FIXED) {
          if (fault.type === "EQUIPMENT_FAULT") {
            handleUpdate({ status: Status.FIXED });
          } else {
            onRequestClosure(fault.id);
          }
        }
      } else if (key === "k") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, fault, onUpdate, onRequestClosure]);

  const relevantInsights = React.useMemo(() => {
    if (!fault) return [];
    if (fault.category === "FACILITY_FAULT" && fault.typeId) {
      return facilityInsights.filter((i) => i.targetId === fault.typeId);
    } else if (fault.category === "EQUIPMENT_FAULT") {
      const typeId = fault.typeId;
      const equipId = getFaultEquipmentId(fault);
      return equipmentInsights.filter(
        (i) =>
          (typeId && i.targetId === typeId) ||
          (equipId && i.targetId === equipId),
      );
    }
    return [];
  }, [fault, facilityInsights, equipmentInsights]);

  if (!fault) return null;

  const sla = getRemainingTime(fault);

  const handleAddComment = () => {
    if (!fault) return;
    if (!comment.trim() && commentMedia.length === 0) return;
    const newComment = addComment(fault, {
      text: comment,
      author: currentUser.name,
      parentId: replyTo,
      media: commentMedia,
    });

    // Trigger notification if there are mentions
    if (newComment.mentions && newComment.mentions.length > 0) {
      newComment.mentions.forEach((mention) => {
        onAddNotification(
          `Paminėjo jus komentare: ${comment}`,
          "priority",
          fault.id,
        );
      });
    }

    // Watcher notifications
    fault.watchers.forEach((w) => {
      if (w.userId !== currentUser.name && w.mode === "all") {
        onAddNotification(
          `${currentUser.name} pakomentavo gedimą: "${comment.substring(0, 30)}..."`,
          "normal",
          fault.id,
        );
      }
    });

    handleUpdate({ comments: [...fault.comments] });
    setComment("");
    setReplyTo(null);
    setCommentMedia([]);
  };

  const handleEditComment = (commentId: string, text: string) => {
    if (!fault) return;
    editComment(fault, commentId, text, currentUser.name);
    handleUpdate({ comments: [...fault.comments] });
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!fault) return;
    const confirmation = window.confirm("Ar tikrai norite ištrinti komentarą?");
    if (confirmation) {
      deleteComment(fault, commentId, currentUser);
      handleUpdate({ comments: [...fault.comments] });
    }
  };

  const handleUpdateSOP = () => {
    if (!fault) return;
    updateFaultSOP(fault, sopInput, currentUser.name);
    handleUpdate({ sop: fault.sop });
    setIsSopEditing(false);
  };

  const notifyWatchers = (updates: Partial<Fault>) => {
    if (!fault) return;
    const oldStatus = fault.status;
    const newStatus = updates.status;

    fault.watchers.forEach((w) => {
      if (w.userId === currentUser.name) return; // Don't notify self

      if (w.mode === "all") {
        if (newStatus && newStatus !== oldStatus) {
          onAddNotification(
            `${currentUser.name} pakeitė statusą į "${newStatus}": ${fault.title}`,
            "sla",
            fault.id,
          );
        }
        if (updates.assignedTo) {
          const newAssignee =
            typeof updates.assignedTo === "string"
              ? updates.assignedTo
              : updates.assignedTo.name;
          onAddNotification(
            `${currentUser.name} paskyrė užduotį: ${newAssignee}`,
            "normal",
            fault.id,
          );
        }
        if (updates.title && updates.title !== fault.title) {
          onAddNotification(
            `${currentUser.name} atnaujino pavadinimą: ${updates.title}`,
            "normal",
            fault.id,
          );
        }
      } else if (w.mode === "done_only") {
        if (newStatus === Status.FIXED && oldStatus !== Status.FIXED) {
          onAddNotification(
            `Užbaigta užduotis #${fault.code}: ${fault.title}`,
            "sla",
            fault.id,
          );
        }
      }
    });

    // Special case for comments - already handled in handleAddComment but let's make it consistent if needed
  };

  const handleUpdate = (updates: Partial<Fault>) => {
    if (!fault) return;
    const oldFault = { ...fault };
    notifyWatchers(updates);
    onUpdate(updates);

    // Create audit log entry for significant changes
    const significantFields = ['status', 'title', 'assigneeId', 'description', 'priority', 'closedAt', 'archivedAt', 'archiveReason'];
    const changedFields = Object.keys(updates).filter(key => significantFields.includes(key));

    if (changedFields.length > 0) {
      const description = changedFields.map(field => {
        const newVal = (updates as any)[field];
        const oldVal = (oldFault as any)[field];
        return `${field}: ${oldVal} -> ${newVal}`;
      }).join(', ');

      createAuditLogEntry({
        moduleId: fault.type === 'ORDER' ? 'orders' : 'faults',
        moduleName: fault.type === 'ORDER' ? 'Užsakymai' : 'Gedimai',
        entityType: fault.type === 'ORDER' ? 'ORDER' : 'FAULT',
        entityId: fault.id,
        entityTitle: updates.title || fault.title,
        actionType: updates.status && updates.status !== oldFault.status ? "STATUS_CHANGED" : "UPDATED",
        changeDescription: `Atnaujinta: ${description}`,
        locationLabel: `${fault.type === 'ORDER' ? 'Užsakymai' : 'Gedimai'}${fault.clubName ? ` > ${fault.clubName}` : ''}`,
        canRestore: true,
        oldValue: oldFault,
        newValue: { ...oldFault, ...updates },
        snapshotBefore: oldFault,
        snapshotAfter: { ...oldFault, ...updates }
      });
    }
  };

  const handleToggleWatch = (userId: string, mode: "all" | "done_only") => {
    if (!fault) return;
    const existing = fault.watchers.find((w) => w.userId === userId);
    if (existing && existing.mode === mode && userId === currentUser.name) {
      unwatchFault(fault, userId);
    } else {
      setWatchMode(fault, userId, mode);
    }
    handleUpdate({ watchers: [...fault.watchers] });
  };

  const handleArchiveCard = () => {
    if (!fault || fault.archivedAt) return;
    const input = window.prompt("Archyvavimo priežastis");
    if (input === null) return;
    const reason = input.trim() || "Nenurodyta";
    const now = Date.now();

    handleUpdate({
      archivedAt: now,
      archivedBy: currentUser.name,
      archiveReason: reason,
      history: [
        {
          id: generateUniqueId("h"),
          timestamp: now,
          user: currentUser.name,
          actionType: "ARCHIVED",
          reason,
        },
        ...(fault.history || []),
      ],
    });
    onClose();
  };

  const processFiles = async (files: File[]) => {
    const newMedia = [...commentMedia];
    for (const file of files) {
      await addMediaToComment(newMedia, file);
    }
    setCommentMedia([...newMedia]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) processFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  };

  const handleMainMediaPaste = (e: React.ClipboardEvent) => {
    if (!fault) return;
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      addMedia(fault, files).then(() => {
        handleUpdate({ media: [...fault.media] });
      });
    }
  };

  const handleMainMediaDrop = (e: React.DragEvent) => {
    if (!fault) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addMedia(fault, files).then(() => {
        handleUpdate({ media: [...fault.media] });
      });
    }
  };

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="text-slate-900 font-bold bg-brand-lime/20 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const club = CLUBS.find((c) => c.id === fault.clubId) || CLUBS[0];
  const permissionCard = {
    workflowTypeId: fault.workflowTypeId,
    moduleId: fault.type === "ORDER" ? "orders" : "darbai",
    type: fault.type,
    entityType: fault.entityType,
  };
  const permissionUser = currentUser as AuthUser;

  const canEdit =
    canEditWorkflowCardPreview(permissionUser, permissionCard) ||
    fault.status === Status.NEW ||
    fault.status === "NAUJAS";
  const canCreateRelatedWorkflowCard = fault.workflowTypeId
      ? canCreateWorkflowCardResolver(
        permissionUser,
        fault.workflowTypeId,
        permissionCard.moduleId,
      )
    : false;
  const canCloseWorkflowCard = canCloseWorkflowCardPreview(
    permissionUser,
    permissionCard,
    fault.status,
  );
  const canApproveWorkflowItem = canApproveWorkflowItemPreview(
    permissionUser,
    permissionCard,
  );
  const canViewWorkflowAnalytics = Boolean(
    fault.workflowTypeId &&
      permissionUser.effectivePermissionsPreview?.workflowAccess.find(
        (access) => access.workflowTypeId === fault.workflowTypeId,
      )?.canViewAnalytics,
  );

  const handleUpdateItemStatus = (
    itemIdx: number,
    newStatus: "OK" | "MISSING" | "DAMAGED",
  ) => {
    if (!fault.orderData || !fault.orderData.items) return;
    const newItems = [...fault.orderData.items];
    const prevStatus = newItems[itemIdx].status;
    newItems[itemIdx].status = newStatus;

    handleUpdate({
      orderData: {
        ...fault.orderData,
        items: newItems,
      },
    });

    // Log to history
    const itemName = newItems[itemIdx].productName;
    const historyEntry = {
      user: currentUser.name,
      action: `Prekės "${itemName}" statusas pakeistas: ${prevStatus} -> ${newStatus}`,
      timestamp: Date.now(),
    };
    handleUpdate({ history: [...(fault.history || []), historyEntry] });
  };

  const parentComments = fault.comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    fault.comments.filter((c) => c.parentId === parentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-x-0 top-16 bottom-0 bg-slate-900/40 z-[60]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-xl bg-white shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            {/* Panel Header - Clean & Compact */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-50">
              {/* Close Button Absolute for Mobile Visibility */}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 p-2 hover:bg-slate-100 rounded-xl transition-colors z-[60] bg-white sm:static sm:bg-transparent sm:p-1.5"
              >
                <X
                  size={20}
                  className="text-slate-400 group-hover:text-slate-600"
                />
              </button>

              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  {/* Row 1: Badges & ID */}
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={fault.status}
                      role={currentUser.role}
                    />
                    {fault.priority === "critical" && (
                      <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[8px] font-black uppercase flex items-center gap-1">
                        <AlertCircle size={10} /> Skubus
                      </span>
                    )}
                    <div
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex items-center gap-1",
                        sla.overdue
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-slate-100 text-slate-600 border-slate-200",
                      )}
                    >
                      <Clock size={10} />
                      {sla.text}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 font-mono">
                      #{fault.code}
                    </span>
                  </div>

                  {/* Row 2: Title (Dominant) */}
                  <div className="mt-1">
                    {isEditingTitle && canEdit ? (
                      <input
                        autoFocus
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={() => {
                          if (tempTitle !== fault.title) {
                            handleUpdate({ title: tempTitle });
                          }
                          setIsEditingTitle(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (tempTitle !== fault.title) {
                              handleUpdate({ title: tempTitle });
                            }
                            setIsEditingTitle(false);
                          }
                          if (e.key === "Escape") {
                            setTempTitle(fault.title);
                            setIsEditingTitle(false);
                          }
                        }}
                        className="w-full text-xl font-black text-slate-900 bg-slate-50 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-brand-lime/20"
                      />
                    ) : (
                      <h2
                        onClick={() => {
                          if (canEdit) {
                            setTempTitle(fault.title);
                            setIsEditingTitle(true);
                          }
                        }}
                        className={cn(
                          "text-xl font-black text-slate-900 leading-tight tracking-tight px-2 -mx-2 rounded transition-colors",
                          canEdit
                            ? "cursor-pointer hover:bg-slate-50"
                            : "cursor-default",
                        )}
                      >
                        {fault.title}
                      </h2>
                    )}
                  </div>

                  {/* Row 3: Secondary Meta */}
                  <div className="flex items-center gap-4 text-slate-400 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight">
                      <Building2 size={11} />
                      <span className="text-slate-600">{club.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight relative">
                      <UserIcon size={11} />
                      {isEditingAssignee && canEdit ? (
                        <select
                          autoFocus
                          value={
                            typeof fault.assignedTo === "string"
                              ? fault.assignedTo
                              : fault.assignedTo.name
                          }
                          onChange={(e) => {
                            const newUser = users.find((u) => u.name === e.target.value);
                            if (newUser) {
                              const oldName =
                                typeof fault.assignedTo === "string"
                                  ? fault.assignedTo
                                  : fault.assignedTo.name;
                              const newAssigneeData = {
                                id: newUser.id,
                                name: newUser.name,
                                role: newUser.role,
                              };

                              const historyItem: FaultHistoryItem = {
                                id: generateUniqueId("h"),
                                timestamp: Date.now(),
                                user: currentUser.name,
                                actionType: "ASSIGNEE_CHANGED",
                                type: "ASSIGNEE_CHANGED",
                                from: oldName,
                                to: newUser.name,
                                date: new Date().toISOString(),
                              };

                              handleUpdate({
                                assignedTo: newAssigneeData,
                                assigneeId: newUser.id,
                                assigneeName: newUser.name,
                                history: [historyItem, ...fault.history],
                              });
                            }
                            setIsEditingAssignee(false);
                          }}
                          onBlur={() => setIsEditingAssignee(false)}
                          className="bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:outline-none"
                        >
                          {getAssignableUsersForClub(users, club)
                            .map((u) => (
                              <option
                                key={`assignee-opt-${u.id}`}
                                value={u.name}
                              >
                                {u.name} ({u.role})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span
                          onClick={() =>
                            canEdit && setIsEditingAssignee(true)
                          }
                          className={cn(
                            "text-slate-600",
                            canEdit &&
                              "cursor-pointer hover:text-brand-lime border-b border-dotted border-slate-400",
                          )}
                        >
                          {typeof fault.assignedTo === "string"
                            ? fault.assignedTo
                            : fault.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Timestamps */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 mt-2 border-t border-slate-50 pt-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight">
                      <Clock size={10} />
                      <span>Sukurta:</span>
                      <span className="text-slate-600">
                        {fault.created_at
                          ? new Date(fault.created_at).toLocaleString("lt-LT")
                          : new Date(fault.createdAt).toLocaleString("lt-LT")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight">
                      <History size={10} />
                      <span>Paskutinis atnaujinimas:</span>
                      <span className="text-slate-600">
                        {fault.updated_at
                          ? new Date(fault.updated_at).toLocaleString("lt-LT")
                          : fault.updatedAt
                            ? new Date(fault.updatedAt).toLocaleString("lt-LT")
                            : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Close */}
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <div className="flex items-center gap-1 mr-2 border-r border-slate-100 pr-2">
                    {canCreateRelatedWorkflowCard &&
                      fault.source !== "PERIODIC" &&
                      fault.status !== Status.MOVED &&
                      fault.status !== Status.SOMEDAY && (
                        <button
                          onClick={() => onConvertToTask(fault.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-lime text-black rounded-lg text-xs font-bold hover:bg-brand-lime-dark transition-all shadow-md"
                          title="Inicijuoti projektą"
                        >
                          <ArrowRight size={12} /> Inicijuoti projektą
                        </button>
                      )}
                    {!fault.archivedAt && (
                      <button
                        onClick={handleArchiveCard}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                        title="Archyvuoti"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {canCloseWorkflowCard &&
                      fault.status !== Status.REJECTED && (
                        <button
                          onClick={onReject}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                          title="Atmesti"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsWatchDropdownOpen(!isWatchDropdownOpen)
                        }
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          (fault.watchers || []).some(
                            (w) => w.userId === currentUser.name,
                          )
                            ? "bg-amber-50 text-amber-500"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                        )}
                        title={
                          (fault.watchers || []).some(
                            (w) => w.userId === currentUser.name,
                          )
                            ? "Keisti stebėjimo režimą"
                            : "Stebėti"
                        }
                      >
                        <Star
                          size={16}
                          fill={
                            (fault.watchers || []).some(
                              (w) => w.userId === currentUser.name,
                            )
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>

                      <AnimatePresence>
                        {isWatchDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-[80] p-1 overflow-hidden"
                          >
                            <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1 flex justify-between items-center">
                              <span>Stebėjimo nustatymai</span>
                              <button
                                onClick={() => setIsWatchDropdownOpen(false)}
                                className="hover:text-slate-600"
                              >
                                <X size={10} />
                              </button>
                            </div>

                            <div className="space-y-0.5 p-1">
                              <button
                                onClick={() =>
                                  handleToggleWatch(currentUser.name, "all")
                                }
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between",
                                  (fault.watchers || []).find(
                                    (w) =>
                                      w.userId === currentUser.name &&
                                      w.mode === "all",
                                  )
                                    ? "bg-amber-50 text-amber-700"
                                    : "text-slate-600 hover:bg-slate-50",
                                )}
                              >
                                <span>Sekti viską</span>
                                {fault.watchers?.find(
                                  (w) =>
                                    w.userId === currentUser.name &&
                                    w.mode === "all",
                                ) && <Check size={12} />}
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleWatch(
                                    currentUser.name,
                                    "done_only",
                                  )
                                }
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between",
                                  (fault.watchers || []).find(
                                    (w) =>
                                      w.userId === currentUser.name &&
                                      w.mode === "done_only",
                                  )
                                    ? "bg-amber-50 text-amber-700"
                                    : "text-slate-600 hover:bg-slate-50",
                                )}
                              >
                                <span>Tik kai užbaigta</span>
                                {fault.watchers?.find(
                                  (w) =>
                                    w.userId === currentUser.name &&
                                    w.mode === "done_only",
                                ) && <Check size={12} />}
                              </button>
                            </div>

                            {/* Add Members Section */}
                            {canEdit && (
                              <div className="mt-1 pt-1 border-t border-slate-50">
                                <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                  Pridėti narius
                                </div>

                                {/* Mode toggle for new members */}
                                <div className="flex gap-1 p-1 bg-slate-50 mx-1 rounded-lg mt-1">
                                  {(["all", "done_only"] as const).map((m) => (
                                    <button
                                      key={`mode-sel-${m}`}
                                      onClick={() => setNewWatcherMode(m)}
                                      className={cn(
                                        "flex-1 py-1 rounded text-[8px] font-black uppercase transition-all",
                                        newWatcherMode === m
                                          ? "bg-white text-black shadow-sm"
                                          : "text-slate-400 hover:text-slate-600",
                                      )}
                                    >
                                      {m === "all" ? "Viskas" : "Tik pabaiga"}
                                    </button>
                                  ))}
                                </div>

                                {/* User Search & List */}
                                <div className="p-1">
                                  <input
                                    placeholder="Ieškoti nario..."
                                    value={watcherSearch}
                                    onChange={(e) =>
                                      setWatcherSearch(e.target.value)
                                    }
                                    className="w-full px-2 py-1.5 mb-1 text-[10px] bg-slate-50 border border-slate-100 rounded focus:outline-none"
                                  />
                                  <div className="max-h-40 overflow-y-auto space-y-0.5 custom-scrollbar">
                                    {users
                                      .filter(
                                        (u) =>
                                          u.name !== currentUser.name &&
                                          u.name
                                            .toLowerCase()
                                            .includes(
                                              watcherSearch.toLowerCase(),
                                            ),
                                      )
                                      .map((u) => {
                                        const watcher = (
                                          fault.watchers || []
                                        ).find((w) => w.userId === u.name);
                                        return (
                                          <button
                                            key={`user-watch-${u.id}`}
                                            onClick={() => {
                                              if (watcher) {
                                                unwatchFault(fault, u.name);
                                              } else {
                                                setWatchMode(
                                                  fault,
                                                  u.name,
                                                  newWatcherMode,
                                                );
                                              }
                                              handleUpdate({
                                                watchers: [
                                                  ...(fault.watchers || []),
                                                ],
                                              });
                                            }}
                                            className={cn(
                                              "w-full text-left px-2 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center justify-between",
                                              watcher
                                                ? "bg-slate-100 text-slate-900"
                                                : "text-slate-500 hover:bg-slate-50",
                                            )}
                                          >
                                            <div className="flex flex-col">
                                              <span>{u.name}</span>
                                              {watcher && (
                                                <span className="text-[7px] text-brand-lime uppercase">
                                                  {watcher.mode === "all"
                                                    ? "Sekama: Viskas"
                                                    : "Sekama: Pabaiga"}
                                                </span>
                                              )}
                                            </div>
                                            {watcher ? (
                                              <CheckCircle2
                                                size={12}
                                                className="text-brand-lime"
                                              />
                                            ) : (
                                              <Plus size={12} />
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(fault.watchers || []).some(
                              (w) => w.userId === currentUser.name,
                            ) && (
                              <button
                                onClick={() => {
                                  unwatchFault(fault, currentUser.name);
                                  handleUpdate({
                                    watchers: [...(fault.watchers || [])],
                                  });
                                  setIsWatchDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors mt-1 border-t border-slate-50"
                              >
                                Nebestebėti manęs
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsShortcutsOpen(true)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    title="Spartieji klavišai (K)"
                  >
                    <Keyboard size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-900 scroll-smooth pb-32">
              {/* SOP Block - Compact Single Row */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 flex items-center justify-between gap-4">
                {isSopEditing ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      autoFocus
                      placeholder="SOP Nuoroda..."
                      value={sopInput}
                      onChange={(e) => setSopInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateSOP()}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-lime/20"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleUpdateSOP}
                        className="px-2 py-1 bg-black text-white rounded-md text-[9px] font-black uppercase"
                      >
                        Išsaugoti
                      </button>
                      <button
                        onClick={() => setIsSopEditing(false)}
                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-[9px] font-black uppercase"
                      >
                        Atšaukti
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase border",
                          fault.sop?.url
                            ? "bg-brand-lime/10 text-slate-900 border-brand-lime/30"
                            : "bg-slate-100 text-slate-500 border-slate-200",
                        )}
                      >
                        {fault.sop?.url ? "SOP Galioja" : "SOP Nėra"}
                      </div>
                      {fault.sop?.updatedAt && (
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                          Atnaujino:{" "}
                          <span className="text-slate-600">
                            {fault.sop.updatedBy}
                          </span>{" "}
                          • {new Date(fault.sop.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {fault.sop?.url && (
                        <a
                          href={fault.sop.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-black text-slate-900 hover:text-brand-lime uppercase tracking-widest transition-colors"
                        >
                          Atidaryti
                        </a>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            setSopInput(fault.sop?.url || "");
                            setIsSopEditing(true);
                          }}
                          className="text-[9px] font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest"
                        >
                          {fault.sop?.url ? "Redaguoti" : "+ Pridėti SOP"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Status Select - Tucked away but accessible */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Statusas:
                </span>
                <select
                  ref={statusSelectRef}
                  value={fault.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Status;
                    if (newStatus === ("PATVIRTINTA" as any)) {
                      const hasIssues = fault.orderData?.items?.some(
                        (i: any) => i.status !== "OK",
                      );
                      if (hasIssues && !canApproveWorkflowItem) {
                        alert(
                          "Negalite patvirtinti užsakymo, kol yra trūkstamų ar pažeistų prekių. Tai turi atlikti OPS komanda.",
                        );
                        return;
                      }
                    }
                    if (newStatus === Status.FIXED) {
                      onRequestClosure(fault.id);
                    } else if (newStatus === Status.REJECTED) {
                      onReject();
                    } else if (newStatus === Status.WAITING_DETAILS) {
                      onRequestWaitingDetails(fault.id);
                    } else {
                      handleUpdate({ status: newStatus });
                    }
                  }}
                  className="text-[10px] font-bold text-slate-900 bg-transparent hover:bg-slate-50 px-2 py-1 rounded-md transition-colors cursor-pointer outline-none uppercase"
                >
                  {fault.type === "ORDER"
                    ? [
                        "NAUJAS",
                        "VYKDOMA",
                        "UŽSAKYTA",
                        "PRISTATYTA",
                        "PATVIRTINTA",
                        "Atmesta",
                      ].map((s) => (
                        <option key={`order-status-${s}`} value={s}>
                          {formatWorkflowStatusLabel(s)}
                        </option>
                      ))
                    : Object.values(Status)
                        .filter((s) => {
                          if (fault.status === Status.SOMEDAY) {
                            return (
                              s === Status.SOMEDAY || s === Status.REJECTED
                            );
                          }
                          return s !== Status.MOVED;
                        })
                        .map((s) => (
                          <option key={`fault-status-${s}`} value={s}>
                            {formatWorkflowStatusLabel(s)}
                          </option>
                        ))}
                </select>
              </div>

              {/* ORDER DATA (General for all order-related categories) */}
              {(fault.category === "INVENTORY" ||
                fault.category === "VENDING" ||
                fault.category === "CLEANING" ||
                fault.category === "PRINT" ||
                fault.category === "OTHER") &&
                fault.orderData && (
                  <div className="space-y-4 pt-2">
                    <div className="px-1 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShoppingCart size={12} /> Užsakymo informacija
                      </h3>
                      <div className="flex items-center gap-3">
                        {fault.orderData.phone && (
                          <span className="text-[10px] font-black text-slate-500 font-mono">
                            Tel: {fault.orderData.phone}
                          </span>
                        )}
                        <span className="text-[10px] font-black text-slate-400 font-mono">
                          ID: {fault.orderData.orderId}
                        </span>
                      </div>
                    </div>

                    {fault.orderData.deliveryAddress && (
                      <div className="px-1 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">
                          Pristatymo adresas
                        </div>
                        <div className="px-2 text-xs font-bold text-slate-700">
                          {fault.orderData.deliveryAddress}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100/50 border-b border-slate-200">
                          <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-4 py-3">Produktas</th>
                            {fault.category === "PRINT" && (
                              <>
                                <th className="px-4 py-3 text-center">
                                  Specifikacija
                                </th>
                              </>
                            )}
                            <th className="px-4 py-3 text-center">Užsakyta</th>
                            <th className="px-4 py-3 text-right">
                              Patvirtinimas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 transition-colors">
                          {fault.orderData.items.map(
                            (item: any, idx: number) => (
                              <tr
                                key={`order-item-${idx}-${item.productName}`}
                                className="text-sm bg-white hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">
                                    {item.productName}
                                  </div>
                                  {item.description && (
                                    <div className="text-[10px] text-slate-500 mt-1 italic">
                                      {item.description}
                                    </div>
                                  )}
                                  {item.attachmentId && (
                                    <div className="mt-2">
                                      <a
                                        href={
                                          fault.attachments?.find(
                                            (a) => a.id === item.attachmentId,
                                          )?.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold hover:bg-brand-lime hover:text-black transition-colors"
                                      >
                                        <FileText size={10} /> Peržiūrėti failą
                                      </a>
                                    </div>
                                  )}
                                  {item.status !== "OK" && (
                                    <div
                                      className={cn(
                                        "text-[10px] font-black uppercase mt-0.5",
                                        item.status === "MISSING"
                                          ? "text-red-500"
                                          : "text-orange-500",
                                      )}
                                    >
                                      {item.status === "MISSING"
                                        ? "TRŪKSTA"
                                        : "PAŽEISTA"}
                                    </div>
                                  )}
                                </td>
                                {fault.category === "PRINT" && (
                                  <td className="px-4 py-3 text-center">
                                    <div className="text-[10px] font-bold text-slate-600 leading-tight">
                                      {item.dimensions && (
                                        <div>{item.dimensions}</div>
                                      )}
                                      {item.material && (
                                        <div className="text-slate-400 font-medium">
                                          {item.material}
                                        </div>
                                      )}
                                      {!item.dimensions &&
                                        !item.material &&
                                        "-"}
                                    </div>
                                  </td>
                                )}
                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                                  {item.orderQuantity}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    {(
                                      ["OK", "MISSING", "DAMAGED"] as const
                                    ).map((s) => (
                                      <button
                                        key={`item-status-${s}-${idx}`}
                                        disabled={
                                          !canEdit &&
                                          fault.status !== "PRISTATYTA"
                                        }
                                        onClick={() => {
                                          const newItems = [
                                            ...fault.orderData.items,
                                          ];
                                          newItems[idx] = {
                                            ...newItems[idx],
                                            status: s,
                                          };
                                          handleUpdate({
                                            orderData: {
                                              ...fault.orderData,
                                              items: newItems,
                                            },
                                          });
                                        }}
                                        className={cn(
                                          "px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all border",
                                          item.status === s
                                            ? s === "OK"
                                              ? "bg-brand-lime text-black border-brand-lime"
                                              : s === "MISSING"
                                                ? "bg-red-100 text-red-700 border-red-200"
                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600 shadow-sm",
                                          !canEdit &&
                                            fault.status !== "PRISTATYTA" &&
                                            "opacity-50 cursor-not-allowed",
                                        )}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                    {canCloseWorkflowCard && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            alert(
                              `Siunčiamas užsakymas tiekėjui ${fault.orderData.supplierId}...\n\nProduktai:\n${fault.orderData.items.map((i: any) => `- ${i.productName}: ${i.orderQuantity} vnt`).join("\n")}`,
                            );
                            handleUpdate({ status: "UŽSAKYTA" as any });
                          }}
                          className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                          Siųsti tiekėjui (MOCK)
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {fault.status === Status.SOMEDAY && (
                <div className="flex flex-wrap gap-2 px-1 py-1">
                  <button
                    onClick={() => onPromoteToProject(fault.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <LayoutDashboard size={12} /> Perkelti į projektą
                  </button>
                  <button
                    onClick={() => onReturnToDarbai(fault.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    <ArrowLeft size={12} /> Grąžinti į darbus
                  </button>
                </div>
              )}

              {fault.status === Status.MOVED && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-lime">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        Perkelta į Užduotis
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        {fault.converted_by} •{" "}
                        {new Date(
                          fault.converted_at || Date.now(),
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      fault.converted_to_task_id &&
                      onNavigateToTask(fault.converted_to_task_id)
                    }
                    className="px-4 py-2 bg-brand-lime text-black text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-brand-lime-dark transition-colors shadow-sm"
                  >
                    Atidaryti užduotį
                  </button>
                </div>
              )}

              {fault.status === Status.WAITING_DETAILS && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col gap-2">
                  <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Laukiama informacijos
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-500 uppercase">
                        Sekantis veiksmas:
                      </span>
                      <div className="p-3 bg-white border border-amber-200 rounded-xl text-sm text-slate-700 min-h-[60px] whitespace-pre-wrap">
                        {fault.nextAction?.text || "Nenurodyta"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-amber-500 uppercase">
                        SLA Terminas:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2 bg-white border border-amber-200 rounded-xl text-sm text-slate-700 font-medium">
                          {fault.nextAction?.dueDate?.replace("T", " ") ||
                            "Nenurodyta"}
                        </div>
                        <button
                          onClick={() => onRequestWaitingDetails(fault.id)}
                          className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 shadow-sm transition-colors"
                        >
                          Atnaujinti
                        </button>
                      </div>
                    </div>

                    {fault.waitingDetailsReason && (
                      <div className="space-y-1.5 pt-3 border-t border-amber-200/50">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">
                          Paskutinio keitimo priežastis:
                        </span>
                        <div className="p-3 bg-amber-100/30 rounded-lg text-sm text-amber-900 leading-relaxed font-medium italic">
                          {fault.waitingDetailsReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description - Highlighted */}
              <PeriodicDecisionBlock fault={fault} onUpdate={handleUpdate} currentUser={currentUser} />
              <div className="space-y-2">
                {isEditingDescription && canEdit ? (
                  <textarea
                    autoFocus
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    onBlur={() => {
                      if (tempDescription !== fault.description) {
                        handleUpdate({ description: tempDescription });
                      }
                      setIsEditingDescription(false);
                    }}
                    className="w-full bg-slate-50 rounded-xl p-5 border-2 border-slate-200 text-lg font-medium text-slate-900 leading-relaxed min-h-[120px] focus:outline-none focus:border-brand-lime"
                    placeholder="Pridėkite išsamų aprašymą..."
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (canEdit) {
                        setTempDescription(fault.description || "");
                        setIsEditingDescription(true);
                      }
                    }}
                    className={cn(
                      "bg-slate-100 rounded-xl p-5 border border-slate-200/50 text-lg font-medium text-slate-900 leading-relaxed min-h-[80px] transition-all shadow-sm",
                      canEdit
                        ? "cursor-pointer hover:bg-slate-200/50"
                        : "cursor-default",
                    )}
                  >
                    {fault.description ||
                      (canEdit
                        ? "Spustelėkite, jei norite pridėti aprašymą..."
                        : "Nėra aprašymo")}
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              {fault.status_history && fault.status_history.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 pb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={14} /> Statusų istorija
                  </h3>
                  <div className="space-y-3 px-1">
                    {fault.status_history
                      .map((h, i) => (
                        <div
                          key={`${fault.id}-h-${i}`}
                          className="relative flex gap-3 pb-3 last:pb-0"
                        >
                          {i !== (fault.status_history?.length || 0) - 1 && (
                            <div className="absolute left-1.5 top-5 bottom-0 w-[1px] bg-slate-100" />
                          )}
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full mt-1 border-2 border-white shadow-sm shrink-0 z-10",
                              i === (fault.status_history?.length || 0) - 1
                                ? "bg-brand-lime"
                                : "bg-slate-200",
                            )}
                          />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                                {h.to}
                              </span>
                              {h.from && (
                                <>
                                  <ArrowRight
                                    size={10}
                                    className="text-slate-300 shrink-0"
                                  />
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                    {h.from}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{h.user}</span>
                              <span>•</span>
                              <span>
                                {new Date(h.date).toLocaleString("lt-LT")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                      .reverse()}
                  </div>
                </div>
              )}

              {/* Insights Section */}
              <div className="space-y-3 pt-4 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Lightbulb size={12} /> Patirtys / Kaip sprendėme anksčiau
                  </h3>
                  {(canEdit || canViewWorkflowAnalytics) && (
                    <button
                      onClick={() =>
                        setIsManualInsightOpen(!isManualInsightOpen)
                      }
                      className="text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors uppercase tracking-widest"
                    >
                      + Pridėti patirtį
                    </button>
                  )}
                </div>

                {isManualInsightOpen && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col gap-3 mb-2">
                    <label className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                      Trumpai aprašykite, kas padėjo greitai išspręsti problemą
                    </label>
                    <textarea
                      className="w-full bg-white border border-amber-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y min-h-[80px]"
                      placeholder="Pvz: iš kur gavome detalę greitai..."
                      value={manualInsightText}
                      onChange={(e) => setManualInsightText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsManualInsightOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase"
                      >
                        Atšaukti
                      </button>
                      <button
                        onClick={() => {
                          if (manualInsightText.trim()) {
                            onAddInsight(manualInsightText);
                            setManualInsightText("");
                            setIsManualInsightOpen(false);
                          }
                        }}
                        disabled={!manualInsightText.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold rounded-lg uppercase transition-colors"
                      >
                        Išsaugoti
                      </button>
                    </div>
                  </div>
                )}

                {relevantInsights.length > 0 ? (
                  <div className="bg-amber-50/30 rounded-xl border border-amber-100/50 p-4 mb-2">
                    <ul className="space-y-3">
                      {relevantInsights
                        .slice(0, insightLimit)
                        .map((insight) => (
                          <li
                            key={`insight-${insight.id}`}
                            className="text-sm font-medium text-slate-700 leading-relaxed flex items-start gap-2"
                          >
                            <span className="text-amber-400 mt-1 shrink-0">
                              •
                            </span>
                            <span>{insight.text}</span>
                          </li>
                        ))}
                    </ul>
                    {relevantInsights.length > insightLimit && (
                      <button
                        onClick={() => setInsightLimit((prev) => prev + 3)}
                        className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-4 hover:underline"
                      >
                        Rodyti daugiau ({relevantInsights.length - insightLimit}
                        )
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">
                    Kol kas patirčių šiam gedimui nėra.
                  </p>
                )}
              </div>

              {/* Media */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Camera size={14} /> Nuotraukos ir Video
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {fault.media.length} /{" "}
                    {MEDIA_LIMITS.MAX_IMAGES + MEDIA_LIMITS.MAX_VIDEOS}
                  </span>
                </div>
                <div
                  onPaste={handleMainMediaPaste}
                  onDrop={handleMainMediaDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex flex-wrap gap-3"
                >
                  {(() => {
                    const faultEquipmentId = getFaultEquipmentId(fault);
                    const equipment = faultEquipmentId
                      ? equipmentList.find((e) => e.id === faultEquipmentId)
                      : null;
                    const displayMedia = [...fault.media];

                    // Priority determine for marking "Main"
                    const currentCoverUrl =
                      fault.coverImage ||
                      (fault.category === "EQUIPMENT_FAULT" &&
                      equipment?.image_url
                        ? equipment.image_url
                        : "") ||
                      (fault.category === "FACILITY_FAULT" &&
                      fault.media.length > 0
                        ? fault.media.find((m) => m.type === "image")?.url || ""
                        : "");

                    return (
                      <>
                        {/* Equipment Image as an option */}
                        {equipment?.image_url && (
                          <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden relative group border border-slate-100 shrink-0">
                            <img
                              src={equipment.image_url}
                              className="w-full h-full object-cover opacity-60 grayscale-[50%]"
                              alt="Gamyklinė nuotrauka"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-1 left-1 bg-black/60 text-[7px] text-white px-1 rounded font-black uppercase">
                              Gamyklinė
                            </div>
                            {currentCoverUrl === equipment.image_url && (
                              <div className="absolute top-1 right-1 bg-brand-lime text-[7px] text-black px-1 rounded font-black uppercase shadow-sm">
                                Pagrindinė
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <button
                                onClick={() => onUpdate({ coverImage: "" })} // Setting to empty string resets to default (which is equipment for equipment_fault)
                                className="px-1.5 py-1 bg-white rounded text-[8px] font-black uppercase hover:bg-slate-100"
                              >
                                Nustatyti numatytą
                              </button>
                            </div>
                          </div>
                        )}

                        {fault.media.map((m, i) => (
                          <div
                            key={`${fault.id}-media-item-${m.url}-${i}`}
                            className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden relative group border border-slate-100 shrink-0"
                          >
                            {m.type === "image" ? (
                              m.url ? (
                                <img
                                  src={m.url}
                                  className={cn(
                                    "w-full h-full object-cover",
                                    currentCoverUrl === m.url &&
                                      "ring-2 ring-brand-lime ring-inset",
                                  )}
                                  alt={m.name}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ImageIcon size={20} />
                                </div>
                              )
                            ) : m.url ? (
                              <video
                                src={m.url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Video size={20} />
                              </div>
                            )}

                            {currentCoverUrl === m.url && (
                              <div className="absolute top-1 right-1 bg-brand-lime text-[7px] text-black px-1 rounded font-black uppercase shadow-sm z-10">
                                Pagrindinė
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <div className="flex gap-1">
                                {m.type === "image" &&
                                  m.url &&
                                  currentCoverUrl !== m.url && (
                                    <button
                                      onClick={() =>
                                        onUpdate({ coverImage: m.url })
                                      }
                                      className="p-1 px-1.5 bg-white rounded-md text-[8px] font-black uppercase hover:bg-brand-lime hover:text-black transition-colors"
                                    >
                                      Pagrindinė
                                    </button>
                                  )}
                                <button
                                  onClick={() => window.open(m.url, "_blank")}
                                  className="p-1.5 bg-white rounded-lg text-slate-900 shadow-xl hover:bg-slate-100 transition-colors"
                                >
                                  <Search size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newMedia = fault.media.filter(
                                      (_, idx) => idx !== i,
                                    );
                                    const updates: Partial<Fault> = {
                                      media: newMedia,
                                    };
                                    if (fault.coverImage === m.url) {
                                      updates.coverImage = "";
                                    }
                                    onUpdate(updates);
                                  }}
                                  className="p-1.5 bg-white rounded-lg text-red-500 shadow-xl hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                  {fault.media.length <
                    MEDIA_LIMITS.MAX_IMAGES + MEDIA_LIMITS.MAX_VIDEOS && (
                    <div className="flex items-center gap-2 self-center">
                      <label
                        className="w-9 h-9 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-brand-lime hover:text-brand-lime cursor-pointer transition-all bg-white shrink-0"
                        title="Įkelti failą"
                      >
                        <Upload size={18} />
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              addMedia(fault, files).then(() => {
                                onUpdate({
                                  media: [...fault.media],
                                  coverImage: fault.coverImage,
                                });
                              });
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <label
                        className="w-9 h-9 rounded-xl border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-400 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition-all bg-amber-50/10 shrink-0"
                        title="Kamera"
                      >
                        <Camera size={18} />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              addMedia(fault, files).then(() => {
                                onUpdate({
                                  media: [...fault.media],
                                  coverImage: fault.coverImage,
                                });
                              });
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Review Section */}
              {fault.orderData &&
                fault.orderData.items &&
                fault.orderData.items.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Package size={12} /> Užsakymo prekės (
                      {fault.orderData.items.length})
                    </h3>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/50 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="px-4 py-3">Produktas</th>
                            <th className="px-4 py-3 text-center">
                              Užsakyti (vnt)
                            </th>
                            <th className="px-4 py-3 text-center">Būsena</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fault.orderData.items.map(
                            (item: any, idx: number) => (
                              <tr
                                key={`review-item-${idx}-${item.productName}`}
                                className="bg-white/50 hover:bg-white transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <p className="text-xs font-bold text-slate-900">
                                    {item.productName}
                                  </p>
                                  {item.reasonType && (
                                    <p className="text-[9px] text-amber-600 font-medium">
                                      Priežastis: {item.reasonType}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700 text-sm">
                                  {item.orderQuantity}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    {(
                                      ["OK", "MISSING", "DAMAGED"] as const
                                    ).map((s) => (
                                      <button
                                        key={`review-item-status-${s}-${idx}`}
                                        onClick={() =>
                                          handleUpdateItemStatus(idx, s)
                                        }
                                        className={cn(
                                          "px-2 py-1 rounded text-[9px] font-black uppercase transition-all border",
                                          item.status === s
                                            ? s === "OK"
                                              ? "bg-brand-lime text-black border-brand-lime"
                                              : s === "MISSING"
                                                ? "bg-red-500 text-white border-red-600"
                                                : "bg-brand-lime text-black border-brand-lime"
                                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300",
                                        )}
                                      >
                                        {s === "OK"
                                          ? "Gauta"
                                          : s === "MISSING"
                                            ? "Trūksta"
                                            : "Pažeista"}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Comments Section - Take remaining space */}
              <div className="space-y-4 pt-4 !mb-24">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MessageSquare size={12} /> Komentarai (
                  {fault.comments.length})
                </h3>

                <div className="space-y-8">
                  {parentComments.map((c) => (
                    <div key={`comment-${c.id}`} className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-black shrink-0 shadow-md">
                          {c.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {c.author}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {formatCommentDate(c.createdAt)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "p-4 rounded-2xl rounded-tl-none shadow-sm border group relative",
                              c.system
                                ? "bg-red-50 border-red-100 italic"
                                : "bg-slate-50 border-slate-100",
                              c.deleted && "opacity-50",
                            )}
                          >
                            {c.system && (
                              <div className="text-[8px] font-black uppercase text-red-400 mb-1 tracking-widest">
                                Sistemos pranešimas
                              </div>
                            )}
                            {editingCommentId === c.id ? (
                              <div className="space-y-2">
                                <textarea
                                  autoFocus
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lime/20 resize-none"
                                  defaultValue={c.text}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditComment(
                                        c.id,
                                        e.currentTarget.value,
                                      );
                                    } else if (e.key === "Escape") {
                                      setEditingCommentId(null);
                                    }
                                  }}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
                                  >
                                    Atšaukti
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {highlightMentions(c.text)}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              {c.edited && !c.deleted && (
                                <button
                                  onClick={() =>
                                    setHistoryOpenCommentId(
                                      historyOpenCommentId === c.id
                                        ? null
                                        : c.id,
                                    )
                                  }
                                  className="text-[10px] font-black uppercase text-slate-400 hover:text-brand-lime flex items-center gap-1 transition-colors"
                                >
                                  Redaguota
                                </button>
                              )}
                              {!c.deleted && !editingCommentId && (
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setReplyTo(c.id);
                                      setComment(`@${c.author} `);
                                      textareaRef.current?.focus();
                                    }}
                                    className="text-[10px] font-black uppercase text-slate-400 hover:text-brand-lime flex items-center gap-1 transition-colors"
                                  >
                                    Atsakyti
                                  </button>
                                  {c.author === currentUser.name && (
                                    <>
                                      <button
                                        onClick={() =>
                                          setEditingCommentId(c.id)
                                        }
                                        className="text-[10px] font-black uppercase text-slate-400 hover:text-amber-600 flex items-center gap-1"
                                      >
                                        Redaguoti
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(c.id)
                                        }
                                        className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 flex items-center gap-1"
                                      >
                                        Ištrinti
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <AnimatePresence>
                              {historyOpenCommentId === c.id &&
                                c.history.length > 0 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 pt-3 border-t border-slate-200 space-y-3 overflow-hidden"
                                  >
                                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                                      Redagavimo istorija
                                    </span>
                                    {c.history.map((h, hIdx) => (
                                      <div
                                        key={`history-${c.id}-${h.timestamp}-${hIdx}`}
                                        className="text-[11px] text-slate-500 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50"
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-bold text-slate-400">
                                            {formatCommentDate(h.timestamp)}
                                          </span>
                                        </div>
                                        <p className="italic">"{h.text}"</p>
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Comment Media */}
                            {c.media && c.media.length > 0 && !c.deleted && (
                              <div className="mt-3 grid grid-cols-5 gap-2">
                                {c.media.map((m, mIdx) => (
                                  <div
                                    key={`comment-media-${c.id}-${mIdx}`}
                                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white"
                                  >
                                    {m.type === "image" ? (
                                      <img
                                        src={m.url}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        alt="Comment"
                                        referrerPolicy="no-referrer"
                                        onClick={() => {
                                          window.open(m.url, "_blank");
                                        }}
                                      />
                                    ) : (
                                      <video
                                        src={m.url}
                                        controls
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      <RenderReplies
                        comments={fault.comments}
                        parentId={c.id}
                        onReply={(pId, auth) => {
                          setReplyTo(pId);
                          setComment(`@${auth} `);
                          textareaRef.current?.focus();
                        }}
                        currentUser={currentUser}
                        onEdit={(id) => setEditingCommentId(id)}
                        onDelete={handleDeleteComment}
                        editingCommentId={editingCommentId}
                        handleEditComment={handleEditComment}
                        setEditingCommentId={setEditingCommentId}
                        historyOpenCommentId={historyOpenCommentId}
                        setHistoryOpenCommentId={setHistoryOpenCommentId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Comment Input */}
            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10">
              {replyTo && (
                <div className="flex items-center justify-between mb-2 px-4 py-2 bg-brand-lime/10 rounded-xl border border-brand-lime/20 animate-in slide-in-from-bottom-2">
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-2">
                    <ArrowRight size={12} className="rotate-180" /> Atsakymas į{" "}
                    {fault.comments.find((ch) => ch.id === replyTo)?.author}{" "}
                    komentarą
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-slate-400 hover:text-brand-lime transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-brand-lime/20 focus-within:bg-white transition-all group/input"
              >
                {/* Media Preview */}
                {commentMedia.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 p-2 border-b border-slate-200/50 mb-1">
                    {commentMedia.map((m, idx) => (
                      <div
                        key={`comment-preview-${idx}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm group"
                      >
                        {m.type === "image" ? (
                          <img
                            src={m.url}
                            className="w-full h-full object-cover"
                            alt="Preview"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white relative">
                            <Film size={16} />
                            <div className="absolute inset-x-0 bottom-0 p-0.5 bg-black/40 text-[6px] text-center truncate">
                              Video
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() =>
                            setCommentMedia((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={comment}
                  rows={2}
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 150)}px`;
                  }}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Parašykite komentarą... (Ctrl+V arba tempkite failus čia)"
                  className="w-full px-4 py-3 text-sm focus:outline-none bg-transparent resize-none min-h-[60px] max-h-[150px] overflow-y-auto"
                />
                <div className="flex items-center justify-between p-2">
                  <div className="flex gap-1">
                    <input
                      type="file"
                      ref={commentImageInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        processFiles(files);
                        if (commentImageInputRef.current)
                          commentImageInputRef.current.value = "";
                      }}
                    />
                    <input
                      type="file"
                      ref={commentVideoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processFiles([file]);
                        if (commentVideoInputRef.current)
                          commentVideoInputRef.current.value = "";
                      }}
                    />
                    <button
                      onClick={() => commentImageInputRef.current?.click()}
                      className="p-2 hover:bg-white text-slate-400 rounded-full transition-colors"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      onClick={() => commentVideoInputRef.current?.click()}
                      className="p-2 hover:bg-white text-slate-400 rounded-full transition-colors"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim() && commentMedia.length === 0}
                    className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-200"
                  >
                    Siųsti
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Fallback Close Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto sm:hidden flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full py-4 bg-white border border-slate-200 rounded-3xl text-sm font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <X size={18} />
                Uždaryti langą
              </button>
            </div>
          </motion.div>
          <AnimatePresence>
            {isShortcutsOpen && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60"
                onClick={() => setIsShortcutsOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
                >
                  <div className="p-8 text-slate-900">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                          <LayoutDashboard size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">
                            Klaviatūra
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Spartieji klavišai
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsShortcutsOpen(false)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { k: "E", d: "redaguoti pavadinimą" },
                        { k: "D", d: "redaguoti aprašymą" },
                        { k: "C", d: "komentaras" },
                        { k: "M", d: "keisti statusą" },
                        { k: "V", d: "į Vykdoma" },
                        { k: "S", d: "į Atlikta" },
                        { k: "Esc", d: "uždaryti" },
                      ].map((s) => (
                        <div
                          key={s.k}
                          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            {s.d}
                          </span>
                          <kbd className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-900 min-w-[2.5rem] text-center shadow-sm uppercase">
                            {s.k}
                          </kbd>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setIsShortcutsOpen(false)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                      >
                        Supratau
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

const SLATimer = ({ fault }: { fault: Fault }) => {
  const sla = getRemainingTime(fault);
  const isDelayed =
    sla.overdue &&
    fault.status !== Status.FIXED &&
    fault.status !== Status.REJECTED;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-bold uppercase",
        isDelayed ? "text-red-600" : "text-slate-500",
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isDelayed ? "bg-red-600" : "bg-slate-300",
        )}
      />
      <span>
        {isDelayed ? "SLA viršytas" : "SLA"} ({sla.text})
      </span>
    </div>
  );
};

// --- OPS Dashboard Component ---

const OpsDashboard = ({
  faults: faultsData,
  onActionClick,
  clubs: clubsData,
}: {
  faults: Fault[];
  onActionClick: (filter: "delayed" | "near" | "priority") => void;
  clubs: Club[];
}) => {
  try {
    const faults = faultsData || [];
    const clubs = clubsData || [];

    console.log("OPS DATA:", {
      faults,
      clubs,
    });

    const activeFaults = (faults || []).filter(
      (f) =>
        f &&
        !f.isDeleted &&
        f.status !== Status.FIXED &&
        f.status !== Status.REJECTED,
    );

    const overdueCount = (activeFaults || []).filter(
      (f) => checkSLA(f) === "overdue",
    ).length;
    const warningCount = (activeFaults || []).filter(
      (f) => checkSLA(f) === "warning",
    ).length;
    const newCount = (activeFaults || []).filter(
      (f) => f.status === Status.NEW,
    ).length;

    const topIssues = [...(activeFaults || [])]
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return (
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          );
        }
        const slaA = checkSLA(a);
        const slaB = checkSLA(b);
        if (slaA === "overdue" && slaB !== "overdue") return -1;
        if (slaB === "overdue" && slaA !== "overdue") return 1;
        return 0;
      })
      .slice(0, 5);

    const regions = Array.from(
      new Set((clubs || []).map((c) => c?.region).filter(Boolean)),
    );
    const regionStats = (regions || [])
      .map((region) => {
        const regionClubs = (clubs || [])
          .filter((c) => c && c.region === region)
          .map((c) => c.id);
        const regionFaults = (activeFaults || []).filter(
          (f) => f && regionClubs.includes(f.clubId),
        );
        const regionOverdue = (regionFaults || []).filter(
          (f) => checkSLA(f) === "overdue",
        ).length;
        return {
          name: region,
          count: regionFaults?.length || 0,
          overdue: regionOverdue,
        };
      })
      .sort((a, b) => b.overdue - a.overdue || b.count - a.count);

    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-brand-lime" size={28} />
              OPS Valdymo skydas
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
              Apžvalga ir skubūs veiksmai
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "delayed",
                label: "Vėluojantys",
                value: overdueCount,
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-100",
                icon: AlertCircle,
                filter: "delayed" as const,
              },
              {
                id: "near",
                label: "Artėjantys SLA",
                value: warningCount,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
                icon: Clock,
                filter: "near" as const,
              },
              {
                id: "all",
                label: "Nauji darbai",
                value: newCount,
                color: "text-black",
                bg: "bg-brand-lime/20",
                border: "border-brand-lime/30",
                icon: Plus,
                filter: "all" as const,
              },
            ].map((kpi, idx) => (
              <motion.div
                key={`ops-kpi-${kpi.id}-${idx}`}
                whileHover={{ y: -4 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm flex flex-col gap-4 bg-white",
                  kpi.border,
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      kpi.bg,
                      kpi.color,
                    )}
                  >
                    <kpi.icon size={24} />
                  </div>
                  {kpi.value > 0 && (
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        kpi.bg,
                        kpi.color,
                      )}
                    >
                      SVARBU
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-4xl font-black text-slate-900 leading-none">
                    {kpi.value}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {kpi.label}
                  </div>
                </div>
                <button
                  onClick={() => onActionClick(kpi.filter as any)}
                  className={cn(
                    "mt-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity",
                    kpi.color,
                  )}
                >
                  Peržiūrėti <ArrowRight size={12} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Issues */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Prioritetiniai gedimai
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  TOP 5
                </span>
              </div>
              <div className="divide-y divide-slate-50 flex-1">
                {(topIssues?.length || 0) === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase">
                    Nėra skubių darbų
                  </div>
                ) : (
                  (topIssues || []).map((f, i) => (
                    <div
                      key={`${f.id}-${i}`}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-12 rounded-full",
                            getPriorityColor(f.priority).split(" ")[0],
                          )}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {f.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                              {f.code}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              •{" "}
                              {clubs.find((c) => c && c.id === f.clubId)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PriorityBadge priority={f.priority} />
                        <div
                          className={cn(
                            "text-[9px] font-black uppercase",
                            checkSLA(f) === "overdue"
                              ? "text-red-600"
                              : "text-slate-400",
                          )}
                        >
                          {checkSLA(f) === "overdue" ? "VĖLUOJA" : "SLA OK"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Region Status */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={18} className="text-slate-400" />
                  Regionų aktyvumas
                </h3>
              </div>
              <div className="p-6 flex-1">
                <div className="space-y-6">
                  {(regionStats || []).map((stat, idx) => (
                    <div
                      key={`region-${stat.name}-${idx}`}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                        <span className="text-slate-700">{stat.name}</span>
                        <div className="flex gap-4">
                          <span className="text-slate-400">
                            {stat.count || 0} DARBAI
                          </span>
                          {stat.overdue > 0 && (
                            <span className="text-red-500">
                              {stat.overdue} VĖLUOJA
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${(stat.count || 0) > 0 ? (stat.overdue / stat.count) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="h-full bg-brand-lime"
                          style={{
                            width: `${(stat.count || 0) > 0 ? (((stat.count || 0) - stat.overdue) / stat.count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => onActionClick("priority")}
              className="p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between group hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <div className="text-left">
                <div className="text-lg font-black tracking-tight underline decoration-slate-600 underline-offset-4 decoration-2">
                  Rodyti kritinius
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">
                  Aukščiausio prioriteto darbai
                </p>
              </div>
              <ArrowRight
                size={24}
                className="group-hover:translate-x-2 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("OPS crash:", error);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Duomenys laikinai nepasiekiami
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          Įvyko klaida įkeliant OPS valdymo skydą.
        </p>
      </div>
    );
  }
};

// --- Main Application ---

const QrReportView = ({
  params,
  onClose,
  allTasks,
  currentUser,
  onUpdateTasks,
  workflowTypes,
}: {
  params: { equipment_id?: string; location_id?: string };
  onClose: () => void;
  allTasks: Fault[];
  currentUser: { name: string; id: string };
  onUpdateTasks: (updatedTasks: Fault[]) => void;
  workflowTypes: WorkflowType[];
}) => {
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const equipment = params.equipment_id
    ? equipmentList.find((e) => e.id === params.equipment_id)
    : null;
  const location = params.location_id
    ? facilityLocations.find((l) => l.id === params.location_id)
    : null;

  const existingTask = useMemo(() => {
    const workflow = getQrWorkflow({ ...params, comment: "" }, workflowTypes);
    if (workflow) return findActiveQrAssetTask(allTasks, { ...params, comment: "" }, workflow);
    return null;
  }, [params, allTasks, workflowTypes]);

  const handleSubmit = () => {
    const result = handleQrReport(
      { ...params, comment },
      allTasks,
      currentUser,
      workflowTypes,
    );

    if (result.success) {
      if (result.existingTask) {
        onUpdateTasks(
          allTasks.map((t) =>
            t.id === result.existingTask!.id ? result.existingTask! : t,
          ),
        );
      } else if (result.newTask) {
        onUpdateTasks([result.newTask, ...allTasks]);
      }
      setFeedback({ type: "success", message: result.message });
      setTimeout(() => onClose(), 2000);
    } else {
      setFeedback({ type: "error", message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 sm:bg-slate-900/50">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl p-8 space-y-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-black mx-auto mb-4">
            <Camera size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            QR Pranešimas
          </h2>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700">
            {equipment ? (
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">
                  Treniruoklis
                </p>
                <p className="text-lg">{equipment.name}</p>
                <p className="text-xs text-brand-lime font-bold">
                  ID: {equipment.number}
                </p>
              </div>
            ) : location ? (
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">
                  Vieta
                </p>
                <p className="text-lg">{location.name}</p>
              </div>
            ) : (
              <p className="text-red-500 text-sm">Nežinomas objektas</p>
            )}
          </div>
        </div>

        {existingTask && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
            <AlertTriangle size={20} className="shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-black uppercase tracking-tight text-xs mb-1">
                Šis gedimas jau registruotas
              </p>
              <p className="opacity-80 font-medium leading-tight">
                Pridėkite papildomos informacijos, ji bus išsaugota prie esamo
                gedimo.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">
              Apibūdinkite problemą
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Pvz.: neįsijungia, girgžda, sulinkęs rėmas..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-lime focus:border-transparent transition-all resize-none font-medium text-slate-900"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              (!comment && !existingTask) || feedback?.type === "success"
            }
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-brand-lime/20 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-1"
          >
            {feedback?.type === "success" ? "Pranešimas išsiųstas" : "Pranešti"}
          </button>
        </div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-4 rounded-2xl text-center font-black uppercase tracking-widest text-xs",
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200",
            )}
          >
            {feedback.message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const TaskDetailView = ({
  task,
  onClose,
}: {
  task: Fault;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <header className="bg-white border-b border-slate-200 h-14 sm:h-16 shrink-0 flex items-center px-3 sm:px-4 lg:px-8 justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400">
              Darbo informacija
            </h2>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md">
              {task.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-slate-200">
            #{task.code}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* Main Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <div className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    {formatWorkflowStatusLabel(task.status)}
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {task.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>

            {/* History */}
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-brand-lime sm:size-5" />
                Istorija
              </h3>
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden space-y-2 sm:space-y-4">
                {task.history.map((h, i) => (
                  <div key={h.id} className="flex gap-3 sm:gap-4 relative">
                    {i !== task.history.length - 1 && (
                      <div className="absolute left-3 top-7 bottom-[-16px] w-0.5 bg-slate-50" />
                    )}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    </div>
                    <div className="flex-1 pb-3 sm:pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-900">
                          {h.user}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                        {h.actionType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Klubas
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Building2 size={14} className="text-slate-400" />
                    {task.clubName}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Atsakingas
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <UserIcon size={14} className="text-slate-400" />
                    {typeof (task as any).assignedTo === "string"
                      ? (task as any).assignedTo ||
                        (task as any).assigneeName ||
                        "Nepriskirta"
                      : (task as any).assignedTo?.name ||
                        (task as any).assigneeName ||
                        "Nepriskirta"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Sukurta
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Clock size={14} className="text-slate-400" />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {task.public_url && (
                <div className="pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Vieša nuoroda
                  </span>
                  <code className="bg-slate-50 p-2 rounded-lg text-[10px] font-mono block break-all border border-slate-100">
                    {window.location.origin}
                    {task.public_url}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>


      </main>
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full text-center space-y-6 border border-slate-100">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Įvyko klaida
            </h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Sistema susidūrė su nenumatyta klaida. Prašome perkrauti puslapį.
              Jei klaida kartojasi, susisiekite su administratoriumi.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-lime text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:shadow-xl hover:shadow-brand-lime/20 transition-all active:scale-95"
            >
              Perkrauti sistemą
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: authenticatedUser, logout } = useAuth();
  const currentUser = authenticatedUser!;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  const [isPeriodicExpanded, setIsPeriodicExpanded] = useState(true);
  const [activePeriodicTab, setActivePeriodicTab] = useState<
    | "calendar"
    | "latest"
    | "history"
    | "worklist"
    | "templates"
    | "analytics"
    | "dashboard"
  >("calendar");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [periodicFilter, setPeriodicFilter] = useState<
    "ALL" | "PERIODIC" | "SIMPLE"
  >("ALL");

  const activeModule: string = useMemo(() => {
    return getActiveModuleIdForPath(location.pathname);
  }, [location.pathname]);

  const activeRuntimeModule = useMemo(
    () => getRuntimeModuleForPath(location.pathname),
    [location.pathname],
  );

  const activeComponent = activeRuntimeModule?.component || "DarbaiModule";

  const activeTab: string = useMemo(() => {
    return getActiveTabIdForPath(location.pathname);
  }, [location.pathname]);

  const getAdminModuleTab = (tabId: string) =>
    getAdminTabIdForRouteTab(tabId) || (tabId.replace("admin-", "") as any);

  const navigateToAdminTab = (tab: AdminModuleTabId) =>
    navigate(getAdminTabRoutePath(tab) || "/admin/vartotojai");

  const setAdminRouteTab = (tab: AdminModuleTabId) => {
    const routeTabId = getRouteTabIdForAdminTab(tab);
    if (routeTabId) {
      setActiveTab(routeTabId);
    }
  };

  const setActiveModule = (mod: string) => navigate("/" + mod);
  const setActiveTab = (tab: string) => navigate("/" + tab);

  // Redirect /admin to default tab
  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/vartotojai");
    }
  }, [location.pathname, navigate]);

  // URL Hash Navigation for hidden modules
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "darbai") {
        setActiveModule("darbai");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Handle routing / URL synchronization
  useEffect(() => {
    const currentPath = window.location.pathname;
    const targetPath = getRouteSyncPath(activeTab);
    if (targetPath && !currentPath.includes(targetPath)) {
      window.history.pushState({}, "", targetPath);
    }
  }, [activeTab]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith("/task/")) {
        const id = path.split("/task/")[1];
        setCurrentTaskId(id);
      } else {
        setCurrentTaskId(null);
      }
    };

    checkRoute();
    window.addEventListener("popstate", checkRoute);
    return () => window.removeEventListener("popstate", checkRoute);
  }, []);

  const [workflowTypes, setWorkflowTypes] = useState<WorkflowType[]>(() =>
    loadFromStorage(KEYS.WORKFLOW_TYPES, initialWorkflowTypes),
  );

  const updateWorkflowTypes = (
    updater: React.SetStateAction<WorkflowType[]>,
  ) => {
    setWorkflowTypes((previous) => {
      const next =
        typeof updater === "function" ? updater(previous) : updater;
      return normalizeWorkflowStatusConfig(next, previous);
    });
  };

  useEffect(() => {
    saveToStorage(KEYS.WORKFLOW_TYPES, workflowTypes);
  }, [workflowTypes]);

  const [faults, setFaults] = useState<Fault[]>(() => {
    return applyWorkflowMigration(
      hydrateMockCollection("app_faults", INITIAL_FAULTS),
      getWorkflowTypeByLegacyCategory,
    );
  });

  useEffect(() => {
    writeMockStorage("app_faults", faults);
  }, [faults]);

  const [appSurveys, setAppSurveys] = useState(initialSurveys);
  const [tasks, setTasks] = useState<Fault[]>(() => {
    return applyWorkflowMigration(
      hydrateMockCollection("app_tasks", mockTasks as any),
      getWorkflowTypeByLegacyCategory,
    );
  });

  useEffect(() => {
    writeMockStorage("app_tasks", tasks);
  }, [tasks]);
  const [orders, setOrders] = useState(() =>
    loadFromStorage(KEYS.ORDERS, MOCK_ORDERS),
  );

  useEffect(() => {
    saveToStorage(KEYS.ORDERS, orders);
  }, [orders]);

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [inventorySettings, setInventorySettings] = useState<
    ClubInventorySetting[]
  >(MOCK_INVENTORY_SETTINGS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [appClubs, setAppClubs] = useState<Club[]>(clubs);
  const activeRegistrationClubs = useMemo(
    () => appClubs.filter((club) => club.is_active !== false),
    [appClubs],
  );
  const [appUsers, setAppUsers] = useState<User[]>(() => {
    return hydrateMockCollection("app_users", users, {
      mergeSeed: true,
      getKey: (user) => user.email?.trim().toLowerCase() || user.id,
    });
  });

  useEffect(() => {
    writeMockStorage("app_users", appUsers);
  }, [appUsers]);
  const getScopedAssigneesForClub = (clubId?: string): User[] => {
    const club = appClubs.find((candidate) => candidate.id === clubId);
    return getAssignableUsersForClub(appUsers, club);
  };
  const getDefaultAssigneeForClub = (clubId?: string): User | undefined =>
    getScopedAssigneesForClub(clubId)[0];
  const [appCities, setAppCities] = useState<City[]>(initialCities);
  const [appFacilityTemplates, setAppFacilityTemplates] =
    useState<any[]>(facilityTemplates);
  const [appEquipmentList, setAppEquipmentList] =
    useState<any[]>(equipmentList);

  const [appPeriodicTemplates, setAppPeriodicTemplates] = useState<any[]>(() =>
    hydrateMockCollection("app_periodic_templates", mockPeriodicTemplates as any, {
      mergeSeed: true,
    }),
  );

  useEffect(() => {
    writeMockStorage("app_periodic_templates", appPeriodicTemplates);
  }, [appPeriodicTemplates]);

  const [clubTaskConfigs, setClubTaskConfigs] = useState<any[]>([]);

  // Seed club task configs
  useEffect(() => {
    setClubTaskConfigs((prev) => {
      let changed = false;
      const newConfigs = [...prev];
      const standardTemplates = appPeriodicTemplates.filter(
        (t) =>
          !t.club_id || t.club_id === "global" || t.targetMode === "ALL_CLUBS",
      );

      appClubs.forEach((club) => {
        standardTemplates.forEach((template) => {
          const exists = newConfigs.find(
            (c) => c.club_id === club.id && c.template_id === template.id,
          );
          if (!exists) {
            changed = true;
            newConfigs.push({
              id:
                "conf_" + Date.now() + Math.random().toString(36).substr(2, 9),
              template_id: template.id,
              club_id: club.id,
              name: template.name || template.title,
              description: template.description || "",
              frequency: template.frequency || template.recurrence || "monthly",
              status: "DRAFT",
              reviewed: false,
              modified: false,
            });
          }
        });
      });
      return changed ? newConfigs : prev;
    });
  }, [appClubs, appPeriodicTemplates]);

  const [periodicHistory, setPeriodicHistory] = useState<any[]>(() =>
    loadFromStorage(KEYS.PERIODIC_HISTORY, [...mockPeriodicHistory]),
  );

  useEffect(() => {
    saveToStorage(KEYS.PERIODIC_HISTORY, periodicHistory);
  }, [periodicHistory]);


  const [showQrReport, setShowQrReport] = useState(false);
  const [qrParams, setQrParams] = useState<{
    equipment_id?: string;
    location_id?: string;
  }>({});

  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [facilityInsights, setFacilityInsights] = useState<Insight[]>(
    initialFacilityInsights,
  );
  const [equipmentInsights, setEquipmentInsights] = useState<Insight[]>(
    initialEquipmentInsights,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let equipment_id = params.get("equipment_id");
    const location_id = params.get("location_id");

    // Fallback: search by qr_url if no IDs provided
    if (!equipment_id && !location_id) {
      const currentUrl = window.location.href;
      const foundByUrl = equipmentList.find((e) => e.qr_url === currentUrl);
      if (foundByUrl) {
        equipment_id = foundByUrl.id;
      }
    }

    if (equipment_id || location_id) {
      setQrParams({
        equipment_id: equipment_id || undefined,
        location_id: location_id || undefined,
      });
      setShowQrReport(true);
    }
  }, []);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(
    canManageAllClubs(currentUser)
      ? "ALL"
      : currentUser.region,
  );
  const [clubFilter, setClubFilter] = useState<string[]>([]);
  const [slaFilter, setSlaFilter] = useState("visi");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "QR">("ALL");
  const [quickFilter, setQuickFilter] =
    useState<"all" | "delayed" | "near" | "archive">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [selectedWorkflowTypeIds, setSelectedWorkflowTypeIds] = useState<
    string[]
  >([]);
  const [regStep, setRegStep] = useState<2 | 3>(2);
  const [regType, setRegType] = useState<string>("Darbas");
  const [activeModal, setActiveModal] = useState<
    "home" | "fault" | "other" | null
  >(null);
  const [isEquipmentSearchModalOpen, setIsEquipmentSearchModalOpen] =
    useState(false);
  const [faultTypeSearchQuery, setFaultTypeSearchQuery] = useState("");
  const [isFaultTypeDropdownOpen, setIsFaultTypeDropdownOpen] = useState(false);
  const faultTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState("");

  const adminDB = useMemo(() => {
    // 1. MIETAI, KLUBAI, VARTOTOJAI
    const citiesData = appCities;
    const clubsData = appClubs;
    const usersData = appUsers;
    const regionManagersData = regionManagers;

    // 2. EQUIPMENT: merge from qrMapping and tasks
    const mergedEquipment = [...appEquipmentList];

    // Add from qrMapping
    qrEquipment.forEach((q) => {
      if (
        !mergedEquipment.find((e) => e.id === q.id || e.number === q.number)
      ) {
        mergedEquipment.push({
          id: q.id,
          club_id: q.clubId,
          number: q.number,
          name: q.name,
          zone: "General",
          is_active: true,
        });
      }
    });

    // Extract from tasks
    tasks.forEach((t) => {
      if (
        getFaultEquipmentId(t) &&
        !mergedEquipment.find((e) => e.id === getFaultEquipmentId(t))
      ) {
        const equipmentId = getFaultEquipmentId(t);
        mergedEquipment.push({
          id: equipmentId,
          club_id: t.clubId,
          number: "TBD",
          name: t.title.split(" - ")[0],
          zone: "Unknown",
          is_active: true,
        });
      }
    });

    // 3. FACILITY TEMPLATES: extract from faults and inventoryTemplates
    const extractedFacilityTemplates = [...appFacilityTemplates];
    const uniqueFaultTypes = Array.from(
      new Set((faults || []).map((f) => f && f.type).filter(Boolean)),
    );
    uniqueFaultTypes.forEach((ft) => {
      if (
        ft &&
        !extractedFacilityTemplates.find(
          (t) => t.name.toLowerCase() === ft.toLowerCase(),
        )
      ) {
        extractedFacilityTemplates.push({
          id: `ft-ext-${ft}`,
          name: ft.charAt(0).toUpperCase() + ft.slice(1),
          club_id: null,
          priority: "medium",
          sla_hours: 24,
        });
      }
    });

    // 4. PRODUCTS: inventoryTemplates + products state
    const mergedProducts = [...products];
    inventoryTemplates.forEach((cat) => {
      cat.items.forEach((item) => {
        if (!mergedProducts.find((p) => p.id === item.id)) {
          mergedProducts.push({
            id: item.id,
            name: item.name,
            category: (cat.category === "Smulkus inventorius"
              ? "INVENTORY"
              : cat.category === "Vending prekės"
                ? "VENDING"
                : cat.category === "Vaistinėlė"
                  ? "FIRST_AID_KIT"
                  : "OTHER") as any,
            supplier_id: "s5",
            sku: item.id,
            image_url: item.image,
            target_quantity: item.targetQty,
            is_active: true,
          });
        }
      });
    });

    // 6. SUPPLIERS: extract from inventoryTemplates + suppliers state
    const mergedSuppliers = [...suppliers];
    inventoryTemplates.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.altSupplierUrl) {
          try {
            const domain = new URL(item.altSupplierUrl).hostname.replace(
              "www.",
              "",
            );
            if (
              !mergedSuppliers.find((s) =>
                s.name.toLowerCase().includes(domain.toLowerCase()),
              )
            ) {
              mergedSuppliers.push({
                id: `s-ext-${domain}`,
                name: domain.charAt(0).toUpperCase() + domain.slice(1),
                email: `info@${domain}`,
                is_internal: false,
                requires_approval: true,
              });
            }
          } catch (e) {}
        }
      });
    });

    return {
      cities: citiesData,
      clubs: clubsData,
      users: usersData,
      regionManagers: regionManagersData,
      equipment: mergedEquipment,
      facilityTemplates: extractedFacilityTemplates,
      products: mergedProducts,
      suppliers: mergedSuppliers,
      inventorySettings,
    };
  }, [
    appCities,
    appClubs,
    appUsers,
    appEquipmentList,
    appFacilityTemplates,
    products,
    suppliers,
    inventorySettings,
    tasks,
    faults,
  ]);

  useEffect(() => {
    console.log("ADMIN DB:", adminDB);
  }, [adminDB]);
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);
  const equipmentDropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const mobileCategoryRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        faultTypeDropdownRef.current &&
        !faultTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFaultTypeDropdownOpen(false);
      }
      if (
        equipmentDropdownRef.current &&
        !equipmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEquipmentDropdownOpen(false);
      }
      if (
        mobileCategoryRef.current &&
        !mobileCategoryRef.current.contains(event.target as Node)
      ) {
        setIsMobileCategoryOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFaultTypeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Analytics Date Filter
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  // Modal States
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);
  const [activeFaultId, setActiveFaultId] = useState<string | null>(null);

  // Registration Form State
  const DEFAULT_REG_FORM = {
    title: "",
    clubId: "",
    typeId: "",
    equipmentId: "",
    customEquipmentName: "",
    priority: "medium" as Priority,
    impact: "Netrukdo" as "Negalima naudotis" | "Trukdo" | "Netrukdo",
    isDangerous: false,
    attachments: [] as Attachment[],
    category: undefined as string | undefined,
    workflowTypeId: undefined as string | undefined,
    orderCategory: undefined as ProductCategory | undefined,
    deliveryAddress: "",
    phone: "",
    assigneeId: "" as string,
    coordinatorWarning: false as boolean,
    inventoryData: [] as {
      productId: string;
      addedQty: number;
      orderQty: number;
      reasonType?: string;
      reasonComment?: string;
      isManualOrder?: boolean;
      customName?: string;
    }[],
    printCustomItems: [] as {
      id: string;
      name: string;
      description: string;
      quantity: number;
      attachmentId?: string;
    }[],
  };

  const [regValidationErrors, setRegValidationErrors] = useState<
    Record<string, string>
  >({});
  const [regForm, setRegForm] = useState(DEFAULT_REG_FORM);

  const selectedRegistrationWorkflow = React.useMemo(
    () =>
      workflowTypes.find((workflow) => workflow.id === regForm.workflowTypeId) ||
      null,
    [workflowTypes, regForm.workflowTypeId],
  );
  const getRegistrationAssetType = React.useCallback(
    (workflow?: Pick<WorkflowType, "assetTypeId"> | null) =>
      workflow?.assetTypeId
        ? assetTypes.find((assetType) => assetType.id === workflow.assetTypeId)
        : undefined,
    [],
  );
  const isWorkflowAssetBacked = React.useCallback(
    (workflow?: Pick<WorkflowType, "assetTypeId"> | null) => {
      const assetType = getRegistrationAssetType(workflow);
      return Boolean(
        workflow?.assetTypeId &&
          assetType &&
          (assetType.usesAssets || assetType.usesIssueTypes),
      );
    },
    [getRegistrationAssetType],
  );
  const selectedRegistrationAssetType = React.useMemo(
    () => getRegistrationAssetType(selectedRegistrationWorkflow),
    [getRegistrationAssetType, selectedRegistrationWorkflow],
  );
  const selectedRegistrationAssetTypeId =
    selectedRegistrationAssetType?.id || null;
  const registrationObjectType: WorkflowObjectType =
    selectedRegistrationWorkflow?.objectType || "GENERIC";
  const isEquipmentRegistration = registrationObjectType === "EQUIPMENT";
  const isFacilityRegistration = registrationObjectType === "FACILITY";
  const isOrderRegistration = registrationObjectType === "ORDER";
  const isGenericRegistration = registrationObjectType === "GENERIC";
  const isAssetRegistration = isWorkflowAssetBacked(selectedRegistrationWorkflow);

  const selectedAssetObject = React.useMemo<AssetObject | null>(() => {
    if (!isAssetRegistration || !regForm.equipmentId) return null;
    return (
      getAssetObjectsForAssetType(selectedRegistrationAssetTypeId || "").find(
        (object) => object.id === regForm.equipmentId,
      ) || null
    );
  }, [isAssetRegistration, regForm.equipmentId, selectedRegistrationAssetTypeId]);

  const selectedAssetObjectLegacyId = React.useMemo(() => {
    const legacyId = selectedAssetObject?.metadata?.legacyId;
    return typeof legacyId === "string" ? legacyId : selectedAssetObject?.id;
  }, [selectedAssetObject]);

  const selectedAssetIssueType = React.useMemo<AssetIssueType | null>(() => {
    if (!isAssetRegistration || !selectedRegistrationAssetTypeId) return null;
    return (
      getIssueTypesForAssetType(selectedRegistrationAssetTypeId).find(
        (issueType) => issueType.id === regForm.typeId,
      ) || null
    );
  }, [isAssetRegistration, regForm.typeId, selectedRegistrationAssetTypeId]);

  const currentAdminTemplate = React.useMemo(() => {
    if (selectedAssetIssueType) {
      return {
        id: selectedAssetIssueType.id,
        name: selectedAssetIssueType.name,
        priority: selectedAssetIssueType.priority,
        sla_hours: selectedAssetIssueType.slaHours,
      };
    }
    if (isAssetRegistration) {
      return equipmentIssueTypesList.find((i) => i.id === regForm.typeId);
    }
    return null;
  }, [isAssetRegistration, regForm.typeId, selectedAssetIssueType]);

  const currentSLA = React.useMemo(() => {
    if (regForm.typeId === "other") {
      if (regForm.isDangerous) return 6;
      if (regForm.impact === "Negalima naudotis") return 24;
      if (regForm.impact === "Trukdo") return 72;
      return 168;
    }
    if (selectedAssetIssueType) return selectedAssetIssueType.slaHours;
    const issueType = equipmentIssueTypesList.find(
      (i) => i.id === regForm.typeId,
    );
    if (issueType) return issueType.sla_hours;

    if (isFacilityRegistration) {
      const template = facilityRegistrationObjects.find(
        (t) => t.id === selectedAssetObjectLegacyId,
      );
      if (template) return template.sla_hours;
    }

    return getFaultMeta(regForm.typeId)?.sla || 72;
  }, [regForm, currentAdminTemplate, isFacilityRegistration, selectedAssetIssueType]);

  const displayedIssueTypes = React.useMemo(() => {
    if (isAssetRegistration && selectedRegistrationAssetTypeId) {
      return getIssueTypesForAssetType(selectedRegistrationAssetTypeId);
    }
    if (isFacilityRegistration) {
      return equipmentIssueTypesList.filter(
        (t) =>
          t.applies_to === "FACILITY" ||
          t.applies_to === "BOTH" ||
          !t.applies_to,
      );
    } else if (isEquipmentRegistration) {
      return equipmentIssueTypesList.filter(
        (t) =>
          t.applies_to === "EQUIPMENT" ||
          t.applies_to === "BOTH" ||
          !t.applies_to,
      );
    }
    return faultTypes;
  }, [
    isAssetRegistration,
    selectedRegistrationAssetTypeId,
    isEquipmentRegistration,
    isFacilityRegistration,
  ]);

  const displayedEquipmentOptions = React.useMemo(() => {
    if (isAssetRegistration && selectedRegistrationAssetTypeId) {
      const query = equipmentSearchQuery.toLowerCase();
      const options = getAssetObjectsForAssetType(
        selectedRegistrationAssetTypeId,
      )
        .filter(
          (object) =>
            !object.clubId ||
            object.clubId === regForm.clubId ||
            object.metadata?.legacySource === "facilityTemplates",
        )
        .filter(
          (object) =>
            object.name.toLowerCase().includes(query) ||
            object.code.toLowerCase().includes(query),
        );

      if (isEquipmentRegistration) {
        options.push({
          id: "other",
          assetTypeId: selectedRegistrationAssetTypeId,
          code: "",
          name: "+ Kitas (ne sąraše)",
          active: true,
          clubId: regForm.clubId,
        });
      }

      return options;
    }
    if (isFacilityRegistration) {
      return facilityRegistrationObjects.filter(
        (t) => t.club_id === null || t.club_id === regForm.clubId,
      );
    } else if (isEquipmentRegistration) {
      let options = equipmentList
        .filter((e) => e.club_id === regForm.clubId && e.is_active !== false)
        .filter(
          (e) =>
            e.name.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
            e.number.toLowerCase().includes(equipmentSearchQuery.toLowerCase()),
        );
      options.push({
        id: "other",
        name: "+ Kitas (ne sąraše)",
        number: "",
        club_id: regForm.clubId,
      } as any);
      return options;
    }
    return [];
  }, [
    isEquipmentRegistration,
    isFacilityRegistration,
    isAssetRegistration,
    selectedRegistrationAssetTypeId,
    regForm.clubId,
    equipmentSearchQuery,
  ]);

  // Calculate SLA and Priority
  React.useEffect(() => {
    if (regForm.typeId === "other") {
      let priority: Priority = "medium";
      let sla = 72;

      if (regForm.isDangerous) {
        priority = "critical"; // Represents "A+"
        sla = 6;
      } else {
        switch (regForm.impact) {
          case "Negalima naudotis":
            priority = "high"; // Represents "A"
            sla = 24;
            break;
          case "Trukdo":
            priority = "medium"; // Represents "B"
            sla = 72;
            break;
          case "Netrukdo":
            priority = "low"; // Represents "C"
            sla = 168;
            break;
        }
      }

      if (priority !== regForm.priority) {
        setRegForm((prev) => ({ ...prev, priority }));
      }
    } else if (currentAdminTemplate) {
      if (currentAdminTemplate.priority !== regForm.priority) {
        setRegForm((prev) => ({
          ...prev,
          priority: currentAdminTemplate.priority as Priority,
        }));
      }
    } else if (isFacilityRegistration) {
      const template = facilityRegistrationObjects.find(
        (t) => t.id === selectedAssetObjectLegacyId,
      );
      if (template && template.priority !== regForm.priority) {
        setRegForm((prev) => ({
          ...prev,
          priority: template.priority as Priority,
        }));
      }
    } else if (isEquipmentRegistration) {
      if (regForm.priority !== "medium") {
        setRegForm((prev) => ({ ...prev, priority: "medium" }));
      }
    } else {
      const meta = getFaultMeta(regForm.typeId);
      if (meta && meta.priority !== regForm.priority) {
        setRegForm((prev) => ({
          ...prev,
          priority: meta.priority as Priority,
        }));
      }
    }
  }, [
    regForm.impact,
    regForm.isDangerous,
    regForm.typeId,
    regForm.priority,
    currentAdminTemplate,
    isEquipmentRegistration,
    isFacilityRegistration,
    selectedAssetObjectLegacyId,
  ]);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [commentText, setCommentText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage(KEYS.NOTIFICATIONS, initialNotifications),
  );

  useEffect(() => {
    saveToStorage(KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

  // --- SLA & Priority Logic ---
  React.useEffect(() => {
    const timer = setInterval(() => {
      const newNotifs: { text: string; type: any; faultId: string }[] = [];

      faults.forEach((f) => {
        if (f.status === Status.FIXED || f.status === Status.REJECTED) return;

        const slaStatus = checkSLA(f);
        const hasSlaNotif = notifications.some(
          (n) => (n as any).faultId === f.id && (n as any).type === "sla",
        );
        const hasWarningNotif = notifications.some(
          (n) =>
            (n as any).faultId === f.id &&
            (n as any).type === "priority" &&
            (n as any).text.includes("SLA artėja prie pabaigos"),
        );

        if (slaStatus === "overdue" && !hasSlaNotif) {
          newNotifs.push({
            text: `Darbas ${f.code} viršijo SLA terminą!`,
            type: "sla",
            faultId: f.id,
          });
        } else if (slaStatus === "warning" && !hasWarningNotif) {
          newNotifs.push({
            text: `Darbas ${f.code} SLA artėja prie pabaigos (80%)`,
            type: "priority",
            faultId: f.id,
          });
        }
      });

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          let current = prev;
          newNotifs.forEach((n) => {
            current = addNotification(
              current,
              "Sistema",
              n.text,
              n.type,
              n.faultId,
            );
          });
          return current;
        });
      }
    }, 10000); // Check every 10s
    return () => clearInterval(timer);
  }, [notifications, faults]);

  // --- Helpers ---

  const logAudit = (
    faultId: string,
    action: string,
    description: string,
    changes?: Record<string, { from: any; to: any }>,
    previousState?: string,
    metadata?: any,
  ) => {
    const entry: AuditEntry = createAppAuditEntry({
      faultId,
      user: currentUser.name,
      action,
      description,
      changes,
      previousState,
      metadata,
    });
    setAuditTrail((prev) => [entry, ...prev]);
  };

  const handleGenerateWorks = (clubId: string) => {
    const club = appClubs.find((c) => c.id === clubId);
    if (!club) return;

    const result = generatePeriodicWorksForClub(
      appPeriodicTemplates,
      faults,
      orders,
      club,
      currentUser.name,
      { workflowTypes },
    );

    if (result.newFaults.length > 0 || result.newOrders.length > 0) {
      if (result.newFaults.length > 0) {
        setFaults((prev) => [...result.newFaults, ...prev]);
        result.newFaults.forEach((f) => {
          logAudit(
            f.id,
            "PERIODIC_GENERATED",
            `Automatiškai sugeneruota užduotis: ${f.title}`,
          );
        });
      }
      if (result.newOrders.length > 0) {
        setOrders((prev) => [...result.newOrders, ...prev]);
        result.newOrders.forEach((o) => {
          // Log audit if logAudit supports orders or need order-specific log
          console.log(`Automatiškai sugeneruotas užsakymas: ${o.code}`);
        });
      }
      alert(
        `Sugeneruota ${result.newFaults.length} užduočių ir ${result.newOrders.length} užsakymų klubui ${club.name}.`,
      );
    } else {
      alert(
        `Nėra naujų užduočių generavimui (Iš viso: ${result.totalFound}, jau egzistuoja: ${result.skippedCount}).`,
      );
    }
  };

  // Called after template create/update — generates WorkflowCards immediately
  const handlePeriodicTemplatesChange = (updatedTemplates: any[]) => {
    setAppPeriodicTemplates(updatedTemplates);

    const toGenerate = updatedTemplates.filter(
      (t) => t.isActive !== false && !t.archivedAt && t.destinationWorkflowTypeId,
    );
    if (!toGenerate.length) return;

    const collectedFaults: Fault[] = [];
    const collectedOrders: any[] = [];

    appClubs.forEach((club) => {
      const result = generatePeriodicWorksForClub(
        toGenerate,
        [...faults, ...tasks, ...collectedFaults],
        [...orders, ...collectedOrders] as any[],
        club,
        currentUser.name,
        { workflowTypes },
      );
      collectedFaults.push(...result.newFaults);
      collectedOrders.push(...result.newOrders);
    });

    if (collectedFaults.length > 0) {
      setFaults((prev) => [...collectedFaults, ...prev]);
    }
    if (collectedOrders.length > 0) {
      setOrders((prev) => [...collectedOrders, ...prev]);
    }
  };

  const handleAssign = (faultId: string, userId: string) => {
    const fault: any =
      faults.find((f) => f.id === faultId) ||
      tasks.find((f) => f.id === faultId);
    if (!fault) return;

    const assignedUser = appUsers.find((u) => u.id === userId || u.name === userId);
    if (userId && !assignedUser) return;

    const oldAssigneeId = fault.assigned_to || fault.assigneeId || "Niekas";
    const oldAssigneeName = fault.assigneeName || fault.assignedTo || "Niekas";

    const updates: Partial<Fault> = {
      assigned_to: assignedUser?.id || "",
      assigned_by: currentUser.name,
      assigned_at: Date.now(),
      assigneeId: assignedUser?.id || "",
      assigneeName: assignedUser?.name || "",
      assignedTo: assignedUser?.name || "",
      public_url: `/task/${faultId}`,
    } as any;

    setFaults((prev) =>
      prev.map((f) => (f.id === faultId ? { ...f, ...updates } : f)),
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === faultId ? { ...t, ...updates } : t)),
    );

    logAudit(faultId, "assignment", `Darbas priskirtas: ${assignedUser?.name || "Nepriskirta"}`, {
      assigned_to: { from: oldAssigneeName, to: assignedUser?.name || "Nepriskirta" },
    });

    // Simulated email notification
    if (assignedUser?.email) {
      console.log(`[MOCK EMAIL] To: ${assignedUser.email}`);
      console.log(`[MOCK EMAIL] Subject: Jums priskirtas darbas`);
      console.log(
        `[MOCK EMAIL] Body: Jums priskirtas darbas "${fault.title}". Nuoroda: ${window.location.origin}/task/${faultId}`,
      );
    }
  };

  const openCard = (faultId: string) => {
    const fault = faults.find((f) => f.id === faultId);
    if (fault) {
      setSelectedFault(fault);
      setIsDetailPanelOpen(true);
      setIsNotifOpen(false);
    }
  };

  // --- Handlers ---

  const handleCustomPrintFileUpload = async (file: File, itemIdx: number) => {
    try {
      let processedUrl = URL.createObjectURL(file);
      let type: "image" | "video" | "pdf" = "image";

      if (file.type.startsWith("image/")) {
        const processed = await compressAndResizeImage(file);
        processedUrl = processed.url;
        type = "image";
      } else if (file.type.startsWith("video/")) {
        type = "video";
        processedUrl = URL.createObjectURL(file);
      } else {
        type = "pdf";
        processedUrl = URL.createObjectURL(file);
      }

      const attId = generateId();
      const newAttachment: Attachment = {
        id: attId,
        type: (type === "pdf" ? "image" : type) as any,
        url: processedUrl,
        name: file.name,
        size: file.size,
      };

      setRegForm((prev) => {
        const newItems = [...prev.printCustomItems];
        newItems[itemIdx] = { ...newItems[itemIdx], attachmentId: attId };
        return {
          ...prev,
          attachments: [...prev.attachments, newAttachment],
          printCustomItems: newItems,
        };
      });
    } catch (error) {
      console.error("File upload error:", error);
      alert("Klaida įkeliant failą");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    const newAttachments: Attachment[] = [...regForm.attachments];
    let imageCount = newAttachments.filter((a) => a.type === "image").length;
    let videoCount = newAttachments.filter((a) => a.type === "video").length;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        if (imageCount >= MEDIA_LIMITS.MAX_IMAGES) {
          setUploadError(
            `Maksimalus nuotraukų kiekis: ${MEDIA_LIMITS.MAX_IMAGES}`,
          );
          continue;
        }
        try {
          const processed = await compressAndResizeImage(file);
          newAttachments.push({
            id: generateId(),
            type: "image",
            url: processed.url,
            name: file.name,
            size: file.size,
          });
          imageCount++;
        } catch (error) {
          console.error("Klaida apdorojant nuotrauką:", error);
        }
      } else if (file.type.startsWith("video/")) {
        if (videoCount >= MEDIA_LIMITS.MAX_VIDEOS) {
          setUploadError(
            `Maksimalus vaizdo įrašų kiekis: ${MEDIA_LIMITS.MAX_VIDEOS}`,
          );
          continue;
        }
        if (file.size > MEDIA_LIMITS.VIDEO_MAX_SIZE_MB * 1024 * 1024) {
          setUploadError(
            `Maksimalus video dydis: ${MEDIA_LIMITS.VIDEO_MAX_SIZE_MB}MB`,
          );
          continue;
        }
        newAttachments.push({
          id: generateId(),
          type: "video",
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
        videoCount++;
      } else {
        setUploadError("Galima kelti tik nuotraukas arba video.");
      }
    }

    setRegForm({ ...regForm, attachments: newAttachments });
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setRegForm({
      ...regForm,
      attachments: regForm.attachments.filter((a) => a.id !== id),
    });
  };

  const resetRegForm = () => {
    setRegForm({
      title: "",
      clubId: "",
      typeId: "",
      equipmentId: "",
      customEquipmentName: "",
      priority: "medium",
      impact: "Netrukdo",
      isDangerous: false,
      attachments: [],
      category: undefined,
      workflowTypeId: undefined,
      orderCategory: undefined,
      deliveryAddress: "",
      phone: "",
      assigneeId: "",
      coordinatorWarning: false,
      inventoryData: [] as {
        productId: string;
        addedQty: number;
        orderQty: number;
        reasonType?: string;
        reasonComment?: string;
        isManualOrder?: boolean;
        customName?: string;
      }[],
      printCustomItems: [] as {
        id: string;
        name: string;
        description: string;
        quantity: number;
        attachmentId?: string;
      }[],
    });
    setRegValidationErrors({});
    setRegStep(2);
    setUploadError(null);
  };

  const handleRegister = () => {
    const workflowForCreate = selectedRegistrationWorkflow;
    const workflowTypeIdForCreate = workflowForCreate?.id;
    const createModuleId = getWorkflowCreateModuleId(workflowForCreate);
    const compatibilityCategory =
      getRegistrationCompatibilityCategory(workflowForCreate);

    if (
      !workflowTypeIdForCreate ||
      !canCreateWorkflowCardResolver(
        currentUser,
        workflowTypeIdForCreate,
        createModuleId,
      )
    ) {
      alert("Neturite teisės kurti kortelės šiame workflow.");
      return;
    }

    if (isOrderRegistration && regForm.orderCategory) {
      if (!regForm.clubId) {
        setRegValidationErrors({ clubId: "Pasirinkite sporto klubą" });
        return;
      }

      const clubName =
        CLUBS.find((c) => c.id === regForm.clubId)?.name || regForm.clubId;
      const orderTypeMap: Record<string, string> = {
        INVENTORY: "Smulkus inventorius",
        VENDING: "Vending prekės",
        CLEANING: "Švaros prekės",
        PRINT: "Spauda",
        FIRST_AID_KIT: "Vaistinėlės turinys",
        OTHER: "Kita",
      };

      if (
        ["INVENTORY", "CLEANING", "VENDING", "FIRST_AID_KIT"].includes(regForm.orderCategory)
      ) {
        // Validation: required check if orderQty != addedQty for items with local stock
        // OR required reason if local stock == 0 and orderQty > 0
        const itemsWithIssues = regForm.inventoryData.filter((d) => {
          const isOrdering = d.orderQty > 0;
          if (!isOrdering) return false;

          const product = products.find((p) => p.id === d.productId);
          if (!product) return false;

          const setting = inventorySettings.find(
            (s) => s.club_id === regForm.clubId && s.product_id === d.productId,
          );
          const hasLocalStock =
            (setting?.local_stock || product.local_stock_quantity || 0) > 0;

          // Custom product name validation
          if (product.is_custom && !d.customName?.trim()) return true;

          if (hasLocalStock) {
            // Manual override check
            if (
              d.isManualOrder &&
              d.orderQty !== d.addedQty &&
              !d.reasonComment?.trim()
            )
              return true;
          } else {
            // No local stock check
            if (!product.is_custom && !d.reasonType) return true;
            if (d.reasonType === "Kita" && !d.reasonComment?.trim())
              return true;
          }

          return false;
        });

        if (itemsWithIssues.length > 0) {
          alert(
            "Prašome užpildyti visus privalomus laukus (pavadinimus, priežastis ar komentarus) užsakomoms prekėms.",
          );
          return;
        }

        const itemsToOrder = regForm.inventoryData.filter((d) => {
          const product = products.find((p) => p.id === d.productId);
          if (!product || product.category !== regForm.orderCategory)
            return false;

          return d.orderQty > 0;
        });

        if (itemsToOrder.length === 0) {
          alert("Nėra produktų, kuriuos reikėtų užsakyti.");
          return;
        }

        // Group by supplier
        const itemsBySupplier: Record<string, typeof itemsToOrder> = {};
        itemsToOrder.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          const supplierId = product?.supplier_id || "unassigned";
          if (!itemsBySupplier[supplierId]) itemsBySupplier[supplierId] = [];
          itemsBySupplier[supplierId].push(item);
        });

        const newTasks: Fault[] = [];

        Object.entries(itemsBySupplier).forEach(
          ([supplierId, supplierItems]) => {
            const supplierName =
              SUPPLIERS.find((s) => s.id === supplierId)?.name ||
              "Nežinomas tiekėjas";

            const defaultAssignee = getDefaultAssigneeForClub(regForm.clubId);
            const allItems = supplierItems.map((d) => {
              const product = products.find((p) => p.id === d.productId);
              const setting = inventorySettings.find(
                (s) =>
                  s.club_id === regForm.clubId && s.product_id === d.productId,
              );
              return {
                productId: d.productId,
                productName:
                  product?.is_custom && d.customName
                    ? d.customName
                    : product?.name || "",
                addedQuantity: d.addedQty,
                orderQuantity: d.orderQty,
                reasonType: d.reasonType,
                reasonComment: d.reasonComment,
                targetQuantity: setting
                  ? setting.target_quantity
                  : product?.target_quantity || 0,
                localStockTarget: setting
                  ? setting.local_stock || 0
                  : product?.local_stock_quantity || 0,
                status: "OK",
              };
            });

            const taskId = generateUniqueId("f-ord");
            const newTask: Fault = {
              id: taskId,
              title: `${orderTypeMap[regForm.orderCategory || ""]} - ${supplierName} : ${clubName}`,
              description: `${orderTypeMap[regForm.orderCategory || ""]} (${allItems.length} poz.) - Tiekėjas: ${supplierName}`,
              clubId: regForm.clubId || "",
              clubName: clubName,
              status: "NAUJAS" as any,
              type: "ORDER",
              category: regForm.orderCategory as string,
              workflowTypeId: workflowTypeIdForCreate,
              entityType: "fault",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status_history: createFaultHistory(currentUser.name),
              assigneeId: defaultAssignee?.id || "",
              assigneeName: defaultAssignee?.name || "",
              priority: "medium",
              slaHours: 24,
              assignedTo: defaultAssignee?.name || "",
              comments: [],
              media: [],
              watchers: [],
              rejected: false,
              rejectReason: "",
              updatedBy: currentUser.name,
              code: Math.floor(Math.random() * 900000 + 100000).toString(),
              repeat_count: 0,
              history: [
                {
                  user: currentUser.name,
                  action: "Užsakymas sukurtas",
                  timestamp: Date.now(),
                },
              ],
              source: "USER",
              orderData: {
                orderId: `ORD-${taskId.slice(-6).toUpperCase()}`,
                items: allItems,
                supplier_id: supplierId,
              },
            };
            newTasks.push(newTask);
          },
        );

        setFaults((prev) => [...newTasks, ...prev]);

        // Trigger mock emails
        newTasks.forEach((t) => mockSendEmailToSupplier(t));
      } else if (regForm.orderCategory === "PRINT") {
        if (!regForm.clubId || !regForm.deliveryAddress || !regForm.phone) {
          setRegValidationErrors({
            clubId: !regForm.clubId ? "Privaloma" : "",
            deliveryAddress: !regForm.deliveryAddress ? "Privaloma" : "",
            phone: !regForm.phone ? "Privaloma" : "",
          });
          return;
        }

        const itemsToOrder = regForm.inventoryData.filter((d) => {
          const product = products.find((p) => p.id === d.productId);
          return product && product.category === "PRINT" && d.orderQty > 0;
        });

        const hasCustom = regForm.printCustomItems.length > 0;

        if (itemsToOrder.length === 0 && !hasCustom) {
          alert("Nėra pasirinktų spaudos gaminių.");
          return;
        }

        // In our case, all PRINT items go to the same supplier or internal
        // Let's assume there's one main print supplier for now or handle them as a group
        const supplierId =
          products.find((p) => p.category === "PRINT")?.supplier_id || "s4";
        const supplierName =
          SUPPLIERS.find((s) => s.id === supplierId)?.name || "Spauda";

        const orderItems = itemsToOrder.map((d) => {
          const product = products.find((p) => p.id === d.productId);
          return {
            productId: d.productId,
            productName: product?.name || "",
            orderQuantity: d.orderQty,
            dimensions: product?.dimensions,
            material: product?.material,
            status: "OK",
          };
        });

        // Add custom items
        const customItems = regForm.printCustomItems.map((c) => ({
          productId: "custom",
          productName: c.name,
          orderQuantity: c.quantity,
          description: c.description,
          attachmentId: c.attachmentId,
          isCustom: true,
          status: "OK",
        }));

        const defaultAssignee = getDefaultAssigneeForClub(regForm.clubId);
        const taskId = generateUniqueId("f-ord-print");
        const newTask: Fault = {
          id: taskId,
          title: `Spauda: ${clubName}`,
          description: `Užsakymas iš ${clubName}. Pozicijų skaičius: ${orderItems.length + customItems.length}`,
          clubId: regForm.clubId,
          clubName: clubName,
          status: "NAUJAS" as any,
          type: "ORDER",
          category: "PRINT",
          workflowTypeId: workflowTypeIdForCreate,
          entityType: "fault",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status_history: createFaultHistory(currentUser.name),
          assigneeId: defaultAssignee?.id || "",
          assigneeName: defaultAssignee?.name || "",
          priority: "medium",
          slaHours: 48,
          assignedTo: defaultAssignee?.name || "",
          comments: [],
          media: regForm.attachments.map((a) => ({
            id: a.id,
            type: "image",
            url: a.url,
            name: a.name,
          })),
          watchers: [],
          rejected: false,
          rejectReason: "",
          updatedBy: currentUser.name,
          code: Math.floor(Math.random() * 900000 + 100000).toString(),
          repeat_count: 0,
          history: [
            {
              user: currentUser.name,
              action: "Spaudos užsakymas sukurtas",
              timestamp: Date.now(),
            },
          ],
          source: "USER",
          orderData: {
            orderId: `PRINT-${taskId.slice(-6).toUpperCase()}`,
            items: [...orderItems, ...customItems] as any,
            supplier_id: supplierId,
            deliveryAddress: regForm.deliveryAddress,
            phone: regForm.phone,
          },
        };
        setFaults((prev) => [newTask, ...prev]);
        mockSendEmailToSupplier(newTask);
      } else if (regForm.orderCategory === "OTHER") {
        if (!regForm.title.trim()) {
          setRegValidationErrors({ title: "Įveskite užsakymo aprašymą" });
          return;
        }
        const defaultAssignee = getDefaultAssigneeForClub(regForm.clubId);
        const newTask: Fault = {
          id: generateUniqueId("f-ord-other"),
          title: `Kitas užsakymas: ${clubName}`,
          description: regForm.title,
          clubId: regForm.clubId,
          clubName: clubName,
          status: "NAUJAS" as any,
          type: "ORDER",
          category: "OTHER",
          workflowTypeId: workflowTypeIdForCreate,
          entityType: "fault",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status_history: createFaultHistory(currentUser.name),
          assigneeId: defaultAssignee?.id || "",
          assigneeName: defaultAssignee?.name || "",
          priority: "medium",
          slaHours: 72,
          assignedTo: defaultAssignee?.name || "",
          comments: [],
          media: [],
          watchers: [],
          rejected: false,
          rejectReason: "",
          updatedBy: currentUser.name,
          code: Math.floor(Math.random() * 900000 + 100000).toString(),
          repeat_count: 0,
          history: [],
          source: "USER",
        };
        setFaults((prev) => [newTask, ...prev]);
      }

      setActiveModal(null);
      setRegStep(2);
      return;
    }

    // Detailed Validation
    const errors: Record<string, string> = {};

    if (!regForm.clubId) {
      errors.clubId = "Pasirinkite sporto klubą";
    }

    if (isFacilityRegistration) {
      if (!regForm.equipmentId) errors.equipmentId = "Pasirinkite objektą";
    } else if (isEquipmentRegistration) {
      if (!regForm.equipmentId) {
        errors.equipmentId = "Pasirinkite objektą";
      } else if (
        regForm.equipmentId === "other" &&
        !regForm.customEquipmentName.trim()
      ) {
        errors.customEquipmentName = "Įveskite pavadinimą";
      }
    }

    if (isAssetRegistration && !regForm.typeId) {
      errors.typeId = "Pasirinkite gedimo tipą";
    }

    if (!regForm.title.trim()) {
      errors.title = "Įveskite darbo aprašymą";
    }

    const canBypassCoordinatorWarning = workflowTypeIdForCreate
      ? canCreateWorkflowCardResolver(
          currentUser,
          workflowTypeIdForCreate,
          createModuleId,
        )
      : false;

    if (regForm.coordinatorWarning && !canBypassCoordinatorWarning) {
      errors.clubId =
        "Šiam klubui nepriskirtas koordinatorius. Kreipkitės į OPS.";
    }

    if (Object.keys(errors).length > 0) {
      setRegValidationErrors(errors);
      return;
    }

    setRegValidationErrors({});

    const manualEquipmentId =
      isEquipmentRegistration && regForm.equipmentId !== "other"
        ? selectedAssetObjectLegacyId
        : undefined;
    const existingEquipmentFault = findActiveEquipmentFault(
      faults,
      manualEquipmentId,
    );
    const manualFacilityAssetObjectId =
      isFacilityRegistration && selectedAssetObject
        ? selectedAssetObject.id
        : undefined;
    const existingFacilityFault = findActiveFacilityFault(
      faults,
      manualFacilityAssetObjectId,
      workflowTypeIdForCreate,
    );
    const existingActiveFault = existingEquipmentFault || existingFacilityFault;

    if (existingActiveFault) {
      const now = Date.now();
      const systemComment: FaultComment = {
        id: generateUniqueId("c"),
        text: `Additional report received via manual registration\n\n${regForm.title.trim()}`,
        author: "SISTEMA",
        createdAt: now,
        mentions: [],
        parentId: null,
        system: true,
        edited: false,
        history: [],
        deleted: false,
        source: "USER",
      };
      const updatedExistingFault: Fault = {
        ...existingActiveFault,
        comments: [...(existingActiveFault.comments || []), systemComment],
        repeat_count: (existingActiveFault.repeat_count || 0) + 1,
        updatedAt: now,
        updated_at: new Date(now).toISOString(),
        updatedBy: currentUser.name,
      };

      setFaults((prev) =>
        prev.map((fault) =>
          fault.id === updatedExistingFault.id ? updatedExistingFault : fault,
        ),
      );
      setNotifications((prev) =>
        addNotification(
          prev,
          currentUser.name,
          "Active fault already exists. Information added to existing fault.",
          "normal",
          updatedExistingFault.id,
        ),
      );
      logAudit(
        updatedExistingFault.id,
        "COMMENT_ADDED",
        "Additional manual asset report added to existing fault",
      );
      setSelectedFault(updatedExistingFault);
      setIsDetailPanelOpen(true);
      setActiveModal(null);
      setRegStep(2);
      setUploadError(null);
      setRegValidationErrors({});
      resetRegForm();
      return;
    }

    const isOther = isGenericRegistration || regForm.typeId === "other";

    const firstImage = regForm.attachments.find((a) => a.type === "image");
    const club = CLUBS.find((c) => c.id === regForm.clubId);

    let finalTitle = isOther ? regForm.title : "";
    let finalSla = 72;
    let finalPriority: Priority = "medium";
    let typeIdForMeta = regForm.typeId;

    if (isOther) {
      if (regForm.isDangerous) finalSla = 6;
      else if (regForm.impact === "Negalima naudotis") finalSla = 24;
      else if (regForm.impact === "Trukdo") finalSla = 72;
      else if (regForm.impact === "Netrukdo") finalSla = 168;

      finalPriority = regForm.priority;
    } else if (isAssetRegistration) {
      let objectName = "Nenurodytas objektas";
      if (regForm.equipmentId === "other") {
        objectName = regForm.customEquipmentName || "Kitas objektas";
      } else if (selectedAssetObject) {
        objectName = selectedAssetObject.name;
      }

      finalTitle = objectName;
      if (selectedAssetIssueType) {
        finalSla = selectedAssetIssueType.slaHours;
        finalPriority = selectedAssetIssueType.priority as Priority;
      } else if (currentAdminTemplate) {
        finalSla = currentAdminTemplate.sla_hours;
        finalPriority = currentAdminTemplate.priority as Priority;
      } else if (isEquipmentRegistration) {
        finalSla = 72;
        finalPriority = "medium";
      } else {
        finalSla = 72;
        finalPriority = "medium";
      }
    } else {
      const meta = getFaultMeta(regForm.typeId);
      if (meta) {
        finalTitle = meta.name;
        finalSla = meta.sla;
        finalPriority = meta.priority as Priority;
      }
    }

    const meta = getFaultMeta(typeIdForMeta);
    let finalSopUrl = meta?.sopUrl || null;
    let finalSopStatus: "EXISTS" | "MISSING" | "NEEDS_UPDATE" = meta?.sopUrl
      ? "EXISTS"
      : "MISSING";

    if (selectedAssetIssueType?.sopUrl) {
      finalSopUrl = selectedAssetIssueType.sopUrl;
      finalSopStatus = "EXISTS";
    }

    if (isFacilityRegistration) {
      const template = facilityRegistrationObjects.find(
        (t) => t.id === selectedAssetObjectLegacyId,
      );
      if (template?.sop_url) {
        finalSopUrl = template.sop_url;
        finalSopStatus = "EXISTS";
      }
    }

    const defaultAssignee = getDefaultAssigneeForClub(regForm.clubId);
    const selectedFacilityObject = isFacilityRegistration
      ? facilityRegistrationObjects.find((t) => t.id === selectedAssetObjectLegacyId)
      : undefined;

    const newFault: Fault = {
      id: generateUniqueId("f"),
      code: generateId(),
      title: finalTitle,
      clubId: regForm.clubId,
      clubName: club?.name || "Klubas",
      status: Status.NEW,
      entityType: "fault",
      source: "USER",
      slaHours: finalSla,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: createFaultHistory(currentUser.name),
      description: isOther ? "" : regForm.title,
      assignedTo: defaultAssignee
        ? {
            id: defaultAssignee.id,
            name: defaultAssignee.name,
            role: defaultAssignee.role,
          }
        : "",
      assigneeId: defaultAssignee?.id || "",
      assigneeName: defaultAssignee?.name || "",
      comments: [],
      media: regForm.attachments.map((a) => ({
        type: a.type,
        url: a.url,
        name: a.name,
      })),
      watchers:
        finalPriority === "critical" || finalPriority === "high"
          ? [{ userId: currentUser.name, mode: "all" }]
          : [],
      rejected: false,
      rejectReason: "",
      updatedBy: currentUser.name,
      type: compatibilityCategory,
      priority: finalPriority,
      coverImage:
        isFacilityRegistration
          ? firstImage
            ? firstImage.url
            : ""
          : "",
      history: [],
      sopUrl: finalSopUrl,
      sopStatus: finalSopStatus,
      category: compatibilityCategory,
      workflowTypeId: workflowTypeIdForCreate,
      region: club?.city,
      typeId: regForm.typeId, // Legacy mapping
      assetObjectId:
        regForm.equipmentId !== "other"
          ? selectedAssetObject?.id
          : undefined,
      ...getEquipmentIdentityFields(
        isEquipmentRegistration &&
          regForm.equipmentId !== "other"
          ? selectedAssetObjectLegacyId
          : undefined,
      ),
      customEquipmentName:
        isEquipmentRegistration &&
        regForm.equipmentId === "other"
          ? regForm.customEquipmentName
          : undefined,
      ...getFacilityIdentityFields(
        isFacilityRegistration ? selectedAssetObjectLegacyId : undefined,
        { isLocation: Boolean(selectedFacilityObject?.locationId) },
      ),
      issue_type_id: isAssetRegistration ? regForm.typeId : undefined,
    } as Fault & {
      region?: string;
      equipmentId?: string;
      customEquipmentName?: string;
    };

    setFaults([newFault, ...faults]);
    logAudit(newFault.id, "created", "Užregistruotas naujas gedimas");
    setActiveModal(null);
    setRegStep(2);
    setUploadError(null);
    setRegValidationErrors({});
    resetRegForm();
  };

  const mockSendEmailToSupplier = (task: Fault) => {
    if (!task.orderData || !task.orderData.supplier_id) return;
    const supplier = SUPPLIERS.find(
      (s) => s.id === task.orderData!.supplier_id,
    );
    if (!supplier) return;

    const itemsList = task.orderData.items
      .map((item: any) => `- ${item.productName}: ${item.orderQuantity} vnt.`)
      .join("\n");

    const emailContent = `
Tiekėjui: ${supplier.name} (${supplier.email})
Užsakymo ID: ${task.orderData.orderId}
Klubas: ${task.clubName}

Užsakomos prekės:
${itemsList}

Pagarbiai,
${task.updatedBy}
    `;

    console.log(
      "%c MOCK EMAIL SENT TO SUPPLIER ",
      "background: #222; color: #bada55",
      emailContent,
    );

    // Add system comment
    const systemComment: FaultComment = {
      id: generateUniqueId("sys"),
      text: `Automatinis el. laiškas išsiųstas tiekėjui ${supplier.name} (${supplier.email})`,
      author: "SISTEMA",
      createdAt: Date.now(),
      system: true,
      mentions: [],
      edited: false,
      history: [],
      deleted: false,
    };

    setFaults((prev) =>
      prev.map((f) => {
        if (f.id === task.id) {
          return { ...f, comments: [systemComment, ...f.comments] } as Fault;
        }
        return f;
      }),
    );
  };

  const moveForward = (id: string) => {
    const fault = faults.find((f) => f.id === id);
    if (!fault) return;

    if (fault.status === Status.NEW) {
      updateFault(id, { status: Status.IN_PROGRESS });
    } else if (fault.status === Status.IN_PROGRESS) {
      updateFault(id, { status: Status.WAITING_DETAILS });
    } else if (fault.status === Status.WAITING_DETAILS) {
      setActiveFaultId(id);
      setIsClosureModalOpen(true);
    }
  };

  const updateFault = (id: string, updates: Partial<Fault>) => {
    let error: string | null = null;
    const updatedAt = Date.now();
    const updatedBy = currentUser.name;

    const mapper = (f: Fault) => {
      if (f.id === id) {
        // Validation
        if (updates.status && updates.status !== f.status) {
          try {
            validateStatusChange({ ...f, ...updates }, updates.status);
          } catch (err: any) {
            error = err.message;
            return f;
          }
        }

        const changes: Record<string, { from: any; to: any }> = {};
        Object.keys(updates).forEach((key) => {
          const k = key as keyof Fault;
          if (updates[k] !== f[k]) {
            changes[key] = { from: f[k], to: updates[k] };
          }
        });

        if (Object.keys(changes).length > 0) {
          logAudit(
            id,
            updates.isDeleted ? "deleted" : "updated",
            updates.isDeleted
              ? "Gedimas ištrintas (soft delete)"
              : "Pakeista informacija",
            changes,
            JSON.stringify(f),
          );
        }

        // Watcher notifications
        f.watchers.forEach((w) => {
          if (w.userId !== currentUser.name) {
            const isTerminal =
              updates.status === Status.FIXED ||
              updates.status === Status.REJECTED;
            const statusChanged = updates.status && updates.status !== f.status;

            if (w.mode === "all") {
              if (statusChanged) {
                setNotifications((prev) =>
                  addNotification(
                    prev,
                    currentUser.name,
                    `Darbo ${f.code} statusas pakeistas į: ${updates.status}`,
                    "priority",
                    f.id,
                  ),
                );
              } else if (Object.keys(changes).length > 0) {
                setNotifications((prev) =>
                  addNotification(
                    prev,
                    currentUser.name,
                    `Darbas ${f.code} buvo atnaujintas`,
                    "normal",
                    f.id,
                  ),
                );
              }
            } else if (w.mode === "done_only" && isTerminal && statusChanged) {
              setNotifications((prev) =>
                addNotification(
                  prev,
                  currentUser.name,
                  `Darbas ${f.code} užbaigtas: ${updates.status}`,
                  "priority",
                  f.id,
                ),
              );
            }
          }
        });

        if (updates.status === Status.FIXED && f.status !== Status.FIXED) {
          setNotifications((prev) =>
            addNotification(
              prev,
              currentUser.name,
              `Darbas ${f.code} sutvarkytas!`,
              "priority",
              f.id,
            ),
          );
        }

        // Apply kanban logic if status changed
        if (updates.status && updates.status !== f.status) {
          moveFault(f, updates.status, currentUser.name);
        }

        return { ...f, ...updates, updatedAt, updatedBy };
      }
      return f;
    };

    setFaults((prev) => prev.map(mapper));
    setTasks((prev) => prev.map(mapper));

    if (error) alert(error);
  };

  const handleRestoreArchivedCard = (id: string) => {
    const now = Date.now();
    const restoreMapper = (item: Fault): Fault => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: Status.NEW,
        archivedAt: undefined,
        archivedBy: undefined,
        archiveReason: undefined,
        updatedAt: now,
        updatedBy: currentUser.name,
        history: [
          {
            id: generateUniqueId("h"),
            timestamp: now,
            user: currentUser.name,
            actionType: "RESTORED_FROM_ARCHIVE",
            reason: "Kortelė atstatyta iš archyvo",
          },
          ...(item.history || []),
        ],
      };
    };

    setFaults((prev) => prev.map(restoreMapper));
    setTasks((prev) => prev.map(restoreMapper));
    setSelectedFault((prev) =>
      prev && prev.id === id ? restoreMapper(prev) : prev,
    );
    logAudit(
      id,
      "RESTORED_FROM_ARCHIVE",
      "Kortelė atstatyta iš archyvo",
    );
  };

  const handleRollback = (auditId: string) => {
    const entry = auditTrail.find((a) => a.id === auditId);
    if (!entry || !entry.previousState) return;

    const oldState = JSON.parse(entry.previousState) as Fault;
    setFaults((prev) => prev.map((f) => (f.id === oldState.id ? oldState : f)));

    logAudit(
      oldState.id,
      "rollback",
      `Atstatyta versija iš ${new Date(entry.timestamp).toLocaleString()}`,
      undefined,
      undefined,
    );
  };

  const handleExport = () => {
    // Sheet 1: All faults in period
    const start = new Date(dateFrom).getTime();
    const end = new Date(dateTo).getTime() + 86400000;

    const exportData = filteredEntities
      .filter((f) => f.createdAt >= start && f.createdAt <= end)
      .map((f) => {
        const sla = getRemainingTime(f);
        return {
          Data: new Date(f.createdAt).toLocaleDateString(),
          Klubas: CLUBS.find((c) => c.id === f.clubId)?.name || "Nežinoma",
          Tipas: f.type,
          Statusas: f.status,
          Prioritetas: f.priority,
          "SLA Būklė": sla.text,
          "Ar vėluoja": sla.overdue ? "Taip" : "Ne",
        };
      });

    // Sheet 2: Summary
    const stats = {
      "Laikotarpio pradžia": dateFrom,
      "Laikotarpio pabaiga": dateTo,
      "Bendras gedimų kiekis": analyticsData.stats.total,
      "Vėluojantys gedimai": analyticsData.stats.delayed,
      "SLA Laikymasis (%)": analyticsData.stats.slaCompliance,
      "Vid. sprendimo laikas (val.)": analyticsData.stats.avgResolutionTime,
      "Laukia detalių (vnt.)":
        analyticsData.stats.waitingDetailsMetrics.currentCount,
      "Laukia detalių (%)":
        analyticsData.stats.waitingDetailsMetrics.percentage,
      "Vidutinė trukmė laukiant (d.)":
        analyticsData.stats.waitingDetailsMetrics.avgDays,
      "Pasikartojantys gedimai": analyticsData.stats.recurring,
      "Dažniausias gedimo tipas": analyticsData.stats.mostCommon,
    };

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(exportData);
    const ws2 = XLSX.utils.json_to_sheet([stats]);

    XLSX.utils.book_append_sheet(wb, ws1, "Visi gedimai");
    XLSX.utils.book_append_sheet(wb, ws2, "Suvestinė");

    XLSX.writeFile(wb, `Gedimu_Ataskaita_${dateFrom}_${dateTo}.xlsx`);
  };

  const handleSopDecision = (decision: "NONE" | "CREATE" | "UPDATE") => {
    if (!activeFaultId) return;

    const id = activeFaultId;
    const newTasks: Fault[] = [];
    const faultUpdates: Record<string, Partial<Fault>> = {};
    const notifsToAdd: { text: string; type: any; faultId: string }[] = [];

    const f = faults.find((x) => x.id === id);
    if (f) {
      const newStatus = Status.FIXED;
      let createdTaskId = f.createdTaskId;

      if (decision !== "NONE") {
        const titlePrefix =
          decision === "CREATE" ? "Sukurti SOP" : "Atnaujinti SOP";

        const newTask: Fault = {
          id: generateUniqueId("t-"),
          title: `${titlePrefix} – ${f.title}`,
          description:
            decision === "CREATE"
              ? "Sukurti SOP pagal pasikartojantį gedimą"
              : "Atnaujinti SOP pagal šį gedimą",
          type: "SOP",
          entityType: "sop",
          status: Status.NEW,
          slaHours: 72,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          relatedFaultId: f.id,
          clubId: f.clubId,
          clubName: CLUBS.find((c) => c.id === f.clubId)?.name || "Klubas",
          priority: f.priority,
          assigneeName: "Operacijų vadovas",
          assigneeId: "ops_1",
          assignedTo: "Operacijų vadovas",
          comments: [],
          watchers: [],
          media: [],
          code: generateId(),
          history: [],
          rejected: false,
          rejectReason: "",
          updatedBy: currentUser.name,
        };

        newTasks.push(newTask);
        createdTaskId = newTask.id;

        logAudit(
          f.id,
          "SOP_TASK_CREATED",
          `Sukurta SOP užduotis (${newTask.type})`,
          undefined,
          JSON.stringify(f),
          { taskId: newTask.id },
        );
      }

      notifsToAdd.push({
        text: `Darbas ${f.code} sutvarkytas!`,
        type: "priority",
        faultId: f.id,
      });

      logAudit(
        f.id,
        "MOVED_TO_DONE",
        `Darbas pažymėtas kaip sutvarkytas. SOP sprendimas: ${decision}`,
        { status: { from: f.status, to: newStatus } },
        JSON.stringify(f),
      );

      faultUpdates[f.id] = {
        status: newStatus,
        isRecurring: decision !== "NONE",
        createdTaskId,
        closedAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: currentUser.name,
      };
    }

    if (newTasks.length > 0) setTasks((prev) => [...newTasks, ...prev]);

    if (notifsToAdd.length > 0) {
      setNotifications((prev) => {
        let current = prev;
        notifsToAdd.forEach((n) => {
          current = addNotification(
            current,
            currentUser.name,
            n.text,
            n.type,
            n.faultId,
          );
        });
        return current;
      });
    }

    setFaults((prev) =>
      prev.map((f) =>
        faultUpdates[f.id] ? { ...f, ...faultUpdates[f.id] } : f,
      ),
    );

    setIsSopModalOpen(false);
    setActiveFaultId(null);
  };

  const handleClosure = (isRecurring: boolean) => {
    if (!activeFaultId) return;
    const fault = faults.find((f) => f.id === activeFaultId);
    if (!fault) return;

    // Simplified to redirect to SOP modal for unified logic
    setIsClosureModalOpen(false);
    setIsInsightModalOpen(true);
  };

  const handleWaitingDetailsSubmit = (data: {
    nextAction: string;
    dueDate: string;
    reason: string;
  }) => {
    if (!activeFaultId) return;

    const id = activeFaultId;
    const faultUpdates: Record<string, Partial<Fault>> = {};

    const f = faults.find((x) => x.id === id);
    if (f) {
      const isFirstTime = f.status !== Status.WAITING_DETAILS;
      const newSla = new Date(data.dueDate).getTime();
      const extensionCount = (f.slaExtensionCount || 0) + (isFirstTime ? 0 : 1);

      const actionType = isFirstTime
        ? "MOVED_TO_WAITING_DETAILS"
        : "SLA_EXTENDED";
      let msg = isFirstTime
        ? `Gedimas perkeltas į „Laukiama“. Naujas SLA terminas: ${data.dueDate}. Sekantis veiksmas: ${data.nextAction}.`
        : `SLA pratęstas iki ${data.dueDate}.`;

      if (data.reason) {
        msg += ` Priežastis: ${data.reason}`;
      }

      logAudit(
        id,
        actionType,
        msg,
        {
          status: { from: f.status, to: Status.WAITING_DETAILS },
          slaDeadline: {
            from: getSlaDeadline(f),
            to: new Date(data.dueDate).getTime(),
          },
        },
        JSON.stringify(f),
        {
          reason: data.reason,
          newSla: new Date(data.dueDate).getTime(),
          nextAction: isFirstTime
            ? data.nextAction
            : f.nextAction?.text || "SLA Pratęsimas",
          actionType,
        },
      );

      addComment(f, {
        text: msg,
        author: currentUser.name,
      });

      faultUpdates[f.id] = {
        status: Status.WAITING_DETAILS,
        slaDeadline: newSla,
        waitingDetailsReason: data.reason,
        slaExtensionCount: extensionCount,
        nextAction: isFirstTime
          ? {
              text: data.nextAction,
              dueDate: data.dueDate,
            }
          : f.nextAction
            ? {
                ...f.nextAction,
                dueDate: data.dueDate,
              }
            : {
                text: "Nenurodyta",
                dueDate: data.dueDate,
              },
        updatedAt: Date.now(),
        updatedBy: currentUser.name,
      };
    }

    setFaults((prev) =>
      prev.map((f) =>
        faultUpdates[f.id] ? { ...f, ...faultUpdates[f.id] } : f,
      ),
    );

    setIsWaitingModalOpen(false);
    setActiveFaultId(null);
  };

  const handleInsightSubmit = (text: string) => {
    const fault = activeFaultId
      ? faults.find((f) => f.id === activeFaultId)
      : null;
    if (fault && text.trim()) {
      if (fault.category === "FACILITY_FAULT" && fault.typeId) {
        setFacilityInsights((prev) => [
          ...prev,
          {
            id: generateUniqueId("fi"),
            targetId: fault.typeId!,
            targetType: "FACILITY",
            text,
            createdAt: Date.now(),
            createdBy: currentUser.name,
          },
        ]);
      } else if (fault.category === "EQUIPMENT_FAULT") {
        const targetId = fault.typeId || getFaultEquipmentId(fault);
        if (targetId) {
          setEquipmentInsights((prev) => [
            ...prev,
            {
              id: generateUniqueId("ei"),
              targetId,
              targetType: fault.typeId ? "EQUIPMENT_ISSUE" : "EQUIPMENT",
              text,
              createdAt: Date.now(),
              createdBy: currentUser.name,
            },
          ]);
        }
      }
    }
  };

  const handleConvertToTask = (_mode: ConversionMode) => {
    if (!activeFaultId) return;
    const f = faults.find((x) => x.id === activeFaultId);
    if (!f) return;

    const projectOwner = getDefaultAssigneeForClub(f.clubId) || currentUser;

    const now = Date.now();
    const newProject: Fault = {
      ...f,
      id: "p" + now,
      entityType: "project" as any,
      status: Status.NEW,
      type: "PROJECT" as any,
      assignedTo: projectOwner.name,
      assigneeId: projectOwner.id,
      assigneeName: projectOwner.name,
      code: "P-" + Math.floor(Math.random() * 1000 + 100),
      createdAt: now,
      updatedAt: now,
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
      converted_to_task_id: undefined,
      converted_at: undefined,
      converted_by: undefined,
      source_task_id: f.id,
      status_history: [
        {
          from: f.status ?? null,
          to: Status.NEW,
          date: new Date(now).toISOString(),
          user: currentUser.name,
        },
      ],
      history: [
        {
          id: "h" + now,
          timestamp: now,
          user: currentUser.name,
          actionType: "CONVERTED_FROM_FAULT",
          reason: `Sukurta iš darbo ${f.code}`,
        },
      ],
      comments: [],
    };

    const updatedSource: Fault = {
      ...f,
      status: Status.MOVED,
      converted_to_task_id: newProject.id,
      converted_at: now,
      converted_by: currentUser.name,
      updatedAt: now,
      updatedBy: currentUser.name,
      history: [
        ...f.history,
        {
          id: "h" + (now + 1),
          timestamp: now + 1,
          user: currentUser.name,
          actionType: "MOVED_TO_TASKS",
          reason: "Perkelta į projektus (Darbai kanban)",
        },
      ],
    };

    // Single atomic update: replace source AND prepend new project
    setFaults((prev) => [
      newProject,
      ...prev.map((item) => (item.id === updatedSource.id ? updatedSource : item)),
    ]);

    logAudit(
      f.id,
      "CONVERTED_TO_TASK",
      `Darbas inicijuotas kaip projektas Darbai kanban`,
      undefined,
      JSON.stringify(f),
      { newProjectId: newProject.id },
    );

    addNotification(
      notifications,
      currentUser.name,
      `Darbas ${f.code} sėkmingai inicijuotas kaip projektas`,
      "normal",
      f.id,
    );

    setIsConversionModalOpen(false);
    setSelectedFault(updatedSource);
  };

  const handleReturnToDarbai = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    const { updatedSource, newFault } = returnTaskToDarbai(t, {
      name: currentUser.name,
      id: "currentUser",
    });

    setTasks((prev) =>
      prev.map((item) => (item.id === updatedSource.id ? updatedSource : item)),
    );
    setFaults((prev) => [newFault, ...prev]);

    logAudit(
      t.id,
      "RETURNED_TO_DARBAI",
      'Darbas grąžintas į "Darbai" modulį',
      undefined,
      JSON.stringify(t),
    );
    addNotification(
      notifications,
      currentUser.name,
      `Darbas sėkmingai grąžintas į modulį Darbai`,
      "normal",
      newFault.id,
    );

    if (selectedFault?.id === id) setSelectedFault(updatedSource);
  };

  const handlePromoteToProject = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    const promoted = promoteSomedayToProject(t, {
      name: currentUser.name,
      id: "currentUser",
    });

    setTasks((prev) =>
      prev.map((item) => (item.id === promoted.id ? promoted : item)),
    );

    logAudit(
      t.id,
      "PROMOTED_TO_PROJECT",
      "Užduotis paversta projektu",
      undefined,
      JSON.stringify(t),
    );
    addNotification(
      notifications,
      currentUser.name,
      `Užduotis paversta projektu`,
      "normal",
      promoted.id,
    );

    if (selectedFault?.id === id) setSelectedFault(promoted);
  };

  // --- Data Scoping & Filtering ---

  const scopedEntities = useMemo(
    () => getScopedEntities(faults, tasks, currentUser, selectedRegion, appClubs),
    [faults, tasks, currentUser, selectedRegion, appClubs],
  );

  const { scopedFaults, scopedTasks } = useMemo(
    () => splitScopedEntities(scopedEntities),
    [scopedEntities],
  );

  const visibleWorkflowTypes = useMemo(
    () => getActiveWorkflowTypesForModule(workflowTypes, "darbai", currentUser),
    [workflowTypes, currentUser],
  );

  const visibleWorkflowTypeIds = useMemo(
    () => visibleWorkflowTypes.map((workflow) => workflow.id),
    [visibleWorkflowTypes],
  );

  const creatableVisibleWorkflowTypes = useMemo(
    () =>
      visibleWorkflowTypes.filter((workflow) =>
        canCreateWorkflowCardResolver(
          currentUser,
          workflow.id,
          getWorkflowCreateModuleId(workflow),
        ),
      ),
    [currentUser, visibleWorkflowTypes],
  );
  const canCreateVisibleWorkflow = creatableVisibleWorkflowTypes.length > 0;
  const periodicModuleAccess = currentUser.effectivePermissionsPreview?.moduleAccess.find(
    (access) => access.moduleId === "periodiniai",
  );
  const canViewPeriodicTasks = canAccessModule(currentUser, "periodiniai");
  const canManagePeriodicTaskTemplates = Boolean(
    periodicModuleAccess?.canEdit ||
      periodicModuleAccess?.canAdmin,
  );

  useEffect(() => {
    if (activeModule === "darbai" && activeTab === "periodiniai" && !canViewPeriodicTasks) {
      setActiveTab("kanban" as any);
    }
  }, [activeModule, activeTab, canViewPeriodicTasks]);

  const openRegistrationHome = () => {
    if (!canCreateVisibleWorkflow) {
      resetRegForm();
      setActiveModal(null);
      return;
    }

    setActiveModal("home");
  };

  useEffect(() => {
    if (
      (activeModal === "home" || activeModal === "fault") &&
      !canCreateVisibleWorkflow
    ) {
      resetRegForm();
      setActiveModal(null);
    }
  }, [activeModal, canCreateVisibleWorkflow]);

  useEffect(() => {
    setSelectedWorkflowTypeIds((previous) =>
      previous.filter((workflowTypeId) =>
        visibleWorkflowTypeIds.includes(workflowTypeId),
      ),
    );
  }, [visibleWorkflowTypeIds]);

  const permittedWorkflowTypeIds = visibleWorkflowTypeIds;

  const activeRegionOptions = useMemo(
    () => appCities.filter((city) => city.is_active !== false),
    [appCities],
  );

  const selectedRegionCityId = useMemo(
    () => activeRegionOptions.find((city) => city.name === selectedRegion)?.id,
    [activeRegionOptions, selectedRegion],
  );

  const activeFilterClubs = useMemo(
    () =>
      appClubs.filter((club) => {
        if (club.is_active === false) return false;
        if (!canManageAllClubs(currentUser)) {
          return club.region === currentUser.region;
        }
        return (
          selectedRegion === "ALL" ||
          club.region === selectedRegion ||
          club.city === selectedRegion ||
          Boolean(selectedRegionCityId && club.city_id === selectedRegionCityId)
        );
      }),
    [appClubs, currentUser, selectedRegion, selectedRegionCityId],
  );

  const selectedClubNames = useMemo(
    () =>
      clubFilter
        .map((clubId) => appClubs.find((club) => club.id === clubId)?.name)
        .filter((name): name is string => Boolean(name)),
    [appClubs, clubFilter],
  );

  const clubFilterSummary =
    clubFilter.length === 0
      ? "Visi klubai"
      : clubFilter.length === 1
        ? selectedClubNames[0] || "1 klubas pasirinktas"
        : `${clubFilter.length} klubai pasirinkti`;

  useEffect(() => {
    const activeClubIds = new Set(activeFilterClubs.map((club) => club.id));
    const nextClubFilter = clubFilter.filter((clubId) =>
      activeClubIds.has(clubId),
    );

    if (nextClubFilter.length !== clubFilter.length) {
      setClubFilter(nextClubFilter);
    }
  }, [activeFilterClubs, clubFilter]);

  const filteredEntities = useMemo(
    () =>
      filterBoardEntities({
        scopedEntities,
        activeTab,
        searchQuery,
        clubs: appClubs,
        getRemainingTime,
        slaFilter,
        sourceFilter,
        appUsers,
        currentUser,
        assigneeFilter,
        quickFilter,
        periodicFilter,
        clubFilter,
        selectedWorkflowTypeIds,
        permittedWorkflowTypeIds,
      }),
    [
      scopedEntities,
      activeTab,
      searchQuery,
      appClubs,
      slaFilter,
      sourceFilter,
      appUsers,
      currentUser,
      assigneeFilter,
      quickFilter,
      periodicFilter,
      clubFilter,
      selectedWorkflowTypeIds,
      permittedWorkflowTypeIds,
    ],
  );

  const archivedEntities = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return scopedEntities
      .filter((item) => {
        if (item.isDeleted || !item.archivedAt) return false;

        const club = appClubs.find((c) => c.id === item.clubId);
        const assignedToId = item.assigned_to || item.assigneeId;
        const assignedToName =
          typeof item.assignedTo === "object" && item.assignedTo
            ? item.assignedTo.name
            : item.assignedTo ||
              item.assigneeName ||
              (assignedToId
                ? appUsers.find((user) => user.id === assignedToId)?.name
                : null);

        const matchesSearch =
          !normalizedSearch ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          (club?.name || "").toLowerCase().includes(normalizedSearch);
        const matchesClub =
          clubFilter.length === 0 || clubFilter.includes(item.clubId);
        const matchesAssignee =
          assigneeFilter === "ALL" ||
          (assigneeFilter === "MINE" &&
            (assignedToId === currentUser.id ||
              assignedToName === currentUser.name)) ||
          (assigneeFilter === "UNASSIGNED" &&
            !assignedToId &&
            !assignedToName) ||
          assignedToId === assigneeFilter ||
          assignedToName === assigneeFilter;
        const matchesSource =
          sourceFilter === "ALL" || item.source === sourceFilter;
        const matchesWorkflowType =
          selectedWorkflowTypeIds.length > 0
            ? Boolean(
                item.workflowTypeId &&
                  selectedWorkflowTypeIds.includes(item.workflowTypeId) &&
                  (!permittedWorkflowTypeIds ||
                    permittedWorkflowTypeIds.includes(item.workflowTypeId)),
              )
            : !permittedWorkflowTypeIds ||
              Boolean(
                item.workflowTypeId &&
                  permittedWorkflowTypeIds.includes(item.workflowTypeId),
              );

        return (
          matchesSearch &&
          matchesClub &&
          matchesAssignee &&
          matchesSource &&
          matchesWorkflowType
        );
      })
      .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  }, [
    scopedEntities,
    searchQuery,
    appClubs,
    appUsers,
    clubFilter,
    assigneeFilter,
    currentUser,
    sourceFilter,
    selectedWorkflowTypeIds,
    permittedWorkflowTypeIds,
  ]);

  const canViewSomedayLane = canManagePeriodicTasks(currentUser);
  const activeWorkflowIds = useMemo(
    () =>
      getActiveDarbaiWorkflowIds(
        workflowTypes,
        selectedWorkflowTypeIds,
        currentUser,
      ),
    [workflowTypes, selectedWorkflowTypeIds, currentUser],
  );
  const hasUnmappedStatuses = useMemo(
    () => hasUnmappedWorkflowStatuses(filteredEntities),
    [filteredEntities],
  );
  const kanbanLanes = useMemo(
    () =>
      getBoardKanbanLanes(workflowTypes, {
        includeSomeday: canViewSomedayLane,
        activeWorkflowIds,
        includeUnknownLane: hasUnmappedStatuses,
      }),
    [workflowTypes, canViewSomedayLane, activeWorkflowIds, hasUnmappedStatuses],
  );

  const analyticsData = useMemo<AnalyticsData>(() => {
    return calculateAnalytics(
      scopedFaults,
      auditTrail,
      scopedTasks,
      dateFrom,
      dateTo,
      getRemainingTime,
      getFaultMeta,
      CLUBS,
    );
  }, [scopedFaults, scopedTasks, dateFrom, dateTo, auditTrail]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Status;
    if (
      destination.droppableId === UNKNOWN_STATUS_LANE_ID ||
      !isRegisteredWorkflowStatus(normalizeWorkflowStatusId(destination.droppableId))
    ) {
      console.warn(
        `[workflow-status] Blocked move to unsupported status "${destination.droppableId}"`,
      );
      return;
    }

    // special case for closing fixed faults through closure modal if needed
    if (newStatus === Status.FIXED) {
      const fault =
        faults.find((f) => f.id === draggableId) ||
        tasks.find((f) => f.id === draggableId);
      if (fault?.type === "EQUIPMENT_FAULT") {
        updateFault(draggableId, { status: newStatus });
      } else {
        setActiveFaultId(draggableId);
        setSelectedFault(fault || null);
        setIsInsightModalOpen(true);
      }
    } else if (newStatus === Status.REJECTED) {
      const fault =
        faults.find((f) => f.id === draggableId) ||
        tasks.find((f) => f.id === draggableId);
      setActiveFaultId(draggableId);
      setSelectedFault(fault || null);
      setIsRejectModalOpen(true);
    } else if (newStatus === Status.WAITING_DETAILS) {
      const fault =
        faults.find((f) => f.id === draggableId) ||
        tasks.find((f) => f.id === draggableId);
      setActiveFaultId(draggableId);
      setSelectedFault(fault || null);
      setIsWaitingModalOpen(true);
    } else {
      updateFault(draggableId, { status: newStatus });
    }
  };

  const subModules = getSidebarSubModules(currentUser);
  const sidebarItems = getSidebarItems();
  const finalSidebarItems = getFilteredSidebarItems(currentUser, sidebarItems);
  const activeSubmodule = getActiveSubmodule(subModules, activeTab);
  const sidebarTitle = getSidebarTitle(
    sidebarItems,
    location.pathname,
    activeModule,
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex overflow-hidden">
      <AppSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        items={finalSidebarItems}
        expandedGroups={expandedGroups}
        toggleExpand={toggleExpand}
        activeTab={activeTab}
        activePeriodicTab={activePeriodicTab}
        setActivePeriodicTab={setActivePeriodicTab}
        setActiveModule={setActiveModule}
        setActiveTab={setActiveTab}
        navigateToRoute={(route) => navigate("/" + route)}
        pathname={location.pathname}
        currentUser={currentUser}
        onLogout={() => {
          logout();
          navigate("/login", { replace: true });
          setIsSidebarOpen(false);
        }}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {showQrReport && (
          <QrReportView
            params={qrParams}
            onClose={() => {
              setShowQrReport(false);
              window.history.pushState({}, "", window.location.pathname);
            }}
            allTasks={faults}
            currentUser={{ name: currentUser.name, id: "currentUser" }}
            onUpdateTasks={(updated) => setFaults(updated)}
            workflowTypes={workflowTypes}
          />
        )}

        {/* Global Header */}
        <header className="relative z-[80] bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-black hidden sm:block">
                {sidebarTitle}
              </h1>

              {activeModule === "darbai" && activeTab === "kanban" && (
                <WorkflowSelector
                  workflows={visibleWorkflowTypes}
                  selectedWorkflowTypeIds={selectedWorkflowTypeIds}
                  onChange={(workflowTypeIds) => {
                    const allowedWorkflowIds = new Set(visibleWorkflowTypeIds);
                    setSelectedWorkflowTypeIds(
                      workflowTypeIds.filter((workflowTypeId) =>
                        allowedWorkflowIds.has(workflowTypeId),
                      ),
                    );
                  }}
                />
              )}

              {activeModule === "darbai" &&
                (activeTab === "kanban" || activeTab === "periodiniai") && (
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab("kanban" as any)}
                      className={cn(
                        "h-7 rounded-lg px-3 text-xs font-black transition-all",
                        activeTab === "periodiniai"
                          ? "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          : "bg-slate-900 text-white shadow-sm",
                      )}
                    >
                      Darbai
                    </button>
                    {canViewPeriodicTasks && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("periodiniai" as any)}
                        className={cn(
                          "h-7 rounded-lg px-3 text-xs font-black transition-all",
                          activeTab === "periodiniai"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                        )}
                      >
                        Periodiniai darbai
                      </button>
                    )}
                  </div>
                )}

              {activeModule === "darbai" &&
                activeSubmodule &&
                activeTab !== "kanban" &&
                activeTab !== "periodiniai" && (
                <>
                  <div className="w-px h-6 bg-slate-200 mx-2 hidden lg:block" />

                  {/* Submodule Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm">
                      <activeSubmodule.icon
                        size={16}
                        className="text-brand-lime"
                      />
                      {activeSubmodule.label}
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {subModules.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id as any)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors",
                            activeTab === sub.id
                              ? "text-brand-lime bg-slate-50"
                              : "text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          <sub.icon size={16} />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEquipmentSearchModalOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Search size={20} />
            </button>

            {activeModule === "darbai" && (
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Filter size={20} />
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Bell size={20} />
                {getUnreadCount(notifications) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotifOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 flex flex-col gap-3 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">
                            Pranešimai
                          </h4>
                          <button
                            onClick={() =>
                              setNotifications((prev) => markAllAsRead(prev))
                            }
                            className="text-[9px] font-bold text-slate-400 hover:text-brand-lime uppercase transition-colors"
                          >
                            Perskaityti visus
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs italic">
                            Pranešimų nėra
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotifications((prev) =>
                                  markAsRead(prev, n.id),
                                );
                                if (n.faultId) openCard(n.faultId);
                              }}
                              className={cn(
                                "p-4 hover:bg-slate-50 transition-all cursor-pointer relative group",
                                !n.read
                                  ? "bg-brand-lime/10 border-l-4 border-brand-lime"
                                  : "bg-white",
                              )}
                            >
                              <div className="flex gap-3">
                                <NotificationIcon type={n.type as any} />
                                <div className="flex-1 space-y-1">
                                  <p
                                    className={cn(
                                      "text-xs leading-relaxed",
                                      !n.read
                                        ? "text-slate-900 font-black"
                                        : "text-slate-500 font-medium",
                                    )}
                                  >
                                    {n.text}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                    {new Date(n.createdAt).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotifications((prev) =>
                                      toggleRead(prev, n.id),
                                    );
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    n.read
                                      ? "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                                      : "text-slate-500 hover:text-brand-lime hover:bg-brand-lime/10",
                                  )}
                                  title={
                                    n.read
                                      ? "Pažymėti kaip neskaitytą"
                                      : "Pažymėti kaip perskaitytą"
                                  }
                                >
                                  {n.read ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase overflow-hidden ml-2">
              {currentUser.name[0]}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white pb-24 lg:pb-8 relative">
          {activeComponent === "CeoDashboard" ? (
            !canAccessModule(currentUser, "ceo") ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-lg">Prieiga uždrausta</div>
            ) : (
            <CeoDashboard
              key="ceo"
              faults={faults}
              tasks={tasks as any}
              orders={orders}
              periodicInstances={periodicHistory as any}
              periodicTemplates={mockPeriodicTemplates}
              audits={auditTrail}
              sops={MOCK_SOPS}
              clubs={appClubs}
              surveys={appSurveys}
              onNavigate={(tab, filters) => {
                setActiveModule("darbai");
                setActiveTab(tab as any);
                if (filters?.clubId) {
                  setClubFilter([filters.clubId]);
                }
                if (filters?.search) {
                  setSearchQuery(filters.search);
                }
              }}
            />
            )
          ) : activeComponent === "OpsFlowView" ? (
            !canAccessModule(currentUser, "ops-flow") ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-lg">Prieiga uždrausta</div>
            ) : (
              <OpsFlowView
                tasks={faults}
                onNavigateTo={() => {
                  setActiveModule("darbai");
                  setActiveTab("kanban" as any);
                }}
              />
            )
          ) : activeComponent === "AdminModule" ? (
            !canAccessModule(currentUser, "admin") ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-lg">Prieiga uždrausta</div>
            ) : (
            <AdminModule
              products={adminDB.products}
              setProducts={setProducts}
              inventorySettings={adminDB.inventorySettings}
              setInventorySettings={setInventorySettings}
              suppliers={adminDB.suppliers}
              setSuppliers={setSuppliers}
              clubs={adminDB.clubs}
              setClubs={setAppClubs}
              users={adminDB.users}
              setUsers={setAppUsers}
              cities={adminDB.cities}
              setCities={setAppCities}
              facilityTemplates={adminDB.facilityTemplates}
              setFacilityTemplates={setAppFacilityTemplates}
              equipmentList={adminDB.equipment}
              setEquipmentList={setAppEquipmentList}
              periodicTemplates={appPeriodicTemplates}
              setPeriodicTemplates={setAppPeriodicTemplates}
              clubTaskConfigs={clubTaskConfigs}
              setClubTaskConfigs={setClubTaskConfigs}
              tasks={[...faults, ...tasks]}
              orders={orders}
              workflowTypes={workflowTypes}
              setWorkflowTypes={updateWorkflowTypes}
              renderPeriodicModule={() => (
                <PeriodicModule
                  faults={[...faults, ...tasks]}
                  history={periodicHistory}
                  templates={appPeriodicTemplates}
                  clubs={appClubs}
                  activeTab={activePeriodicTab}
                  onTabChange={setActivePeriodicTab}
                  onTemplatesChange={handlePeriodicTemplatesChange}
                  canManageTemplates={canManagePeriodicTaskTemplates}
                  onOpenCard={(id) => {
                    const task = [...faults, ...tasks].find((item) => item.id === id);
                    if (task) {
                      setSelectedFault(task);
                      setIsDetailPanelOpen(true);
                    }
                  }}
                />
              )}
              onTabChange={navigateToAdminTab}
              activeTab={getAdminModuleTab(activeTab)}
              inventorySubTab={getAdminInventorySubTabForRouteTab(activeTab)}
            />
            )
          ) : activeComponent === "DarbaiModule" ? (
            <div className="h-full flex flex-col">
              {/* Filters Bar - Refactored for Minimal Clutter */}
              {activeTab === "kanban" && (
                <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                  {/* DESKTOP FILTERS */}
                  <div className="hidden md:block pt-4 pb-4 px-6">
                    <div className="flex items-center gap-4">
                      {/* Primary Operational Filters */}
                      <div className="flex gap-2">
                        {([
                          { id: "all", label: "Visi", icon: LayoutDashboard },
                          {
                            id: "delayed",
                            label: "Vėluojantys",
                            icon: AlertTriangle,
                          },
                          { id: "near", label: "<24h", icon: Clock },
                          { id: "archive", label: "Archyvas", icon: History },
                        ] as const).map((qf) => (
                          <button
                            key={`qf-${qf.id}`}
                            onClick={() => setQuickFilter(qf.id)}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap",
                              quickFilter === qf.id
                                ? "bg-brand-lime text-black border-brand-lime shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                            )}
                          >
                            <qf.icon size={12} />
                            {qf.label}
                          </button>
                        ))}
                      </div>

                      <div className="w-px h-8 bg-slate-100 mx-1" />

                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Ieškoti darbų, įrangos, klubų..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-lime outline-none transition-all text-xs font-medium"
                        />
                      </div>

                      {/* Filters Button */}
                      <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border shadow-sm whitespace-nowrap",
                          selectedRegion !== "ALL" ||
                            clubFilter.length > 0 ||
                            assigneeFilter !== "ALL" ||
                            sourceFilter !== "ALL"
                            ? "bg-brand-lime text-black border-brand-lime"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        <Settings2 size={16} />
                        Filtrai
                        {(selectedRegion !== "ALL" ||
                          clubFilter.length > 0 ||
                          assigneeFilter !== "ALL" ||
                          sourceFilter !== "ALL") && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] text-black font-black">
                            {(selectedRegion !== "ALL" ? 1 : 0) +
                              (clubFilter.length > 0 ? 1 : 0) +
                              (assigneeFilter !== "ALL" ? 1 : 0) +
                              (sourceFilter !== "ALL" ? 1 : 0)}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Active Filter Summary UI */}
                    {(selectedRegion !== "ALL" ||
                      clubFilter.length > 0 ||
                      assigneeFilter !== "ALL" ||
                      sourceFilter !== "ALL") && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 overflow-x-auto no-scrollbar pb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mr-2">
                          Aktyvūs filtrai:
                        </span>

                        <div className="flex gap-2 items-center">
                          {selectedRegion !== "ALL" && (
                            <button
                              onClick={() => {
                                setSelectedRegion("ALL");
                                setClubFilter([]);
                              }}
                              className="px-3 py-1 rounded-full bg-brand-lime text-black text-[10px] font-bold flex items-center gap-1.5 hover:opacity-80 transition-all border border-brand-lime"
                            >
                              {selectedRegion}
                              <X size={10} />
                            </button>
                          )}

                          {clubFilter.length > 0 && (
                            <button
                              onClick={() => setClubFilter([])}
                              className="px-3 py-1 rounded-full bg-brand-lime text-black text-[10px] font-bold flex items-center gap-1.5 hover:opacity-80 transition-all border border-brand-lime"
                            >
                              {clubFilterSummary}
                              <X size={10} />
                            </button>
                          )}

                          {assigneeFilter !== "ALL" && (
                            <button
                              onClick={() => setAssigneeFilter("ALL")}
                              className="px-3 py-1 rounded-full bg-brand-lime text-black text-[10px] font-bold flex items-center gap-1.5 hover:opacity-80 transition-all border border-brand-lime"
                            >
                              {assigneeFilter === "MINE"
                                ? "Mano"
                                : assigneeFilter === "UNASSIGNED"
                                  ? "Nepriskirta"
                                  : appUsers.find(
                                      (u) => u.id === assigneeFilter,
                                    )?.name || assigneeFilter}
                              <X size={10} />
                            </button>
                          )}

                          {sourceFilter === "QR" && (
                            <button
                              onClick={() => setSourceFilter("ALL")}
                              className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-all border border-amber-100"
                            >
                              QR Pranešimai
                              <X size={10} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedRegion("ALL");
                              setClubFilter([]);
                              setAssigneeFilter("ALL");
                              setSourceFilter("ALL");
                              setPeriodicFilter("ALL");
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2 py-1 transition-all"
                          >
                            Išvalyti visus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MOBILE FILTERS */}
                  <div className="md:hidden p-4 space-y-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {([
                        { id: "all", label: "Visi", icon: LayoutDashboard },
                        {
                          id: "delayed",
                          label: "Vėluojantys",
                          icon: AlertTriangle,
                        },
                        { id: "archive", label: "Archyvas", icon: History },
                      ] as const).map((qf) => (
                        <button
                          key={`mob-qf-${qf.id}`}
                          onClick={() => setQuickFilter(qf.id)}
                          className={cn(
                            "py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border whitespace-nowrap",
                            quickFilter === qf.id
                              ? "bg-brand-lime text-black border-brand-lime shadow-sm"
                              : "bg-white text-slate-500 border-slate-200",
                          )}
                        >
                          <qf.icon size={12} />
                          {qf.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={cn(
                          "py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border",
                          selectedRegion !== "ALL" ||
                            clubFilter.length > 0 ||
                            assigneeFilter !== "ALL" ||
                            sourceFilter !== "ALL"
                            ? "bg-brand-lime text-black border-brand-lime"
                            : "bg-white text-slate-700 border-slate-200",
                        )}
                      >
                        <Settings2 size={12} />
                        Filtrai
                      </button>
                    </div>

                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Ieškoti..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-lime outline-none transition-all text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 lg:p-8 overflow-x-auto overflow-y-auto">
                <div
                  className={cn(
                    "h-full relative",
                    activeTab === "kanban"
                      ? "min-w-[1000px] max-w-[1800px]"
                      : "w-full",
                  )}
                >
                  <AnimatePresence mode="wait">
                    {activeTab === "kanban" && quickFilter === "archive" && (
                      <motion.div
                        key="workflow-archive"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-black text-slate-900">
                              Archyvas
                            </h2>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                              Archyvuotos workflow kortelės
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                            {archivedEntities.length}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-4 py-3 font-black">
                                  Pavadinimas
                                </th>
                                <th className="px-4 py-3 font-black">
                                  Workflow
                                </th>
                                <th className="px-4 py-3 font-black">
                                  Klubas
                                </th>
                                <th className="px-4 py-3 font-black">
                                  Archyvavo
                                </th>
                                <th className="px-4 py-3 font-black">Data</th>
                                <th className="px-4 py-3 font-black">
                                  Priežastis
                                </th>
                                <th className="px-4 py-3 font-black text-right">
                                  Veiksmai
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {archivedEntities.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                                  >
                                    Archyve kortelių nėra
                                  </td>
                                </tr>
                              ) : (
                                archivedEntities.map((item) => {
                                  const workflowName =
                                    workflowTypes.find(
                                      (workflow) =>
                                        workflow.id === item.workflowTypeId,
                                    )?.name || item.type;
                                  const clubName =
                                    appClubs.find(
                                      (club) => club.id === item.clubId,
                                    )?.name ||
                                    item.clubName ||
                                    "-";

                                  return (
                                    <tr
                                      key={`archive-${item.id}`}
                                      className="hover:bg-slate-50/70 transition-colors"
                                    >
                                      <td className="px-4 py-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedFault(item);
                                            setIsDetailPanelOpen(true);
                                          }}
                                          className="font-bold text-slate-900 hover:text-brand-lime text-left"
                                        >
                                          {item.title}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-medium">
                                        {workflowName}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-medium">
                                        {clubName}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-medium">
                                        {item.archivedBy || "-"}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                                        {item.archivedAt
                                          ? new Date(
                                              item.archivedAt,
                                            ).toLocaleString("lt-LT")
                                          : "-"}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 font-medium max-w-xs">
                                        {item.archiveReason || "-"}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRestoreArchivedCard(item.id)
                                          }
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-brand-lime hover:text-black transition-colors"
                                        >
                                          <RefreshCcw size={13} />
                                          Atstatyti
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {(activeTab === "kanban" || activeTab === "tasks") && quickFilter !== "archive" && (
                      <DragDropContext
                        key={`board-${activeTab}`}
                        onDragEnd={onDragEnd}
                      >
                        <div className="flex flex-col h-full overflow-hidden">
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid gap-4 items-start h-full"
                            style={{
                              gridTemplateColumns: `repeat(${kanbanLanes.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {kanbanLanes.map((status) => {
                              const columnFaults = (
                                filteredEntities || []
                              ).filter((f) =>
                                status === UNKNOWN_STATUS_LANE_ID
                                  ? !isRegisteredWorkflowStatus(
                                      normalizeWorkflowStatusId(f.status),
                                    )
                                  : normalizeWorkflowStatusId(f.status) ===
                                    status,
                              );
                              const clubMap = new Map(
                                (appClubs || []).map((c) => [c.id, c]),
                              );
                              return (
                                <KanbanColumn
                                  key={`col-${status}`}
                                  id={status}
                                  title={
                                    status === UNKNOWN_STATUS_LANE_ID
                                      ? "Nepriskirta"
                                      : formatWorkflowStatusLabel(status)
                                  }
                                  count={columnFaults.length}
                                  currentUserRole={currentUser.role}
                                  columnFaults={columnFaults}
                                >
                                  {status === Status.NEW && canCreateVisibleWorkflow && (
                                    <motion.button
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      onClick={openRegistrationHome}
                                      className="w-full aspect-[3/1] mb-4 border-2 border-dashed border-slate-100 bg-white rounded-xl flex flex-col items-center justify-center gap-1 hover:border-brand-lime transition-all text-slate-400 hover:text-brand-lime group shadow-sm p-2"
                                    >
                                      <Plus
                                        size={18}
                                        className="text-slate-300 group-hover:text-brand-lime mb-1"
                                      />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">
                                        Registruoti
                                      </span>
                                    </motion.button>
                                  )}

                                  {columnFaults.map((f, index) => {
                                    const club = clubMap.get(f.clubId);
                                    if (!club) return null;
                                    return (
                                      <FaultCard
                                        key={f.id}
                                        index={index}
                                        fault={f}
                                        club={club}
                                        currentUserName={currentUser.name}
                                        onToggleWatch={() => {
                                          const watchers = f.watchers || [];
                                          const isWatching = watchers.find(
                                            (w) =>
                                              w.userId === currentUser.name,
                                          );
                                          if (isWatching) {
                                            unwatchFault(f, currentUser.name);
                                          } else {
                                            setWatchMode(
                                              f,
                                              currentUser.name,
                                              "all",
                                            );
                                          }
                                          updateFault(f.id, {
                                            watchers: [...(f.watchers || [])],
                                          });
                                        }}
                                        onClick={() => {
                                          window.history.pushState(
                                            {},
                                            "",
                                            `/darbai`,
                                          );
                                          setSelectedFault(f);
                                          setIsDetailPanelOpen(true);
                                        }}
                                        onAssign={handleAssign}
                                        allUsers={appUsers}
                                        onConvertToTask={(id) => {
                                          setActiveFaultId(id);
                                          setIsConversionModalOpen(true);
                                        }}
                                        onNavigateToTask={(id) => {
                                          window.history.pushState(
                                            {},
                                            "",
                                            `/darbai`,
                                          );
                                          const t = (tasks || []).find(
                                            (x) => x.id === id,
                                          );
                                          if (t) {
                                            setSelectedFault(t);
                                            setIsDetailPanelOpen(true);
                                          }
                                        }}
                                        onReturnToDarbai={handleReturnToDarbai}
                                        onPromoteToProject={
                                          handlePromoteToProject
                                        }
                                        onRejectSingle={(id) => {
                                          setActiveFaultId(id);
                                          setIsRejectModalOpen(true);
                                        }}
                                        currentUserRole={currentUser.role}
                                      />
                                    );
                                  })}
                                </KanbanColumn>
                              );
                            })}
                          </motion.div>
                        </div>
                      </DragDropContext>
                    )}

                    {activeTab === "periodiniai" && canViewPeriodicTasks && (
                      <PeriodicModule
                        faults={scopedTasks}
                        history={periodicHistory}
                        templates={appPeriodicTemplates}
                        clubs={appClubs}
                        activeTab={activePeriodicTab}
                        onTabChange={setActivePeriodicTab}
                        onTemplatesChange={handlePeriodicTemplatesChange}
                        canManageTemplates={canManagePeriodicTaskTemplates}
                        onOpenCard={(id) => {
                          const task = tasks.find((item) => item.id === id);
                          if (task) {
                            setSelectedFault(task);
                            setIsDetailPanelOpen(true);
                          }
                        }}
                      />
                    )}

                    {activeTab === "analytics" && (
                      <AnalyticsTab
                        key="analytics"
                        data={analyticsData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        setDateFrom={setDateFrom}
                        setDateTo={setDateTo}
                        onExport={handleExport}
                      />
                    )}

                    {activeTab === "audit" && (
                      <AuditTab
                        key="audit"
                        auditTrail={auditTrail}
                        faults={faults}
                        onRollback={handleRollback}
                      />
                    )}

                    {activeTab === "orders" && (
                      <OrderProvider>
                        <OrderModule
                          currentUser={currentUser}
                          clubs={appClubs}
                          suppliers={suppliers}
                        />
                      </OrderProvider>
                    )}

                    {activeTab.startsWith("admin-") && (
                      <motion.div
                        key="admin-module"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="h-full"
                      >
                        <AdminModule
                          products={adminDB.products}
                          setProducts={setProducts}
                          inventorySettings={adminDB.inventorySettings}
                          setInventorySettings={setInventorySettings}
                          suppliers={adminDB.suppliers}
                          setSuppliers={setSuppliers}
                          clubs={adminDB.clubs}
                          setClubs={setAppClubs}
                          users={adminDB.users}
                          setUsers={setAppUsers}
                          cities={adminDB.cities}
                          setCities={setAppCities}
                          facilityTemplates={adminDB.facilityTemplates}
                          setFacilityTemplates={setAppFacilityTemplates}
                          equipmentList={adminDB.equipment}
                          setEquipmentList={setAppEquipmentList}
                          periodicTemplates={appPeriodicTemplates}
                          setPeriodicTemplates={setAppPeriodicTemplates}
                          clubTaskConfigs={clubTaskConfigs}
                          setClubTaskConfigs={setClubTaskConfigs}
                          tasks={[...faults, ...tasks]}
                          orders={orders}
                          workflowTypes={workflowTypes}
                          setWorkflowTypes={updateWorkflowTypes}
                          renderPeriodicModule={() => (
                            <PeriodicModule
                              faults={[...faults, ...tasks]}
                              history={periodicHistory}
                              templates={appPeriodicTemplates}
                              clubs={appClubs}
                              activeTab={activePeriodicTab}
                              onTabChange={setActivePeriodicTab}
                              onTemplatesChange={handlePeriodicTemplatesChange}
                              canManageTemplates={canManagePeriodicTaskTemplates}
                              onOpenCard={(id) => {
                                const task = [...faults, ...tasks].find((item) => item.id === id);
                                if (task) {
                                  setSelectedFault(task);
                                  setIsDetailPanelOpen(true);
                                }
                              }}
                            />
                          )}
                          activeTab={getAdminModuleTab(activeTab)}
                          inventorySubTab={getAdminInventorySubTabForRouteTab(
                            activeTab,
                          )}
                          onTabChange={(tab) => {
                            setAdminRouteTab(tab);
                          }}
                          onSubTabChange={(sub) =>
                            setActiveTab(`admin-${sub}` as any)
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : activeComponent === "ZmonesOrgModule" ? (
            <div className="h-full flex flex-col overflow-hidden">
              <ZmonesOrgModule onGeneratePeriodicTasks={handleGenerateWorks} />
            </div>
          ) : (
            <div className="p-4 lg:p-10"></div>
          )}
        </main>

        <FaultDetailPanel
          isOpen={isDetailPanelOpen}
          onClose={() => setIsDetailPanelOpen(false)}
          fault={selectedFault}
          onUpdate={(updates) => {
            if (selectedFault) {
              updateFault(selectedFault.id, updates);
              setSelectedFault({ ...selectedFault, ...updates });
            }
          }}
          onReturnToDarbai={handleReturnToDarbai}
          onPromoteToProject={handlePromoteToProject}
          currentUser={currentUser}
          onAddNotification={(text, type, faultId) => {
            setNotifications((prev) =>
              addNotification(prev, currentUser.name, text, type, faultId),
            );
          }}
          onRequestClosure={(id) => {
            const f =
              faults.find((x) => x.id === id) || tasks.find((x) => x.id === id);
            if (f?.type === "EQUIPMENT_FAULT") {
              updateFault(id, { status: Status.FIXED });
            } else {
              setActiveFaultId(id);
              setIsClosureModalOpen(true);
            }
          }}
          onRequestWaitingDetails={(id) => {
            setActiveFaultId(id);
            setIsWaitingModalOpen(true);
          }}
          onConvertToTask={(id) => {
            setActiveFaultId(id);
            setIsConversionModalOpen(true);
          }}
          onNavigateToTask={(id) => {
            const t = tasks.find((x) => x.id === id);
            if (t) {
              setSelectedFault(t);
              setIsDetailPanelOpen(true);
            }
          }}
          onReject={() => {
            setIsRejectModalOpen(true);
          }}
          facilityInsights={facilityInsights}
          equipmentInsights={equipmentInsights}
          onAddInsight={(text) => {
            // Handle adding insight manually
            if (selectedFault) {
              if (
                selectedFault.category === "FACILITY_FAULT" &&
                selectedFault.typeId
              ) {
                setFacilityInsights((prev) => [
                  ...prev,
                  {
                    id: `fi-${Date.now()}`,
                    targetId: selectedFault.typeId!,
                    targetType: "FACILITY",
                    text,
                    createdAt: Date.now(),
                    createdBy: currentUser.name,
                  },
                ]);
              } else if (selectedFault.category === "EQUIPMENT_FAULT") {
                const targetId =
                  selectedFault.typeId || getFaultEquipmentId(selectedFault);
                if (targetId) {
                  setEquipmentInsights((prev) => [
                    ...prev,
                    {
                      id: `ei-${Date.now()}`,
                      targetId,
                      targetType: selectedFault.typeId
                        ? "EQUIPMENT_ISSUE"
                        : "EQUIPMENT",
                      text,
                      createdAt: Date.now(),
                      createdBy: currentUser.name,
                    },
                  ]);
                }
              }
            }
          }}
        />

        <ConversionModal
          isOpen={isConversionModalOpen}
          onClose={() => setIsConversionModalOpen(false)}
          onConfirm={handleConvertToTask}
        />

        {/* Rejection Modal */}
        <AnimatePresence>
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Atmesti darbą
                    </h2>
                    <p className="text-sm text-slate-500">
                      Nurodykite argumentuotą priežastį
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 p-1 uppercase tracking-widest">
                      Priežastis
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Kodėl darbas atmetamas?"
                      className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Atšaukti
                    </button>
                    <button
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          alert("Atmetimo priežastis yra privaloma");
                          return;
                        }

                        if (selectedFault) {
                          try {
                            rejectFault(
                              selectedFault,
                              rejectReason,
                              currentUser,
                            );
                            updateFault(selectedFault.id, {
                              status: Status.REJECTED,
                              rejected: true,
                              rejectReason: rejectReason,
                              comments: [...selectedFault.comments],
                            });
                            setIsRejectModalOpen(false);
                            setRejectReason("");
                            setIsDetailPanelOpen(false);
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }
                      }}
                      className="flex-1 px-6 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                    >
                      Patvirtinti
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FAB for Registration */}
        {activeModule === "darbai" && canCreateVisibleWorkflow && (
          <button
            onClick={openRegistrationHome}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-brand-lime text-black rounded-full flex items-center justify-center shadow-xl shadow-brand-lime/20 hover:scale-110 active:scale-95 transition-all z-[45]"
          >
            <Plus size={28} />
          </button>
        )}

        {/* Filter Modal */}
        <AnimatePresence>
          {isFilterModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Filtrai
                  </h3>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Source Filter (QR) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                      Išnaša
                    </label>
                    <button
                      onClick={() =>
                        setSourceFilter(sourceFilter === "QR" ? "ALL" : "QR")
                      }
                      className={cn(
                        "w-full px-4 py-4 rounded-2xl text-sm font-bold border transition-all text-left flex items-center justify-between",
                        sourceFilter === "QR"
                          ? "bg-amber-100 text-amber-800 border-amber-200 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <QrCode
                          size={18}
                          className={
                            sourceFilter === "QR"
                              ? "text-amber-600"
                              : "text-slate-400"
                          }
                        />
                        QR Pranešimai
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                          sourceFilter === "QR"
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white border-slate-200",
                        )}
                      >
                        {sourceFilter === "QR" && (
                          <Check
                            size={12}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Region Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                      Regionas
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "ALL", name: "ALL" },
                        ...activeRegionOptions,
                      ].map((region) => (
                        <button
                          key={`region-filter-${region.id}`}
                          onClick={() => {
                            setSelectedRegion(region.name);
                            setClubFilter([]);
                          }}
                          disabled={
                            !canManageAllClubs(currentUser) &&
                            region.name !== "ALL" &&
                            region.name !== currentUser.region
                          }
                          className={cn(
                            "px-4 py-3 rounded-2xl text-sm font-bold border transition-all text-left",
                            selectedRegion === region.name
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                              : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300",
                            !canManageAllClubs(currentUser) &&
                              region.name !== "ALL" &&
                              region.name !== currentUser.region &&
                              "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {region.name === "ALL" ? "Visi regionai" : region.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Club Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                      Klubas
                    </label>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <span className="text-sm font-bold text-slate-700">
                          {clubFilterSummary}
                        </span>
                        {clubFilter.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setClubFilter([])}
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            Išvalyti
                          </button>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {activeFilterClubs.map((club) => {
                          const selected = clubFilter.includes(club.id);

                          return (
                            <button
                              key={`club-option-filter-${club.id}`}
                              type="button"
                              onClick={() =>
                                setClubFilter((previous) =>
                                  previous.includes(club.id)
                                    ? previous.filter((id) => id !== club.id)
                                    : [...previous, club.id],
                                )
                              }
                              className={cn(
                                "w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between text-left",
                                selected
                                  ? "bg-slate-900 text-white"
                                  : "bg-white text-slate-600 hover:bg-slate-100",
                              )}
                            >
                              <span>{club.name}</span>
                              <span
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center",
                                  selected
                                    ? "bg-brand-lime border-brand-lime"
                                    : "bg-white border-slate-200",
                                )}
                              >
                                {selected && (
                                  <Check
                                    size={10}
                                    className="text-black"
                                    strokeWidth={4}
                                  />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Assignee Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                      Atsakingas
                    </label>
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lime outline-none transition-all"
                    >
                      <option value="ALL">Visi atsakingi</option>
                      <option value="MINE">Mano užduotys</option>
                      <option value="UNASSIGNED">Nepriskirta</option>
                      <optgroup label="Darbuotojai">
                        {appUsers
                          .filter((u) => u.is_active !== false)
                          .map((u) => (
                            <option
                              key={`user-option-filter-${u.id}`}
                              value={u.id}
                            >
                              {u.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedRegion("ALL");
                      setClubFilter([]);
                      setAssigneeFilter("ALL");
                      setSourceFilter("ALL");
                    }}
                    className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Išvalyti visus
                  </button>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                  >
                    Taikyti
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REGISTRATION MODAL */}
        <AnimatePresence>
          <HomeActionModal
            isOpen={activeModal === "home"}
            onClose={() => setActiveModal(null)}
            workflows={creatableVisibleWorkflowTypes}
            currentUser={currentUser}
            onSelectAction={(workflowTypeId) => {
              const workflow = creatableVisibleWorkflowTypes.find(
                (visibleWorkflow) => visibleWorkflow.id === workflowTypeId,
              );
              if (!workflow) return;
              if (
                !canCreateWorkflowCardResolver(
                  currentUser,
                  workflow.id,
                  getWorkflowCreateModuleId(workflow),
                )
              ) {
                return;
              }

              resetRegForm();
              setRegForm((prev) => ({
                ...prev,
                category: getRegistrationCompatibilityCategory(workflow),
                workflowTypeId: workflow.id,
                typeId: isWorkflowAssetBacked(workflow) ? prev.typeId : "other",
              }));

              if (workflow.objectType !== "ORDER") {
                setRegType(workflow.name);
                setRegStep(2);
                setActiveModal("fault");
              } else {
                setRegType("Užsakymas");
                setRegStep(3);
                setActiveModal("fault");
              }
            }}
          />

          {activeModal === "fault" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setActiveModal(null)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {(regStep === 2 || regStep === 3) && (
                      <button
                        onClick={() => {
                          if (regStep === 3) {
                            openRegistrationHome();
                          } else {
                            // Step 2
                            if (regForm.orderCategory) {
                              setRegStep(3);
                            } else {
                              openRegistrationHome();
                            }
                          }
                        }}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <h3 className="text-lg font-bold">
                      {isOrderRegistration || regForm.orderCategory || regStep === 3
                        ? regForm.orderCategory
                          ? `Užsakymai: ${regType}`
                          : "Užsakymai"
                        : `Registruoti: ${regType}`}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                  {regStep === 3 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          id: "INVENTORY",
                          title: "Smulkus inventorius",
                          icon: ShoppingCart,
                          color: "text-slate-900",
                          bg: "bg-brand-lime/10",
                        },
                        {
                          id: "VENDING",
                          title: "Vending prekės",
                          icon: Zap,
                          color: "text-orange-600",
                          bg: "bg-orange-50",
                        },
                        {
                          id: "CLEANING",
                          title: "Švaros prekės",
                          icon: SprayCan || Package,
                          color: "text-slate-600",
                          bg: "bg-slate-50",
                        },
                        {
                          id: "PRINT",
                          title: "Spauda",
                          icon: Printer || FileText,
                          color: "text-slate-900",
                          bg: "bg-brand-lime/10",
                        },
                        {
                          id: "FIRST_AID_KIT",
                          title: "Vaistinėlės turinys",
                          icon: HeartPulse,
                          color: "text-red-600",
                          bg: "bg-red-50",
                        },
                        {
                          id: "OTHER",
                          title: "Kita",
                          icon: Plus,
                          color: "text-slate-600",
                          bg: "bg-slate-50",
                        },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const catId = cat.id as ProductCategory;
                            const productsForCategory = products.filter(
                              (p) =>
                                p.category === catId && p.is_active !== false,
                            );
                            setRegForm({
                              ...regForm,
                              orderCategory: catId,
                              inventoryData: productsForCategory.map((p) => ({
                                productId: p.id,
                                addedQty: 0,
                                orderQty: 0,
                                isManualOrder: false,
                              })),
                            });
                            setRegStep(2);
                            setRegType(cat.title);
                          }}
                          className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all gap-4 group"
                        >
                          <div
                            className={cn(
                              "w-14 h-14 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform",
                              cat.bg,
                              cat.color,
                            )}
                          >
                            <cat.icon size={28} />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-700 text-sm text-center">
                              {cat.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-lime uppercase tracking-wider transition-colors">
                              Užsakyti
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : regStep === 2 &&
                    (regForm.orderCategory === "INVENTORY" ||
                      regForm.orderCategory === "CLEANING" ||
                      regForm.orderCategory === "VENDING" ||
                      regForm.orderCategory === "FIRST_AID_KIT") ? (
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Sporto klubas
                        </label>
                        <select
                          value={regForm.clubId}
                          onChange={(e) => {
                            const clubId = e.target.value;
                            const productsForCategory = products.filter(
                              (p) =>
                                p.category === regForm.orderCategory &&
                                p.is_active !== false,
                            );
                            setRegForm({
                              ...regForm,
                              clubId,
                              inventoryData: productsForCategory.map((p) => {
                                return {
                                  productId: p.id,
                                  addedQty: 0,
                                  orderQty: 0,
                                  isManualOrder: false,
                                };
                              }),
                            });
                          }}
                          className={cn(
                            "w-full px-3 py-2 bg-white border rounded-lg text-sm font-medium",
                            regValidationErrors.clubId
                              ? "border-red-500"
                              : "border-slate-200",
                          )}
                        >
                          <option value="">Pasirinkite sporto klubą</option>
                          {activeRegistrationClubs.map((c) => (
                            <option
                              key={`club-option-reg-1-${c.id}`}
                              value={c.id}
                            >
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {regValidationErrors.clubId && (
                          <p className="text-[10px] text-red-500 font-bold">
                            {regValidationErrors.clubId}
                          </p>
                        )}
                      </div>

                      {regForm.clubId && (
                        <div className="space-y-3">
                          <div className="px-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Produktai
                            </h4>
                          </div>
                          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                            <div className="bg-slate-100/50 border-b border-slate-200 grid grid-cols-[60px_1fr_80px_120px_100px_120px] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <div className="px-4 py-3 text-center">Foto</div>
                              <div className="px-4 py-3">Produktas</div>
                              <div className="px-4 py-3 text-center">
                                Turi būti
                              </div>
                              <div className="px-4 py-3 text-center">
                                Vietinis sandėlis (Sandėliukas)
                              </div>
                              <div className="px-4 py-3 text-center">
                                Įdėta į salę
                              </div>
                              <div className="px-4 py-3 text-center">
                                Užsakyti (Tiekimas)
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100 bg-white">
                              {products.filter(
                                (p) => p.category === regForm.orderCategory && p.is_active !== false
                              ).length === 0 ? (
                                <div className="p-8 text-center text-slate-500 font-medium text-sm">
                                  {regForm.orderCategory === "FIRST_AID_KIT"
                                    ? "Pridėkite vaistinėlės produktus per Sistemos administravimas"
                                    : "Pridėkite produktus per Sistemos administravimas"}
                                </div>
                              ) : (
                                products
                                  .filter(
                                    (p) =>
                                      p.category === regForm.orderCategory &&
                                      p.is_active !== false,
                                  )
                                  .map((prod) => {
                                  const setting = inventorySettings.find(
                                    (s) =>
                                      s.product_id === prod.id &&
                                      s.club_id === regForm.clubId,
                                  );
                                  const analytics = getProductAnalytics(
                                    prod.id,
                                    setting?.local_stock ||
                                      prod.local_stock_quantity ||
                                      0,
                                    productTransfers,
                                    1,
                                    regForm.clubId,
                                  );
                                  const dataIdx =
                                    regForm.inventoryData.findIndex(
                                      (d) => d.productId === prod.id,
                                    );
                                  if (dataIdx === -1) return null;

                                  const itemData =
                                    regForm.inventoryData[dataIdx];
                                  const hasLocalStock =
                                    (setting?.local_stock ||
                                      prod.local_stock_quantity ||
                                      0) > 0;
                                  const targetQty = setting
                                    ? setting.target_quantity
                                    : prod.target_quantity || 0;
                                  const currentLocalStock = setting
                                    ? setting.local_stock || 0
                                    : prod.local_stock_quantity || 0;

                                  const needsOverrideComment =
                                    hasLocalStock &&
                                    itemData.isManualOrder &&
                                    itemData.orderQty !== itemData.addedQty;
                                  const needsReason =
                                    !hasLocalStock && itemData.orderQty > 0;

                                  return (
                                    <React.Fragment key={prod.id}>
                                      <div
                                        className={cn(
                                          "grid grid-cols-[60px_1fr_80px_120px_100px_120px] text-sm items-center transition-colors border-t border-slate-100 first:border-t-0",
                                          needsOverrideComment || needsReason
                                            ? ""
                                            : "hover:bg-slate-50/30",
                                        )}
                                      >
                                        <div className="px-4 py-3">
                                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                                            {prod?.image_url ? (
                                              <img
                                                src={prod.image_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <Package size={16} />
                                            )}
                                          </div>
                                        </div>
                                        <div className="px-4 py-3 font-medium">
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                              <div className="font-bold text-slate-900 leading-tight">
                                                {prod?.name}
                                              </div>
                                              {!prod.is_custom && (
                                                <div
                                                  className={cn(
                                                    "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight whitespace-nowrap",
                                                    analytics.days_left > 30
                                                      ? "bg-slate-100 text-slate-700"
                                                      : analytics.days_left >=
                                                          14
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700",
                                                  )}
                                                >
                                                  Liko:{" "}
                                                  {Math.round(
                                                    analytics.days_left,
                                                  )}{" "}
                                                  d.
                                                </div>
                                              )}
                                            </div>

                                            {prod.is_custom && (
                                              <div className="mt-1">
                                                <input
                                                  type="text"
                                                  placeholder="Įveskite pavadinimą..."
                                                  value={
                                                    itemData.customName || ""
                                                  }
                                                  onChange={(e) => {
                                                    const newData = [
                                                      ...regForm.inventoryData,
                                                    ];
                                                    newData[dataIdx] = {
                                                      ...itemData,
                                                      customName:
                                                        e.target.value,
                                                    };
                                                    setRegForm({
                                                      ...regForm,
                                                      inventoryData: newData,
                                                    });
                                                  }}
                                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-brand-lime/20 outline-none"
                                                />
                                              </div>
                                            )}

                                            {prod?.mode === "SLOW" && (
                                              <span className="text-[8px] bg-slate-200 px-1 py-0.5 rounded text-slate-500 font-black uppercase inline-block mt-1">
                                                LĖTAS
                                              </span>
                                            )}
                                            <div className="text-[9px] text-slate-400 mt-1 font-medium italic">
                                              {hasLocalStock
                                                ? "Iš sandėlio paimtas kiekis nukeliauja į automatinį užsakymą"
                                                : "Prekė užsakoma tiesiogiai iš centrinio sandėlio"}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="px-4 py-3 text-center text-slate-400 font-mono font-bold">
                                          {targetQty}
                                        </div>
                                        <div className="px-4 py-3 text-center text-slate-500 font-mono font-bold bg-slate-50/50 h-full flex items-center justify-center border-x border-slate-100/50">
                                          {currentLocalStock}
                                        </div>
                                        <div className="px-4 py-3 text-center">
                                          <input
                                            type="number"
                                            min="0"
                                            disabled={!hasLocalStock}
                                            value={itemData.addedQty}
                                            onChange={(e) => {
                                              const val =
                                                parseInt(e.target.value) || 0;
                                              const newData = [
                                                ...regForm.inventoryData,
                                              ];
                                              const updatedItem = {
                                                ...itemData,
                                                addedQty: val,
                                              };
                                              // Auto-fill orderQty if not manual
                                              if (!itemData.isManualOrder) {
                                                updatedItem.orderQty = val;
                                              }
                                              newData[dataIdx] = updatedItem;
                                              setRegForm({
                                                ...regForm,
                                                inventoryData: newData,
                                              });
                                            }}
                                            className={cn(
                                              "w-14 px-1.5 py-1.5 border rounded text-center font-bold focus:outline-none focus:ring-2 focus:ring-brand-lime/20 transition-all",
                                              !hasLocalStock
                                                ? "bg-slate-50 text-slate-300 border-slate-100"
                                                : "bg-white border-slate-200 text-black hover:border-brand-lime",
                                            )}
                                          />
                                        </div>
                                        <div className="px-4 py-3 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <input
                                                type="number"
                                                min="0"
                                                value={itemData.orderQty}
                                                onChange={(e) => {
                                                  const val =
                                                    parseInt(e.target.value) ||
                                                    0;
                                                  const newData = [
                                                    ...regForm.inventoryData,
                                                  ];
                                                  newData[dataIdx] = {
                                                    ...itemData,
                                                    orderQty: val,
                                                    isManualOrder: true,
                                                  };
                                                  setRegForm({
                                                    ...regForm,
                                                    inventoryData: newData,
                                                  });
                                                }}
                                                className={cn(
                                                  "w-14 px-1.5 py-1.5 border rounded text-center font-bold focus:outline-none focus:ring-2 transition-all",
                                                  itemData.isManualOrder
                                                    ? "border-orange-400 bg-orange-50/50 text-orange-600 focus:ring-orange-500/20"
                                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 focus:ring-brand-lime/20",
                                                )}
                                              />
                                              {itemData.isManualOrder && (
                                                <button
                                                  onClick={() => {
                                                    const newData = [
                                                      ...regForm.inventoryData,
                                                    ];
                                                    newData[dataIdx] = {
                                                      ...itemData,
                                                      orderQty:
                                                        itemData.addedQty,
                                                      isManualOrder: false,
                                                    };
                                                    setRegForm({
                                                      ...regForm,
                                                      inventoryData: newData,
                                                    });
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-md transition-colors"
                                                  title="Grąžinti automatinį skaičiavimą"
                                                >
                                                  <X size={12} />
                                                </button>
                                              )}
                                            </div>
                                            {(analytics.reorder_flag ||
                                              itemData.orderQty === 0) &&
                                              analytics.suggested_order_qty >
                                                0 && (
                                                <button
                                                  onClick={() => {
                                                    const newData = [
                                                      ...regForm.inventoryData,
                                                    ];
                                                    newData[dataIdx] = {
                                                      ...itemData,
                                                      orderQty: Math.ceil(
                                                        analytics.suggested_order_qty,
                                                      ),
                                                      isManualOrder: true,
                                                    };
                                                    setRegForm({
                                                      ...regForm,
                                                      inventoryData: newData,
                                                    });
                                                  }}
                                                  className="text-[8px] font-black uppercase text-slate-900 hover:text-black transition-colors bg-brand-lime/20 px-1 py-0.5 rounded border border-brand-lime/30 flex flex-col items-center leading-tight mt-0.5"
                                                >
                                                  <span>
                                                    Siūloma:{" "}
                                                    {Math.ceil(
                                                      analytics.suggested_order_qty,
                                                    )}{" "}
                                                    vnt.
                                                  </span>
                                                  <span className="text-[7px] text-slate-500">
                                                    Pildyti
                                                  </span>
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                      {(needsOverrideComment ||
                                        needsReason) && (
                                        <div
                                          className={cn(
                                            "px-4 py-3 border-t border-slate-100",
                                            needsOverrideComment
                                              ? "bg-amber-50/30"
                                              : "bg-slate-50/50",
                                          )}
                                        >
                                          <div className="flex gap-3 items-start ml-[60px]">
                                            {needsReason ? (
                                              <div className="flex-1 flex gap-3">
                                                <select
                                                  value={
                                                    itemData.reasonType || ""
                                                  }
                                                  onChange={(e) => {
                                                    const newData = [
                                                      ...regForm.inventoryData,
                                                    ];
                                                    newData[dataIdx] = {
                                                      ...itemData,
                                                      reasonType:
                                                        e.target.value,
                                                    };
                                                    setRegForm({
                                                      ...regForm,
                                                      inventoryData: newData,
                                                    });
                                                  }}
                                                  className="w-48 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-brand-lime/20 outline-none"
                                                >
                                                  <option value="">
                                                    Priežastis (privaloma)...
                                                  </option>
                                                  <option value="Dingo (nerandu salėje)">
                                                    Dingo (nerandu salėje)
                                                  </option>
                                                  <option value="Susidėvėjo (išmesta)">
                                                    Susidėvėjo (išmesta)
                                                  </option>
                                                  <option value="Kita">
                                                    Kita
                                                  </option>
                                                </select>
                                                {itemData.reasonType ===
                                                  "Kita" && (
                                                  <input
                                                    type="text"
                                                    placeholder="Nurodykite priežastį..."
                                                    value={
                                                      itemData.reasonComment ||
                                                      ""
                                                    }
                                                    onChange={(e) => {
                                                      const newData = [
                                                        ...regForm.inventoryData,
                                                      ];
                                                      newData[dataIdx] = {
                                                        ...itemData,
                                                        reasonComment:
                                                          e.target.value,
                                                      };
                                                      setRegForm({
                                                        ...regForm,
                                                        inventoryData: newData,
                                                      });
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-lime/20 outline-none"
                                                  />
                                                )}
                                              </div>
                                            ) : (
                                              <div className="flex-1 flex items-center gap-2">
                                                <div className="p-1 bg-amber-100 text-amber-700 rounded shadow-sm">
                                                  <AlertCircle size={12} />
                                                </div>
                                                <input
                                                  type="text"
                                                  placeholder="Komentaras (privalomas - kodėl užsakote kitą kiekį nei paimta)..."
                                                  value={
                                                    itemData.reasonComment || ""
                                                  }
                                                  onChange={(e) => {
                                                    const newData = [
                                                      ...regForm.inventoryData,
                                                    ];
                                                    newData[dataIdx] = {
                                                      ...itemData,
                                                      reasonComment:
                                                        e.target.value,
                                                    };
                                                    setRegForm({
                                                      ...regForm,
                                                      inventoryData: newData,
                                                    });
                                                  }}
                                                  className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-medium placeholder:text-amber-400 focus:ring-2 focus:ring-amber-500/10 outline-none"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                }))}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                              {regForm.orderCategory === "VENDING"
                                ? "Nurodykite esamą likutį automate. Sistema apskaičiuos užsakymą pagal numatytus limitus."
                                : "Įveskite kiekį, kurį ką tik papildėte. Sistema automatiškai apskaičiuos trūkstamą kiekį užsakymui: Užsakymas = Turi būti - Yra dabar."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : regStep === 2 && regForm.orderCategory === "PRINT" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sporto klubas
                          </label>
                          <select
                            value={regForm.clubId}
                            onChange={(e) => {
                              const clubId = e.target.value;
                              const productsForCategory = products.filter(
                                (p) =>
                                  p.category === "PRINT" &&
                                  p.is_active !== false,
                              );
                              setRegForm({
                                ...regForm,
                                clubId,
                                deliveryAddress:
                                  CLUBS.find((c) => c.id === clubId)?.address ||
                                  "",
                                inventoryData: productsForCategory.map((p) => ({
                                  productId: p.id,
                                  addedQty: 0,
                                  orderQty: 0,
                                  isManualOrder: false,
                                })),
                              });
                            }}
                            className={cn(
                              "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium",
                              regValidationErrors.clubId && "border-red-500",
                            )}
                          >
                            <option value="">Pasirinkite sporto klubą</option>
                            {activeRegistrationClubs.map((c) => (
                              <option
                                key={`club-option-reg-2-${c.id}`}
                                value={c.id}
                              >
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Pristatymo adresas
                          </label>
                          <input
                            type="text"
                            placeholder="Adresas..."
                            value={regForm.deliveryAddress}
                            onChange={(e) =>
                              setRegForm({
                                ...regForm,
                                deliveryAddress: e.target.value,
                              })
                            }
                            disabled={!regForm.clubId}
                            className={cn(
                              "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium",
                              !regForm.clubId && "bg-slate-50 opacity-50",
                              regValidationErrors.deliveryAddress &&
                                "border-red-500",
                            )}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Telefono nr.
                          </label>
                          <input
                            type="text"
                            placeholder="+370..."
                            value={regForm.phone}
                            onChange={(e) =>
                              setRegForm({ ...regForm, phone: e.target.value })
                            }
                            disabled={!regForm.clubId}
                            className={cn(
                              "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium",
                              !regForm.clubId && "bg-slate-50 opacity-50",
                              regValidationErrors.phone && "border-red-500",
                            )}
                          />
                        </div>
                      </div>

                      {!regForm.clubId ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <Building2
                            size={32}
                            className="mx-auto mb-3 text-slate-300"
                          />
                          <p className="text-sm font-bold text-slate-400">
                            Pasirinkite sporto klubą, kad matytumėte produktus
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                            <div className="grid grid-cols-[60px_1fr_120px_100px_80px] bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                              <div className="px-4 py-3 text-center">Foto</div>
                              <div className="px-4 py-3">Pavadinimas</div>
                              <div className="px-4 py-3 text-center">
                                Išmatavimai
                              </div>
                              <div className="px-4 py-3 text-center">
                                Pagrindas
                              </div>
                              <div className="px-4 py-3 text-center">
                                Kiekis
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {products
                                .filter(
                                  (p) =>
                                    p.category === "PRINT" &&
                                    p.is_active !== false,
                                )
                                .map((prod) => {
                                  const dataIdx =
                                    regForm.inventoryData.findIndex(
                                      (d) => d.productId === prod.id,
                                    );
                                  if (dataIdx === -1) return null;
                                  const itemData =
                                    regForm.inventoryData[dataIdx];

                                  return (
                                    <div
                                      key={`product-print-${prod.id}`}
                                      className="grid grid-cols-[60px_1fr_120px_100px_80px] items-center py-2 hover:bg-slate-50/50 transition-colors"
                                    >
                                      <div className="px-4 text-center">
                                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center mx-auto">
                                          {prod.image_url ? (
                                            <img
                                              src={prod.image_url}
                                              alt=""
                                              className="w-full h-full object-cover rounded"
                                            />
                                          ) : (
                                            <Printer
                                              size={16}
                                              className="text-slate-400"
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <div className="px-4 text-sm font-bold text-slate-900">
                                        {prod.name}
                                      </div>
                                      <div className="px-4 text-xs text-center text-slate-500 font-medium">
                                        {prod.dimensions || "-"}
                                      </div>
                                      <div className="px-4 text-xs text-center text-slate-500 font-medium">
                                        {prod.material || "-"}
                                      </div>
                                      <div className="px-4 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          value={itemData.orderQty || 0}
                                          onChange={(e) => {
                                            const newData = [
                                              ...regForm.inventoryData,
                                            ];
                                            newData[dataIdx] = {
                                              ...itemData,
                                              orderQty:
                                                parseInt(e.target.value) || 0,
                                            };
                                            setRegForm({
                                              ...regForm,
                                              inventoryData: newData,
                                            });
                                          }}
                                          className="w-14 px-2 py-1 bg-slate-100 border border-transparent rounded text-center text-sm font-bold focus:bg-white focus:border-brand-lime outline-none"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Kita spauda section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Plus size={14} className="text-slate-400" />{" "}
                                Kita spauda
                              </h4>
                              <button
                                onClick={() => {
                                  setRegForm({
                                    ...regForm,
                                    printCustomItems: [
                                      ...regForm.printCustomItems,
                                      {
                                        id: generateUniqueId("pc"),
                                        name: "",
                                        description: "",
                                        quantity: 1,
                                      },
                                    ],
                                  });
                                }}
                                className="text-[10px] font-bold text-slate-400 hover:text-brand-lime uppercase tracking-widest"
                              >
                                + Pridėti kitą
                              </button>
                            </div>

                            {regForm.printCustomItems.length > 0 && (
                              <div className="space-y-3">
                                {regForm.printCustomItems.map((item, idx) => (
                                  <div
                                    key={`custom-print-${item.id}`}
                                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group"
                                  >
                                    <button
                                      onClick={() => {
                                        setRegForm({
                                          ...regForm,
                                          printCustomItems:
                                            regForm.printCustomItems.filter(
                                              (i) => i.id !== item.id,
                                            ),
                                        });
                                      }}
                                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                                            Pavadinimas (privaloma)
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="Pvz: Specialus lipdukas ant durų..."
                                            value={item.name}
                                            onChange={(e) => {
                                              const newItems = [
                                                ...regForm.printCustomItems,
                                              ];
                                              newItems[idx].name =
                                                e.target.value;
                                              setRegForm({
                                                ...regForm,
                                                printCustomItems: newItems,
                                              });
                                            }}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                                            Aprašymas
                                          </label>
                                          <textarea
                                            placeholder="Nurodykite matmenis, medžiagą, papildomą informaciją..."
                                            value={item.description}
                                            onChange={(e) => {
                                              const newItems = [
                                                ...regForm.printCustomItems,
                                              ];
                                              newItems[idx].description =
                                                e.target.value;
                                              setRegForm({
                                                ...regForm,
                                                printCustomItems: newItems,
                                              });
                                            }}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm min-h-[60px]"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                                            Kiekis (privaloma)
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => {
                                              const newItems = [
                                                ...regForm.printCustomItems,
                                              ];
                                              newItems[idx].quantity =
                                                parseInt(e.target.value) || 1;
                                              setRegForm({
                                                ...regForm,
                                                printCustomItems: newItems,
                                              });
                                            }}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                                            Priedas (failas spaudai)
                                          </label>
                                          <div className="flex items-center gap-2">
                                            <label className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:border-brand-lime hover:text-brand-lime cursor-pointer flex items-center justify-center gap-2">
                                              <Upload size={12} />
                                              {item.attachmentId
                                                ? "Keisti failą"
                                                : "Pridėti failą"}
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={async (e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  if (!file) return;
                                                  await handleCustomPrintFileUpload(
                                                    file,
                                                    idx,
                                                  );
                                                }}
                                              />
                                            </label>
                                            {item.attachmentId && (
                                              <div className="p-1.5 bg-brand-lime text-black rounded-lg">
                                                <Check size={14} />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : regStep === 2 && regForm.orderCategory === "OTHER" ? (
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Ką norite užsakyti?
                        </label>
                        <textarea
                          autoFocus
                          value={regForm.title}
                          onChange={(e) =>
                            setRegForm({ ...regForm, title: e.target.value })
                          }
                          placeholder="Laisvos formos tekstas..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm min-h-[150px] font-bold"
                        />
                        {regValidationErrors.title && (
                          <p className="text-[10px] text-red-500 font-bold">
                            {regValidationErrors.title}
                          </p>
                        )}
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                        <AlertCircle
                          size={18}
                          className="text-amber-600 shrink-0"
                        />
                        <p className="text-xs text-amber-800 font-medium">
                          Šis užsakymas bus perduotas OPS komandai peržiūrai.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "grid gap-4",
                          isAssetRegistration ? "grid-cols-3" : "grid-cols-1",
                        )}
                      >
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sporto klubas
                          </label>
                          <select
                            value={regForm.clubId}
                            onChange={(e) => {
                              const newClubId = e.target.value;
                              const defaultAssignee =
                                getDefaultAssigneeForClub(newClubId);
                              setRegForm({
                                ...regForm,
                                clubId: newClubId,
                                equipmentId: "",
                                typeId: "",
                                assigneeId: defaultAssignee?.id || "",
                                coordinatorWarning: !defaultAssignee && !!newClubId,
                              });
                            }}
                            className={cn(
                              "w-full px-3 py-2 bg-white border rounded-lg text-sm font-medium",
                              regValidationErrors.clubId
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-slate-200",
                            )}
                          >
                            <option value="">Pasirinkite sporto klubą</option>
                            {activeRegistrationClubs.map((c) => (
                              <option
                                key={`club-option-reg-3-${c.id}`}
                                value={c.id}
                              >
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {regForm.coordinatorWarning && (
                            <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> Šiam klubui
                              nepriskirtas koordinatorius
                            </p>
                          )}
                          {regValidationErrors.clubId && (
                            <p className="text-[10px] text-red-500 font-bold">
                              {regValidationErrors.clubId}
                            </p>
                          )}
                        </div>

                        {isAssetRegistration && (
                          <>
                            <div className="space-y-1.5 relative">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Gedimas
                              </label>
                              <div
                                className="relative"
                                ref={equipmentDropdownRef}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!regForm.clubId) return;
                                    setIsEquipmentDropdownOpen(
                                      !isEquipmentDropdownOpen,
                                    );
                                  }}
                                  disabled={!regForm.clubId}
                                  className={cn(
                                    "w-full px-3 py-2 bg-white border rounded-lg text-sm font-medium text-left flex items-center justify-between transition-colors",
                                    !regForm.clubId
                                      ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-60"
                                      : "hover:border-slate-300",
                                    regValidationErrors.equipmentId
                                      ? "border-red-500 focus:ring-red-500/20"
                                      : "border-slate-200",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "truncate",
                                      !regForm.clubId &&
                                        "text-slate-400 font-normal",
                                    )}
                                  >
                                    {!regForm.clubId
                                      ? "Pasirinkite klubą pirmiausia"
                                      : displayedEquipmentOptions.find(
                                          (e) => e.id === regForm.equipmentId,
                                        )?.name || "Pasirinkite..."}
                                  </span>
                                  <ChevronDown
                                    size={14}
                                    className={cn(
                                      "text-slate-400 transition-transform",
                                      isEquipmentDropdownOpen && "rotate-180",
                                    )}
                                  />
                                </button>
                                {!regForm.clubId ? (
                                  <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Pasirinkite
                                    sporto klubą prieš ieškant treniruoklio
                                  </p>
                                ) : (
                                  regValidationErrors.equipmentId && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1">
                                      {regValidationErrors.equipmentId}
                                    </p>
                                  )
                                )}

                                <AnimatePresence>
                                  {isEquipmentDropdownOpen &&
                                    regForm.clubId && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[300px]"
                                      >
                                        <div className="p-2 border-b bg-slate-50 sticky top-0">
                                          <div className="relative">
                                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                              autoFocus
                                              type="text"
                                              placeholder="Ieškoti..."
                                              value={equipmentSearchQuery}
                                              onChange={(e) =>
                                                setEquipmentSearchQuery(
                                                  e.target.value,
                                                )
                                              }
                                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-lime/20"
                                            />
                                          </div>
                                        </div>
                                        <div className="overflow-y-auto py-1">
                                          {isEquipmentRegistration &&
                                          equipmentSearchQuery &&
                                          !displayedEquipmentOptions.some(
                                            (e) => e.id !== "other",
                                          ) ? (
                                            <div className="px-3 py-4 text-center space-y-3">
                                              <div className="text-[11px] text-slate-400 font-bold leading-relaxed px-2">
                                                Rezultatų nerasta. Galite
                                                peržiūrėti visą sąrašą.
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEquipmentSearchQuery("");
                                                }}
                                                className="w-full py-2.5 px-4 bg-brand-lime text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-lime/90 transition-all border border-brand-lime shadow-lg shadow-brand-lime/20"
                                              >
                                                Rodyti visus treniruoklius
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setRegForm({
                                                    ...regForm,
                                                    equipmentId: "other",
                                                  });
                                                  setIsEquipmentDropdownOpen(
                                                    false,
                                                  );
                                                  setEquipmentSearchQuery("");
                                                }}
                                                className="w-full py-2.5 px-4 bg-slate-50 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                                              >
                                                + Kitas (ne sąraše)
                                              </button>
                                            </div>
                                          ) : displayedEquipmentOptions.length ===
                                            0 ? (
                                            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium italic">
                                              Nerasta
                                            </div>
                                          ) : (
                                            displayedEquipmentOptions.map(
                                              (e, idx) => (
                                                <button
                                                  key={`${e.id}-${idx}`}
                                                  type="button"
                                                  onClick={() => {
                                                    setRegForm({
                                                      ...regForm,
                                                      equipmentId: e.id,
                                                    });
                                                    setIsEquipmentDropdownOpen(
                                                      false,
                                                    );
                                                    setEquipmentSearchQuery("");
                                                  }}
                                                  className={cn(
                                                    "w-full px-4 py-2 text-left text-sm hover:bg-brand-lime/10 transition-colors",
                                                    regForm.equipmentId === e.id
                                                      ? "bg-brand-lime/20 text-black font-bold"
                                                      : "text-slate-700 font-medium",
                                                  )}
                                                >
                                                  {e.name}{" "}
                                                  {((e as any).number ||
                                                    (e as any).code) && (
                                                    <span className="text-xs text-slate-400">
                                                      (
                                                      {(e as any).number ||
                                                        (e as any).code}
                                                      )
                                                    </span>
                                                  )}
                                                </button>
                                              ),
                                            )
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {regForm.equipmentId === "other" && (
                              <div className="space-y-1.5 relative col-span-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Įveskite pavadinimą
                                </label>
                                <input
                                  type="text"
                                  placeholder="Pavadinimas..."
                                  value={regForm.customEquipmentName}
                                  onChange={(e) =>
                                    setRegForm({
                                      ...regForm,
                                      customEquipmentName: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "w-full px-3 py-2 bg-white border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-lime/20",
                                    regValidationErrors.customEquipmentName
                                      ? "border-red-500 focus:ring-red-500/20"
                                      : "border-slate-200",
                                  )}
                                />
                                {regValidationErrors.customEquipmentName && (
                                  <p className="text-[10px] text-red-500 font-bold">
                                    {regValidationErrors.customEquipmentName}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        <div
                          className={cn(
                            "space-y-1.5 relative",
                            !isAssetRegistration && "hidden",
                          )}
                        >
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isAssetRegistration
                              ? "Gedimo tipas"
                              : "Darbas"}
                          </label>
                          <div className="relative" ref={faultTypeDropdownRef}>
                            <button
                              type="button"
                              onClick={() =>
                                setIsFaultTypeDropdownOpen(
                                  !isFaultTypeDropdownOpen,
                                )
                              }
                              className={cn(
                                "w-full px-3 py-2 bg-white border rounded-lg text-sm font-medium text-left flex items-center justify-between hover:border-slate-300 transition-colors",
                                regValidationErrors.typeId
                                  ? "border-red-500 focus:ring-red-500/20"
                                  : "border-slate-200",
                              )}
                            >
                              <span className="truncate">
                                {displayedIssueTypes.find(
                                  (t) => t.id === regForm.typeId,
                                )?.name || "Pasirinkite..."}
                              </span>
                              <ChevronDown
                                size={14}
                                className={cn(
                                  "text-slate-400 transition-transform",
                                  isFaultTypeDropdownOpen && "rotate-180",
                                )}
                              />
                            </button>
                            {regValidationErrors.typeId && (
                              <p className="text-[10px] text-red-500 font-bold mt-1">
                                {regValidationErrors.typeId}
                              </p>
                            )}

                            <AnimatePresence>
                              {isFaultTypeDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[300px]"
                                >
                                  <div className="p-2 border-b bg-slate-50 sticky top-0">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                      <input
                                        autoFocus
                                        type="text"
                                        placeholder="Ieškoti..."
                                        value={faultTypeSearchQuery}
                                        onChange={(e) =>
                                          setFaultTypeSearchQuery(
                                            e.target.value,
                                          )
                                        }
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-lime/20"
                                      />
                                    </div>
                                  </div>
                                  <div className="overflow-y-auto py-1">
                                    {displayedIssueTypes.filter(
                                      (f) =>
                                        !faultTypeSearchQuery ||
                                        f.name
                                          .toLowerCase()
                                          .includes(
                                            faultTypeSearchQuery.toLowerCase(),
                                          ),
                                    ).length === 0 ? (
                                      <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium italic">
                                        Nerasta
                                      </div>
                                    ) : (
                                      displayedIssueTypes
                                        .filter(
                                          (f) =>
                                            !faultTypeSearchQuery ||
                                            f.name
                                              .toLowerCase()
                                              .includes(
                                                faultTypeSearchQuery.toLowerCase(),
                                              ),
                                        )
                                        .map((t, idx) => (
                                          <button
                                            key={`${t.id}-${idx}`}
                                            type="button"
                                            onClick={() => {
                                              setRegForm({
                                                ...regForm,
                                                typeId: t.id,
                                              });
                                              setIsFaultTypeDropdownOpen(false);
                                              setFaultTypeSearchQuery("");
                                            }}
                                            className={cn(
                                              "w-full px-4 py-2 text-left text-sm hover:bg-brand-lime/10 transition-colors",
                                              regForm.typeId === t.id
                                                ? "bg-brand-lime/20 text-black font-bold"
                                                : "text-slate-700 font-medium",
                                            )}
                                          >
                                            {t.name}
                                          </button>
                                        ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 opacity-60">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            SLA (Valandų)
                          </label>
                          <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-between">
                            <span>{currentSLA} val.</span>
                            <Clock size={14} className="text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5 opacity-60">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Prioritetas
                          </label>
                          <div className="w-full">
                            <PriorityBadge
                              priority={
                                regForm.typeId === "other"
                                  ? regForm.priority
                                  : currentAdminTemplate
                                    ? (currentAdminTemplate.priority as Priority)
                                    : getFaultMeta(regForm.typeId)?.priority ||
                                      regForm.priority ||
                                      "medium"
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {regForm.typeId === "other" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-6"
                        >
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                              <AlertCircle size={14} /> Poveikio vertinimas
                            </label>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-600 block">
                                  Koks šio darbo poveikis klientui?
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    {
                                      id: "Negalima naudotis",
                                      label: "🔴 Negalima naudotis paslauga",
                                      helper: "Pvz. neveikia WC, nėra vandens",
                                    },
                                    {
                                      id: "Trukdo",
                                      label: "🟠 Trukdo naudotis",
                                      helper: "Pvz. neveikia dalis įrangos",
                                    },
                                    {
                                      id: "Netrukdo",
                                      label:
                                        "🟢 Netrukdo (tik estetika / komfortas)",
                                      helper: "Pvz. purvinas langas",
                                    },
                                  ].map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() =>
                                        setRegForm({
                                          ...regForm,
                                          impact: option.id as any,
                                        })
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border text-left transition-all",
                                        regForm.impact === option.id
                                          ? "bg-white border-amber-500 shadow-sm ring-2 ring-amber-500/10"
                                          : "bg-white/50 border-slate-200 hover:border-amber-200",
                                      )}
                                    >
                                      <div className="text-sm font-bold text-slate-700">
                                        {option.label}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                        {option.helper}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-600 block">
                                  Ar tai kelia pavojų klientams ar turtui?
                                </span>
                                <div className="flex gap-2">
                                  {[
                                    { id: true, label: "Taip" },
                                    { id: false, label: "Ne" },
                                  ].map((option) => (
                                    <button
                                      key={String(option.id)}
                                      type="button"
                                      onClick={() =>
                                        setRegForm({
                                          ...regForm,
                                          isDangerous: option.id,
                                        })
                                      }
                                      className={cn(
                                        "flex-1 p-3 rounded-xl border text-center font-bold text-sm transition-all",
                                        regForm.isDangerous === option.id
                                          ? "bg-white border-red-500 text-red-700 shadow-sm ring-2 ring-red-500/10"
                                          : "bg-white/50 border-slate-200 text-slate-500 hover:border-red-200",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Darbo detalizacija
                        </label>
                        <input
                          type="text"
                          placeholder={
                            regForm.typeId === "other"
                              ? "Būtina nurodyti detalizaciją..."
                              : "Kas nutiko?"
                          }
                          value={regForm.title}
                          onChange={(e) =>
                            setRegForm({ ...regForm, title: e.target.value })
                          }
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg text-sm font-bold",
                            regValidationErrors.title
                              ? "border-red-500 focus:ring-red-500/20 bg-red-50"
                              : regForm.typeId === "other" &&
                                  !regForm.title.trim()
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200",
                          )}
                        />
                        {regValidationErrors.title && (
                          <p className="text-[10px] text-red-500 font-bold">
                            {regValidationErrors.title}
                          </p>
                        )}
                      </div>

                      {getFaultMeta(regForm.typeId)?.sopUrl && (
                        <div className="bg-brand-lime/10 p-4 rounded-xl border border-brand-lime/20 flex items-center justify-between animate-in zoom-in-95">
                          <div className="flex items-center gap-3 text-slate-900">
                            <AlertCircle
                              size={20}
                              className="text-brand-lime"
                            />
                            <span className="text-sm font-bold uppercase tracking-tight">
                              SOP Instrukcija prieinama
                            </span>
                          </div>
                          <a
                            href={getFaultMeta(regForm.typeId)?.sopUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-white hover:bg-brand-lime hover:text-black transition-all text-slate-900 rounded-md text-xs font-bold border border-slate-200"
                          >
                            Atidaryti
                          </a>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* MEDIA UPLOAD SECTION */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              Multimedija
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Iki 3 foto, 1 video
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            {regForm.attachments.map((file) => (
                              <div
                                key={file.id}
                                className="relative aspect-square group"
                              >
                                {file.type === "image" ? (
                                  <img
                                    src={file.url}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-xl border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-white border border-slate-200 relative overflow-hidden">
                                    <Film size={20} />
                                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/40 text-[8px] truncate text-center">
                                      Video
                                    </div>
                                  </div>
                                )}
                                <button
                                  onClick={() => removeAttachment(file.id)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            {regForm.attachments.length < 4 && (
                              <div className="flex gap-2 aspect-square w-full">
                                <label className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-brand-lime hover:text-brand-lime hover:bg-brand-lime/5 cursor-pointer transition-all">
                                  <Upload size={20} className="mb-1" />
                                  <span className="text-[10px] font-bold">
                                    Kelti
                                  </span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                  />
                                </label>
                                <label className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50 cursor-pointer transition-all">
                                  <Camera size={20} className="mb-1" />
                                  <span className="text-[10px] font-bold">
                                    Foto
                                  </span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileUpload}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-5 border-t bg-slate-50/50 flex gap-3">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setRegValidationErrors({});
                    }}
                    className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Atšaukti
                  </button>
                  {regStep === 2 && (
                    <button
                      onClick={handleRegister}
                      className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                      {isOrderRegistration || regForm.orderCategory
                        ? "Užsakyti"
                        : "Registruoti"}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CLOSURE MODAL */}
        <AnimatePresence>
          {isClosureModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-slate-50 text-brand-lime rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Darbas pašalintas?
                </h3>
                <p className="text-slate-500 mb-8">
                  Prieš užbaigdami, patikslinkite situaciją dėl pasikartojimo.
                </p>

                <div className="grid gap-3">
                  <button
                    onClick={() => handleClosure(false)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-700 transition-all text-left flex items-center justify-between group"
                  >
                    Vienkartinis gedimas
                    <ChevronRight
                      size={20}
                      className="text-slate-300 group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button
                    onClick={() => handleClosure(true)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-700 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-slate-900">
                        Pasikartojantis darbas
                      </span>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                        Bus sukurta užduotis vadovui
                      </p>
                    </div>
                    <History
                      size={20}
                      className="text-brand-lime group-hover:rotate-12 transition-transform"
                    />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <WaitingForPartsModal
          isOpen={isWaitingModalOpen}
          onClose={() => {
            setIsWaitingModalOpen(false);
            setActiveFaultId(null);
          }}
          onSubmit={handleWaitingDetailsSubmit}
          faultTitle={faults.find((f) => f.id === activeFaultId)?.title || ""}
          isExtensionOnly={
            activeFaultId
              ? faults.find((f) => f.id === activeFaultId)?.status ===
                Status.WAITING_DETAILS
              : false
          }
          isBulk={false}
        />

        <InsightModal
          isOpen={isInsightModalOpen}
          onClose={() => {
            setIsInsightModalOpen(false);
            setIsSopModalOpen(true);
          }}
          fault={
            activeFaultId
              ? faults.find((f) => f.id === activeFaultId) || null
              : null
          }
          onSubmit={(text) => {
            handleInsightSubmit(text);
            setIsInsightModalOpen(false);
            setIsSopModalOpen(true);
          }}
          onSkip={() => {
            setIsInsightModalOpen(false);
            setIsSopModalOpen(true);
          }}
        />

        <SopDecisionModal
          isOpen={isSopModalOpen}
          onClose={() => {
            setIsSopModalOpen(false);
            setActiveFaultId(null);
          }}
          fault={
            activeFaultId
              ? faults.find((f) => f.id === activeFaultId) || null
              : null
          }
          onConfirm={handleSopDecision}
        />

        <AnimatePresence>
          {currentTaskId && (
            <TaskDetailView
              task={
                faults.find((f) => f.id === currentTaskId) ||
                tasks.find((t) => t.id === currentTaskId) ||
                INITIAL_FAULTS[0]
              }
              onClose={() => {
                window.history.pushState({}, "", "/darbai");
                setCurrentTaskId(null);
              }}
            />
          )}
        </AnimatePresence>

        <EquipmentSearchModal
          isOpen={isEquipmentSearchModalOpen}
          onClose={() => setIsEquipmentSearchModalOpen(false)}
          clubs={activeRegistrationClubs}
          faults={faults}
          onAddComment={(faultId, text) => {
            const f = faults.find((x) => x.id === faultId);
            if (f) {
              addComment(f, {
                text,
                author: currentUser.name,
              });
              setFaults([...faults]);
              logAudit(
                f.id,
                "COMMENT_ADDED",
                "Pridėtas komentaras per paiešką",
              );
            }
          }}
          onRegisterFault={(clubId, equipmentId) => {
            const equipmentWorkflow = workflowTypes.find(
              (workflow) =>
                workflow.objectType === "EQUIPMENT" &&
                Boolean(workflow.active ?? workflow.enabled),
            );
            if (
              !equipmentWorkflow ||
              !canCreateWorkflowCardResolver(
                currentUser,
                equipmentWorkflow.id,
                getWorkflowCreateModuleId(equipmentWorkflow),
              )
            ) {
              resetRegForm();
              setActiveModal(null);
              return;
            }

            setRegForm((prev) => ({
              ...prev,
              category: getRegistrationCompatibilityCategory(equipmentWorkflow),
              workflowTypeId: equipmentWorkflow.id,
              clubId,
              equipmentId,
              typeId:
                equipmentIssueTypesList.length > 0
                  ? equipmentIssueTypesList[0].id
                  : "",
              priority:
                equipmentIssueTypesList.length > 0
                  ? (equipmentIssueTypesList[0].priority as any)
                  : "medium",
            }));
            setRegType(equipmentWorkflow.name);
            setActiveModal("fault");
          }}
        />
      </div>

      {/* @ts-ignore */}
      {import.meta.env?.DEV && (
        <div style={{position:'fixed',bottom:12,right:12,zIndex:9999,background:'#1e1e1e',color:'#fff',padding:'8px 12px',borderRadius:8,fontSize:12,display:'flex',gap:8,alignItems:'center'}} className="hidden sm:flex">
          <span style={{opacity:0.5}}>Dev user:</span>
          <select
            defaultValue={currentUser.id}
            onChange={e => { localStorage.setItem('dev_user_id', e.target.value); window.location.reload(); }}
            style={{background:'#333',color:'#fff',border:'none',borderRadius:4,padding:'2px 6px',fontSize:12}}
          >
            {[
              {id:'u1',name:'Miglė (COORDINATOR)'},
              {id:'u2',name:'Tomas (COORDINATOR)'},
              {id:'u3',name:'Admin (OPS)'},
              {id:'u5',name:'Super Admin (SUPER_ADMIN)'},
              {id:'u6',name:'Buhalterija (ACCOUNTING)'},
              {id:'u8',name:'Administratorius (ADMIN)'},
              {id:'u9',name:'CS Darbuotojas (CS)'}
            ].map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span style={{opacity:0.3}}>|</span>
          <button
            onClick={() => {
              if (confirm('Visi duomenys bus ištrinti ir atstatyti į pradinę būseną. Tęsti?')) {
                clearStorage();
                window.location.reload();
              }
            }}
            style={{background:'transparent',color:'#fca5a5',border:'1px solid #7f1d1d',borderRadius:4,padding:'2px 8px',fontSize:12,cursor:'pointer'}}
          >
            Atstatyti demo
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <MainApp />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/darbai" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// --- Inventory Order View ---

interface InventoryOrderViewProps {
  clubId: string;
  onClose: () => void;
  onSubmit: (payload: OrderPayload) => void;
  state: OrderCategoryState[];
  setState: React.Dispatch<React.SetStateAction<OrderCategoryState[]>>;
  products: Product[];
}

const InventoryOrderView = ({
  clubId,
  onClose,
  onSubmit,
  state,
  setState,
  products,
}: InventoryOrderViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const club = CLUBS.find((c) => c.id === clubId);

  const handleQtyChange = (
    catIdx: number,
    itemIdx: number,
    field: "currentQty" | "orderQty",
    value: string,
  ) => {
    const val = parseInt(value) || 0;
    const newState = [...state];
    const item = newState[catIdx].items[itemIdx];

    if (field === "currentQty") {
      item.currentQty = val;
      const templateItem = inventoryTemplates[catIdx].items[itemIdx];
      item.missingQty = calculateMissing(templateItem.targetQty, val);
      item.orderQty = item.missingQty;
    } else {
      item.orderQty = val;
    }

    setState(newState);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Inventoriaus užsakymas
            </h2>
            <p className="text-sm text-slate-500">
              {club?.name} • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            Atšaukti
          </button>
          <button
            onClick={() =>
              onSubmit({ clubId, type: "order", categories: state })
            }
            className="px-8 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Suformuoti užsakymą
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {state.map((cat, catIdx) => (
          <div key={`inv-cat-${cat.category}-${catIdx}`} className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 border-l-4 border-brand-lime pl-4 uppercase tracking-tighter">
              {cat.category}
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-200">
                    <th className="px-6 py-4 w-24">Foto</th>
                    <th className="px-6 py-4">Prekės pavadinimas</th>
                    <th className="px-6 py-4 text-center">Tikslas</th>
                    <th className="px-6 py-4 text-center">Yra dabar</th>
                    <th className="px-6 py-4 text-center">Trūksta</th>
                    <th className="px-6 py-4 text-center">Užsakyti</th>
                    <th className="px-6 py-4 text-right">Tiekėjai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cat.items.map((itemState, itemIdx) => {
                    const itemTemplate =
                      inventoryTemplates[catIdx].items[itemIdx];
                    return (
                      <tr
                        key={`inv-item-${catIdx}-${itemState.itemId}-${itemIdx}`}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedImage(itemTemplate.image)}
                            className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm flex items-center justify-center bg-slate-50"
                          >
                            {itemTemplate.image ? (
                              <img
                                src={itemTemplate.image}
                                alt={itemTemplate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm">
                            {itemTemplate.name}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                            ID: {itemTemplate.id}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-black text-slate-700">
                            {itemTemplate.targetQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={itemState.currentQty}
                            onChange={(e) =>
                              handleQtyChange(
                                catIdx,
                                itemIdx,
                                "currentQty",
                                e.target.value,
                              )
                            }
                            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-brand-lime/20 focus:border-brand-lime"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-lg text-sm font-black",
                              itemState.missingQty > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-brand-lime/10 text-slate-900",
                            )}
                          >
                            {itemState.missingQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={itemState.orderQty}
                            onChange={(e) =>
                              handleQtyChange(
                                catIdx,
                                itemIdx,
                                "orderQty",
                                e.target.value,
                              )
                            }
                            className={cn(
                              "w-20 px-3 py-2 border rounded-lg text-sm font-black text-center transition-colors",
                              itemState.orderQty > 0
                                ? "bg-brand-lime/10 border-brand-lime/30 text-slate-900 font-black"
                                : "bg-white border-slate-200 text-slate-400",
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <a
                              href={itemTemplate.supplierUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-slate-400 hover:text-brand-lime hover:underline"
                            >
                              Pagrindinis tiekėjas →
                            </a>
                            <a
                              href={itemTemplate.altSupplierUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-slate-400 hover:underline"
                            >
                              Alternatyvus tiekėjas →
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Image Zoom Portal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <div
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
            >
              <img
                src={selectedImage}
                alt="Large preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-colors"
                id="close-zoom"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BoardSummary = React.memo(({ faults }: { faults: Fault[] }) => {
  const stats = (faults || []).reduce(
    (acc, f) => {
      if (!f) return acc;
      const heat = getSLAHeat(f);
      if (heat.color === "overdue") acc.overdue++;
      else if (heat.color === "warning") acc.warning++;
      else acc.ok++;
      return acc;
    },
    { overdue: 0, warning: 0, ok: 0 },
  );

  return (
    <div className="flex items-center gap-4 mb-4 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto w-fit">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-red-500 text-sm">🔴</span>
        <span className="text-[11px] font-bold text-slate-900 tracking-tight">
          {stats.overdue}{" "}
          <span className="text-slate-400 font-medium lowercase">vėluoja</span>
        </span>
      </div>
      <div className="w-px h-3 bg-slate-100" />
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-brand-lime text-sm">🟡</span>
        <span className="text-[11px] font-bold text-slate-900 tracking-tight">
          {stats.warning}
        </span>
      </div>
      <div className="w-px h-3 bg-slate-100" />
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-slate-300 text-sm">⚪</span>
        <span className="text-[11px] font-bold text-slate-900 tracking-tight">
          {stats.ok}
        </span>
      </div>
    </div>
  );
});

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  currentUserRole: string;
  columnFaults: Fault[];
}

const KanbanColumn = React.memo(({
  id,
  title,
  count,
  children,
  currentUserRole,
  columnFaults,
}: KanbanColumnProps) => {
  const displayTitle =
    currentUserRole === "Koordinatorius" &&
    (id === "NAUJAS" || id === Status.NEW)
      ? "LAUKIAMA"
      : formatWorkflowStatusLabel(title);

  // Compute heat stats
  const heatStats = (columnFaults || []).reduce(
    (acc, f) => {
      if (!f) return acc;
      const heat = getSLAHeat(f);
      if (heat.color === "overdue" || heat.color === "critical") acc.overdue++;
      return acc;
    },
    { overdue: 0 },
  );

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={cn(
            "flex flex-col h-full p-2 rounded-xl transition-colors",
            snapshot.isDraggingOver ? "bg-slate-50" : "bg-white",
          )}
        >
          <div
            className={cn(
              "px-2 py-2 border-b-2 mb-3 bg-white",
              heatStats.overdue > 0 ? "border-red-500" : "border-slate-100",
            )}
          >
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <h2 className="font-bold uppercase text-[10px] tracking-widest text-slate-900">
                  {displayTitle} ({count})
                </h2>
                {heatStats.overdue > 0 && (
                  <span
                    className="text-[10px] font-bold text-red-600"
                    title={`${heatStats.overdue} vėluoja`}
                  >
                    ⚠️ {heatStats.overdue}
                  </span>
                )}
              </div>
              <MoreVertical
                size={14}
                className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          <div className="flex-1 space-y-2 px-1">
            {children}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
});

interface FaultCardProps {
  fault: Fault;
  club: Club;
  index: number;
  currentUserName: string;
  onToggleWatch: () => void;
  onMove?: () => void;
  onClick?: () => void;
  onConvertToTask?: (id: string) => void;
  onNavigateToTask?: (id: string) => void;
  onReturnToDarbai?: (id: string) => void;
  onPromoteToProject?: (id: string) => void;
  onRejectSingle?: (id: string) => void;
  currentUserRole?: string;
  onAssign?: (faultId: string, userId: string) => void;
  allUsers?: any[];
}

const FaultCard = React.memo(({
  fault,
  club,
  index,
  currentUserName,
  onToggleWatch,
  onMove,
  onClick,
  onConvertToTask,
  onNavigateToTask,
  onReturnToDarbai,
  onPromoteToProject,
  onRejectSingle,
  currentUserRole,
  onAssign,
  allUsers = [],
}: FaultCardProps) => {
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignDropdownOpen(false);
      }
    };
    if (isAssignDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAssignDropdownOpen]);

  const heat = getSLAHeat(fault);
  const isWatched =
    (fault.watchers || []).some((w) => w.userId === currentUserName) ||
    fault.isWatched;

  const bgColors = {
    ok: "bg-slate-400",
    warning: "bg-brand-lime",
    critical: "bg-red-500",
    overdue: "bg-red-700",
  };

  const textColors = {
    ok: "text-slate-400",
    warning: "text-brand-lime",
    critical: "text-red-500",
    overdue: "text-red-900",
  };

  const borderColors = {
    ok: "border-l-slate-200",
    warning: "border-l-brand-lime",
    critical: "border-l-red-500",
    overdue: "border-l-red-600",
  };

  // Shorten club name
  const shortClubName = club.name.split("(")[0].trim();

  // Get current assignee display name
  const currentAssigneeName =
    typeof fault.assignedTo === "string"
      ? fault.assignedTo || fault.assigneeName || "Niekas"
      : fault.assignedTo.name;
  const assignableUsers = getAssignableUsersForClub(allUsers as User[], club);

  return (
    <Draggable draggableId={fault.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-white rounded-lg border border-slate-200 transition-all relative group overflow-hidden border-l-4 flex flex-col",
            snapshot.isDragging
              ? "shadow-2xl opacity-90 rotate-1 z-50"
              : "shadow-sm hover:shadow-md",
            borderColors[heat.color],
          )}
        >
          {(() => {
            const faultEquipmentId = getFaultEquipmentId(fault);
            const equipment = faultEquipmentId
              ? equipmentList.find((e) => e.id === faultEquipmentId)
              : null;
            const coverUrl =
              fault.coverImage ||
              equipment?.image_url ||
              fault.media?.find((m) => m.type === "image")?.url;
            if (!coverUrl) return null;
            return (
              <div className="w-full aspect-video overflow-hidden border-b border-slate-100 flex-shrink-0">
                <img
                  src={coverUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0";
                  }}
                />
              </div>
            );
          })()}
          <div className="p-2 space-y-1.5">
            {/* PERIODIC INDICATOR */}
            {fault.source === "PERIODIC" && (
              <div className="flex gap-1.5 mb-1">
                <span className="text-[8px] font-black uppercase text-brand-lime bg-brand-lime/10 px-1 py-0.5 rounded flex items-center gap-0.5 border border-brand-lime/10">
                  <History size={8} /> Periodinis
                </span>
                {fault.periodic_type === "MANDATORY" ? (
                  <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100">
                    Privalomas
                  </span>
                ) : (
                  <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                    Optional
                  </span>
                )}
              </div>
            )}

            {/* TOP: Priority and Title */}
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1 shrink-0",
                  fault.priority === "critical"
                    ? "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                    : fault.priority === "high"
                      ? "bg-amber-500"
                      : "bg-slate-400",
                )}
                title={fault.priority}
              />
              <h3 className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2 uppercase tracking-tight flex-1">
                {fault.title}
              </h3>
              <div className="flex gap-1 shrink-0" title={`ID: #${fault.code}`}>
                {fault.sopStatus === "EXISTS" ? (
                  <span className="text-[10px]" title="SOP Yra">
                    📘
                  </span>
                ) : (
                  <span className="text-[10px]" title="SOP Nėra">
                    ⚠️
                  </span>
                )}
              </div>
            </div>

            {/* MIDDLE: Status and SLA */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 font-bold text-[9px] text-slate-400 uppercase tracking-tight">
                {formatWorkflowStatusLabel(fault.status)}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-tight",
                    heat.color === "ok"
                      ? "text-slate-400"
                      : heat.color === "warning"
                        ? "text-brand-lime"
                        : "text-red-600",
                  )}
                >
                  {heat.badgeText}
                </span>
              </div>
            </div>

            {/* BOTTOM: Club and Responsible */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-1.5">
              <div className="flex items-center gap-1 min-w-0">
                <Building2 size={10} className="text-slate-300 shrink-0" />
                <span className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter">
                  {shortClubName}
                </span>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAssignDropdownOpen(!isAssignDropdownOpen);
                  }}
                  className="flex items-center gap-1 shrink-0 bg-slate-50 hover:bg-slate-100 px-1 py-0.5 rounded transition-colors"
                >
                  <UserIcon size={8} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter truncate max-w-[60px]">
                    {currentAssigneeName.split(" ")[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isAssignDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-[60] overflow-hidden"
                    >
                      <div className="p-1 px-2 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                          Priskirti
                        </span>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssign?.(fault.id, currentUserName);
                            setIsAssignDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-brand-lime/10 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-between group"
                        >
                          Aš
                          <Check
                            size={10}
                            className={cn(
                              "text-brand-lime opacity-0",
                              (typeof fault.assignedTo === "string"
                                ? fault.assignedTo
                                : fault.assignedTo.name) === currentUserName &&
                                "opacity-100",
                            )}
                          />
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        {assignableUsers
                          .filter((u) => u.name !== currentUserName)
                          .map((user) => (
                            <button
                              key={user.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssign?.(fault.id, user.id);
                                setIsAssignDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-between"
                            >
                              {user.name}
                              <Check
                                size={10}
                                className={cn(
                                  "text-brand-lime opacity-0",
                                  (typeof fault.assignedTo === "string"
                                    ? fault.assignedTo
                                    : fault.assignedTo.name) === user.name &&
                                    "opacity-100",
                                )}
                              />
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

// --- Audit ---

interface AuditTabProps {
  auditTrail: AuditEntry[];
  faults: Fault[];
  onRollback: (auditId: string) => void;
}

const AuditTab = ({ auditTrail, faults, onRollback }: AuditTabProps) => (
  <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sistemos Auditas</h2>
        <p className="text-slate-500 text-sm">
          Visų atliktų veiksmų ir pakeitimų istorija
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <Clock size={16} />
        Real-time tracking enabled
      </div>
    </div>

    <div className="space-y-4">
      {auditTrail.map((entry, idx) => {
        const fault = faults.find((f) => f.id === entry.faultId);
        return (
          <div key={entry.id} className="relative pl-8 group">
            {/* Timeline Line */}
            {idx !== auditTrail.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-[-16px] w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors" />
            )}

            {/* Timeline Dot */}
            <div
              className={cn(
                "absolute left-0 top-1 w-7 h-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                entry.action === "created"
                  ? "bg-brand-lime"
                  : entry.action === "deleted"
                    ? "bg-red-500"
                    : entry.action === "rollback"
                      ? "bg-red-500"
                      : "bg-slate-400",
              )}
            >
              {entry.action === "created" && (
                <Plus size={12} className="text-white" />
              )}
              {entry.action === "deleted" && (
                <Trash2 size={12} className="text-white" />
              )}
              {entry.action === "rollback" && (
                <History size={12} className="text-white" />
              )}
              {entry.action === "updated" && (
                <Filter size={12} className="text-white" />
              )}
              {entry.action === "status_change" && (
                <ArrowRight size={12} className="text-white" />
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {entry.action.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                      ID: {entry.id}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">
                      {entry.user}
                    </span>
                    : {entry.description}
                  </p>
                  {entry.metadata && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      {entry.metadata.reason && (
                        <div className="flex gap-2 text-xs">
                          <span className="font-bold text-slate-400 min-w-[70px]">
                            Priežastis:
                          </span>
                          <span className="text-slate-600 italic">
                            "{entry.metadata.reason}"
                          </span>
                        </div>
                      )}
                      {entry.metadata.nextAction && (
                        <div className="flex gap-2 text-xs">
                          <span className="font-bold text-slate-400 min-w-[70px]">
                            Sekantis:
                          </span>
                          <span className="text-slate-600 font-medium">
                            {entry.metadata.nextAction}
                          </span>
                        </div>
                      )}
                      {entry.metadata.newSla && (
                        <div className="flex gap-2 text-xs">
                          <span className="font-bold text-slate-400 min-w-[70px]">
                            Naujas SLA:
                          </span>
                          <span className="text-slate-600 font-medium">
                            {new Date(entry.metadata.newSla).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {entry.previousState && (
                  <button
                    onClick={() => onRollback(entry.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <History size={14} />
                    Atstatyti
                  </button>
                )}
              </div>

              {/* Fault Context */}
              {fault && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {fault.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                        Reg. ID: {fault.code} | Klubas:{" "}
                        {CLUBS.find((c) => c.id === fault.clubId)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Differences */}
              {entry.changes && (
                <div className="mt-4 pt-4 border-t border-slate-50 grid gap-2">
                  {Object.entries(entry.changes).map(([field, delta]) => (
                    <div
                      key={`audit-change-${entry.id}-${field}`}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="w-24 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        {field}:
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md line-through opacity-60">
                          {String(delta.from)}
                        </span>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                          {String(delta.to)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const ConversionModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ConversionMode) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
          >
            <div className="p-8">
              <div className="w-16 h-16 bg-brand-lime/10 rounded-2xl flex items-center justify-center text-slate-800 mb-6 mx-auto">
                <LayoutDashboard size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center mb-2">
                Inicijuoti projektą
              </h2>
              <p className="text-slate-500 text-center text-sm font-medium mb-8">
                Šis darbas bus paverstas projektu ir liks Darbai modulyje. Atsakingas: OPS.
              </p>

              <button
                onClick={() => onConfirm("PROJECT")}
                className="w-full p-4 bg-slate-50 hover:bg-brand-lime/5 border border-slate-200 hover:border-brand-lime/20 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Inicijuoti projektą
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-tight">
                      Sukuria projekto kortelę tame pačiame Darbai kanban lentoje
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
              >
                Atšaukti
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

