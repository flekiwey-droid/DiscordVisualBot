
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, FileText, Lock, User, Clock, AlertCircle, Search, Eye, Filter, ArrowLeft, History } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

type PortalState = 'AUTH' | 'LIST' | 'VIEW';

export default function TranscriptPortal() {
  const [state, setState] = useState<PortalState>('AUTH');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Authenticate with Password
  const handleLogin = async () => {
    if (!password.trim()) return toast.error('Ingrese su clave de acceso.');
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ticket_sessions'),
        where('passwordHash', '==', password)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Clave inválida.');
      } else {
        const sessionData = querySnapshot.docs[0].data();
        
        // Check expiration in memory to avoid needing a composite index
        if (sessionData.expiresAt < Date.now()) {
          return toast.error('Esta clave de acceso ha expirado (validez 8h).');
        }

        setSession(sessionData);
        await fetchTranscripts();
        setState('LIST');
        toast.success(`Bienvenido, ${sessionData.staffId || 'Auditor'}`);
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      // More descriptive error
      if (e.message?.includes('permission-denied')) {
        toast.error('Error de permisos en la base de datos. Contacte al administrador.');
      } else {
        toast.error('Error al conectar con el servidor de auditoría.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch All Transcripts
  const fetchTranscripts = async () => {
    try {
      const q = query(collection(db, 'transcripts'), orderBy('closedAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTranscripts(list);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los transcripts.');
    }
  };

  // 3. Open Transcript (Requires Reason)
  const handleOpenTranscript = (item: any) => {
    setSelectedTranscript(item);
  };

  const handleConfirmAccess = async () => {
    if (reason.length < 5) return toast.error('Proporcione un motivo válido (mín. 5 caracteres).');

    setLoading(true);
    try {
      // Log audit access
      const logData = {
        transcriptId: selectedTranscript.id,
        staffId: session.staffId,
        staffAvatar: session.staffAvatar,
        reason: reason,
        action: 'VIEW_CONTENT',
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'audit_logs'), logData);

      // Fetch audit history for this transcript
      const logQuery = query(
        collection(db, 'audit_logs'),
        where('transcriptId', '==', selectedTranscript.id)
      );
      const logSnapshot = await getDocs(logQuery);
      // Sort in memory to avoid index requirements
      const sortedLogs = logSnapshot.docs
        .map(d => d.data())
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      
      setAccessLogs(sortedLogs);

      setState('VIEW');
      setReason('');
      toast.success('Acceso autorizado y registrado.');
    } catch (e) {
      console.error(e);
      toast.error('Error al registrar la auditoría.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTranscripts = transcripts.filter(t => 
    t.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.creatorId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-emerald-500/30">
      <AnimatePresence mode="wait">
        
        {/* --- STATE: AUTH --- */}
        {state === 'AUTH' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05),_transparent_50%)]"
          >
            <Card className="w-full max-w-md border-zinc-800/50 bg-zinc-950/50 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-emerald-500/10 p-4 rounded-2xl w-fit mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Lock className="text-emerald-500" size={32} />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white mb-1">Portal de Transcripts</CardTitle>
                <CardDescription>Seguridad de Auditoría y Control de Datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Clave de Identidad Discord</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                      <ShieldCheck size={18} />
                    </div>
                    <Input 
                      type="password" 
                      placeholder="XXXX-XXXX-XXXX"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="bg-zinc-900/50 border-zinc-800 h-12 pl-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all font-mono tracking-widest"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Acceder al Registro'}
                </Button>

                <div className="flex items-center gap-2 justify-center bg-zinc-900/50 py-3 rounded-xl border border-zinc-800/50">
                  <AlertCircle size={14} className="text-zinc-500" />
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    Acceso monitorizado por logs internos
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* --- STATE: LIST --- */}
        {state === 'LIST' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto p-4 md:p-8 space-y-8"
          >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 p-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <FileText className="text-zinc-950" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white italic">AUDIT <span className="text-emerald-500">PORTAL</span></h1>
                  <p className="text-zinc-500 text-sm font-medium">Gestión de registros y cumplimiento de seguridad</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-full border border-zinc-800">
                <img src={session.staffAvatar} className="w-8 h-8 rounded-full border border-emerald-500/20" alt="Avatar" />
                <div className="pr-4">
                  <p className="text-xs font-bold text-white leading-none mb-1">{session.staffId}</p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none px-0 h-auto text-[9px] uppercase tracking-tighter">Sesión Activa</Badge>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Buscador</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input 
                      placeholder="ID Ticket / Usuario..." 
                      className="bg-zinc-900 border-zinc-800 pl-10 text-sm h-11 focus-visible:ring-emerald-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Card className="border-zinc-800/50 bg-zinc-900/30">
                  <CardHeader className="py-4">
                    <CardTitle className="text-xs font-bold flex items-center gap-2">
                      <Filter size={14} className="text-emerald-500" /> RESUMEN
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/30">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Registros</p>
                      <p className="text-2xl font-mono font-bold text-white">{transcripts.length}</p>
                    </div>
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/30">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Tu Estado</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-semibold text-zinc-300">Auditor Autorizado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-3">
                <div className="space-y-4">
                  {filteredTranscripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                      <Search className="text-zinc-700" size={48} />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-zinc-400">Sin resultados</h3>
                        <p className="text-sm text-zinc-600">No se encontraron registros que coincidan con la búsqueda.</p>
                      </div>
                    </div>
                  ) : (
                    filteredTranscripts.map((t) => (
                      <motion.div 
                        key={t.id}
                        whileHover={{ x: 4 }}
                        className="group relative bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl hover:bg-zinc-900/60 hover:border-emerald-500/30 transition-all cursor-pointer"
                        onClick={() => handleOpenTranscript(t)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 group-hover:border-emerald-500/30 transition-colors">
                              <FileText className="text-zinc-500 group-hover:text-emerald-500 transition-colors" size={20} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">#{t.ticketId?.slice(-6) || 'N/A'}</span>
                                <Badge variant="outline" className="bg-zinc-800/50 border-none text-[9px] font-mono text-zinc-500">{t.ticketId}</Badge>
                              </div>
                              <p className="text-xs text-zinc-500">Propietario: <span className="text-zinc-300 font-medium">{t.creatorId}</span></p>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-6">
                            <div className="hidden md:block space-y-1">
                              <div className="flex items-center gap-1 text-zinc-500 text-[10px] justify-end">
                                <Clock size={10} />
                                {t.closedAt ? new Date(t.closedAt.seconds * 1000).toLocaleDateString() : 'Desconocida'}
                              </div>
                              <p className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-tighter">Ticket Cerrado</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-zinc-600 group-hover:text-emerald-500 transition-colors">
                              <Eye size={18} />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MODAL: REQUIRE REASON */}
            {selectedTranscript && state === 'LIST' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-lg"
                >
                  <Card className="border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
                    <div className="h-1.5 w-full bg-emerald-500/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="text-amber-500" size={20} /> Autorización de Acceso
                      </CardTitle>
                      <CardDescription>Para visualizar el transcript #{selectedTranscript.ticketId} debe indicar el motivo legal de la consulta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 border-l-4 border-l-amber-500/50">
                        <p className="text-[11px] text-amber-500/80 uppercase font-bold tracking-widest mb-1 italic">Advertencia de Seguridad</p>
                        <p className="text-xs text-zinc-400">Su nombre (**{session.staffId}**) y el motivo ingresado quedarán vinculados permanentemente a este registro de auditoría.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Motivo del Acceso</label>
                        <textarea 
                          className="w-full min-h-[100px] bg-zinc-950 border-zinc-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-zinc-700"
                          placeholder="p.ej. Revisión de abuso de staff, reporte de comportamiento inapropiado, etc..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-11 border-zinc-800" onClick={() => setSelectedTranscript(null)}>Cancelar</Button>
                        <Button 
                          className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          onClick={handleConfirmAccess}
                          disabled={loading}
                        >
                          {loading ? 'Confirmando...' : 'Confirmar y Abrir'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- STATE: VIEW --- */}
        {state === 'VIEW' && selectedTranscript && (
          <motion.div 
            key="view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-6xl mx-auto p-4 md:p-8 space-y-6"
          >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
                  onClick={() => setState('LIST')}
                >
                  <ArrowLeft size={18} />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Ticket #{selectedTranscript.ticketId}</h1>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none py-0.5 text-[9px] font-bold">LECTURA AUTORIZADA</Badge>
                  </div>
                  <p className="text-zinc-500 text-xs">Cerrado el {new Date(selectedTranscript.closedAt?.seconds * 1000).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-xs border-zinc-800 h-9" onClick={() => window.print()}>
                  Exportar PDF
                </Button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Transcript Column */}
              <Card className="lg:col-span-8 border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="border-b border-zinc-900/50 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Historial de Conversación</CardTitle>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                      <User size={12} className="text-zinc-500" />
                      <span className="text-[10px] font-mono text-zinc-400">{selectedTranscript.creatorId}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px] p-6">
                    <div className="space-y-6">
                      {selectedTranscript.messages?.length > 0 ? (
                        selectedTranscript.messages.map((msg: any, i: number) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-500">{msg.author}</span>
                              <span className="text-[9px] font-mono text-zinc-600 italic">
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-zinc-900/70 p-3.5 rounded-2xl rounded-tl-none border border-zinc-800/50 max-w-[90%]">
                              <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-50 italic text-sm py-20 text-zinc-500">
                          No hay mensajes registrados en este ticket.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Sidebar: Audit & Details */}
              <div className="lg:col-span-4 space-y-6 no-print">
                <Card className="border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
                  <CardHeader className="bg-zinc-950/50 py-4 border-b border-zinc-800">
                    <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-zinc-400">
                      <History size={14} className="text-emerald-500" /> Historial de Accesos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[300px] pr-2">
                      <div className="space-y-6">
                        {accessLogs.map((log, i) => (
                          <div key={i} className="relative pl-4 border-l border-zinc-800 space-y-1 pb-2">
                            <div className="absolute -left-[5px] top-1 w-[9px] h-[9px] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div className="flex items-center gap-2">
                              {log.staffAvatar && <img src={log.staffAvatar} className="w-5 h-5 rounded-full" alt="" />}
                              <span className="text-[11px] font-bold text-white">{log.staffId}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-relaxed italic bg-zinc-950 p-2 rounded border border-zinc-800/50">
                              "{log.reason}"
                            </p>
                            <div className="text-[9px] text-zinc-600 font-mono">
                              {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Reciente'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="p-6 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(16,185,129,0.02)_10px,rgba(16,185,129,0.02)_20px)] rounded-3xl border border-emerald-500/10 text-center space-y-3">
                  <ShieldCheck size={20} className="mx-auto text-emerald-500/50" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Protocolo de Alta Seguridad</p>
                    <p className="text-[9px] text-zinc-600 mt-1">Este canal está cifrado y cada acción está vinculada a su firma digital de Discord.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
