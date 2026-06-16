'use client';
import React, { useState, useEffect } from 'react';
import { Gift, Search, Plus, Trash2, Power, MapPin, Palette, Type } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BeneficiosAdmin() {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    location: '', 
    icon: 'Car', 
    color: 'text-yellow-400',
    is_active: true 
  });

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('benefits')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setBenefits(data);
    }
    setLoading(false);
  };

  const toggleBenefit = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('benefits')
      .update({ is_active: !currentStatus })
      .eq('id', id);
      
    if (!error) {
      setBenefits(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    }
  };

  const createBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('benefits')
      .insert([formData])
      .select();
      
    if (!error && data) {
      setBenefits([data[0], ...benefits]);
      setIsModalOpen(false);
      setFormData({ 
        title: '', 
        description: '', 
        location: '', 
        icon: 'Car', 
        color: 'text-yellow-400',
        is_active: true 
      });
    } else {
      alert('Error creando beneficio');
    }
  };

  const deleteBenefit = async (id: string) => {
    if(!confirm('¿Seguro que deseas eliminar este beneficio?')) return;
    const { error } = await supabase
      .from('benefits')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setBenefits(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <>
      <header className="h-24 px-12 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">Spinaz Club</h2>
          <p className="text-zinc-400 text-sm font-medium">Gestiona convenios y beneficios exclusivos para los choferes.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl font-bold text-black flex items-center gap-2 overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
        >
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10">Nuevo Beneficio</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-12 z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-500">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {benefits.map(benefit => (
              <div key={benefit.id} className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:bg-zinc-800/50">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${benefit.color}`}>
                    <Gift size={24} />
                  </div>
                  <button 
                    onClick={() => toggleBenefit(benefit.id, benefit.is_active)}
                    className={`relative w-14 h-8 rounded-full p-1 transition-colors border ${benefit.is_active ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black border-white/10'}`}
                  >
                    <div className={`w-6 h-6 rounded-full transform transition-transform flex items-center justify-center ${benefit.is_active ? 'translate-x-6 bg-yellow-500' : 'translate-x-0 bg-zinc-600'}`}>
                      <Power size={10} className={benefit.is_active ? 'text-black' : 'text-zinc-400'} />
                    </div>
                  </button>
                </div>
                
                <h3 className="font-black text-xl text-white mb-2">{benefit.title}</h3>
                <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-4">{benefit.description}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-8">
                   <MapPin size={12} /> {benefit.location}
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg ${benefit.is_active ? 'bg-green-500/10 text-green-500' : 'text-zinc-600'}`}>
                    {benefit.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => deleteBenefit(benefit.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {benefits.length === 0 && (
              <div className="col-span-full h-[300px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-zinc-500">
                <Gift size={48} className="opacity-20 mb-4" />
                <p>No hay beneficios cargados todavía.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black mb-8 text-white">Nuevo Beneficio Spinaz Club</h2>
            
            <form onSubmit={createBenefit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest pl-2">Establecimiento / Título</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 outline-none" placeholder="Ej: Lavadero El Rayo" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest pl-2">Descripción del Beneficio</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 outline-none" placeholder="Ej: 50% OFF en Lavado Completo" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest pl-2">Ubicación</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 outline-none" placeholder="Ej: Av. Mitre 1200" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest pl-2">Color (Tailwind class)</label>
                  <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 outline-none">
                    <option value="text-yellow-400">Amarillo</option>
                    <option value="text-blue-400">Azul</option>
                    <option value="text-green-400">Verde</option>
                    <option value="text-red-400">Rojo</option>
                    <option value="text-purple-400">Púrpura</option>
                  </select>
                </div>
                <div className="flex items-end">
                   <label className="flex items-center gap-4 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-6 h-6 accent-yellow-500" />
                      <span className="text-xs font-bold text-white">Activo ahora</span>
                   </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-500 hover:text-white font-bold transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all">Crear Beneficio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
