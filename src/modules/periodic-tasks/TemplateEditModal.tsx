import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  History,
  AlertCircle,
  Search as SearchIcon,
  ChevronDown,
} from "lucide-react";
import { PeriodicTemplate } from "../../mock-db/periodicTemplates";
import { users, User } from "../../mock-db/users";
import { clubs, Club } from "../../mock-db/clubs";
import { equipmentList, equipmentIssueTypesList } from "../../mock-db/admin";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  periodicTaskInstances,
  PeriodicTaskInstance,
} from "../../mock-db/periodicTasks";

interface TemplateEditModalProps {
  template: PeriodicTemplate;
  onClose: () => void;
  onSave: (template: PeriodicTemplate) => void;
}

const AssigneeDropdown = ({
  users,
  selectedUserId,
  onSelect,
  clubs,
  selectedClubId,
  error,
}: {
  users: User[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  clubs: Club[];
  selectedClubId: string;
  error?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  const filteredUsers = users.filter((u) => {
    const roleMatches = [
      "COORDINATOR",
      "OPS",
      "ACCOUNTING",
      "CS",
    ].includes(u.role);
    let cityMatches = true;
    if (selectedClub && selectedClub.city && u.region && u.region !== "ALL") {
      cityMatches = u.region === selectedClub.city;
    }
    const nameMatches = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    return selectedClub
      ? roleMatches && cityMatches && nameMatches
      : nameMatches;
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const groups = {
    Koordinatoriai: filteredUsers.filter(
      (u) => u.role === "COORDINATOR",
    ),
    OPS: filteredUsers.filter((u) => u.role === "OPS"),
    Buhalterija: filteredUsers.filter((u) => u.role === "ACCOUNTING"),
    "Klientų aptarnavimas": filteredUsers.filter((u) => u.role === "CS"),
    Kiti: selectedClub
      ? []
      : users.filter(
          (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !["COORDINATOR", "OPS", "ACCOUNTING", "CS"].includes(
              u.role,
            ),
        ),
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 border bg-white rounded-lg text-sm text-left flex justify-between items-center ${error ? "border-red-500" : "border-slate-200"}`}
      >
        <span className={selectedUser ? "text-slate-900" : "text-slate-500"}>
          {selectedUser ? selectedUser.name : "Pasirinkite atsakingą..."}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2">
          <div className="relative mb-2">
            <SearchIcon
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              autoFocus
              className="w-full pl-8 p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-300"
              placeholder="Ieškoti pagal vardą..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(groups).map(([groupName, groupUsers]) => {
              if (groupUsers.length === 0) return null;
              return (
                <div key={groupName} className="mb-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                    {groupName}
                  </div>
                  {groupUsers.map((u) => (
                    <div
                      key={u.id}
                      className="px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50 rounded"
                      onClick={() => {
                        onSelect(u.id);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      {u.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  template,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<PeriodicTemplate>({ ...template });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find last 3 history from instances
  const history = periodicTaskInstances
    .filter((i) => i.templateId === template.id && i.status === "COMPLETED")
    .sort((a, b) => b.dueDate - a.dueDate)
    .slice(0, 3);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name && !formData.title)
      newErrors.name = "Pavadinimas privalomas";
    if (!formData.id) newErrors.id = "Užduoties ID privalomas";
    if (!formData.assignedTo && !formData.assigned_to)
      newErrors.assignee = "Atsakingas asmuo privalomas";
    if (!formData.targetClubIds || formData.targetClubIds.length === 0) {
      newErrors.clubs = "Pasirinkite klubą";
    }
    if (!formData.frequency) newErrors.frequency = "Periodiškumas privalomas";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  const selectedUser = formData.assignedTo;
  const selectedClubId = formData.targetClubIds?.[0] || "";
  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900 uppercase">
            Redaguoti šabloną
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Užduoties ID
              </label>
              <input
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500"
                value={formData.id}
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                Pavadinimas
                {errors.name && (
                  <span className="text-red-500 normal-case font-normal flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.name}
                  </span>
                )}
              </label>
              <input
                className={`w-full p-2 border rounded-lg text-sm ${errors.name ? "border-red-500" : "border-slate-200"}`}
                value={formData.name || formData.title || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Aprašas / Instrukcija
              </label>
              <RichTextEditor
                value={formData.description || ""}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Įveskite užduoties aprašymą..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                Atsakingas
                {errors.assignee && (
                  <span className="text-red-500 normal-case font-normal flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.assignee}
                  </span>
                )}
              </label>
              <AssigneeDropdown
                users={users}
                clubs={clubs}
                selectedClubId={selectedClubId}
                error={!!errors.assignee}
                selectedUserId={
                  formData.assigned_to ||
                  (formData.assignedTo ? formData.assignedTo.id : "")
                }
                onSelect={(userId) => {
                  const user = users.find((u) => u.id === userId);
                  if (user) {
                    setFormData({
                      ...formData,
                      assigned_to: user.id,
                      assignedTo: {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                      },
                    });
                  } else {
                    setFormData({
                      ...formData,
                      assigned_to: "",
                      assignedTo: undefined,
                    });
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Paskirtis / Modulis
              </label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                value={formData.targetSubmodule || "GENERAL"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetSubmodule: e.target.value as "GENERAL" | "EQUIPMENT_FAULT",
                  })
                }
              >
                <option value="GENERAL">🏢 Patalpų darbai / Bendras</option>
                <option value="EQUIPMENT_FAULT">🏋️ Treniruoklių darbai</option>
                <option value="UZSAKYMAI">📦 Užsakymai</option>
              </select>
            </div>

            {formData.targetSubmodule === "EQUIPMENT_FAULT" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Gedimo tipas (SLA & Prioritetas)
                  </label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={formData.issueTypeId || ""}
                    onChange={(e) => {
                      const issue = equipmentIssueTypesList.find(i => i.id === e.target.value);
                      setFormData({
                        ...formData,
                        issueTypeId: e.target.value,
                        slaHours: issue ? issue.sla_hours : formData.slaHours,
                      });
                    }}
                  >
                    <option value="">Pasirinkite gedimo tipą...</option>
                    {equipmentIssueTypesList.map(issue => (
                      <option key={issue.id} value={issue.id}>{issue.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Konkretus treniruoklis (neprivaloma)
                  </label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={formData.equipmentId || ""}
                    onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  >
                    <option value="">Visi treniruokliai (pagal gedimą)</option>
                    {equipmentList
                      .filter(eq => !selectedClubId || eq.club_id === selectedClubId)
                      .map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name} #{eq.number}</option>
                      ))
                    }
                  </select>
                </div>
              </>
            )}

            {formData.targetSubmodule === "UZSAKYMAI" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Užsakymo tipas
                </label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  value={formData.orderType || "SMULKUS"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderType: e.target.value as "SMULKUS" | "VENDING",
                    })
                  }
                >
                  <option value="SMULKUS">🛠️ Smulkus inventorius</option>
                  <option value="VENDING">🍫 Vending prekės</option>
                  <option value="FIRST_AID_KIT">🩹 Vaistinėlės turinys</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Prioritetas
              </label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                value={formData.priority || "IMPORTANT"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as "IMPORTANT" | "CRITICAL",
                  })
                }
              >
                <option value="CRITICAL">🔴 Kritiškai svarbus</option>
                <option value="IMPORTANT">🟡 Svarbus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                SOP URL
              </label>
              <input
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                value={formData.sopUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sopUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                Periodiškumas
                {errors.frequency && (
                  <span className="text-red-500 normal-case font-normal flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.frequency}
                  </span>
                )}
              </label>
              <select
                className={`w-full p-2 border rounded-lg text-sm ${errors.frequency ? "border-red-500" : "border-slate-200"}`}
                value={
                  formData.frequency === "custom_days"
                    ? "custom"
                    : formData.frequency
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setFormData({
                      ...formData,
                      frequency: "custom_days",
                      customFrequencyMonths: 1,
                    });
                  } else {
                    setFormData({
                      ...formData,
                      frequency: val as any,
                      customFrequencyMonths: undefined,
                    });
                  }
                }}
              >
                <option value="daily">Kasdien</option>
                <option value="weekly">Kas savaitę</option>
                <option value="monthly">Kas mėnesį</option>
                <option value="quarterly">Kas ketvirtį</option>
                <option value="6_months">Kas 6 mėn</option>
                <option value="yearly">Kas metus</option>
                <option value="custom">Custom</option>
              </select>
              {formData.frequency === "custom_days" && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Kas kiek mėnesių?
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={formData.customFrequencyMonths || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customFrequencyMonths: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={!!formData.proofRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proofRequired: e.target.checked,
                        proofConfig: e.target.checked
                          ? {
                              allowedTypes: ["image", "video"],
                              maxFiles: 5,
                              maxTotalVideoSizeMb: 100,
                            }
                          : undefined,
                      })
                    }
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 rounded group-hover:border-slate-300 peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors"></div>
                  <CheckCircle2
                    size={14}
                    className="absolute top-0.5 left-0.5 text-white scale-0 peer-checked:scale-100 transition-transform"
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Būtinas atlikimo įrodymas
                </span>
              </label>
              {formData.proofRequired && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Uždarant užduotį reikės įkelti foto/video
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                  Sporto klubas
                  {errors.clubs && (
                    <span className="text-red-500 normal-case font-normal flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.clubs}
                    </span>
                  )}
                </label>
                <select
                  className={`w-full p-2 border rounded-lg text-sm ${errors.clubs ? "border-red-500" : "border-slate-200"}`}
                  value={selectedClubId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormData({
                      ...formData,
                      targetMode: "SELECTED_CLUBS",
                      targetClubIds: [id],
                    });
                  }}
                >
                  <option value="">Pasirinkite klubą...</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClub && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Regionas
                    </label>
                    <input
                      readOnly
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500"
                      value={selectedClub.region}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Miestas
                    </label>
                    <input
                      readOnly
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500"
                      value={selectedClub.city}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase">
                Tiekėjas
              </h3>
              <div className="space-y-2">
                <input
                  placeholder="Pavadinimas"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  value={formData.supplier?.name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier: { ...formData.supplier!, name: e.target.value },
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Tel. nr."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    value={formData.supplier?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier: {
                          ...formData.supplier!,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    placeholder="El. paštas"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    value={formData.supplier?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier: {
                          ...formData.supplier!,
                          email: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-black text-slate-900 uppercase mb-3 flex items-center gap-2">
                <History size={14} className="text-slate-400" />
                Ankstesni atlikimai
              </h3>
              <div className="space-y-2">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border border-slate-100 rounded-lg text-[10px] flex justify-between items-center group hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-700">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400">
                          {item.supplier || "Tiekėjas nežinomas"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {item.actualCost || 0} €
                        </div>
                        <button className="text-brand-lime hover:underline">
                          Sąskaita
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-[10px] text-slate-400">
                    Ankstesnių atlikimų nėra
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            Atšaukti
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            Išsaugoti
          </button>
        </div>
      </div>
    </div>
  );
};
