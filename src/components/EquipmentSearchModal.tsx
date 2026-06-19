import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, AlertCircle, Plus, MessageSquare, CheckCircle, ChevronDown } from 'lucide-react';
import { getEquipmentAssetObjects } from '../mock-db/assetObjects';
import type { Club } from '../mock-db/clubs';
import { cn } from '../lib/utils';
import { Fault } from '../mock-db/faults';
import { Status } from '../types/faults';
import { getPriorityColor, getPriorityLabel } from '../logic/faultLogic';
import { getFaultEquipmentId } from '../logic/equipmentFaultIdentity';

const equipmentList = getEquipmentAssetObjects();

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  faults: Fault[];
  onAddComment: (faultId: string, comment: string) => void;
  onRegisterFault: (clubId: string, equipmentId: string) => void;
}

export const EquipmentSearchModal = ({ isOpen, onClose, clubs, faults, onAddComment, onRegisterFault }: Props) => {
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');

  const activeClubs = useMemo(
    () => clubs.filter((club) => club.is_active !== false),
    [clubs],
  );

  const filteredEquipment = useMemo(() => {
    if (!selectedClubId) return [];
    return equipmentList
      .filter((e) => e.club_id === selectedClubId && e.is_active !== false)
      .filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.number.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [selectedClubId, searchQuery]);

  // Check if there is an active task for the selected equipment
  const activeTask = useMemo(() => {
    if (!selectedEquipment) return null;
    return faults.find(
      (t) =>
        getFaultEquipmentId(t) === selectedEquipment.id &&
        t.category === 'EQUIPMENT_FAULT' &&
        t.status !== Status.FIXED &&
        t.status !== Status.REJECTED
    );
  }, [selectedEquipment, faults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[800px]"
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Treniruoklių paieška</h2>
              <p className="text-xs text-slate-500 font-medium">Būsena ir gedimų registracija</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50/50">
          {!selectedEquipment ? (
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  1. Pasirinkite sporto klubą (privaloma)
                </label>
                <div className="relative">
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Pasirinkite sporto klubą...</option>
                    {activeClubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {selectedClubId && (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      2. Ieškoti
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ieškoti pagal pavadinimą arba numerį..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0 bg-white border border-slate-200 rounded-xl divide-y">
                    {filteredEquipment.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                        Treniruoklių nerasta
                      </div>
                    ) : (
                      filteredEquipment.map((eq) => {
                         const hasActive = faults.some(
                          (t) =>
                            getFaultEquipmentId(t) === eq.id &&
                            t.category === 'EQUIPMENT_FAULT' &&
                            t.status !== Status.FIXED &&
                            t.status !== Status.REJECTED
                        );

                        return (
                          <button
                            key={eq.id}
                            onClick={() => setSelectedEquipment(eq)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              {eq.image_url ? (
                                <img src={eq.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">EQ</div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {eq.name}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                  <span className="font-medium">#{eq.number}</span>
                                  {eq.zone && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{eq.zone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {hasActive ? (
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded uppercase tracking-tighter border border-red-100 flex items-center gap-1">
                                  <AlertCircle size={12} /> Yra aktyvus gedimas
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-tighter border border-emerald-100 flex items-center gap-1">
                                  <CheckCircle size={12} /> Veikia (aktyvių nėra)
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6 p-1">
              <button
                onClick={() => {
                  setSelectedEquipment(null);
                  setCommentText('');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
              >
                ← Atgal į paiešką
              </button>

              <div className="bg-white border text-center p-6 border-slate-200 rounded-2xl shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">🏋️</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{selectedEquipment.name}</h3>
                <div className="text-lg font-bold text-slate-500 mt-1">#{selectedEquipment.number}</div>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit mx-auto px-4">
                  <span>{clubs.find((c) => c.id === selectedEquipment.club_id)?.name}</span>
                  {selectedEquipment.zone && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{selectedEquipment.zone}</span>
                    </>
                  )}
                </div>
              </div>

              {activeTask ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Yra aktyvus gedimas</h4>
                      <p className="text-xs text-red-600 font-bold uppercase tracking-widest">
                        {activeTask.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider", getPriorityColor(activeTask.priority))}>
                      {getPriorityLabel(activeTask.priority)}
                    </span>
                    <span className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded uppercase tracking-tighter shadow-sm flex items-center gap-1">
                      SLA: {activeTask.slaHours}h
                    </span>
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-xl border border-red-100/50 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pridėti komentarą prie esamo gedimo
                    </label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Papildoma informacija per paiešką..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-[100px] resize-none"
                    />
                    <button
                      onClick={() => {
                        if (!commentText.trim()) return;
                        onAddComment(activeTask.id, commentText);
                        setCommentText('');
                        onClose();
                      }}
                      disabled={!commentText.trim()}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageSquare size={16} /> Pridėti komentarą
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">Treniruoklis veikia</h4>
                  <p className="text-sm text-emerald-600 font-medium mb-6">
                    Aktyvių gedimų nerasta. Jei pastebėjote gedimą, galite jį užregistruoti.
                  </p>
                  
                  <button
                    onClick={() => {
                      onRegisterFault(selectedEquipment.club_id, selectedEquipment.id);
                      onClose();
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    <Plus size={18} /> Registruoti gedimą
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
