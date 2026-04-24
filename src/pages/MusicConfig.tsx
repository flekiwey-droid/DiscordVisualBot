import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Save, Play, Settings2, ShieldHalf, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

export function MusicConfig() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleName, setModuleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [config, setConfig] = useState({
    prefix: '@mention',
    djRole: '',
    stayInChannel: false,
    songInStatus: true,
    ownerId: ''
  });

  useEffect(() => {
    if (!user || !moduleId) return;
    
    const loadModule = async () => {
      try {
        const d = await getDoc(doc(db, 'modules', moduleId));
        if (d.exists()) {
          const data = d.data();
          setModuleName(data.name);
          if (data.nodes && data.nodes !== '[]' && data.nodes.length > 0) {
             try {
                const parsed = JSON.parse(data.nodes);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                   setConfig(prev => ({ ...prev, ...parsed }));
                }
             } catch(e) {}
          }
        } else {
          toast.error("Módulo no encontrado");
          navigate('/dashboard');
        }
      } catch (error) {
        toast.error("Error al cargar configuración");
      } finally {
        setIsLoading(false);
      }
    };
    loadModule();
  }, [user, moduleId]);

  const saveConfig = async () => {
    if (!user || !moduleId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'modules', moduleId), {
        nodes: JSON.stringify(config),
        // JMusicBot does not really use edges in our visual setup but we need to keep format
        edges: '[]',
        updatedAt: serverTimestamp()
      });
      toast.success('¡Configuración de Música guardada!');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center p-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="h-14 border-b border-border/40 bg-card/50 backdrop-blur-md flex flex-row items-center justify-between px-4 sticky top-0 z-40">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => navigate('/dashboard')}>
                   <ChevronRight size={14} className="rotate-180 text-muted-foreground" />
                </Button>
                <h1 className="text-sm font-semibold tracking-tight text-foreground leading-none">{moduleName}</h1>
                <span className="hidden xs:flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50">JMusicBot</span>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Button onClick={saveConfig} disabled={isSaving} size="sm" className="h-8 px-4 gap-2 text-xs font-semibold shadow-md border-transparent bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              <Save size={14} className="fill-current" /> {isSaving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
         </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
         <div className="flex items-center gap-4 border-b border-border/40 pb-6">
            <div className="h-16 w-16 bg-purple-500/10 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
               <Play size={32} className="fill-current" />
            </div>
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-foreground">Configuración de JMusicBot</h2>
               <p className="text-sm text-muted-foreground mt-1">Configura el comportamiento del bot de música en tu servidor. Estos valores se inyectarán en la instancia de tu bot.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
               <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Settings2 size={16} className="text-primary" /> General</h3>
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4 shadow-sm">
                     <div className="space-y-2">
                        <label className="text-xs font-semibold flex justify-between">Prefijo del Bot <span className="text-muted-foreground font-normal">Recomendado: @mention, !, ?</span></label>
                        <Input 
                          value={config.prefix} 
                          onChange={e => setConfig({...config, prefix: e.target.value})} 
                          className="bg-background"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-semibold flex justify-between">ID del Propietario <span className="text-muted-foreground font-normal">Tu ID de Discord</span></label>
                        <Input 
                          value={config.ownerId} 
                          onChange={e => setConfig({...config, ownerId: e.target.value})}
                          placeholder="84729188..."
                          className="bg-background font-mono"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2"><ShieldHalf size={16} className="text-amber-500" /> Permisos & Roles</h3>
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4 shadow-sm">
                     <div className="space-y-2">
                        <label className="text-xs font-semibold">Rol de DJ (ID o Nombre)</label>
                        <Input 
                          value={config.djRole} 
                          onChange={e => setConfig({...config, djRole: e.target.value})} 
                          placeholder="DJ, 9382103..."
                          className="bg-background"
                        />
                     </div>
                     
                     <div className="pt-2 border-t border-border/40 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" className="w-4 h-4 rounded border-border bg-background accent-primary" 
                              checked={config.stayInChannel}
                              onChange={e => setConfig({...config, stayInChannel: e.target.checked})}
                           />
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-foreground">Permanecer en canal de voz</span>
                             <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">Si se activa, el bot no se desconectará al quedarse solo.</span>
                           </div>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" className="w-4 h-4 rounded border-border bg-background accent-primary" 
                              checked={config.songInStatus}
                              onChange={e => setConfig({...config, songInStatus: e.target.checked})}
                           />
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-foreground">Canción en Estado</span>
                             <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">Muestra la canción actual como "Escuchando a..." en la bio del bot.</span>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
