import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, LogOut, X } from "lucide-react";
import type { AuthUser } from "../../auth/types";
import { cn } from "../../lib/utils";
import type { SidebarItem } from "./sidebarLogic";

interface AppSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: SidebarItem[];
  expandedGroups: string[];
  toggleExpand: (id: string) => void;
  activeTab: string;
  activePeriodicTab: string;
  setActivePeriodicTab: (tab: any) => void;
  setActiveModule: (moduleId: string) => void;
  setActiveTab: (tabId: string) => void;
  navigateToRoute: (route: string) => void;
  pathname: string;
  currentUser: AuthUser;
  onLogout: () => void;
}

export const AppSidebar = ({
  isOpen,
  setIsOpen,
  items,
  expandedGroups,
  toggleExpand,
  activeTab,
  activePeriodicTab,
  setActivePeriodicTab,
  setActiveModule,
  setActiveTab,
  navigateToRoute,
  pathname,
  currentUser,
  onLogout,
}: AppSidebarProps) => (
  <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-[60] md:hidden"
        />
      )}
    </AnimatePresence>

    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 shrink-0 bg-black text-white flex flex-col transition-transform duration-300 md:static md:translate-x-0 shadow-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-lime rounded-xl flex items-center justify-center font-black text-sm text-black">
            S
          </div>
          <span className="font-black text-lg uppercase tracking-tight">
            Sportgates
          </span>
        </div>
        <button
          className="md:hidden text-white/50 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item, idx) => {
          if (item.type === "header") {
            return (
              <p
                key={`sidebar-header-${idx}`}
                className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 mt-8 first:mt-2"
              >
                {item.label}
              </p>
            );
          }

          if (item.type === "group") {
            const isExpanded = Boolean(item.id && expandedGroups.includes(item.id));

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    console.log("Clicked:", item.id);
                    if (item.children && item.children.length > 0 && item.id) {
                      toggleExpand(item.id);
                    } else {
                      if (item.module) setActiveModule(item.module);
                      if (item.tab) setActiveTab(item.tab);
                    }
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all group text-left",
                    item.id && activeTab.startsWith(item.id)
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.icon && (
                    <item.icon
                      size={18}
                      className={cn(
                        "transition-colors",
                        item.id && activeTab.startsWith(item.id)
                          ? "text-white"
                          : "text-white/30 group-hover:text-white",
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      "ml-auto transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-12 space-y-1 py-1">
                        {item.children?.map((child) => {
                          if (child.children) {
                            return (
                              <div key={child.id} className="space-y-1">
                                <div className="flex items-center gap-3 py-2 text-xs font-bold text-white/40">
                                  {child.icon && <child.icon size={14} />}
                                  <span>{child.label}</span>
                                </div>
                                <div className="pl-6 space-y-1">
                                  {child.children.map((subChild: any) => (
                                    <button
                                      key={subChild.id}
                                      onClick={() => {
                                        setActiveModule("darbai");
                                        setActiveTab(subChild.tab);
                                        setIsOpen(false);
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-3 py-2 text-[11px] font-bold transition-colors text-left",
                                        activeTab === subChild.tab
                                          ? "text-brand-lime"
                                          : "text-white/30 hover:text-brand-lime",
                                      )}
                                    >
                                      {subChild.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                setActiveModule("darbai");
                                setActiveTab(child.tab);
                                if ((child as any).subTab) {
                                  if (child.tab === "periodic") {
                                    setActivePeriodicTab((child as any).subTab);
                                  }
                                } else if (child.tab === "periodic") {
                                  setActivePeriodicTab("calendar");
                                }
                                setIsOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 py-2 text-xs font-bold transition-colors text-left",
                                activeTab === child.tab &&
                                  (!(child as any).subTab ||
                                    (child.tab === "periodic" &&
                                      activePeriodicTab ===
                                        (child as any).subTab))
                                  ? "text-brand-lime"
                                  : "text-white/40 hover:text-brand-lime",
                              )}
                            >
                              {child.icon && <child.icon size={14} />}
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.route) navigateToRoute(item.route);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all group text-left",
                item.route && pathname.includes(`/${item.route}`)
                  ? "bg-brand-lime text-black shadow-lg shadow-brand-lime/20"
                  : "text-white/50 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.icon && (
                <item.icon
                  size={18}
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    item.route && pathname.includes(`/${item.route}`)
                      ? "text-black"
                      : "text-white/30",
                  )}
                />
              )}
              {item.label}
              {item.route && pathname.includes(`/${item.route}`) && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime flex items-center justify-center font-black text-sm uppercase text-black">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{currentUser.name}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {currentUser.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-white/50 hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut size={17} className="text-white/30" />
          Atsijungti
        </button>
      </div>
    </aside>
  </>
);
