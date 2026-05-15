import React, { useState } from 'react';
import { useZmonesOrg } from './ZmonesOrgContext';
import { Edit2, Trash2, X, Plus, GripVertical, ChevronDown, AlertTriangle, Clock, Play } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const ClubsSection: React.FC<{ onGeneratePeriodicTasks?: (id: string) => void }> = ({ onGeneratePeriodicTasks }) => {
  const { detailedClubs, addClubBlock, updateClubBlock, deleteClubBlock, reorderClubBlocks, deleteClubContact, deleteClubZone } = useZmonesOrg();
  const clubs = Object.values(detailedClubs).map(d => d.club);
  const [activeClubId, setActiveClubId] = useState<string>(clubs[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'Informacija' | 'Kontaktai' | 'Zonos' | 'Failai' | 'Istorija'>('Informacija');

  const detailed = detailedClubs[activeClubId];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const blocksList = [...(detailed?.blocks || [])].sort((a, b) => a.order_index - b.order_index);
    const [reorderedItem] = blocksList.splice(result.source.index, 1);
    blocksList.splice(result.destination.index, 0, reorderedItem);
    reorderClubBlocks(activeClubId, blocksList.map(b => b.id));
  };

  if (!detailed) return <div>Nėra klubų duomenų</div>;

  const blocksList = [...detailed.blocks].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex gap-8 h-full">
      <div className="w-1/4 min-w-[250px] space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Pasirinkite klubą</h3>
        <div className="space-y-2 h-[calc(100vh-230px)] overflow-y-auto pr-2 pb-10">
          {clubs.map(c => (
            <button 
              key={c.id} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-between group ${activeClubId === c.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'}`} 
              onClick={() => setActiveClubId(c.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                 <span>{c.name}</span>
                 {activeClubId === c.id && <ChevronDown size={16} className="text-brand-lime" />}
                </div>
                <div className={`text-[10px] font-bold uppercase mt-1 ${activeClubId === c.id ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {c.city}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-black text-2xl text-slate-900 tracking-tight">{detailed.club.name}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{detailed.club.city}</p>
          </div>
          <div className="flex items-center gap-3">
            {onGeneratePeriodicTasks && (
              <button 
                onClick={() => onGeneratePeriodicTasks(activeClubId)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                title="Sugeneruoti šio mėnesio periodinius darbus šiame klube"
              >
                <Clock size={16} /> Generuoti periodinius darbus
              </button>
            )}
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {(['Informacija', 'Kontaktai', 'Zonos', 'Failai', 'Istorija'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'Informacija' && (
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex justify-end shrink-0">
                <button 
                  onClick={() => alert('Pridėti bloką...')}
                  className="bg-brand-lime text-slate-900 px-4 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 hover:bg-[#b0f020]"
                >
                  <Plus size={16} /> Pridėti bloką
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-10">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="club-blocks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {blocksList.map((b, index) => (
                        <Draggable key={b.id} draggableId={b.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className={`border rounded-2xl p-5 shadow-sm bg-white group flex gap-4 items-start ${b.is_risk ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
                            >
                              <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 mt-1 cursor-grab shrink-0">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-black text-lg flex items-center gap-2 text-slate-900">
                                    {b.is_sensitive && <span className="text-amber-500" title="Konfidencialu">🔒</span>}
                                    {b.is_risk && <span className="text-red-500" title="Rizika"><AlertTriangle size={18} /></span>}
                                    {b.title}
                                  </h3>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                    <button onClick={() => alert('Redaguoti...')} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                                    <button onClick={() => { if(confirm('Trinti?')) deleteClubBlock(activeClubId, b.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                                <div className={`text-slate-600 whitespace-pre-wrap text-sm leading-relaxed ${b.is_sensitive ? 'select-none' : ''}`}>
                                  {b.full_text}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              </div>
            </div>
          )}

          {activeTab === 'Kontaktai' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => alert('Pridėti kontaktą...')}
                  className="bg-brand-lime text-slate-900 px-4 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 hover:bg-[#b0f020]"
                >
                  <Plus size={16} /> Pridėti kontaktą
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detailed.contacts.map(c => (
                  <div key={c.id} className="border border-slate-200 p-5 rounded-2xl shadow-sm bg-white relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => alert('Redaguoti...')} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => { if(confirm('Trinti?')) deleteClubContact(activeClubId, c.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.type}</p>
                    <h3 className="font-black text-lg text-slate-900 mb-4">{c.name}</h3>
                    <div className="space-y-2">
                       <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📞 {c.phone}</p>
                       <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📧 {c.email}</p>
                    </div>
                    {c.notes && (
                      <p className="mt-4 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg">{c.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Zonos' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => alert('Pridėti zoną...')}
                  className="bg-brand-lime text-slate-900 px-4 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 hover:bg-[#b0f020]"
                >
                  <Plus size={16} /> Pridėti zoną
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {detailed.zones.map(z => (
                  <div key={z.id} className="border border-slate-200 p-5 rounded-2xl shadow-sm bg-white relative group flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-black text-lg text-slate-900 mb-1">{z.name}</h3>
                      <p className="text-sm text-slate-600 mb-4">{z.info}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                         {z.plotas && <p className="text-xs font-bold text-slate-500"><span className="text-slate-400 font-medium mr-1 uppercase">Plotas:</span> {z.plotas}</p>}
                         {z.aukstas && <p className="text-xs font-bold text-slate-500"><span className="text-slate-400 font-medium mr-1 uppercase">Aukštas:</span> {z.aukstas}</p>}
                         {z.vieta && <p className="text-xs font-bold text-slate-500"><span className="text-slate-400 font-medium mr-1 uppercase">Vieta:</span> {z.vieta}</p>}
                      </div>
                      {z.pastabos && <p className="mt-4 text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg">{z.pastabos}</p>}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 ml-4">
                      <button onClick={() => alert('Redaguoti...')} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => { if(confirm('Trinti?')) deleteClubZone(activeClubId, z.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Failai' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <p className="font-black text-lg mb-2">Failų sistema</p>
               <p className="text-sm font-medium">Failų įkėlimas bus pridėtas netrukus</p>
            </div>
          )}

          {activeTab === 'Istorija' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <p className="font-black text-lg mb-2">Istorijos įrašų nėra</p>
               <p className="text-sm font-medium">Šio klubo profilyje dar nebuvo atlikta jokių veiksmų.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
