import React, { useState } from 'react';
import { useZmonesOrg } from './ZmonesOrgContext';
import { Edit2, Trash2, X, Plus, GripVertical, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const OfficeSection: React.FC = () => {
  const { detailedOffices, addOfficeBlock, updateOfficeBlock, deleteOfficeBlock, reorderOfficeBlocks } = useZmonesOrg();
  const offices = Object.values(detailedOffices).map(d => d.office);
  const [activeOfficeId, setActiveOfficeId] = useState<string>(offices[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'Informacija' | 'Kontaktai' | 'Istorija'>('Informacija');

  const detailed = detailedOffices[activeOfficeId];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const blocksList = [...(detailed?.blocks || [])].sort((a, b) => a.order_index - b.order_index);
    const [reorderedItem] = blocksList.splice(result.source.index, 1);
    blocksList.splice(result.destination.index, 0, reorderedItem);
    reorderOfficeBlocks(activeOfficeId, blocksList.map(b => b.id));
  };

  if (!detailed) return <div>Nėra ofisų duomenų</div>;

  const blocksList = [...detailed.blocks].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex gap-8 h-full">
      <div className="w-1/4 min-w-[250px] space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Pasirinkite ofisą</h3>
        <div className="space-y-2">
          {offices.map(o => (
            <button 
              key={o.id} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-between ${activeOfficeId === o.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'}`} 
              onClick={() => setActiveOfficeId(o.id)}
            >
              {o.name}
              {activeOfficeId === o.id && <ChevronDown size={16} className="text-brand-lime" />}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-black text-2xl text-slate-900 tracking-tight">{detailed.office.name}</h2>
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {(['Informacija', 'Kontaktai', 'Istorija'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'Informacija' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => alert('Pridėti bloką modals bus netrukus')}
                  className="bg-brand-lime text-slate-900 px-4 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 hover:bg-[#b0f020]"
                >
                  <Plus size={16} /> Pridėti bloką
                </button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="office-blocks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {blocksList.map((b, index) => (
                        <Draggable key={b.id} draggableId={b.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className="border border-slate-200 rounded-2xl p-5 shadow-sm bg-white group flex gap-4 items-start"
                            >
                              <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 mt-1 cursor-grab">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-black text-lg flex items-center gap-2 text-slate-900">
                                    {b.is_sensitive && <span className="text-amber-500" title="Konfidenciali informacija">🔒</span>}
                                    {b.title}
                                  </h3>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => alert('Redaguoti...')} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                                    <button onClick={() => { if(confirm('Trinti?')) deleteOfficeBlock(activeOfficeId, b.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                                <div className={`text-slate-600 whitespace-pre-wrap text-sm leading-relaxed ${b.is_sensitive ? 'select-none' : ''}`}>
                                  {b.content}
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
                  <div key={c.id} className="border border-slate-200 p-5 rounded-2xl shadow-sm bg-white">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.type}</p>
                    <h3 className="font-black text-lg text-slate-900 mb-4">{c.name}</h3>
                    <div className="space-y-2">
                       <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📞 {c.phone}</p>
                       <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📧 {c.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Istorija' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <p className="font-black text-lg mb-2">Istorijos įrašų nėra</p>
               <p className="text-sm font-medium">Šio ofiso profilyje dar nebuvo atlikta jokių veiksmų.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
