'use client';
import { useState, useEffect } from 'react';
import { Settings, Shield, Lock, Power, Save, RefreshCw, Eye, EyeOff, LayoutGrid, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ConfiguracionAdmin() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({
    brand_name: '',
    brand_logo: '',
    primary_color: '#EAB308',
    contact_email: '',
    currency_symbol: '$'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      if (session.user.id !== '734a51e1-194a-466c-b2a9-a324f8a52a27') {
        return router.push('/admin');
      }
      
      fetchData();
    };
    checkAccessAndFetch();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      supabase.from('site_config').select('*').order('module_name'),
      supabase.from('system_settings').select('*')
    ]);

    if (cRes.data) setModules(cRes.data);
    if (sRes.data) {
      const s: any = {};
      sRes.data.forEach((item: any) => {
        s[item.key] = item.value;
      });
      setSystemSettings({
        brand_name: s.brand_name || '',
        brand_logo: s.brand_logo || '',
        primary_color: s.primary_color || '#EAB308',
        contact_email: s.contact_email || '',
        currency_symbol: s.currency_symbol || '$'
      });
    }
    setLoading(false);
  };

  // saveSettings deshabilitada - pendiente de configuración de marca

  const toggleModule = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('site_config')
      .update({ is_enabled: !currentStatus, updated_at: new Date() })
      .eq('id', id);
    
    if (!error) {
      setModules(prev => prev.map(m => m.id === id ? { ...m, is_enabled: !currentStatus } : m));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Contraseña actualizada con éxito');
      setPasswords({ current: '', new: '', confirm: '' });
    }
    setSaving(false);
  };

  const purgeData = async () => {
    if (!confirm('🚨 ATENCIÓN: Esto borrará TODOS los datos de autos, choferes, pagos, órdenes de servicio y avisos. Esta acción es irreversible. ¿Estás seguro?')) return;
    
    setSaving(true);
    try {
      await supabase.from('service_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('Sistema limpiado con éxito. Ahora está listo para un nuevo cliente.');
    } catch (e) {
      alert('Error al limpiar datos');
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-24 px-12 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
            <Settings className="text-yellow-500" /> Configuración Maestro
          </h2>
          <p className="text-zinc-400 text-sm font-medium">Control de acceso, módulos y marca blanca.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
              <Shield className="text-yellow-500" size={16} />
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Developer Access</span>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* SECCIÓN MARCA BLANCA - PENDIENTE */}
          <div className="space-y-8 lg:col-span-2 bg-zinc-900/20 p-10 rounded-[3rem] border border-yellow-500/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                  <RefreshCw className="text-yellow-500" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white italic">Personalización de Marca</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Configura el nombre y logo de tu empresa</p>
               </div>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-8 flex items-start gap-6">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                <RefreshCw className="text-yellow-500" size={22} />
              </div>
              <div className="space-y-2">
                <p className="font-black text-yellow-400 uppercase tracking-widest text-sm">Nombre de la App — Pendiente de Configuración</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  El nombre y logo de la plataforma aún no han sido definidos. Una vez que decidas el nombre de tu empresa o sistema, contactá al desarrollador para activar esta sección y configurar tu marca blanca completa.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <a href="mailto:adamoomar110@gmail.com" className="px-5 py-2.5 bg-yellow-500 text-black font-black text-xs rounded-xl hover:bg-yellow-400 transition-all">
                    📧 Contactar al Desarrollador
                  </a>
                  <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white/5 text-white font-black text-xs rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* SECCIÓN MÓDULOS */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <LayoutGrid className="text-zinc-400" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white italic">Interruptores de Módulos</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Habilitar o deshabilitar secciones del menú</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {modules.map(m => (
                <div key={m.id} className="group bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 flex items-center justify-between hover:bg-zinc-800/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${m.is_enabled ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-black border-white/5 text-zinc-600'}`}>
                      <Settings size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase tracking-tighter capitalize">{m.module_name}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Visibilidad: {m.is_enabled ? 'Activado' : 'Oculto'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleModule(m.id, m.is_enabled)}
                    className={`relative w-14 h-8 rounded-full p-1 transition-all duration-500 border ${m.is_enabled ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black border-white/10'}`}
                  >
                    <div className={`w-6 h-6 rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${m.is_enabled ? 'translate-x-6 bg-yellow-500 shadow-yellow-500/50' : 'translate-x-0 bg-zinc-600'}`}>
                      <Power size={12} className={m.is_enabled ? 'text-black' : 'text-zinc-400'} />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN SEGURIDAD Y LIMPIEZA */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <Lock className="text-zinc-400" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white italic">Seguridad y Limpieza</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Contraseña y reinicio de fábrica</p>
               </div>
            </div>

            <form onSubmit={handlePasswordChange} className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Nueva Contraseña Admin</label>
                <div className="relative">
                  <input 
                    required 
                    type={showPass ? 'text' : 'password'} 
                    value={passwords.new} 
                    onChange={e => setPasswords({...passwords, new: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-yellow-500 font-bold pr-14" 
                    placeholder="Minimo 6 caracteres" 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-white/5 text-white font-black py-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                CAMBIAR CONTRASEÑA
              </button>
            </form>

            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] space-y-4">
               <div className="flex items-center gap-3 text-red-500">
                  <Shield size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Zona Crítica / Venta de App</span>
               </div>
               <p className="text-zinc-500 text-[10px] font-bold leading-relaxed">
                  Utiliza el botón de abajo para borrar todos los datos actuales (autos, choferes, pagos) y dejar el sistema en blanco para un nuevo cliente. Esta acción es definitiva.
               </p>
               <button 
                onClick={purgeData}
                disabled={saving}
                className="w-full bg-red-600/20 text-red-500 border border-red-500/30 font-black py-4 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3"
               >
                 <Trash2 size={20} />
                 REINICIAR SISTEMA (BORRAR TODO)
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
