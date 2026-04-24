/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import React, { useState, useCallback, useMemo, useRef } from 'react';

// Initialize the API using the standard process.env structure handled by Vite via define plugin or import.meta equivalent manually.
// According to skills, "React (Vite): const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); Do NOT use import.meta as any."
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode, ActionNode, LogicNode, VariableNode, ButtonNode } from '../components/nodes/CustomNodes';
import { NODE_CATEGORIES } from '../constants';
import { VNode, VEdge, NodeData } from '../types';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Settings2, 
  ChevronRight, 
  Cpu, 
  Layers,
  Search,
  Zap,
  Info,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/Loading';

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  logicNode: LogicNode,
  variableNode: VariableNode,
  buttonNode: ButtonNode,
};

// Generate a unique ID
let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

interface PropertiesContentProps {
  nodeId: string;
  nodeData: NodeData;
  updateNodeConfig: (id: string, config: any) => void;
  deleteNode: (id: string) => void;
  addButtonNode?: (parentId: string) => void;
  mobile?: boolean;
}

const PropertiesContent = ({ nodeId, nodeData, updateNodeConfig, deleteNode, addButtonNode, mobile = false }: PropertiesContentProps) => (
    <div className={cn("space-y-6", mobile ? "p-4" : "p-6")}>
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-muted/20 border border-border/50 rounded-xl">
           <div className={cn(
            "p-2.5 rounded-xl border shadow-sm shrink-0",
            nodeData.type === 'trigger' ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
            nodeData.type === 'action' ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" : 
            nodeData.label === 'Boton' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
            "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
           )}>
            {React.createElement((Icons as any)[nodeData.icon as string || 'Settings'] || Icons.Settings, { size: 18 })}
           </div>
           <div className="min-w-0">
             <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">{nodeData.label}</h3>
             <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">{nodeData.description}</p>
             <p className="text-[9px] text-muted-foreground mt-2 font-mono opacity-60 truncate">ID: {nodeId}</p>
           </div>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-9 rounded-lg bg-muted/50 p-1">
          <TabsTrigger value="config" className="text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Configuración</TabsTrigger>
          <TabsTrigger value="debug" className="text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Depuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config" className="space-y-5 mt-0 outline-none">
          {/* Section for Buttons - Modern logic with buttonNodes */}
          {(nodeData.label === 'Enviar Mensaje' || nodeData.label === 'Enviar Embed' || nodeData.label === 'Responder Comando') && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold tracking-tight text-foreground flex items-center justify-between">
                Control de Botones
                {addButtonNode && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10" onClick={() => addButtonNode(nodeId)}>
                    <Plus size={14} />
                  </Button>
                )}
              </label>
              <div className="bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl p-4 text-center">
                 <p className="text-[10px] text-muted-foreground font-medium mb-1">Crea nuevos botones visuales.</p>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-7 text-[10px] gap-2 text-emerald-500 font-bold hover:bg-emerald-500/10"
                   onClick={() => addButtonNode?.(nodeId)}
                 >
                   <Plus size={12} /> CREAR BOTÓN VISUAL
                 </Button>
              </div>
            </div>
          )}

          {/* Config for ButtonNode specifically */}
          {nodeData.label === 'Boton' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-tight text-foreground flex items-center justify-between">
                  Etiqueta del Botón
                  <Icons.Type size={12} className="opacity-30" />
                </label>
                <Input
                  value={(nodeData.config as any)?.label || ''}
                  onChange={(e) => updateNodeConfig(nodeId, { label: e.target.value })}
                  placeholder="Ej: Abrir Ticket"
                  className="bg-background h-9 text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-tight text-foreground flex items-center justify-between">
                  Estilo / Color
                  <Icons.Palette size={12} className="opacity-30" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Primary', 'Secondary', 'Success', 'Danger'].map((style) => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 text-[10px] font-bold uppercase tracking-wider",
                        (nodeData.config as any)?.style === style ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground"
                      )}
                      onClick={() => updateNodeConfig(nodeId, { style })}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {Object.keys(nodeData.config || {}).map((key) => {
            if (key === 'buttons' || (nodeData.label === 'Boton' && (key === 'label' || key === 'style'))) return null;
            if (key === 'label' && nodeData.label !== 'Boton') return null;
            if (false) {
              const buttons = (nodeData.config as any)[key] || [];
              return (
                <div key={key} className="space-y-3 pt-2">
                  <label className="text-xs font-semibold tracking-tight text-foreground flex items-center justify-between">
                    Botones Interactivos
                    <Plus size={12} className="cursor-pointer text-primary" onClick={() => {
                        const newBtn = { id: `btn_${Date.now()}`, label: 'Nuevo Botón', style: 'Primary' };
                        updateNodeConfig(nodeId, { buttons: [...buttons, newBtn] });
                    }} />
                  </label>
                  <div className="space-y-2">
                    {buttons.map((btn: any, index: number) => (
                      <div key={btn.id} className="flex gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border/40">
                         <div className="flex-1 space-y-1">
                            <Input 
                              value={btn.label} 
                              onChange={(e) => {
                                 const newBtns = [...buttons];
                                 newBtns[index] = { ...btn, label: e.target.value };
                                 updateNodeConfig(nodeId, { buttons: newBtns });
                              }}
                              className="h-7 text-[10px] bg-background"
                              placeholder="Etiqueta"
                            />
                         </div>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-6 w-6 text-destructive"
                           onClick={() => {
                              const newBtns = buttons.filter((_: any, i: number) => i !== index);
                              updateNodeConfig(nodeId, { buttons: newBtns });
                           }}
                         >
                           <Trash2 size={12} />
                         </Button>
                      </div>
                    ))}
                    {buttons.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">Sin botones añadidos</p>
                    )}
                  </div>
                </div>
              );
            }

            const isTextarea = ['messageContent', 'embedDescription', 'reason', 'headers'].includes(key);
            const isVariableSupported = ['messageContent', 'embedDescription', 'embedTitle', 'userId', 'channelId', 'url', 'variable1', 'variable2'].includes(key);
            
            return (
              <div key={key} className="space-y-2">
                <label className="text-xs font-semibold tracking-tight text-foreground flex items-center justify-between">
                  {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                  <Info size={12} className="opacity-30" />
                </label>
                {isTextarea ? (
                  <textarea
                    value={(nodeData.config as any)[key]}
                    onChange={(e) => updateNodeConfig(nodeId, { [key]: e.target.value })}
                    className="flex min-h-[80px] w-full bg-background text-xs border border-border/60 hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all rounded-lg shadow-xs px-3 py-2 resize-y"
                  />
                ) : (
                  <Input
                    value={(nodeData.config as any)[key]}
                    onChange={(e) => updateNodeConfig(nodeId, { [key]: e.target.value })}
                    className="bg-background h-9 text-xs border-border/60 hover:border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all rounded-lg shadow-xs"
                  />
                )}
                {isVariableSupported && (
                  <p className="text-[10px] text-muted-foreground/70 leading-tight pt-0.5">
                    Supports <code className="text-primary/90 font-mono bg-primary/10 px-1 py-0.5 rounded-[4px] text-[9px]">{'{user.id}'}</code> or <code className="text-primary/90 font-mono bg-primary/10 px-1 py-0.5 rounded-[4px] text-[9px]">{'{channel.name}'}</code>
                  </p>
                )}
              </div>
            );
          })}

          {(!nodeData.config || Object.keys(nodeData.config).length === 0) && (
            <div className="bg-muted/10 border border-dashed border-border/60 rounded-xl p-8 text-center flex flex-col items-center justify-center">
              <Zap size={20} className="text-muted-foreground opacity-30 mb-3" />
              <p className="text-xs text-muted-foreground font-medium">No configuration needed.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="debug" className="mt-0 outline-none">
           <Card className="bg-muted/10 border-border/50 p-4 shadow-none">
             <div className="flex items-center gap-2 mb-3">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
               <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Runtime Memory</span>
             </div>
             <pre className="text-[10px] font-mono leading-relaxed text-muted-foreground bg-muted/30 border border-border/30 p-3 rounded-lg overflow-hidden whitespace-pre-wrap max-h-64 overflow-y-auto w-full break-all">
               {JSON.stringify(nodeData, null, 2)}
             </pre>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="pt-8">
        <Button
          variant="outline"
          className="w-full h-9 gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60 shadow-xs"
          onClick={() => deleteNode(nodeId)}
        >
          <Trash2 size={14} /> Remove Node
        </Button>
      </div>
    </div>
  );

function VDBEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [moduleName, setModuleName] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Load Module from Firebase
  React.useEffect(() => {
    if (!moduleId || !user) return;
    
    // Set bot token if it exists in user context
    if (userData?.botToken) {
      setBotToken(userData.botToken);
    }

    const loadModule = async () => {
      try {
        const docRef = doc(db, 'modules', moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          const data = docSnap.data();
          setModuleName(data.name);
          setNodes(JSON.parse(data.nodes || '[]'));
          setEdges(JSON.parse(data.edges || '[]'));
        } else {
          toast.error("Module not found.");
          navigate('/dashboard');
        }
      } catch (e: any) {
         toast.error("Error loading module");
      } finally {
        setIsLoading(false);
      }
    };
    loadModule();
  }, [moduleId, user]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  // Auto-open mobile drawer when node is selected
  const handleNodeClick = (_: any, node: VNode) => {
    setSelectedNodeId(node.id);
    if (window.innerWidth < 1024) {
      setIsMobilePropertiesOpen(true);
    }
  };

  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const systemPrompt = `You are an expert Discord Bot architecture assistant for VisualDiscordBot.
      The user will give you a natural language prompt describing a bot flow.
      You must respond ONLY with a valid JSON object matching this schema exactly:
      {
         "nodes": [
            { "id": "t1", "type": "triggerNode", "position": { "x": 100, "y": 150 }, "data": { "label": "node_label", "type": "trigger", "icon": "icon_name", "config": {} } }
         ],
         "edges": [
            { "id": "e1", "source": "t1", "target": "a1" }
         ]
      }

      Valid Triggers labels (type: 'triggerNode', data.type: 'trigger'):
      - 'Comando Slash': config { commandName, description, isEphemeral } icon: 'TerminalSquare'
      - 'Comando de Texto': config { trigger, ignoreBots } icon: 'MessageCircle'
      - 'Al Recibir Mensaje': config { mustContain, ignoreBots } icon: 'MessageSquare'
      - 'Miembro Nuevo': config { sendWelcomeMessage } icon: 'UserPlus'
      - 'Reaccion a Mensaje': config { emoji, messageId } icon: 'SmilePlus'

      Valid Actions labels (type: 'actionNode', data.type: 'action'):
      - 'Enviar Mensaje': config { channelId, messageContent } icon: 'Send'
      - 'Enviar Embed': config { channelId, embedTitle, embedDescription, hexColor } icon: 'LayoutTemplate'
      - 'Reaccionar a Mensaje': config { emoji } icon: 'SmilePlus'
      - 'Borrar Mensaje': config {} icon: 'Trash'
      - 'Responder Interaccion': config { messageContent, ephemeral } icon: 'Reply'
      - 'Añadir Rol': config { roleId, userId } icon: 'ShieldHalf'
      - 'Remover Rol': config { roleId, userId } icon: 'ShieldMinus'
      - 'Aislar Usuario (Timeout)': config { userId, durationMinutes, reason } icon: 'Clock4'
      - 'Expulsar Usuario (Kick)': config { userId, reason } icon: 'UserMinus'
      - 'Banear Usuario (Ban)': config { userId, reason } icon: 'Hammer'
      - 'Crear Canal': config { channelName, categoryName } icon: 'Hash'
      - 'Borrar Canal': config { channelId } icon: 'Trash2'

      Logic Nodes labels (type: 'logicNode', data.type: 'logic'):
      - '¿Tiene Rol?': config { roleId, userId } icon: 'ShieldQuestion'
      - 'Condicion (If/Else)': config { variable1, operator, variable2 } icon: 'GitBranch'

      IMPORTANT RULES:
      - X coordinates MUST advance left to right (e.g., 100, 400, 700) to keep the visual flow clean. Y coordinates can stay the same or adjust slightly.
      - User generic parameters mapping (use '{user.id}', '{user.name}', '{channel.id}' internally as required).
      - Ensure node \`id\` fields uniqueness across actions and triggers (e.g. t1, a1, a2, l1).
      - Ensure edge connections match \`id\` strings correctly.
      - Return ONLY the raw JSON object. Do not format with markdown blocks \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: aiPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
         try {
           const parsedData = JSON.parse(text);
           if (parsedData.nodes && parsedData.edges) {
             setNodes(parsedData.nodes);
             setEdges(parsedData.edges);
             setIsAIGenerateModalOpen(false);
             setAiPrompt("");
             toast.success("Flujo IA generado correctamente");
           } else {
             toast.error("Formato de flujo inválido devuelto por la IA");
           }
         } catch(e) {
             toast.error("La IA del generador devolvió algo que no se pudo leer");
         }
      }
    } catch (e) {
      console.error(e);
      toast.error("Ocurrió un error con la IA Gemini");
    } finally {
      setIsGenerating(false);
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: NodeData) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const addNodeAtCenter = (type: string, data: NodeData) => {
    if (!reactFlowWrapper.current) return;
    
    // For mobile, place it in the center of the viewport
    const position = { x: 250, y: 250 };

    const newNode: VNode = {
      id: getId(),
      type,
      position,
      data: JSON.parse(JSON.stringify(data)),
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success(`Added ${data.label}`);
    setIsMobilePaletteOpen(false); // Close the palette drawer after adding
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');

      if (!type || !dataStr || !reactFlowWrapper.current) return;

      const data = JSON.parse(dataStr);
      const position = {
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left - 100,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top - 40,
      };

      const newNode: VNode = {
        id: getId(),
        type,
        position,
        data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const addButtonNode = (parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = getId();
    const position = {
      x: parentNode.position.x + 300,
      y: parentNode.position.y + (nodes.filter(n => n.type === 'buttonNode').length * 60) - 100
    };

    const newNode: VNode = {
      id: newNodeId,
      type: 'buttonNode',
      position,
      data: {
        label: 'Boton',
        type: 'action',
        icon: 'MousePointer2',
        description: 'Botón interactivo de Discord',
        config: {
          label: 'Nuevo Botón',
          style: 'Primary'
        }
      }
    };

    const newEdge: VEdge = {
      id: `e_${parentId}_${newNodeId}`,
      source: parentId,
      target: newNodeId,
      sourceHandle: 'buttons',
      targetHandle: 'in'
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
    setSelectedNodeId(newNodeId);
    toast.success("Botón visual añadido");
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                ...config,
              },
            },
          };
        }
        return node;
      })
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setIsMobilePropertiesOpen(false);
    toast.success('Node deleted');
  };

  const saveScript = async () => {
    if (!moduleId || !user) return;
    try {
      const docRef = doc(db, 'modules', moduleId);
      await updateDoc(docRef, {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        updatedAt: serverTimestamp()
      });
      toast.success('Module saved securely!');
    } catch (e) {
      toast.error('Failed to save module.');
    }
  };

  const { updateBotToken } = useAuth();

  const deployBot = async () => {
    if (!botToken.trim()) {
      toast.error('Please enter a valid Bot Token');
      return;
    }

    setIsDeploying(true);
    try {
      // Save token in DB if different
      if (botToken !== userData?.botToken) {
         await updateBotToken(botToken.trim());
      }

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken.trim(), nodes, edges }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to deploy');
      
      toast.success(`Bot deployed successfully as ${data.botTag}!`, {
        description: 'Now actively listening for Discord events.',
      });
      setIsDeployModalOpen(false);
    } catch (err: any) {
      toast.error('Deployment Failed', {
        description: err.message || 'Check terminal logs for details.'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading) return <Loading />;

  const NodePalette = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("p-4 space-y-6", mobile && "px-0")}>
      {!mobile && isSidebarOpen && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search nodes..." className="pl-9 h-9 text-xs" />
        </div>
      )}

      {NODE_CATEGORIES.map((cat) => (
        <div key={cat.id} className="space-y-3">
          <div className="flex items-center gap-2 group">
            <div className="h-4 w-1 bg-primary/40 rounded-full group-hover:bg-primary transition-colors" />
            <h3 className={cn("text-[11px] font-bold uppercase tracking-widest text-muted-foreground", !mobile && !isSidebarOpen && "sr-only")}>
              {cat.label}
            </h3>
          </div>
          <div className="space-y-2">
            {cat.nodes.map((node) => (
              <div key={node.label}>
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, node.defaultData)}
                      onClick={() => mobile && addNodeAtCenter(node.type, node.defaultData)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border/50 bg-transparent hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-all group w-full",
                        !mobile && !isSidebarOpen ? "justify-center px-0" : "text-left"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg border shadow-sm flex items-center justify-center shrink-0",
                        node.type.includes('trigger') ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" : 
                        node.type.includes('action') ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                      )}>
                        {React.createElement((Icons as any)[node.defaultData.icon || 'Box'] || Icons.Box, { size: 16 })}
                      </div>
                      {(mobile || isSidebarOpen) && (
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold truncate leading-tight text-foreground">{node.label}</span>
                          <span className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">{node.description}</span>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {!mobile && !isSidebarOpen && (
                    <TooltipContent side="right" className="font-sans">
                      <p className="font-semibold text-[13px]">{node.label}</p>
                      <p className="text-[11px] text-muted-foreground">{node.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden font-sans">
      <Toaster position="top-right" theme="dark" />
      
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 64 }}
        className="hidden lg:flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-md relative z-10"
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between h-14 bg-card/60">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_15px_rgba(88,101,242,0.4)]">
                <Cpu size={16} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-[15px] tracking-tight">VisualDiscordBot</span>
              <Badge variant="secondary" className="text-[9px] py-0 px-1 ml-1 font-semibold bg-primary/20 text-primary border-none">PRO</Badge>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_15px_rgba(88,101,242,0.4)] mx-auto">
              <Cpu size={16} className="text-primary-foreground" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-8 w-8 text-muted-foreground hover:bg-muted"
          >
            <ChevronRight className={cn("transition-transform", isSidebarOpen ? "rotate-180" : "")} />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <NodePalette />
        </ScrollArea>
      </motion.aside>

      {/* Main flow area */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-background">
        {/* Toolbar */}
        <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 lg:px-6 bg-card/95 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile Menu Trigger */}
            <Sheet>
               <SheetTrigger
                 render={
                   <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground" />
                 }
               >
                 <Menu size={18} />
               </SheetTrigger>
               <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b border-border/40 bg-muted/10">
                    <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                       <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
                         <Cpu size={16} className="text-primary" />
                       </div>
                       VDB Palette
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1">
                    <NodePalette mobile />
                  </ScrollArea>
               </SheetContent>
            </Sheet>

             <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => navigate('/dashboard')}>
                   <ChevronRight size={14} className="rotate-180 text-muted-foreground" />
                </Button>
                <h1 className="text-sm font-semibold tracking-tight text-foreground leading-none">{moduleName}</h1>
                <span className="hidden xs:flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border/50">Borrador</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 hidden xs:flex items-center gap-1.5 tracking-tight ml-8">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Guardado de forma segura
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-5 hidden sm:block opacity-50" />
            
            <div className="hidden sm:flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 font-medium bg-muted/50 text-foreground border border-border/50 hover:bg-muted shadow-sm hover:text-foreground">
                <Layers size={14} className="text-primary" /> <span className="hidden md:inline">Flujo Lógico</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 font-medium text-muted-foreground hover:text-foreground">
                <Settings2 size={14} /> <span className="hidden md:inline">Entorno Global</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAIGenerateModalOpen(true)} size="sm" variant="outline" className="h-8 px-3 gap-2 text-xs font-semibold border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
              <Sparkles size={14} className="fill-current/50" /> Generar con IA
            </Button>
            <Button onClick={saveScript} size="sm" variant="outline" className="h-8 px-4 gap-2 text-xs font-semibold bg-card border-border/60 hover:bg-muted text-foreground">
              <Save size={14} /> Guardar módulo
            </Button>
            <Button onClick={deployBot} disabled={isDeploying} size="sm" className="h-8 px-4 gap-2 text-xs font-semibold shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Zap size={14} className={cn("fill-current", isDeploying && "animate-pulse")} />
              {isDeploying ? 'Desplegando...' : 'Desplegar Bot'}
            </Button>
          </div>
        </header>

        {/* Deploy modal removed */}

        <div className="flex-1 relative bg-muted/10" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="[&_.react-flow__background]:bg-background transition-colors"
            colorMode="system"
          >
            <Background color="#8b95a5" gap={20} size={1} className="opacity-30" />
            <Controls className="!bg-card !border-border/60 !left-4 !bottom-24 lg:!bottom-6 shadow-xl rounded-xl overflow-hidden [&>button]:!border-b-border/60" />
            <MiniMap 
              className="!bg-card !border-border/60 !rounded-xl overflow-hidden shadow-xl hidden sm:block !bottom-6 !right-6" 
              nodeColor={(n: any) => {
                if (n.data?.type === 'trigger') return '#f59e0b';
                if (n.data?.type === 'action') return '#3b82f6';
                if (n.data?.type === 'logic') return '#8b5cf6';
                return '#10b981';
              }}
              maskColor="var(--background)"
              nodeBorderRadius={8}
            />
            <Panel position="top-right" className="flex flex-col gap-2 p-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-card shadow-sm h-8 w-8 p-0 border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all rounded-lg"
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </Panel>
            
            <Panel position="bottom-center">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-card/80 backdrop-blur-md border border-border/60 px-4 py-2 rounded-full shadow-lg flex items-center gap-5 mb-6"
              >
                <div className="flex items-center gap-2 text-[11px] font-medium border-r border-border/60 pr-5 text-muted-foreground">
                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                   <span className="text-foreground font-semibold">{nodes.length}</span> Nodos
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground mr-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-foreground font-semibold">{edges.length}</span> Conexiones
                </div>
              </motion.div>
            </Panel>
          </ReactFlow>

          {/* Mobile FAB for adding nodes */}
          <div className="absolute right-4 bottom-24 lg:hidden z-50">
             <Button 
               size="icon" 
               className="h-14 w-14 rounded-full shadow-[0_0_15px_rgba(88,101,242,0.4)] border-2 border-background bg-primary hover:bg-primary/90 text-primary-foreground" 
               onClick={() => setIsMobilePaletteOpen(true)}
             >
               <Plus size={28} />
             </Button>
             
             <Drawer open={isMobilePaletteOpen} onOpenChange={setIsMobilePaletteOpen}>
                <DrawerContent className="max-h-[85vh] flex flex-col">
                   <DrawerHeader className="border-b border-border/40 text-left shrink-0">
                      <DrawerTitle className="flex items-center gap-2 text-sm font-semibold">
                         <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
                           <Cpu size={16} className="text-primary" />
                         </div>
                         Añadir Nodo al Flujo
                      </DrawerTitle>
                   </DrawerHeader>
                   <div className="flex-1 overflow-y-auto px-4 py-2">
                       <NodePalette mobile />
                   </div>
                </DrawerContent>
             </Drawer>
          </div>
        </div>
      </main>

      {/* Properties Panel - Desktop */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.aside
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="w-80 border-l bg-card/40 backdrop-blur-md z-10 hidden lg:flex flex-col"
          >
            <div className="h-16 border-b flex items-center px-4 justify-between bg-card/60">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-bold">Propiedades</h2>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPanelOpen(false)}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {selectedNode ? (
                <PropertiesContent 
                  nodeId={selectedNode.id} 
                  nodeData={selectedNode.data} 
                  updateNodeConfig={updateNodeConfig}
                  deleteNode={deleteNode}
                  addButtonNode={addButtonNode}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-40">
                  <div className="bg-muted p-4 rounded-3xl">
                    <Plus size={32} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Ningún Nodo Seleccionado</h3>
                    <p className="text-xs text-muted-foreground mt-2 px-4 italic leading-relaxed">
                      Selecciona un nodo en el flujo para configurar sus propiedades y lógica.
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

        {/* Mobile Properties Panel - Drawer */}
        <Drawer open={isMobilePropertiesOpen} onOpenChange={setIsMobilePropertiesOpen}>
          <DrawerContent className="max-h-[96dvh]">
            <DrawerHeader className="border-b">
               <DrawerTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-primary" />
                    <span>Propiedades</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMobilePropertiesOpen(false)}>
                    <X size={18} />
                  </Button>
               </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto pb-10">
              {selectedNode && (
                <PropertiesContent 
                  nodeId={selectedNode.id} 
                  nodeData={selectedNode.data} 
                  updateNodeConfig={updateNodeConfig}
                  deleteNode={deleteNode}
                  addButtonNode={addButtonNode}
                  mobile 
                />
              )}
            </div>
         </DrawerContent>
      </Drawer>

      {!isPanelOpen && (
         <Button 
           className="fixed right-4 bottom-4 h-12 w-12 rounded-full shadow-2xl z-50 border-2 border-primary/20 hidden lg:flex"
           onClick={() => setIsPanelOpen(true)}
         >
           <Settings2 size={24} />
         </Button>
      )}

      {/* AI Generate Modal */}
      <AnimatePresence>
        {isAIGenerateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-card border border-border/60 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
             >
               <div className="p-6 border-b border-border/40 flex justify-between items-center bg-purple-500/5">
                 <div>
                   <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                     <Sparkles size={20} className="text-purple-400" /> Auto-construir Flujo
                   </h2>
                   <p className="text-sm text-muted-foreground mt-1">
                     Describe el comando o flujo que deseas y la IA lo construirá para ti con los nodos existentes.
                   </p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsAIGenerateModalOpen(false)}>
                   <X size={18} />
                 </Button>
               </div>
               <div className="p-6 space-y-4">
                  <textarea
                    placeholder="Ejemplo: Crea un comando /ban que quite todos los roles y expulse al usuario proporcionado en argumentos."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full h-32 p-4 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    disabled={isGenerating}
                  />
               </div>
               <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAIGenerateModalOpen(false)} disabled={isGenerating}>
                     Cancelar
                  </Button>
                  <Button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt.trim()} className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]">
                     {isGenerating ? 'Generando...' : 'Crear Flujo'}
                  </Button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Editor() {
  return (
    <TooltipProvider>
      <ReactFlowProvider>
        <VDBEditor />
      </ReactFlowProvider>
    </TooltipProvider>
  );
}
