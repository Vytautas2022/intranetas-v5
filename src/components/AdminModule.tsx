import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  MapPin,
  Wrench,
  Dumbbell,
  Activity,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Building,
  Users,
  Search,
  QrCode,
  Copy,
  Check,
  Package,
  RotateCcw as History,
  RefreshCw,
  FileText,
} from "lucide-react";
import { AuditAdmin } from "./AuditAdmin";
import { createAuditLogEntry } from "../logic/auditLogic";
import { cn } from "../lib/utils";
import { getProductAnalytics } from "../logic/inventoryLogic";
import { generateUniqueId } from "../logic/idLogic";
import { productTransfers } from "../mock-db/transfers";
import { clubs as initialClubs, Club } from "../mock-db/clubs";
import {
  facilityTemplates as initialFacilityTemplates,
  equipmentList as initialEquipment,
  equipmentIssueTypesList as initialEquipmentIssueTypes,
  productsList as initialProducts,
  clubInventorySettingsList as initialInventorySettings,
  suppliersList as initialSuppliers,
  Product,
  ClubInventorySetting,
  ProductCategory,
  Supplier,
  printMaterials,
} from "../mock-db/admin";
import { users as initialUsers, User } from "../mock-db/users";
import { initialCities, City } from "../mock-db/cities";

