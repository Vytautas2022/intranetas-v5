import React, { useState } from 'react';
import { users as usersData, User } from '../../mock-db/users';
import { Role } from '../../types/zmonesTypes';
import { Edit2, Trash2, X } from 'lucide-react';

export const ColleaguesTab: React.FC<{ role: Role }> = ({ role }) => {
  console.log("Users:", usersData);
  const [colleagues, setColleagues] = useState<User[]>(usersData || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({});

  const regions = Array.from(new Set(colleagues.map(c => c.region).filter(Boolean))) as string[];

  const filtered = colleagues.filter(c =>
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (c.region && c.region.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (selectedRegions.length === 0 || (c.region && selectedRegions.includes(c.region)))
  );

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      setColleagues(colleagues.map(c => c.id === editingId ? { ...c, ...formData } as User : c));
    } else {
      const newColleague: User = {
        id: `u-${Date.now()}`,
        name: formData.name || '',
        email: formData.email || '',
        role: formData.role as any || 'COORDINATOR',
        region: formData.region || '',
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        assigned_clubs: formData.assigned_clubs || []
      };
      setColleagues([...colleagues, newColleague]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({});
  };

  const handleEdit = (c: User) => {
    setFormData(c);
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti?')) {
      setColleagues(colleagues.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex gap-4 items-center">
        <input type="text" placeholder="Ieškoti Kolegos..." className="border border-slate-200 p-2 rounded-lg flex-1 text-sm bg-slate-50" onChange={(e) => setSearchTerm(e.target.value)} />
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
      
      <div className="flex gap-2 flex-wrap">
        {regions.map(r => (
          <button key={r} className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${selectedRegions.includes(r) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setSelectedRegions(prev => prev.includes(r) ? prev.filter(p => p !== r) : [...prev, r])}>{r}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="border p-5 rounded-2xl shadow-sm border-slate-200 bg-white relative group">
            {role !== 'READ' && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-brand-lime hover:bg-slate-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            )}
            <h3 className="font-black text-lg text-slate-900 pr-12">{c.name}</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{c.role}</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">📧 {c.email || '-'}</p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">{c.region || 'No Region'}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {c.assigned_clubs?.map(d => <span key={d} className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-1 rounded-md uppercase">{d}</span>)}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">{editingId ? 'Koreguoti kolegą' : 'Naujas kolega'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vardas</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rolė</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.role || 'COORDINATOR'} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CEO">CEO</option>
                    <option value="OPS">OPS</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                    <option value="CS">CS</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">El. paštas</label>
                  <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Regionas</label>
                <input className="w-full border border-slate-200 rounded-xl p-2 text-sm" value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priskirti klubai (atskirti kableliu)</label>
                <input 
                  className="w-full border border-slate-200 rounded-xl p-2 text-sm" 
                  value={formData.assigned_clubs?.join(', ') || ''} 
                  onChange={e => setFormData({...formData, assigned_clubs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
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
