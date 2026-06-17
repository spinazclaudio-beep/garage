'use client';
import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Image as ImageIcon, Copy, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PostulantesAdmin() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setApplicants(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/postulantes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar el estado');
      }
      setApplicants(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      if (selectedApplicant?.id === id) setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const deleteApplicant = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este postulante? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/admin/postulantes?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      setApplicants(prev => prev.filter(app => app.id !== id));
      if (selectedApplicant?.id === id) setSelectedApplicant(null);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getWhatsAppMessage = (app: any, type: 'approved' | 'rejected') => {
    const firstName = app.full_name.split(' ')[0];
    if (type === 'approved') {
      return `¡Hola ${firstName}! 👋 Soy del equipo de Spinaz Garage. Te contacto porque tu postulación fue pre-seleccionada. 🚀 Nos gustaría tener una entrevista presencial con vos. Por favor, confirmame disponibilidad para acercarte a nuestra oficina.`;
    }
    return `Hola ${firstName}. Gracias por postularte a Spinaz Garage. Por el momento no avanzaremos con tu perfil para esta búsqueda, pero guardaremos tus datos para futuras vacantes. Saludos.`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Mensaje copiado al portapapeles');
  };

  const filteredApplicants = applicants.filter(app => 
    app.full_name.toLowerCase().includes(search.toLowerCase()) || 
    app.dni.includes(search)
  );

  const DOCS = [
    { label: 'DNI FRENTE', urlKey: 'dni_front_url' },
    { label: 'DNI DORSO', urlKey: 'dni_back_url' },
    { label: 'REGISTRO', urlKey: 'license_url' },
    { label: 'SELFIE', urlKey: 'selfie_url' },
  ];

  return (
    <>
      <header className="h-24 px-10 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">Candidatos</h2>
          <p className="text-zinc-400 text-sm font-medium">Gestión de reclutamiento &quot;Nivel Empresa&quot;.</p>
        </div>
        <div className="flex items-center bg-black/50 border border-white/10 px-5 py-3 rounded-2xl w-80 shadow-inner focus-within:border-yellow-500/50 transition-colors">
          <Search className="text-zinc-500" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI..." className="bg-transparent border-none focus:outline-none text-sm ml-3 w-full text-white placeholder-zinc-600" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-1/3 border-r border-white/5 overflow-y-auto bg-black/40 backdrop-blur-md relative z-10">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-yellow-500 p-8">
               <div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
             </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredApplicants.map(app => (
                <button key={app.id} onClick={() => setSelectedApplicant(app)} className={`w-full p-6 text-left transition-all relative ${selectedApplicant?.id === app.id ? 'bg-zinc-900/80 shadow-inner' : 'hover:bg-white/5'}`}>
                  {selectedApplicant?.id === app.id && <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500" />}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg block text-white leading-none">{app.full_name}</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${app.status === 'approved' ? 'bg-green-500/10 text-green-500' : app.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span className="truncate max-w-[200px]">📍 {app.zone?.split(' || ')[0]?.replace('Zona: ', '') || app.zone}</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-black">
          {selectedApplicant ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h2 className="text-5xl font-black text-white mb-2">{selectedApplicant.full_name}</h2>
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">DNI: {selectedApplicant.dni} | EDAD: {selectedApplicant.age} | CEL: {selectedApplicant.phone}</p>
                    </div>
                    <div className="flex gap-3">
                       <button 
                          onClick={() => updateStatus(selectedApplicant.id, 'approved')} 
                          title="Aceptar"
                          className={`p-3 rounded-xl transition-all flex items-center justify-center ${selectedApplicant.status === 'approved' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500 hover:text-green-500 hover:bg-green-500/10'}`}
                       >
                          <CheckCircle size={24} />
                       </button>
                       <button 
                          onClick={() => updateStatus(selectedApplicant.id, 'rejected')} 
                          title="Rechazar"
                          className={`p-3 rounded-xl transition-all flex items-center justify-center ${selectedApplicant.status === 'rejected' ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-500/10'}`}
                       >
                          <XCircle size={24} />
                       </button>
                       <button 
                          onClick={() => deleteApplicant(selectedApplicant.id)} 
                          title="Eliminar Postulante"
                          className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center ml-2 shadow-lg hover:shadow-red-500/20"
                       >
                          <Trash2 size={24} />
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                       <h4 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-3">Experiencia Apps</h4>
                       <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                         {selectedApplicant.zone ? (selectedApplicant.zone.split(' || ').find((p: string) => p.startsWith('Exp: '))?.replace('Exp: ', '') || 'No especificado') : 'No especificado'}
                       </p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                       <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-3">Siniestros</h4>
                       <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                         {selectedApplicant.zone ? (selectedApplicant.zone.split(' || ').find((p: string) => p.startsWith('Siniestros: '))?.replace('Siniestros: ', '') || 'No especificado') : 'No especificado'}
                       </p>
                    </div>
                 </div>
              </div>

              {/* WHATSAPP AUTOMATION AREA */}
              <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-8 rounded-[3rem] shadow-xl">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-500 text-black rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare size={24}/></div>
                    <h3 className="text-xl font-black text-white">Mensaje para enviar</h3>
                 </div>
                 
                 <div className="bg-black/60 p-6 rounded-3xl border border-white/10 mb-6 relative group">
                    <p className="text-zinc-300 font-medium text-sm leading-relaxed pr-12 italic">
                       &quot;{getWhatsAppMessage(selectedApplicant, selectedApplicant.status === 'rejected' ? 'rejected' : 'approved')}&quot;
                    </p>
                    <button onClick={() => copyToClipboard(getWhatsAppMessage(selectedApplicant, selectedApplicant.status === 'rejected' ? 'rejected' : 'approved'))} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                       <Copy size={20} className="text-green-500" />
                    </button>
                 </div>
                 
                 <p className="text-[10px] text-green-500 font-black uppercase tracking-widest text-center">Copiá este texto y pegalo en WhatsApp para avanzar con autoridad profesional.</p>
              </div>

              {/* DOCUMENTOS Y PERFIL */}
              <div className="grid grid-cols-4 gap-4">
                {DOCS.map((doc) => {
                  const zoneParts = selectedApplicant.zone ? selectedApplicant.zone.split(' || ') : [];
                  const exp = zoneParts.find((p: string) => p.startsWith('Exp: '))?.replace('Exp: ', '') || 'No especificado';
                  const siniestros = zoneParts.find((p: string) => p.startsWith('Siniestros: '))?.replace('Siniestros: ', '') || 'No especificado';
                  const dniF = zoneParts.find((p: string) => p.startsWith('DNI-F:'))?.replace('DNI-F:', '');
                  const dniD = zoneParts.find((p: string) => p.startsWith('DNI-D:'))?.replace('DNI-D:', '');
                  const reg = zoneParts.find((p: string) => p.startsWith('REG:'))?.replace('REG:', '');
                  const foto = zoneParts.find((p: string) => p.startsWith('FOTO:'))?.replace('FOTO:', '');
                  
                  const urlMap: Record<string, string | undefined> = {
                     dni_front_url: dniF,
                     dni_back_url: dniD,
                     license_url: reg,
                     selfie_url: foto
                  };
                  
                  const url = urlMap[doc.urlKey];

                  return (
                    <div key={doc.urlKey} className="aspect-square bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-yellow-500/30 transition-all group relative">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Ver Original</span>
                          </div>
                        </a>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={32} className="text-zinc-700" />
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{doc.label}</span>
                          <span className="text-[7px] text-zinc-700">No subido</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-30">
               <Users size={64} />
               <p className="font-black uppercase tracking-[0.3em]">Seleccionar Postulante</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
