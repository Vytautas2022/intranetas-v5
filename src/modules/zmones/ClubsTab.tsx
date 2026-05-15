import React, { useState } from 'react';
import { clubs as clubsData, Club } from '../../mock-db/clubs';
import { Role } from '../../types/zmonesTypes';
import { Edit2, Trash2, X } from 'lucide-react';

export const ClubsTab: React.FC<{ role: Role }> = ({ role }) => {
  console.log("Clubs:", clubsData);
  const [clubs, setClubs] = useState<Club[]>(clubsData || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Club>>({});

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      setClubs(clubs.map(c => c.id === editingId ? { ...c, ...formData } as Club : c));
    } else {
      const newClub: Club = {
        id: `c-${Date.now()}`,
        name: formData.name || '',
        city: formData.city || '',
        address: formData.address || '',
        region: formData.region || '',
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };
      setClubs([...clubs, newClub]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({});
  };

  const handleEdit = (c: Club) => {
    setFormData(c);
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti?')) {
      setClubs(clubs.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Klubai</h2>
        {role !== 'READ' && (
          <button 
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800"
            onClick={() => {
              setEditingId(null);
              setFormData({});
              setShowForm(true);
            }}
          >
            + Pridėti
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((c) => (
          <div key={c.id} className="border p-5 rounded-2xl shadow-sm border-slate-200 bg-white relative group">
            {role !== 'READ' && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            )}
            <h3 className="font-black text-lg text-slate-900 pr-12">{c.name}</h3>
            {c.city && <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{c.city}</p>}
            <div className="mt-4 space-y-2">
              {c.address && <p className="text-sm font-medium text-slate-700">📍 {c.address}</p>}
              {c.region && <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">{c.region}</p>}
            </div>
            {!c.is_active && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="bg-red-100 text-red-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">Neaktyvus</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">{editingId ? 'Koreguoti klubą' : 'Naujas klubas'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pavadinimas (Name)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Miestas (City)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adresas (Address)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Regionas (Region)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-brand-lime focus:ring-brand-lime" />
                <span className="text-sm font-bold text-slate-700">Aktyvus</span>
              </label>
              <button 
                onClick={handleSave} 
                className="w-full bg-brand-lime text-slate-900 rounded-xl p-3 font-black uppercase tracking-wider mt-6 hover:bg-brand-lime/90"
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
