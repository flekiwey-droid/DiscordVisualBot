import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Cpu, TerminalSquare, Settings2, Plus, MessageCircle, AlertCircle, Play, Mic, Sparkles, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function Dashboard() {
  const { user, userData, updateBotToken, logOut, setupDefaultTemplates } = useAuth();
  const navigate = useNavigate();
  
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isBotTokenModalOpen, setIsBotTokenModalOpen] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleType, setNewModuleType] = useState('command');

  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isBridgeActive, setIsBridgeActive] = useState(false);
  
  const socketRef = useRef<any>(null);
  const liveSessionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Socket.io for Bridge
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
       console.log("Bridge socket connected");
       setIsBridgeActive(true);
    });

    socket.on("user-audio-chunk", async (data: any) => {
       // Bridge user audio to Gemini Live
       if (!liveSessionRef.current) {
          console.log("Starting a new Gemini Live Session...");
          try {
             liveSessionRef.current = await ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                   systemInstruction: data.systemPrompt || "Eres un asistente de voz en Discord.",
                   responseModalities: [Modality.AUDIO]
                },
                callbacks: {
                   onmessage: (msg: any) => {
                      const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                      if (audioData) {
                         // Send AI response back to Discord
                         socket.emit("ai-audio-chunk", {
                            userId: data.userId,
                            audio: audioData
                         });
                      }
                   },
                   onerror: (err: any) => console.error("Gemini Live Error:", err),
                }
             });
          } catch (e) {
             console.error("Failed to connect to Gemini Live:", e);
          }
       }

       if (liveSessionRef.current && data.audio) {
          liveSessionRef.current.sendRealtimeInput({
             audio: {
                data: data.audio,
                mimeType: "audio/pcm;rate=16000"
             }
          });
       }
    });

    return () => {
       socket.disconnect();
       if (liveSessionRef.current) liveSessionRef.current.close();
    };
  }, []);

  useEffect(() => {
    fetch('/api/status').then(res => res.json()).then(data => {
      setIsBotRunning(data.isRunning);
    }).catch(console.error);

    if (userData && !userData.hasSetupTemplates) {
       setupDefaultTemplates().then(loadModules);
    } else {
       loadModules();
    }
  }, [userData]);

  const handleStartBot = async () => {
    if (!userData?.botToken) {
       setIsBotTokenModalOpen(true);
       return;
    }
    
    setIsDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: userData.botToken, modules }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to deploy');
      
      toast.success(`Bot online as ${data.botTag}!`, {
        description: 'Loaded ' + modules.length + ' modules.',
      });
      setIsBotRunning(true);
    } catch (err: any) {
      toast.error('Failed to start Bot', {
        description: err.message || 'Check terminal logs for details.'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleResetTemplates = async () => {
    if (confirm('¿Estás seguro de que quieres restablecer las plantillas? Esto añadirá los nuevos módulos de seguridad.')) {
      await setupDefaultTemplates(true);
      await loadModules();
    }
  };

  const handleStopBot = async () => {
    setIsDeploying(true);
    try {
      await fetch('/api/stop', { method: 'POST' });
      setIsBotRunning(false);
      toast.info('Bot stopped successfully');
    } catch (e) {
      toast.error('Failed to stop Bot');
    } finally {
      setIsDeploying(false);
    }
  };

  const loadModules = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'modules'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const mods: any[] = [];
      querySnapshot.forEach((doc) => {
        mods.push({ id: doc.id, ...doc.data() });
      });
      setModules(mods);
      
      if (userData && !userData.botToken) {
           setIsBotTokenModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) return;
    try {
      const newDocRef = doc(collection(db, 'modules'));
      await setDoc(newDocRef, {
        userId: user!.uid,
        name: newModuleName.trim(),
        type: newModuleType,
        nodes: '[]',
        edges: '[]',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setNewModuleName('');
      navigate(`/editor/${newDocRef.id}`);
    } catch (e) {
      toast.error('Failed to create module');
    }
  };

  const handleSaveBotToken = async () => {
    if (!botTokenInput.trim()) return;
    await updateBotToken(botTokenInput.trim());
    setIsBotTokenModalOpen(false);
  };

  const typeIcons: any = {
    command: <TerminalSquare size={16} className="text-blue-400" />,
    event: <AlertCircle size={16} className="text-amber-400" />,
    message: <MessageCircle size={16} className="text-emerald-400" />,
    music: <Play size={16} className="text-purple-400" />,
    ai: <Sparkles size={16} className="text-pink-400" />,
    ticket: <Ticket size={16} className="text-emerald-400" />
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="w-full max-w-5xl z-10 flex flex-col">
        <header className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-card border border-border/60 shadow-xl flex items-center justify-center">
                 <Cpu size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel de VisualDiscordBot</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Conectado como {user?.email}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${isBridgeActive ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                    AI Voice Bridge: {isBridgeActive ? 'ACTIVO' : 'NO CONECTADO'}
                  </span>
                  {isBridgeActive && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                    </span>
                  )}
                </div>
              </div>
           </div>
           
           <div className="flex gap-2 items-center">
              {isBotRunning ? (
                  <Button variant="outline" size="sm" onClick={handleStopBot} disabled={isDeploying} className="border-red-500/50 hover:bg-red-500/10 text-red-500">
                    {isDeploying ? 'Deteniendo...' : 'Detener Bot'}
                  </Button>
              ) : (
                  <Button variant="outline" size="sm" onClick={handleStartBot} disabled={isDeploying} className="border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500">
                    <Play size={14} className="mr-1.5 fill-current" /> {isDeploying ? 'Iniciando...' : 'Iniciar Bot'}
                  </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsBotTokenModalOpen(true)}>
                 <Settings2 size={16} className="mr-2" /> Ajustes del Bot
              </Button>
              <Button variant="ghost" size="sm" onClick={logOut}>
                 Cerrar Sesión
              </Button>
           </div>
        </header>

        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-semibold tracking-tight text-foreground">Tus Módulos</h2>
           <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetTemplates} className="gap-2 text-xs border-border/40 hover:bg-muted font-semibold">
                 <Sparkles size={14} className="text-primary" /> Restaurar Plantillas
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-md shadow-primary/20" onClick={() => setIsCreateModalOpen(true)}>
                 <Plus size={16} /> Nuevo Módulo
              </Button>
           </div>
        </div>

        {isLoading ? (
           <div className="text-center py-20 text-muted-foreground">Cargando módulos...</div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {modules.map((mod) => (
                <Card 
                  key={mod.id} 
                  className="bg-card/50 border-border/40 hover:border-primary/50 transition-colors cursor-pointer p-5 flex flex-col h-40 relative group"
                  onClick={() => navigate(mod.type === 'music' ? `/music/${mod.id}` : `/editor/${mod.id}`)}
                >
                   <div className="flex items-center justify-between mb-auto">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/50 rounded-lg">
                           {typeIcons[mod.type] || <Cpu size={16} />}
                        </div>
                        <h3 className="font-semibold text-foreground tracking-tight">{mod.name}</h3>
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-medium text-muted-foreground capitalize">Módulo de {mod.type}</span>
                     <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                        <Play size={14} className="fill-current" />
                     </Button>
                   </div>
                </Card>
             ))}
             {modules.length === 0 && (
                <div className="col-span-full text-center py-20 border border-dashed border-border/50 rounded-2xl bg-muted/5">
                   <p className="text-muted-foreground">Aún no tienes ningún módulo.</p>
                </div>
             )}
           </div>
        )}
      </div>

      {/* Bot Token Wizard */}
      <AnimatePresence>
        {isBotTokenModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-card border border-border/60 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden"
             >
               <div className="p-6 border-b border-border/40">
                 <h2 className="text-xl font-bold tracking-tight text-foreground">Conectar Bot de Discord</h2>
                 <p className="text-sm text-muted-foreground mt-1">
                   Pega el token de tu bot desde el Portal de Desarrolladores de Discord para vincularlo.
                 </p>
               </div>
               <div className="p-6 space-y-4">
                  <Input 
                    type="password"
                    placeholder="MTAx..." 
                    value={botTokenInput} 
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    className="font-mono text-xs bg-background"
                  />
               </div>
               <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end gap-2">
                  {userData?.botToken && (
                    <Button variant="ghost" onClick={() => setIsBotTokenModalOpen(false)}>Cancelar</Button>
                  )}
                  <Button onClick={handleSaveBotToken} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">Guardar Token</Button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Module Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-card border border-border/60 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden"
             >
               <div className="p-6 border-b border-border/40">
                 <h2 className="text-xl font-bold tracking-tight text-foreground">Crear Módulo</h2>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-2">
                     <label className="text-xs font-semibold">Nombre del Módulo</label>
                     <Input 
                       placeholder="e.j. Ping Simple, Tickets, Música" 
                       value={newModuleName} 
                       onChange={(e) => setNewModuleName(e.target.value)}
                       className="bg-background"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-semibold">Tipo</label>
                     <select 
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                       value={newModuleType} 
                       onChange={(e) => setNewModuleType(e.target.value)}
                     >
                        <option value="command">Módulo de Comando</option>
                        <option value="event">Módulo de Evento</option>
                        <option value="message">Módulo de Mensaje</option>
                        <option value="music">Módulo de Música (JMusicBot)</option>
                        <option value="ai">Módulo de IA (Gemini Live)</option>
                        <option value="ticket">Módulo de Tickets (Seguro)</option>
                     </select>
                  </div>
               </div>
               <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateModule} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">Crear</Button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
