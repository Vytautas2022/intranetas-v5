import React, { useState } from "react";
import { ChevronDown, MapPin, Users, X, FlaskConical } from "lucide-react";
import type { User } from "../mock-db/users";
import { useAuth } from "../auth/authContext";
import { buildAuthUserFromMockUser } from "../auth/devUserBuilder";

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_OWNER: "Sistema",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPS: "Operacijos",
  COORDINATOR: "Koordinatorius",
  CS: "CS",
  ACCOUNTING: "Buhalterija",
  EXTERNAL: "Išorinis",
};

const getRegionLabel = (user: User): string => {
  const regions = user.assignedRegionIds?.filter(Boolean) ?? [];
  if (!regions.length) return user.region || "—";
  if (regions.length === 1 && regions[0] === "ALL") return "Visi regionai";
  return regions.join(", ");
};

const getClubsLabel = (user: User): string => {
  const clubs =
    user.assignedClubIds?.filter(Boolean) ??
    user.assigned_clubs?.filter(Boolean) ??
    [];
  if (!clubs.length) return "—";
  if (clubs.length === 1 && clubs[0] === "ALL") return "Visi klubai";
  return `${clubs.length} ${clubs.length === 1 ? "klubas" : "klubai"}`;
};

interface Props {
  users: User[];
}

const DevRoleSwitcherContent: React.FC<Props> = ({ users }) => {
  const { switchDevUser, clearDevUser, impersonatedUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const activeUsers = users.filter((u) => u.is_active !== false);

  const handleSelect = (userId: string) => {
    const user = activeUsers.find((u) => u.id === userId);
    if (!user || !switchDevUser) return;
    switchDevUser(buildAuthUserFromMockUser(user));
    setIsOpen(false);
  };

  const handleClear = () => {
    clearDevUser?.();
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Badge — visible when impersonating */}
      {impersonatedUser && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg">
          <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">
            DEV MODE
          </span>
          <span className="w-px h-3 bg-amber-200" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">
              TESTUOJATE KAIP:
            </span>
            <span className="text-[9px] font-bold text-slate-700">
              {impersonatedUser.name} ·{" "}
              {ROLE_LABELS[impersonatedUser.role] ?? impersonatedUser.role}
            </span>
          </div>
          <button
            onClick={handleClear}
            className="ml-0.5 p-0.5 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors"
            title="Atšaukti testavimą"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Switcher trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen((v) => !v)}
          title="DEV: Testuoti kaip"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
            impersonatedUser
              ? "bg-amber-100 border-amber-300 text-amber-800"
              : "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-300"
          }`}
        >
          <FlaskConical size={12} />
          <span className="hidden sm:inline">Testuoti kaip</span>
          <ChevronDown
            size={11}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                  <FlaskConical size={9} />
                  DEV MODE — Testuoti kaip
                </p>
                <span className="text-[8px] text-amber-500 font-bold">
                  {activeUsers.length} vartotojai
                </span>
              </div>

              <div className="py-1 max-h-80 overflow-y-auto">
                {/* Clear option */}
                {impersonatedUser && (
                  <>
                    <button
                      onClick={handleClear}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <X size={11} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500">
                        Atšaukti testavimą
                      </span>
                    </button>
                    <div className="mx-3 border-t border-slate-100 my-1" />
                  </>
                )}

                {activeUsers.length === 0 && (
                  <p className="px-3 py-4 text-[10px] text-slate-400 text-center">
                    Nėra aktyvių vartotojų
                  </p>
                )}

                {/* User list */}
                {activeUsers.map((user) => {
                  const isActive = impersonatedUser?.id === user.id;
                  const region = getRegionLabel(user);
                  const clubs = getClubsLabel(user);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelect(user.id)}
                      className={`w-full px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? "bg-amber-50 hover:bg-amber-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {user.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                          <MapPin size={8} />
                          {region}
                        </span>
                        <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                          <Users size={8} />
                          {clubs}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const DevRoleSwitcher: React.FC<Props> = ({ users }) => {
  if (!import.meta.env.DEV) return null;
  return <DevRoleSwitcherContent users={users} />;
};
