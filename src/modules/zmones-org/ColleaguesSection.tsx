import React, { useState } from 'react';
import { useZmonesOrg } from './ZmonesOrgContext';
import { Edit2, Trash2, X, Plus } from 'lucide-react';

export const ColleaguesSection: React.FC = () => {
  const { colleagues, addColleague, updateColleague, deleteColleague } = useZmonesOrg();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const departments = Array.from(new Set(colleagues.flatMap(c => c.departments)));

  const filtered = colleagues.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedDepartments.length === 0 || selectedDepartments.some(d => c.departments.includes(d)))
  );

  const handleSave = () => {
    if (!formData.name) return;
    if (editingId) {
      updateColleague(editingId, formData);
    } else {
      addColleague(formData);
    }
    setShowForm(false);
  };

  const handleEdit = (c: any) => {
    setFormData(c);
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti?')) {
      deleteColleague(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <input 
          type="text" 
          placeholder="Ieškoti pagal vardą, poziciją ar lokaciją..." 
          className="border border-slate-200 p-2 rounded-xl flex-1 text-sm bg-slate-50 focus:outline-none focus:border-brand-lime" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <button 
          className="bg-brand-lime text-slate-900 px-5 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 hover:bg-[#b0f020]" 
          onClick={() => {
            setEditingId(null);
            setFormData({ departments: [] });
            setShowForm(true);
          }}
        >
          <Plus size={16} /> Naujas kolega
        </button>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {departments.map(d => (
          <button 
            key={d} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors border ${selectedDepartments.includes(d) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`} 
            onClick={() => setSelectedDepartments(prev => prev.includes(d) ? prev.filter(p => p !== d) : [...prev, d])}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="border p-5 rounded-2xl shadow-sm border-slate-200 bg-white relative group flex flex-col">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-500 shrink-0">
                {c.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 leading-tight">{c.name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{c.position}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 flex-1">
              {c.phone && <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📞 {c.phone}</p>}
              {c.email && <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📧 {c.email}</p>}
            </div>

            {c.comment && (
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-4 italic">{c.comment}</p>
            )}

            <div className="mt-auto border-t border-slate-100 pt-3 flex flex-wrap gap-1.5 items-center justify-between">
               <div className="flex gap-1.5 flex-wrap flex-1">
                {c.departments.map((d: string) => <span key={d} className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-1 rounded-md uppercase">{d}</span>)}
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase shrink-0">📍 {c.location}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl tracking-tight text-slate-900">{editingId ? 'Koreguoti kolegą' : 'Naujas kolega'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vardas Pavardė</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pozicija</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefonas</label>
                  <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">El. paštas</label>
                  <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lokacija</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Padaliniai (atskirti kableliu)</label>
                <input 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime" 
                  value={formData.departments?.join(', ') || ''} 
                  onChange={e => setFormData({...formData, departments: e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean)})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Komentaras</label>
                <textarea className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-brand-lime min-h-[80px]" value={formData.comment || ''} onChange={e => setFormData({...formData, comment: e.target.value})} />
              </div>
              <button 
                onClick={handleSave} 
                className="w-full bg-brand-lime text-slate-900 rounded-xl p-3.5 font-black uppercase tracking-wider mt-6 hover:bg-[#b0f020] transition-colors shadow-sm"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
