import React, { useState } from 'react';
import { users as usersData, User } from '../../mock-db/users';
import { Role } from '../../types/zmonesTypes';
import { Edit2, Trash2, X } from 'lucide-react';

export const OfficeTab: React.FC<{ role: Role }> = ({ role }) => {
  const [offices, setOffices] = useState<User[]>(
    usersData.filter((u: any) => u.type === 'office' || u.role === 'ADMIN' || u.role === 'CEO' || u.role === 'OPS')
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      setOffices(offices.map(o => o.id === editingId ? { ...o, ...formData } as User : o));
    } else {
      const newOffice: User = {
        id: `o-${Date.now()}`,
        name: formData.name || '',
        email: formData.email || '',
        role: formData.role as any || 'OPS',
        region: formData.region || '',
        assigned_clubs: formData.assigned_clubs || []
      };
      setOffices([...offices, newOffice]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({});
  };

  const handleEdit = (o: User) => {
    setFormData(o);
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti?')) {
      setOffices(offices.filter(o => o.id !== id));
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Ofisai</h2>
        {role !== 'READ' && (
          <button 
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800"
            onClick={() => {
              setEditingId(null);
              setFormData({ assigned_clubs: [] });
              setShowForm(true);
            }}
          >
            + Pridėti
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offices.map((o) => (
          <div key={o.id} className="border p-5 rounded-2xl shadow-sm border-slate-200 bg-white relative group">
            {role !== 'READ' && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => handleEdit(o)} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(o.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            )}
            <h3 className="font-black text-lg text-slate-900 pr-12">{o.name}</h3>
            {o.role && <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{o.role}</p>}
            <div className="mt-4 space-y-2">
              {o.email && <p className="text-sm font-medium text-slate-700">📧 {o.email}</p>}
              {o.region && <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">{o.region}</p>}
            </div>
            {o.assigned_clubs && o.assigned_clubs.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {o.assigned_clubs.map((t: string) => <span key={t} className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">{editingId ? 'Koreguoti ofisą' : 'Naujas ofisas'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pavadinimas (Name)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rolė</label>
                <select className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.role || 'OPS'} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CEO">CEO</option>
                  <option value="OPS">OPS</option>
                  <option value="COORDINATOR">COORDINATOR</option>
                  <option value="CS">CS</option>
                  <option value="EXTERNAL">EXTERNAL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">El. paštas (Email)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Regionas (Location)</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priskirti klubai (atskirti kableliu)</label>
                <input 
                  className="w-full border border-slate-200 rounded-xl p-2 text-sm" 
                  value={formData.assigned_clubs?.join(', ') || ''} 
                  onChange={e => setFormData({...formData, assigned_clubs: e.target.value.split(',').map((s: string) => s.trim()).filter((Boolean))})} 
                />
              </div>
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