interface AdminModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  inventorySettings: ClubInventorySetting[];
  setInventorySettings: React.Dispatch<
    React.SetStateAction<ClubInventorySetting[]>
  >;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  cities: City[];
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
  facilityTemplates: any[];
  setFacilityTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  equipmentList: any[];
  setEquipmentList: React.Dispatch<React.SetStateAction<any[]>>;
  equipmentIssueTypes: any[];
  setEquipmentIssueTypes: React.Dispatch<React.SetStateAction<any[]>>;
  periodicTemplates: any[];
  setPeriodicTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  clubTaskConfigs: any[];
  setClubTaskConfigs: React.Dispatch<React.SetStateAction<any[]>>;
  tasks: any[];
  renderPeriodicModule?: () => React.ReactNode;
  activeTab?:
    | "clubs"
    | "facility"
    | "equipment"
    | "equipment_issues"
    | "cities"
    | "users"
    | "inventory"
    | "periodic_templates"
    | "periodiniai";
  onTabChange?: (
    tab:
      | "clubs"
      | "facility"
      | "equipment"
      | "equipment_issues"
      | "cities"
      | "users"
      | "inventory"
      | "periodic_templates"
      | "periodiniai",
  ) => void;
  inventorySubTab?: "products" | "suppliers" | "inventory_settings";
  onSubTabChange?: (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  products,
  setProducts,
  inventorySettings,
  setInventorySettings,
  suppliers,
  setSuppliers,
  clubs,
  setClubs,
  users,
  setUsers,
  cities,
  setCities,
  facilityTemplates,
  setFacilityTemplates,
  equipmentList,
  setEquipmentList,
  equipmentIssueTypes,
  setEquipmentIssueTypes,
  periodicTemplates,
  setPeriodicTemplates,
  clubTaskConfigs,
  setClubTaskConfigs,
  tasks,
  renderPeriodicModule,
  inventorySubTab,
  onSubTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // console.log("Current route:", path);

  const tabRoutes: Record<string, string> = {
    cities: "/admin/miestai",
    clubs: "/admin/padaliniai",
    users: "/admin/vartotojai",
    facility: "/admin/patalpu",
    periodic_templates: "/admin/periodiniai-sablonai",
    periodiniai: "/admin/periodiniai",
    equipment: "/admin/treniruokliai",
    equipment_issues: "/admin/gedimo-tipai",
    inventory: "/admin/uzsakymai",
    audit: "/admin/auditas",
  };

  const tabs = [
    { id: "cities", label: "Miestai", icon: Building },
    { id: "clubs", label: "Padaliniai", icon: MapPin },
    { id: "users", label: "Vartotojai", icon: Users },
    { id: "facility", label: "Patalpų darbai", icon: Wrench },
    { id: "equipment", label: "Treniruokliai", icon: Dumbbell },
    { id: "equipment_issues", label: "Gedimo tipas", icon: Activity },
    { id: "inventory", label: "Užsakymai", icon: Package },
    { id: "periodiniai", label: "Periodiniai darbai", icon: RefreshCw },
    { id: "audit", label: "Auditas", icon: FileText },
  ] as const;

  return (
    <div className="p-0 md:p-6 min-h-full md:h-full flex flex-col gap-3 md:gap-6 bg-white md:bg-transparent">
      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-white md:bg-transparent border-b md:border-0 overflow-x-auto scrollbar-hide shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tabRoutes[tab.id])}
            className={`flex items-center gap-2 px-3 py-2 font-semibold text-[13px] transition-colors rounded-lg whitespace-nowrap ${
              path.includes(tabRoutes[tab.id])
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-sm flex flex-col min-h-0 w-full overflow-visible">
        {path.includes(tabRoutes.cities) && (
          <CitiesAdmin cities={cities} setCities={setCities} />
        )}
        {path.includes(tabRoutes.users) && (
          <UsersAdmin users={users} setUsers={setUsers} clubs={clubs} />
        )}
        {path.includes(tabRoutes.clubs) && (
          <ClubsAdmin
            clubs={clubs}
            setClubs={setClubs}
            cities={cities}
            users={users}
            periodicTemplates={periodicTemplates}
            setPeriodicTemplates={setPeriodicTemplates}
          />
        )}
        {path.includes(tabRoutes.facility) && (
          <FacilityTemplatesAdmin
            templates={facilityTemplates}
            setTemplates={setFacilityTemplates}
            clubs={clubs}
          />
        )}
        {path.includes(tabRoutes.periodic_templates) && (
          <PeriodicTemplatesAdmin
            templates={periodicTemplates}
            setTemplates={setPeriodicTemplates}
            clubs={clubs}
            clubTaskConfigs={clubTaskConfigs}
            setClubTaskConfigs={setClubTaskConfigs}
          />
        )}
        {path.includes(tabRoutes.periodiniai) && renderPeriodicModule && (
          <div className="h-full">{renderPeriodicModule()}</div>
        )}
        {path.includes(tabRoutes.equipment) && (
          <EquipmentAdmin
            equipmentList={equipmentList}
            setEquipmentList={setEquipmentList}
            clubs={clubs}
          />
        )}
        {path.includes(tabRoutes.equipment_issues) && (
          <EquipmentIssuesAdmin
            issues={equipmentIssueTypes}
            setIssues={setEquipmentIssueTypes}
          />
        )}
        {path.includes(tabRoutes.inventory) && (
          <ProcurementAdmin
            products={products}
            setProducts={setProducts}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            inventorySettings={inventorySettings}
            setInventorySettings={setInventorySettings}
            clubs={clubs}
            subTab={inventorySubTab as any}
            onSubTabChange={onSubTabChange as any}
          />
        )}
        {path.includes(tabRoutes.audit) && <AuditAdmin />}
      </div>
    </div>
  );
};

// ==========================================
// Submodules
// ==========================================

function AdminModal({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-2 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function ClubsAdmin({
  clubs,
  setClubs,
  cities,
  users,
  periodicTemplates,
  setPeriodicTemplates,
}: {
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  cities: City[];
  users: User[];
  periodicTemplates: any[];
  setPeriodicTemplates: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Club>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = clubs.filter((club) => {
    const cityName =
      (club.city_id
        ? cities.find((c) => c.id === club.city_id)?.name
        : club.city) || "";
    const query = searchQuery.toLowerCase();
    return (
      club.name.toLowerCase().includes(query) ||
      cityName.toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    const trimmedId = (editing.id || "").trim().toLowerCase();

    if (!trimmedId) {
      alert("ID yra privalomas");
      return;
    }

    const isEditing = clubs.some((c) => c.id === editing.originalId);

    if (isEditing) {
      // Check if trying to change ID to an existing one
      if (
        trimmedId !== editing.originalId &&
        clubs.some((c) => c.id === trimmedId)
      ) {
        alert("Šis ID jau naudojamas");
        return;
      }
      const existingClub = clubs.find(c => c.id === editing.originalId);
      setClubs(
        clubs.map((c) =>
          c.id === editing.originalId
            ? ({ ...c, ...editing, id: trimmedId } as Club)
            : c,
        ),
      );

      createAuditLogEntry({
        moduleId: "clubs",
        moduleName: "Padaliniai",
        entityType: "CLUB",
        entityId: trimmedId,
        entityTitle: editing.name || existingClub?.name || "Neįvardintas padalinys",
        actionType: "UPDATED",
        changeDescription: `Redaguotas padalinys: ${editing.name}`,
        locationLabel: "Sistemos administravimas > Padaliniai",
        canRestore: true,
        oldValue: existingClub,
        newValue: { ...existingClub, ...editing, id: trimmedId },
        snapshotBefore: existingClub,
        snapshotAfter: { ...existingClub, ...editing, id: trimmedId }
      });
    } else {
      // Check for uniqueness on creation
      if (clubs.some((c) => c.id === trimmedId)) {
        alert("Šis ID jau naudojamas");
        return;
      }
      const newClub = {
        ...editing,
        id: trimmedId,
        name: editing.name || "",
        city: editing.city || "",
        region: editing.region || editing.city || "",
        is_active: editing.is_active !== false,
      } as Club;
      setClubs([
        ...clubs,
        newClub,
      ]);

      createAuditLogEntry({
        moduleId: "clubs",
        moduleName: "Padaliniai",
        entityType: "CLUB",
        entityId: trimmedId,
        entityTitle: newClub.name,
        actionType: "CREATED",
        changeDescription: `Sukurtas naujas padalinys: ${newClub.name}`,
        locationLabel: "Sistemos administravimas > Padaliniai",
        canRestore: false
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Padaliniai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti padalinio..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({ is_active: true });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti padalinį
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Miestas</th>
              <th className="pb-3 font-medium">Periodiniai šablonai</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => {
                const clubTemplates = periodicTemplates.filter(
                  (t) => t.club_id === club.id,
                );
                return (
                  <tr
                    key={club.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-semibold">{club.name}</td>
                    <td className="py-4 text-slate-500">
                      {club.city_id && cities.find((c) => c.id === club.city_id)
                        ? cities.find((c) => c.id === club.city_id)?.name
                        : club.city}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {clubTemplates.length} Šablonai
                        </span>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Ar norite sukurti bazines periodines užduotis klubui ${club.name}?`,
                              )
                            ) {
                              const standardTemplates = periodicTemplates.filter(
                                (t) =>
                                  t.club_id === "global" || t.club_id === null,
                              );
                              const newTemplates = standardTemplates.map((t) => ({
                                ...t,
                                id: generateUniqueId("pt"),
                                club_id: club.id,
                                club_name: club.name,
                              }));
                              setPeriodicTemplates([
                                ...periodicTemplates,
                                ...newTemplates,
                              ]);
                              alert(`Sukurta ${newTemplates.length} šablonų.`);
                            }
                          }}
                          className="p-1 px-2 border border-slate-200 rounded hover:bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1"
                          title="Kopijuoti bazinius šablonus tam klubui"
                        >
                          <Copy size={12} /> Kopijuoti bazinius
                        </button>
                      </div>
                    </td>
                    <td className="py-4 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing({ ...club, originalId: club.id });
                          setModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`p-2 rounded-lg ${club.is_active !== false ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
                        title={club.is_active !== false ? "Išjungti" : "Įjungti"}
                        onClick={() =>
                          setClubs(
                            clubs.map((c) =>
                              c.id === club.id
                                ? {
                                    ...c,
                                    is_active:
                                      c.is_active === false ? true : false,
                                  }
                                : c,
                            ),
                          )
                        }
                      >
                        <Activity size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredClubs.map((club) => {
          const clubTemplates = periodicTemplates.filter(
            (t) => t.club_id === club.id,
          );
          return (
            <div
              key={club.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{club.name}</h3>
                  <p className="text-sm text-slate-500">
                    {club.city_id && cities.find((c) => c.id === club.city_id)
                      ? cities.find((c) => c.id === club.city_id)?.name
                      : club.city}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${club.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {club.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {clubTemplates.length} Šablonai
                </div>
                <button
                  onClick={() => {
                    const standardTemplates = periodicTemplates.filter(
                      (t) => t.club_id === "global" || t.club_id === null,
                    );
                    const newTemplates = standardTemplates.map((t) => ({
                      ...t,
                      id: generateUniqueId("pt"),
                      club_id: club.id,
                      club_name: club.name,
                    }));
                    setPeriodicTemplates([...periodicTemplates, ...newTemplates]);
                    alert(`Sukurta ${newTemplates.length} šablonų.`);
                  }}
                  className="text-[10px] font-bold text-blue-600 flex items-center gap-1"
                >
                  <Copy size={12} /> Kopijuoti bazinius
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => {
                    setEditing({ ...club, originalId: club.id });
                    setModalOpen(true);
                  }}
                  className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Redaguoti
                </button>
                <button
                  onClick={() =>
                    setClubs(
                      clubs.map((c) =>
                        c.id === club.id
                          ? { ...c, is_active: c.is_active === false ? true : false }
                          : c,
                      ),
                    )
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold",
                    club.is_active !== false
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600",
                  )}
                >
                  {club.is_active !== false ? "Išjungti" : "Įjungti"}
                </button>
              </div>
            </div>
          );
        })}
        {filteredClubs.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.originalId ? "Redaguoti padalinį" : "Naujas padalinys"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID (Unikalus kodas)
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Miestas
            </label>
            {cities.filter((c) => c.is_active).length > 0 ? (
              <select
                value={editing.city_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, city_id: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="">Pasirinkite miestą...</option>
                {cities
                  .filter((c) => c.is_active)
                  .map((c, index) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                value={editing.city || ""}
                onChange={(e) =>
                  setEditing({ ...editing, city: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Adresas
            </label>
            <input
              value={editing.address || ""}
              onChange={(e) =>
                setEditing({ ...editing, address: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Koordinatorius
            </label>
            <select
              value={editing.coordinator_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, coordinator_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Nepriskirtas</option>
              {users
                .filter((u) => u.role === "COORDINATOR" && u.is_active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function CitiesAdmin({
  cities,
  setCities,
}: {
  cities: City[];
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<City>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = () => {
    if (editing.id) {
      const existingCity = cities.find((c) => c.id === editing.id);
      if (existingCity) {
        setCities(
          cities.map((c) =>
            c.id === editing.id ? ({ ...c, ...editing } as City) : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "cities",
          moduleName: "Miestai",
          entityType: "CITY",
          entityId: editing.id,
          entityTitle: editing.name || existingCity.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas miestas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Miestai",
          canRestore: true,
          oldValue: existingCity,
          newValue: { ...existingCity, ...editing },
          snapshotBefore: existingCity,
          snapshotAfter: { ...existingCity, ...editing }
        });
      } else {
        const newCity = {
          ...editing,
          id: editing.id || generateUniqueId("c"),
          name: editing.name || "",
          is_active: editing.is_active !== false,
        } as City;
        setCities([
          ...cities,
          newCity,
        ]);
        createAuditLogEntry({
          moduleId: "cities",
          moduleName: "Miestai",
          entityType: "CITY",
          entityId: newCity.id,
          entityTitle: newCity.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas miestas: ${newCity.name}`,
          locationLabel: "Sistemos administravimas > Miestai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Miestai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti miesto..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({ id: generateUniqueId("c"), is_active: true });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti miestą
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <tr
                  key={city.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{city.name}</td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(city);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${city.is_active !== false ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
                      title={city.is_active !== false ? "Išjungti" : "Įjungti"}
                      onClick={() =>
                        setCities(
                          cities.map((c) =>
                            c.id === city.id
                              ? {
                                  ...c,
                                  is_active: c.is_active === false ? true : false,
                                }
                              : c,
                          ),
                        )
                      }
                    >
                      <Activity size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredCities.map((city) => (
          <div
            key={city.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{city.name}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${city.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {city.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(city);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={`p-2 rounded-lg ${city.is_active !== false ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
                  onClick={() =>
                    setCities(
                      cities.map((c) =>
                        c.id === city.id
                          ? {
                              ...c,
                              is_active: c.is_active === false ? true : false,
                            }
                          : c,
                      ),
                    )
                  }
                >
                  <Activity size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredCities.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.id && cities.find((c) => c.id === editing.id)
            ? "Redaguoti miestą"
            : "Naujas miestas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID (Unikalus kodas)
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              disabled={!!cities.find((c) => c.id === editing.id)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
            disabled={!editing.name || !editing.id}
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function UsersAdmin({
  users,
  setUsers,
  clubs,
}: {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<User>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const ROLES = [
    "ADMIN",
    "OPS",
    "COORDINATOR",
    "CS",
    "EXTERNAL",
    "coordinator",
  ];

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    if (editing.id) {
      const existingUser = users.find((c) => c.id === editing.id);
      if (existingUser) {
        setUsers(
          users.map((c) =>
            c.id === editing.id ? ({ ...c, ...editing } as User) : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "users",
          moduleName: "Vartotojai",
          entityType: "USER",
          entityId: editing.id,
          entityTitle: editing.name || existingUser.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas vartotojas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Vartotojai",
          canRestore: true,
          oldValue: existingUser,
          newValue: { ...existingUser, ...editing },
          snapshotBefore: existingUser,
          snapshotAfter: { ...existingUser, ...editing }
        });
      } else {
        const newUser = {
          ...editing,
          id: editing.id || generateUniqueId("u"),
          name: editing.name || "",
          role: editing.role || "OPS",
          is_active: editing.is_active !== false,
          assigned_clubs: editing.assigned_clubs || [],
        } as User;
        setUsers([
          ...users,
          newUser,
        ]);
        createAuditLogEntry({
          moduleId: "users",
          moduleName: "Vartotojai",
          entityType: "USER",
          entityId: newUser.id,
          entityTitle: newUser.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas vartotojas: ${newUser.name}`,
          locationLabel: "Sistemos administravimas > Vartotojai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  const handleToggleClub = (clubId: string) => {
    const current = editing.assigned_clubs || [];
    if (current.includes(clubId)) {
      setEditing({
        ...editing,
        assigned_clubs: current.filter((id) => id !== clubId),
      });
    } else {
      setEditing({ ...editing, assigned_clubs: [...current, clubId] });
    }
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Vartotojai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti vartotojo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              is_active: true,
              role: "OPS",
              assigned_clubs: [],
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti vartotoją
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Vardas</th>
              <th className="pb-3 font-medium">Rolė</th>
              <th className="pb-3 font-medium">Priskirti klubai</th>
              <th className="pb-3 font-medium">Statusas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{user.name}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-slate-500 max-w-[200px] truncate">
                    {user.assigned_clubs?.length
                      ? user.assigned_clubs
                          .map(
                            (cid) => clubs.find((c) => c.id === cid)?.name || cid,
                          )
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {user.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(user);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${user.is_active !== false ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
                      title={user.is_active !== false ? "Išjungti" : "Įjungti"}
                      onClick={() =>
                        setUsers(
                          users.map((u) =>
                            u.id === user.id
                              ? {
                                  ...u,
                                  is_active: u.is_active === false ? true : false,
                                }
                              : u,
                          ),
                        )
                      }
                    >
                      <Activity size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{user.name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                  {user.role}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {user.is_active !== false ? "Aktyvus" : "Neaktyvus"}
              </span>
            </div>

            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-400 uppercase mr-1">
                Klubai:
              </span>
              {user.assigned_clubs?.length
                ? user.assigned_clubs
                    .map((cid) => clubs.find((c) => c.id === cid)?.name || cid)
                    .join(", ")
                : "-"}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button
                onClick={() => {
                  setEditing(user);
                  setModalOpen(true);
                }}
                className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
              >
                Redaguoti
              </button>
              <button
                onClick={() =>
                  setUsers(
                    users.map((u) =>
                      u.id === user.id
                        ? { ...u, is_active: u.is_active === false ? true : false }
                        : u,
                    ),
                  )
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold",
                  user.is_active !== false
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600",
                )}
              >
                {user.is_active !== false ? "Išjungti" : "Įjungti"}
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.id && users.find((u) => u.id === editing.id)
            ? "Redaguoti vartotoją"
            : "Naujas vartotojas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              disabled={!!users.find((u) => u.id === editing.id)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Vardas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Rolė
            </label>
            <select
              value={editing.role || "OPS"}
              onChange={(e) =>
                setEditing({ ...editing, role: e.target.value as any })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {ROLES.map((r, index) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Priskirti klubai
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {clubs.map((club, index) => (
                <label
                  key={`${club.id}-${index}`}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(editing.assigned_clubs || []).includes(club.id)}
                    onChange={() => handleToggleClub(club.id)}
                    className="w-4 h-4 text-brand-lime rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {club.name}
                  </span>
                </label>
              ))}
              {clubs.length === 0 && (
                <span className="text-xs text-slate-400 p-2">Klubų nėra.</span>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
            disabled={!editing.name || !editing.id}
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function FacilityTemplatesAdmin({
  templates,
  setTemplates,
  clubs,
}: {
  templates: any[];
  setTemplates: any;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter((t) => {
    const clubName =
      t.club_id === null
        ? "Visi (Globalus)"
        : clubs.find((c) => c.id === t.club_id)?.name || t.club_id;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      clubName.toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    if (editing.id) {
      const existing = templates.find((c) => c.id === editing.id);
      if (existing) {
        setTemplates(
          templates.map((c: any) =>
            c.id === editing.id ? { ...c, ...editing } : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "facility",
          moduleName: "Patalpų darbai",
          entityType: "FACILITY_TEMPLATE",
          entityId: editing.id,
          entityTitle: editing.name || existing.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas patalpų darbo šablonas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Patalpų darbai",
          canRestore: true,
          oldValue: existing,
          newValue: { ...existing, ...editing },
          snapshotBefore: existing,
          snapshotAfter: { ...existing, ...editing }
        });
      } else {
        const newTemp = { ...editing, id: editing.id || generateUniqueId("ft") };
        setTemplates([
          ...templates,
          newTemp,
        ]);
        createAuditLogEntry({
          moduleId: "facility",
          moduleName: "Patalpų darbai",
          entityType: "FACILITY_TEMPLATE",
          entityId: newTemp.id,
          entityTitle: newTemp.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas patalpų darbo šablonas: ${newTemp.name}`,
          locationLabel: "Sistemos administravimas > Patalpų darbai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Patalpų darbai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti darbo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              priority: "medium",
              sla_hours: 24,
              club_id: null,
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((t, index) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{t.name}</td>
                  <td className="py-4 text-slate-600">
                    {t.club_id === null
                      ? "Visi (Globalus)"
                      : clubs.find((c) => c.id === t.club_id)?.name || t.club_id}
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(t);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setTemplates(templates.filter((x: any) => x.id !== t.id))
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{t.name}</h4>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5">
                  {t.club_id === null
                    ? "Visi (Globalus)"
                    : clubs.find((c) => c.id === t.club_id)?.name || t.club_id}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    setTemplates(templates.filter((x: any) => x.id !== t.id))
                  }
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti" : "Naujas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value || null })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Visi (Globalus)</option>
              {clubs
                .filter((c) => c.is_active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              SOP nuoroda
            </label>
            <input
              value={editing.sop_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, sop_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Trumpas SOP aprašymas (neprivaloma)
            </label>
            <input
              value={editing.sop_description || ""}
              onChange={(e) =>
                setEditing({ ...editing, sop_description: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function EquipmentAdmin({
  equipmentList,
  setEquipmentList,
  clubs,
}: {
  equipmentList: any[];
  setEquipmentList: any;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [csvError, setCsvError] = useState("");
  const [importStats, setImportStats] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredEquipmentList = equipmentList.filter((eq) => {
    const query = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(query) ||
      eq.number.toLowerCase().includes(query) ||
      (eq.zone || "").toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    if (!editing.club_id) {
      setError("Būtina pasirinkti klubą");
      return;
    }
    // duplicate number check
    const dup = equipmentList.find(
      (e: any) =>
        e.club_id === editing.club_id &&
        e.number === editing.number &&
        e.id !== editing.id,
    );
    if (dup) {
      setError(
        `Klaida: numeris ${editing.number} jau egzistuoja pasirinktame klube.`,
      );
      return;
    }

    if (editing.id) {
      const existing = equipmentList.find((c) => c.id === editing.id);
      if (existing) {
        setEquipmentList(
          equipmentList.map((c: any) =>
            c.id === editing.id
              ? { ...c, ...editing, is_active: editing.is_active !== false }
              : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "equipment",
          moduleName: "Treniruokliai",
          entityType: "EQUIPMENT",
          entityId: editing.id,
          entityTitle: editing.name || existing.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas treniruoklis: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Treniruokliai",
          canRestore: true,
          oldValue: existing,
          newValue: { ...existing, ...editing, is_active: editing.is_active !== false },
          snapshotBefore: existing,
          snapshotAfter: { ...existing, ...editing, is_active: editing.is_active !== false }
        });
      } else {
        const newEq = {
          ...editing,
          id: editing.id || generateUniqueId("eq"),
          is_active: editing.is_active !== false,
        };
        setEquipmentList([
          ...equipmentList,
          newEq,
        ]);
        createAuditLogEntry({
          moduleId: "equipment",
          moduleName: "Treniruokliai",
          entityType: "EQUIPMENT",
          entityId: newEq.id,
          entityTitle: newEq.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas treniruoklis: ${newEq.name}`,
          locationLabel: "Sistemos administravimas > Treniruokliai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
    setError("");
  };

  const handleCsvImport = () => {
    setCsvError("");
    setImportStats(null);
    if (!csvData.trim()) {
      setCsvError("Pridėkite CSV duomenis");
      return;
    }

    const rows = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // We will accumulate updates into a new array to preserve existing
    const newEquipmentList = [...equipmentList];

    for (const row of rows) {
      const parts = row.split(",").map((p) => p.trim());
      if (parts.length < 3) {
        skipped++;
        continue;
      }

      const club_name = parts[0];
      const number = parts[1];
      const name = parts[2];
      const zone = parts[3] || "";
      const qr_url = parts[4] || "";

      const club = clubs.find(
        (c) => c.name.toLowerCase() === club_name.toLowerCase(),
      );
      if (!club) {
        skipped++;
        continue;
      }

      const existingIndex = newEquipmentList.findIndex(
        (e) => e.club_id === club.id && e.number === number,
      );
      if (existingIndex >= 0) {
        newEquipmentList[existingIndex] = {
          ...newEquipmentList[existingIndex],
          name: name,
          zone: zone,
          qr_url: qr_url || newEquipmentList[existingIndex].qr_url,
          is_active: true,
        };
        updated++;
      } else {
        newEquipmentList.push({
          id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          club_id: club.id,
          number: number,
          name: name,
          zone: zone,
          qr_url: qr_url,
          is_active: true,
        });
        created++;
      }
    }

    setEquipmentList(newEquipmentList);
    setImportStats({
      total: rows.length,
      created,
      updated,
      skipped,
    });
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Treniruokliai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti treniruoklio (pavadinimas / nr.)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCsvData("");
              setCsvError("");
              setImportStats(null);
              setCsvModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-200 text-sm"
          >
            Importuoti CSV
          </button>
          <button
            onClick={() => {
              setEditing({
                id: Date.now().toString(),
                club_id: clubs[0]?.id || "",
                is_active: true,
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
          >
            <Plus size={16} /> Pridėti
          </button>
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Foto</th>
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium">Numeris</th>
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Zona</th>
              <th className="pb-3 font-medium text-center">QR</th>
              <th className="pb-3 font-medium">Statusas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipmentList.length > 0 ? (
              filteredEquipmentList.map((eq, index) => (
                <tr
                  key={eq.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4">
                    {eq.image_url ? (
                      <img
                        src={eq.image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase" >
                        EQ
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-slate-600">
                    {clubs.find((c) => c.id === eq.club_id)?.name || eq.club_id}
                  </td>
                  <td className="py-4 font-bold text-black">{eq.number}</td>
                  <td className="py-4 font-semibold">{eq.name}</td>
                  <td className="py-4 text-slate-500">{eq.zone}</td>
                  <td className="py-4 text-center">
                    {eq.qr_url ? (
                      <button
                        onClick={() => {
                          setSelectedQrUrl(eq.qr_url);
                          setQrModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Tikrumo QR"
                      >
                        <QrCode size={18} />
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${eq.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {eq.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(eq);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={`p-2 rounded-lg ${eq.is_active !== false ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
                      title={eq.is_active !== false ? "Išjungti" : "Įjungti"}
                      onClick={() =>
                        setEquipmentList(
                          equipmentList.map((x: any) =>
                            x.id === eq.id
                              ? {
                                  ...x,
                                  is_active: x.is_active === false ? true : false,
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <Activity size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredEquipmentList.map((eq) => (
          <div
            key={eq.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {eq.image_url ? (
                  <img
                    src={eq.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
                    EQ
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">
                    {eq.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No. {eq.number} • {eq.zone}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${eq.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {eq.is_active !== false ? "Aktyvus" : "Neaktyvus"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-50 text-xs">
              <span className="text-slate-500 italic">
                {clubs.find((c) => c.id === eq.club_id)?.name || eq.club_id}
              </span>
              {eq.qr_url && (
                <button
                  onClick={() => {
                    setSelectedQrUrl(eq.qr_url);
                    setQrModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-blue-600 font-bold"
                >
                  <QrCode size={16} /> QR Kodas
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button
                onClick={() => {
                  setEditing(eq);
                  setModalOpen(true);
                }}
                className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
              >
                Redaguoti
              </button>
              <button
                onClick={() =>
                  setEquipmentList(
                    equipmentList.map((x: any) =>
                      x.id === eq.id
                        ? { ...x, is_active: x.is_active === false ? true : false }
                        : x,
                    ),
                  )
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold",
                  eq.is_active !== false
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600",
                )}
              >
                {eq.is_active !== false ? "Išjungti" : "Įjungti"}
              </button>
            </div>
          </div>
        ))}
        {filteredEquipmentList.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti treniruoklį" : "Naujas treniruoklis"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError("");
        }}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="" disabled>
                Pasirinkite klubą
              </option>
              {clubs
                .filter((c) => c.is_active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Numeris
            </label>
            <input
              value={editing.number || ""}
              onChange={(e) =>
                setEditing({ ...editing, number: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="Pvz. T-01"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Zona
            </label>
            <input
              value={editing.zone || ""}
              onChange={(e) => setEditing({ ...editing, zone: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Nuotraukos URL
            </label>
            <input
              value={editing.image_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, image_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              QR nuoroda
            </label>
            <input
              value={editing.qr_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, qr_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="Įklijuokite QR URL (Pvz. http...)"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>

      <AdminModal
        title="Importuoti CSV"
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      >
        <div className="space-y-4">
          {!importStats ? (
            <>
              <div className="text-sm text-slate-600">
                Įklijuokite CSV duomenis. Stulpeliai:{" "}
                <strong>club_name, number, name, zone, qr_url</strong>
                <br />
                <br />
                <span className="text-xs text-slate-400">
                  Pvz:
                  <br />
                  SG Akropolis, BT-01, Bėgimo takelis, Kardio,
                  https://example.com/report?id=123
                </span>
              </div>
              {csvError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-center">
                  <AlertCircle size={16} />
                  {csvError}
                </div>
              )}
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="SG Akropolis, BT-01, Bėgimo takelis, Kardio..."
                className="w-full p-3 border border-slate-200 rounded-lg min-h-[200px] text-sm font-mono whitespace-nowrap overflow-x-auto"
              />
              <button
                onClick={handleCsvImport}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
              >
                Pradėti importavimą
              </button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">
                Importavimas baigtas
              </h3>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">
                    Viso eilučių
                  </div>
                  <div className="text-xl font-black text-slate-800">
                    {importStats.total}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="text-xs text-blue-500 uppercase font-bold">
                    Sukurta naujų
                  </div>
                  <div className="text-xl font-black text-blue-700">
                    {importStats.created}
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-xs text-green-500 uppercase font-bold">
                    Atnaujinta
                  </div>
                  <div className="text-xl font-black text-green-700">
                    {importStats.updated}
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="text-xs text-red-500 uppercase font-bold">
                    Praleista
                  </div>
                  <div className="text-xl font-black text-red-700">
                    {importStats.skipped}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold mt-4"
              >
                Uždaryti
              </button>
            </div>
          )}
        </div>
      </AdminModal>

      <AdminModal
        title="Treniruoklio QR"
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setCopied(false);
        }}
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
            <QrCode size={120} className="text-slate-800" />
          </div>
          <div className="w-full space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase">
              QR URL
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={selectedQrUrl}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedQrUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`p-3 rounded-xl transition-all ${copied ? "bg-green-500 text-white" : "bg-slate-800 text-white hover:bg-slate-700"}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <div className="w-full pt-2">
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "#";
                link.download = "qr_code.png";
                link.click();
              }}
            >
              Atsisiųsti QR nuotrauką
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

function EquipmentIssuesAdmin({
  issues,
  setIssues,
}: {
  issues: any[];
  setIssues: any;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIssues = issues.filter((iss) =>
    iss.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = () => {
    if (editing.id) {
      if (issues.find((c) => c.id === editing.id)) {
        setIssues(
          issues.map((c: any) =>
            c.id === editing.id ? { ...c, ...editing } : c,
          ),
        );
      } else {
        setIssues([
          ...issues,
          { ...editing, id: editing.id || generateUniqueId("ei") },
        ]);
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Gedimo tipas</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti gedimo tipo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              priority: "medium",
              sla_hours: 24,
            });
            setModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Pridėti
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Taikoma</th>
              <th className="pb-3 font-medium">Prioritetas</th>
              <th className="pb-3 font-medium">SLA (Valandos)</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length > 0 ? (
              filteredIssues.map((iss, index) => (
                <tr
                  key={`${iss.id}-${index}`}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{iss.name}</td>
                  <td className="py-4 text-xs font-semibold text-slate-600">
                    {iss.applies_to === "FACILITY"
                      ? "Patalpoms"
                      : iss.applies_to === "EQUIPMENT"
                        ? "Treniruokliams"
                        : "Visiems"}
                  </td>
                  <td className="py-4 uppercase text-xs font-bold">
                    {iss.priority}
                  </td>
                  <td className="py-4">{iss.sla_hours}h</td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(iss);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setIssues(issues.filter((x: any) => x.id !== iss.id))
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredIssues.map((iss, index) => (
          <div
            key={`${iss.id}-${index}`}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{iss.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                  Taikoma: {iss.applies_to === 'FACILITY' ? 'Patalpoms' : iss.applies_to === 'EQUIPMENT' ? 'Treniruokliams' : 'Visiems'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                {iss.priority}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50">
              <span className="text-slate-500">SLA: <span className="font-bold text-slate-800">{iss.sla_hours}h</span></span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(iss);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setIssues(issues.filter((x: any) => x.id !== iss.id))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredIssues.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti tipą" : "Naujas tipas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Taikoma
            </label>
            <select
              value={editing.applies_to || "BOTH"}
              onChange={(e) =>
                setEditing({ ...editing, applies_to: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="BOTH">
                Visiems (Patalpoms ir Treniruokliams)
              </option>
              <option value="FACILITY">Tik Patalpoms</option>
              <option value="EQUIPMENT">Tik Treniruokliams</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Prioritetas
            </label>
            <select
              value={editing.priority || "medium"}
              onChange={(e) =>
                setEditing({ ...editing, priority: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              SLA (Valandos)
            </label>
            <input
              type="number"
              value={editing.sla_hours || 0}
              onChange={(e) =>
                setEditing({ ...editing, sla_hours: Number(e.target.value) })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function InventorySettingsAdmin({
  settings,
  setSettings,
  clubs,
  products,
}: {
  settings: ClubInventorySetting[];
  setSettings: React.Dispatch<React.SetStateAction<ClubInventorySetting[]>>;
  clubs: Club[];
  products: Product[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState<
    Partial<ClubInventorySetting> & { index?: number }
  >({});
  const [csvText, setCsvText] = useState("");
  const [importStats, setImportStats] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const handleSave = () => {
    if (editing.club_id && editing.product_id) {
      const newSetting: ClubInventorySetting = {
        club_id: editing.club_id,
        product_id: editing.product_id,
        target_quantity: Number(editing.target_quantity) || 0,
        refill_quantity: Number(editing.refill_quantity) || 0,
        local_stock:
          editing.local_stock !== undefined
            ? Number(editing.local_stock)
            : undefined,
      };

      if (editing.index !== undefined) {
        const newList = [...settings];
        newList[editing.index] = newSetting;
        setSettings(newList);
      } else {
        setSettings([...settings, newSetting]);
      }
    }
    setModalOpen(false);
  };

  const handleImport = () => {
    if (!csvText) return;
    const rows = csvText.split("\n").filter((r) => r.trim());
    let created = 0,
      updated = 0,
      skipped = 0;
    const newSettings = [...settings];

    rows.forEach((row) => {
      const parts = row.split(",").map((p) => p.trim());
      if (parts.length < 4) {
        skipped++;
        return;
      }

      const [clubName, productName, targetQty, refillQty, localStock] = parts;
      const club = clubs.find(
        (c) => c.name.toLowerCase() === clubName.toLowerCase(),
      );
      const product = products.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );

      if (club && product) {
        const existingIndex = newSettings.findIndex(
          (s) => s.club_id === club.id && s.product_id === product.id,
        );
        const entry = {
          club_id: club.id,
          product_id: product.id,
          target_quantity: parseInt(targetQty) || 0,
          refill_quantity: parseInt(refillQty) || 0,
          local_stock: localStock ? parseInt(localStock) : undefined,
        };

        if (existingIndex > -1) {
          newSettings[existingIndex] = entry;
          updated++;
        } else {
          newSettings.push(entry);
          created++;
        }
      } else {
        skipped++;
      }
    });

    setSettings(newSettings);
    setImportStats({ total: rows.length, created, updated, skipped });
  };

  return (
    <div className="p-4 md:p-6 overflow-x-auto h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Inventoriaus nustatymai</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setImportStats(null);
              setCsvText("");
              setImportModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 text-sm"
          >
            Importuoti CSV
          </button>
          <button
            onClick={() => {
              setEditing({});
              setModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> Pridėti
          </button>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium">Produktas</th>
              <th className="pb-3 font-medium text-center">Turi būti</th>
              <th className="pb-3 font-medium text-center">Vietinis sandėlis</th>
              <th className="pb-3 font-medium text-center">Papildymas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s, idx) => (
              <tr
                key={`${s.club_id}-${s.product_id}`}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="py-4 font-semibold">
                  {clubs.find((c) => c.id === s.club_id)?.name}
                </td>
                <td className="py-4 text-slate-600">
                  {products.find((p) => p.id === s.product_id)?.name}
                </td>
                <td className="py-4 text-center font-bold text-blue-600">
                  {s.target_quantity}
                </td>
                <td className="py-4 text-center text-slate-500">
                  {s.local_stock !== undefined ? (
                    <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                      <Check size={12} /> {s.local_stock}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-4 text-center text-slate-500">
                  {s.refill_quantity}
                </td>
                <td className="py-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditing({ ...s, index: idx });
                      setModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setSettings(settings.filter((_, i) => i !== idx))
                    }
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {settings.map((s, idx) => (
          <div
            key={`${s.club_id}-${s.product_id}`}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">
                  {products.find((p) => p.id === s.product_id)?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {clubs.find((c) => c.id === s.club_id)?.name}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing({ ...s, index: idx });
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setSettings(settings.filter((_, i) => i !== idx))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Norma</p>
                <p className="font-black text-blue-600">{s.target_quantity}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Sandėlys</p>
                <p className="font-black text-emerald-600">{s.local_stock ?? '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Papild.</p>
                <p className="font-black text-slate-800">{s.refill_quantity}</p>
              </div>
            </div>
          </div>
        ))}
        {settings.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta nustatymų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.index !== undefined
            ? "Redaguoti nustatymą"
            : "Naujas nustatymas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Pasirinkite klubą...</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Produktas
            </label>
            <select
              value={editing.product_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, product_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Pasirinkite produktą...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Turi būti
              </label>
              <input
                type="number"
                value={editing.target_quantity || 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    target_quantity: Number(e.target.value),
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Papildymas
              </label>
              <input
                type="number"
                value={editing.refill_quantity || 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    refill_quantity: Number(e.target.value),
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  editing.local_stock !== undefined
                    ? "bg-blue-600"
                    : "bg-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={editing.local_stock !== undefined}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditing({ ...editing, local_stock: 0 });
                    } else {
                      const { local_stock, ...rest } = editing;
                      setEditing(rest);
                    }
                  }}
                />
                <div
                  className={cn(
                    "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                    editing.local_stock !== undefined
                      ? "translate-x-5"
                      : "translate-x-0",
                  )}
                />
              </div>
              <span className="text-sm font-bold text-slate-700">
                Naudojamas vietinis sandėlis
              </span>
            </label>
            {editing.local_stock !== undefined && (
              <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kiekis sandėlyje (vnt.)
                </label>
                <input
                  type="number"
                  value={editing.local_stock}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      local_stock: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>

      <AdminModal
        title="CSV Importas"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      >
        {!importStats ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">
              Formatas:{" "}
              <strong>
                club_name, product_name, target_quantity, refill_quantity
              </strong>
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full h-40 p-3 border border-slate-200 rounded-xl font-mono text-xs"
              placeholder="SG Akropolis, Popierinis rankšluostis, 20, 10"
            />
            <button
              onClick={handleImport}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700"
            >
              Importuoti
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-2xl">
              <div className="text-2xl font-bold text-green-600">
                {importStats.total}
              </div>
              <div className="text-sm text-green-700">Iš viso eilučių</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-blue-600">
                  {importStats.created}
                </div>
                <div className="text-[10px] text-slate-500">Sukurta</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-slate-700">
                  {importStats.updated}
                </div>
                <div className="text-[10px] text-slate-500">Atnaujinta</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-red-600">
                  {importStats.skipped}
                </div>
                <div className="text-[10px] text-slate-500">Praleista</div>
              </div>
            </div>
            <button
              onClick={() => setImportModalOpen(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Gerai
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

const CATEGORY_MAP: Record<ProductCategory, string> = {
  INVENTORY: "Smulkus inventorius",
  VENDING: "Vending prekės",
  CLEANING: "Švaros prekės",
  PRINT: "Spauda",
  FIRST_AID_KIT: "Vaistinėlės turinys",
  OTHER: "Kita",
};

function ProcurementAdmin({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  inventorySettings,
  setInventorySettings,
  clubs,
  subTab: externalSubTab,
  onSubTabChange,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  inventorySettings: ClubInventorySetting[];
  setInventorySettings: React.Dispatch<
    React.SetStateAction<ClubInventorySetting[]>
  >;
  clubs: Club[];
  subTab?: "products" | "suppliers" | "inventory_settings";
  onSubTabChange?: (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => void;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<
    "products" | "suppliers" | "inventory_settings"
  >("products");
  const activeTab = externalSubTab || internalActiveTab;
  const setActiveTab = (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [editing, setEditing] = useState<Partial<any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // CSV Import state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvConfigModalOpen, setCsvConfigModalOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [csvResult, setCsvResult] = useState<string>("");

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleUpdateConfig = (
    clubId: string,
    field: "target_quantity" | "local_stock",
    value: number,
  ) => {
    if (!editingProduct) return;
    const existingIndex = inventorySettings.findIndex(
      (s) => s.club_id === clubId && s.product_id === editingProduct.id,
    );
    const newSettings = [...inventorySettings];
    if (existingIndex >= 0) {
      newSettings[existingIndex] = {
        ...newSettings[existingIndex],
        [field]: value,
      };
    } else {
      newSettings.push({
        club_id: clubId,
        product_id: editingProduct.id,
        target_quantity: field === "target_quantity" ? value : 0,
        refill_quantity: 0,
        [field]: value,
      } as ClubInventorySetting);
    }
    setInventorySettings(newSettings);
  };

  const importConfigCsv = () => {
    // CSV format: club_name,product_name,target_quantity,local_stock_quantity
    const lines = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const newSettings = [...inventorySettings];

    lines.forEach((line, idx) => {
      if (idx === 0) return; // skip header
      const parts = line.split(",");
      if (parts.length < 4) {
        skipped++;
        return;
      }
      const [clubName, productName, targetQty, localStock] = parts;

      const club = clubs.find(
        (c) => c.name.toLowerCase() === clubName.toLowerCase(),
      );
      const product = products.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );

      if (!club || !product) {
        skipped++;
        return;
      }

      const existingIndex = newSettings.findIndex(
        (s) => s.club_id === club.id && s.product_id === product.id,
      );
      if (existingIndex >= 0) {
        newSettings[existingIndex] = {
          ...newSettings[existingIndex],
          target_quantity: parseInt(targetQty),
          local_stock: parseInt(localStock),
        };
        updated++;
      } else {
        newSettings.push({
          club_id: club.id,
          product_id: product.id,
          target_quantity: parseInt(targetQty),
          local_stock: parseInt(localStock),
          refill_quantity: 0,
        });
        created++;
      }
    });
    setInventorySettings(newSettings);
    setCsvResult(
      `Sukurta: ${created}, Atnaujinta: ${updated}, Praleista: ${skipped}`,
    );
  };

  const handleSaveSupplier = () => {
    if (editing.id) {
      if (suppliers.find((s) => s.id === editing.id)) {
        setSuppliers(
          suppliers.map((s) =>
            s.id === editing.id ? ({ ...s, ...editing } as Supplier) : s,
          ),
        );
      } else {
        setSuppliers([
          ...suppliers,
          {
            ...editing,
            id: editing.id || Date.now().toString(),
            name: editing.name || "",
            email: editing.email || "",
            is_internal: !!editing.is_internal,
            requires_approval: !!editing.requires_approval,
          } as Supplier,
        ]);
      }
    }
    setModalOpen(false);
  };

  const handleSaveProduct = () => {
    const target = parseInt(editing.target_quantity) || 0;
    const local = parseInt(editing.local_stock_quantity) || 0;

    if (target < 0 || local < 0) {
      alert("Kiekiai negali būti neigiami");
      return;
    }

    const finalLocalStock = editing.has_local_stock ? local : 0;
    const productData = {
      ...editing,
      target_quantity: target,
      local_stock_quantity: finalLocalStock,
    };

    if (editing.id) {
      if (products.find((p) => p.id === editing.id)) {
        setProducts(
          products.map((p) =>
            p.id === editing.id ? ({ ...p, ...productData } as Product) : p,
          ),
        );
      } else {
        setProducts([
          ...products,
          {
            ...productData,
            id: editing.id || Date.now().toString(),
            name: editing.name || "",
            category: editing.category || "OTHER",
            supplier_id: editing.supplier_id || "",
            sku: editing.sku || "",
            is_active: true,
          } as Product,
        ]);
      }
    }
    setModalOpen(false);
  };

  const importCsv = () => {
    const lines = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const newProducts = [...products];

    lines.forEach((line, idx) => {
      if (idx === 0) return; // skip header
      const parts = line.split(",");
      if (parts.length < 3) {
        skipped++;
        return;
      }
      const [name, category, supplierName, hasLocalStock, sku, image_url] =
        parts;

      const supplier = suppliers.find((s) => s.name === supplierName);
      if (!supplier || !Object.keys(CATEGORY_MAP).includes(category)) {
        skipped++;
        return;
      }

      const existingProd = newProducts.find((p) => p.name === name);
      if (existingProd) {
        Object.assign(existingProd, {
          category: category as ProductCategory,
          supplier_id: supplier.id,
          has_local_stock: hasLocalStock === "true",
          sku,
          image_url,
        });
        updated++;
      } else {
        newProducts.push({
          id: Date.now().toString() + Math.random(),
          name,
          category: category as ProductCategory,
          supplier_id: supplier.id,
          has_local_stock: hasLocalStock === "true",
          sku,
          image_url,
          is_active: true,
        });
        created++;
      }
    });
    setProducts(newProducts);
    setCsvResult(
      `Sukurta: ${created}, Atnaujinta: ${updated}, Praleista: ${skipped}`,
    );
  };

  const matches = (query: string, fields: string[]) => {
    return fields.some((f) => f?.toLowerCase().includes(query.toLowerCase()));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.is_active !== false &&
      matches(searchQuery, [
        p.name,
        CATEGORY_MAP[p.category] || p.category,
        suppliers.find((s) => s.id === p.supplier_id)?.name || "",
      ]),
  );

  return (
    <div className="flex flex-col w-full h-auto min-h-0 overflow-visible">
      <div className="flex gap-1 p-2 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-hide shrink-0">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "products"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Produktai
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "suppliers"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Tiekėjai
        </button>
        <button
          onClick={() => setActiveTab("inventory_settings")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "inventory_settings"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Nustatymai
        </button>
      </div>
      <div className="flex-1 overflow-visible p-0 md:p-4">
        {activeTab === "products" ? (
          <div className="p-4 md:p-0 overflow-x-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="font-bold">Produktai</h3>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Ieškoti produkto..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCsvModalOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Importuoti CSV
                  </button>
                  <button
                    onClick={() => setCsvConfigModalOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Nustatymai
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditing({
                      id: Date.now().toString(),
                      is_active: true,
                      has_local_stock: false,
                      category: "OTHER",
                    });
                    setModalOpen(true);
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
                >
                  + Pridėti
                </button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Foto</th>
                    <th className="pb-3 font-medium">Pavadinimas</th>
                    <th className="pb-3 font-medium">Kategorija</th>
                    <th className="pb-3 font-medium">Tiekėjas</th>
                    <th className="pb-3 font-medium">Liko dienų</th>
                    <th className="pb-3 font-medium">Statusas</th>
                    <th className="pb-3 font-medium text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, index) => {
                    const totalStock = inventorySettings
                      .filter((s) => s.product_id === p.id)
                      .reduce((acc, s) => acc + (s.local_stock || 0), 0);

                    const analytics = getProductAnalytics(
                      p.id,
                      totalStock,
                      productTransfers,
                      1,
                    );

                    return (
                      <tr
                        key={`${p.id}-${index}`}
                        className="border-b border-slate-100 items-center hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4">
                          <img
                            src={p.image_url || "https://placehold.co/40x40"}
                            className="w-8 h-8 rounded object-cover"
                          />
                        </td>
                        <td className="py-4">
                          <div className="font-semibold text-slate-900">
                            {p.name}
                          </div>
                          {p.has_local_stock && (
                            <div className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">
                              Bendras likutis: {totalStock} vnt.
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {CATEGORY_MAP[p.category]}
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {suppliers.find((s) => s.id === p.supplier_id)?.name}
                        </td>
                        <td className="py-4">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold",
                              analytics.days_left > 30
                                ? "bg-emerald-50 text-emerald-700"
                                : analytics.days_left >= 14
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700",
                            )}
                          >
                            {Math.round(analytics.days_left)} d.
                          </div>
                        </td>
                        <td className="py-4">
                          {analytics.alert_level === "critical" ? (
                            <div className="flex items-center gap-1 text-red-600 text-xs font-black uppercase">
                              <AlertCircle size={14} /> Kritinis
                            </div>
                          ) : analytics.alert_level === "warning" ? (
                            <div className="flex items-center gap-1 text-amber-600 text-xs font-black uppercase">
                              <AlertCircle size={14} /> Įspėjimas
                            </div>
                          ) : (
                            <div className="text-emerald-600 text-xs font-black uppercase">
                              Optimalus
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg text-xs font-bold"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setConfigModalOpen(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg text-xs font-bold"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setProducts(
                                  products.map((prod) =>
                                    prod.id === p.id
                                      ? { ...prod, is_active: false }
                                      : prod,
                                  ),
                                )
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {filteredProducts.map((p) => {
                const totalStock = inventorySettings
                  .filter((s) => s.product_id === p.id)
                  .reduce((acc, s) => acc + (s.local_stock || 0), 0);

                const analytics = getProductAnalytics(
                  p.id,
                  totalStock,
                  productTransfers,
                  1,
                );

                return (
                  <div
                    key={p.id}
                    className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img
                          src={p.image_url || "https://placehold.co/40x40"}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 leading-tight">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                            {CATEGORY_MAP[p.category]}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                          analytics.days_left > 30
                            ? "bg-emerald-50 text-emerald-700"
                            : analytics.days_left >= 14
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700",
                        )}
                      >
                        {Math.round(analytics.days_left)} d.
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                      <span>Tiekėjas: <span className="text-slate-800">{suppliers.find((s) => s.id === p.supplier_id)?.name}</span></span>
                      {p.has_local_stock && (
                        <span className="text-blue-600">Likutis: {totalStock} vnt.</span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        Redaguoti
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setConfigModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                      >
                        Klubams
                      </button>
                      <button
                        onClick={() =>
                          setProducts(
                            products.map((prod) =>
                              prod.id === p.id
                                ? { ...prod, is_active: false }
                                : prod,
                            ),
                          )
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
              )}
            </div>
          </div>
        ) : activeTab === "suppliers" ? (
          <div className="space-y-4 p-4 md:p-0 overflow-x-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Tiekėjai</h3>
              <button
                onClick={() => {
                  setEditing({
                    id: Date.now().toString(),
                    is_internal: false,
                    requires_approval: true,
                  });
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
              >
                + Pridėti
              </button>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Pavadinimas</th>
                    <th className="pb-3 font-medium">El. paštas</th>
                    <th className="pb-3 font-medium">Tipas</th>
                    <th className="pb-3 font-medium">Reikia patvirtinimo</th>
                    <th className="pb-3 font-medium text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s, index) => (
                    <tr
                      key={`${s.id}-${index}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-4 text-slate-500">{s.email}</td>
                      <td className="py-4 text-slate-500">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.is_internal ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {s.is_internal ? "Vidinis" : "Išorinis"}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500">
                        {s.requires_approval ? "Taip" : "Ne"}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setEditing(s);
                            setModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{s.name}</h4>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.is_internal ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {s.is_internal ? "Vidinis" : "Išorinis"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold pt-2 border-t border-slate-50">
                    <span>Patvirtinimas: <span className="text-slate-800">{s.requires_approval ? "Taip" : "Ne"}</span></span>
                    <button
                      onClick={() => {
                        setEditing(s);
                        setModalOpen(true);
                      }}
                      className="text-blue-600 font-black"
                    >
                      Redaguoti
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <InventorySettingsAdmin
            settings={inventorySettings}
            setSettings={setInventorySettings}
            clubs={clubs}
            products={products}
          />
        )}
      </div>

      <AdminModal
        title={activeTab === "products" ? "Produktas" : "Tiekėjas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        {activeTab === "products" ? (
          <div className="space-y-4">
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Pavadinimas (required)"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <select
              value={editing.category || "OTHER"}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  category: e.target.value as ProductCategory,
                })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {Object.keys(CATEGORY_MAP).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_MAP[c as ProductCategory]}
                </option>
              ))}
            </select>
            {editing.category === "PRINT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editing.dimensions || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, dimensions: e.target.value })
                  }
                  placeholder="Išmatavimai (pvz: A4)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
                <select
                  value={editing.material || "Popierius"}
                  onChange={(e) =>
                    setEditing({ ...editing, material: e.target.value })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Pasirinkite pagrindą</option>
                  {printMaterials.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <select
              value={editing.supplier_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, supplier_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              value={editing.sku || ""}
              onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              placeholder="SKU"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Turi būti klube (vnt.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editing.target_quantity || 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      target_quantity: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Vietinis sandėlis (vnt.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editing.local_stock_quantity || 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      local_stock_quantity: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.has_local_stock}
                onChange={(e) =>
                  setEditing({ ...editing, has_local_stock: e.target.checked })
                }
              />{" "}
              Naudojamas vietinis sandėlis
            </label>
            <button
              onClick={handleSaveProduct}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Išsaugoti
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Pavadinimas"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <input
              value={editing.email || ""}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
              placeholder="El. paštas"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_internal}
                onChange={(e) =>
                  setEditing({ ...editing, is_internal: e.target.checked })
                }
              />{" "}
              Vidinis
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.requires_approval}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    requires_approval: e.target.checked,
                  })
                }
              />{" "}
              Reikia patvirtinimo
            </label>
            <button
              onClick={handleSaveSupplier}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Išsaugoti
            </button>
          </div>
        )}
      </AdminModal>

      <AdminModal
        title="Importuoti produktus"
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      >
        <div className="space-y-4">
          <textarea
            className="w-full h-32 border border-slate-200 rounded-lg p-2 text-xs"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="name,category,supplier_name,has_local_stock,sku,image_url..."
          />
          <button
            onClick={importCsv}
            className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
          >
            Importuoti
          </button>
          {csvResult && (
            <p className="text-sm text-center font-bold text-green-600">
              {csvResult}
            </p>
          )}
        </div>
      </AdminModal>

      <AdminModal
        title="Produkto nustatymai pagal klubą"
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      >
        <div className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Klubas
                </th>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Salėje
                </th>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Sandėlyje
                </th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => {
                const setting = inventorySettings.find(
                  (s) =>
                    s.club_id === club.id &&
                    s.product_id === editingProduct?.id,
                );
                return (
                  <tr key={club.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{club.name}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="w-16 border rounded p-1"
                        value={setting?.target_quantity || 0}
                        onChange={(e) =>
                          handleUpdateConfig(
                            club.id,
                            "target_quantity",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="w-16 border rounded p-1"
                        value={setting?.local_stock || 0}
                        onChange={(e) =>
                          handleUpdateConfig(
                            club.id,
                            "local_stock",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminModal>
    </div>
  );
}

function PeriodicTemplatesAdmin({
  templates,
  setTemplates,
  clubs,
  clubTaskConfigs,
  setClubTaskConfigs,
}: {
  templates: any[];
  setTemplates: any;
  clubs: Club[];
  clubTaskConfigs?: any[];
  setClubTaskConfigs?: any;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  // Group clubs by region
  const clubsByRegion = clubs.reduce(
    (acc, club) => {
      const region = club.region || "Kiti";
      if (!acc[region]) acc[region] = [];
      acc[region].push(club);
      return acc;
    },
    {} as Record<string, Club[]>,
  );

  const handleConfirm = () => {
    if (!setClubTaskConfigs || !clubTaskConfigs) return;

    setClubTaskConfigs(
      clubTaskConfigs.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              ...editing,
              status: "APPROVED",
              reviewed: true,
              reviewed_by: "ADMIN",
              reviewed_at: new Date().toISOString(),
            }
          : c,
      ),
    );
    setModalOpen(false);
  };

  const handleAddTask = () => {
    if (!setClubTaskConfigs || !clubTaskConfigs) return;

    if (!editing.name || !editing.frequency) {
      alert("Užpildykite visus laukus");
      return;
    }

    const templateId = "tpl_" + Date.now().toString();

    if (editing.apply_to_all) {
      // Add to global templates
      setTemplates([
        ...templates,
        {
          id: templateId,
          name: editing.name,
          description: editing.description || "",
          frequency: editing.frequency,
          targetMode: "ALL_CLUBS",
          club_id: null,
        },
      ]);
      // The useEffect will pick this up and auto-generate drafts for all clubs!
    } else {
      if (!editing.club_id) {
        alert("Pasirinkite klubą arba pažymėkite 'Taikyti visiems'");
        return;
      }
      setClubTaskConfigs([
        ...clubTaskConfigs,
        {
          id: "conf_" + Date.now(),
          template_id: templateId,
          club_id: editing.club_id,
          name: editing.name,
          description: editing.description || "",
          frequency: editing.frequency,
          status: "APPROVED", // Since they manually added it, can be approved directly
          reviewed: true,
          modified: true,
        },
      ]);
    }

    setAddTaskModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible bg-white md:bg-slate-50 flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            Periodinių darbų konfigūracija
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Peržiūrėkite ir patvirtinkite periodinius darbus kiekvienam klubui
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ apply_to_all: true, frequency: "monthly" });
            setAddTaskModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#d9f945] text-black rounded-xl font-semibold shadow-sm hover:scale-105 transition-all text-xs md:text-sm relative z-10 shrink-0"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Pridėti užduotį</span><span className="sm:hidden">Pridėti</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
        {/* Sidebar: Regions & Clubs */}
        <div className="lg:col-span-1 bg-white md:rounded-2xl md:border md:border-slate-200 overflow-y-auto w-full p-0 md:p-2 border-b lg:border-0 pb-4">
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide gap-1 md:gap-0">
          {Object.keys(clubsByRegion).map((region) => (
            <div key={region} className="mb-0 lg:mb-4 shrink-0 lg:shrink w-[200px] lg:w-full">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">
                {region}
              </h3>
              <div className="space-y-1">
                {clubsByRegion[region].map((club) => {
                  const clubConfigs = (clubTaskConfigs || []).filter(
                    (c) => c.club_id === club.id,
                  );
                  const hasDrafts = clubConfigs.some(
                    (c) => c.status === "DRAFT",
                  );

                  return (
                    <button
                      key={club.id}
                      onClick={() => setSelectedClub(club.id)}
                      className={cn(
                        "w-full flex flex-col p-3 rounded-xl transition-all text-left",
                        selectedClub === club.id
                          ? "bg-slate-100 ring-1 ring-slate-200"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-sm text-slate-800 truncate pr-2">
                          {club.name}
                        </span>
                        {hasDrafts && (
                          <AlertCircle
                            size={14}
                            className="text-red-500 flex-shrink-0"
                          />
                        )}
                      </div>
                      {hasDrafts && (
                        <span className="text-[10px] text-red-500 font-medium mt-1">
                          Draft
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Main Area: Task List */}
        <div className="lg:col-span-3 bg-white md:rounded-2xl md:border md:border-slate-200 p-0 md:p-6 overflow-y-auto md:shadow-sm">
          {!selectedClub ? (
            <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-center px-6">
                Pasirinkite klubą, kad matytumėte konfigūraciją
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 py-4 md:pt-0 md:pb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {clubs.find((c) => c.id === selectedClub)?.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                {(clubTaskConfigs || [])
                  .filter((c) => c.club_id === selectedClub)
                  .map((config) => (
                    <div
                      key={config.id}
                      onClick={() => {
                        setEditing(config);
                        setModalOpen(true);
                      }}
                      className={cn(
                        "relative overflow-hidden border p-5 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all bg-white group",
                        config.status === "DRAFT"
                          ? "border-red-200 shadow-sm shadow-red-50"
                          : "border-slate-200 hover:border-slate-300 shadow-sm",
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide",
                            config.status === "DRAFT"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-green-50 text-green-600 border border-green-100",
                          )}
                        >
                          {config.status === "DRAFT"
                            ? "Reikia peržiūrėti (Draft)"
                            : "Patvirtinta"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                          {config.frequency}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight pr-4">
                        {config.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={14} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AdminModal
        title="Užduoties peržiūra"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
            <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">
              Pavadinimas
            </div>
            <div className="font-semibold text-slate-800 text-lg">
              {editing.name}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Dažnumas
            </label>
            <select
              value={editing.frequency || ""}
              onChange={(e) =>
                setEditing({ ...editing, frequency: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#d9f945] font-medium text-slate-700"
            >
              <option value="daily">Kasdien</option>
              <option value="weekly">Kas savaitę</option>
              <option value="monthly">Kas mėnesį</option>
              <option value="quarterly">Kas ketvirtį</option>
              <option value="yearly">Kartą metuose</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Instrukcija / Užduotis
            </label>
            <textarea
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#d9f945] min-h-[120px] font-medium text-slate-700"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Uždaryti
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-[#d9f945] text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#c8e63f] transition-colors"
            >
              <Check size={18} /> Patvirtinti
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Add Task Modal */}
      <AdminModal
        title="Pridėti naują"
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Pavadinimas *
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
              placeholder="Pvz. Filtru pakeitimas"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Dažnumas *
            </label>
            <select
              value={editing.frequency || "monthly"}
              onChange={(e) =>
                setEditing({ ...editing, frequency: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
            >
              <option value="daily">Kasdien</option>
              <option value="weekly">Kas savaitę</option>
              <option value="monthly">Kas mėnesį</option>
              <option value="quarterly">Kas ketvirtį</option>
              <option value="yearly">Kartą metuose</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Aprašymas
            </label>
            <textarea
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium min-h-[100px]"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={editing.apply_to_all || false}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  apply_to_all: e.target.checked,
                  club_id: null,
                })
              }
              className="w-5 h-5 text-black border-slate-300 rounded focus:ring-black"
            />
            <span className="font-semibold text-slate-800 text-sm">
              Taikyti visiems klubams
            </span>
          </label>

          {!editing.apply_to_all && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
                Pasirinkite klubą *
              </label>
              <select
                value={editing.club_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, club_id: e.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
              >
                <option value="">-- Nepasirinkta --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleAddTask}
              className="w-full py-3.5 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Pridėti užduotį
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
