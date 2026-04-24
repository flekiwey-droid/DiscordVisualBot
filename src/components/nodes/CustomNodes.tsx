
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '../../types';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';

const BaseNode = ({ data, selected, children, colorClass, borderClass, textClass }: { data: NodeData, selected?: boolean, children?: React.ReactNode, colorClass: string, borderClass: string, textClass: string }) => {
  const Icon = (Icons as any)[data.icon || 'HelpCircle'] || Icons.HelpCircle;

  return (
    <Card className={cn(
      "min-w-[240px] border transition-all duration-200 bg-card/95 backdrop-blur-sm shadow-sm",
      selected ? "ring-1 ring-ring border-ring shadow-md" : "border-border/60 hover:shadow-md hover:border-border/80",
      "rounded-xl overflow-hidden"
    )}>
      <div className="flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-border/30 bg-muted/10">
          <div className={cn("flex items-center justify-center p-2 rounded-lg border shadow-sm", colorClass, borderClass)}>
            <Icon size={14} className={textClass} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold tracking-tight text-foreground leading-none">{data.label}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5 font-medium">{data.type}</span>
          </div>
        </div>
        {data.description && (
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
              {data.description}
            </p>
          </div>
        )}
        {children}
      </div>
    </Card>
  );
};

const handleClass = "w-3 h-3 bg-background border-2 border-muted-foreground/40 hover:bg-primary transition-colors hover:border-primary !shadow-sm";

export const TriggerNode = memo(({ data, selected }: { data: NodeData; selected: boolean }) => {
  return (
    <div className="relative group">
      <BaseNode 
        data={data} 
        selected={selected} 
        colorClass="bg-amber-500/10 dark:bg-amber-500/20" 
        borderClass="border-amber-500/20" 
        textClass="text-amber-600 dark:text-amber-400" 
      />
      <Handle type="source" position={Position.Right} className={cn(handleClass, "!border-amber-500/50 hover:!border-amber-500 hover:!bg-amber-500")} />
    </div>
  );
});

export const ActionNode = memo(({ data, selected }: { data: NodeData; selected: boolean }) => {
  const isMessageNode = data.label === 'Enviar Mensaje' || data.label === 'Enviar Embed' || data.label === 'Responder Comando';

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Left} className={cn(handleClass, "!border-blue-500/50 hover:!border-blue-500 hover:!bg-blue-500")} />
      <BaseNode 
        data={data} 
        selected={selected} 
        colorClass="bg-blue-500/10 dark:bg-blue-500/20" 
        borderClass="border-blue-500/20" 
        textClass="text-blue-600 dark:text-blue-400" 
      />
      
      {/* Standard output handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="default"
        className={cn(handleClass, "!border-blue-500/50 top-1/2 hover:!border-blue-500 hover:!bg-blue-500")} 
      />

      {/* Special Button output handle if it's a message node */}
      {isMessageNode && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="buttons"
          className={cn(handleClass, "!border-emerald-500/50 hover:!border-emerald-500 hover:!bg-emerald-500")}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
            Añadir Botón
          </div>
        </Handle>
      )}
    </div>
  );
});

export const ButtonNode = memo(({ data, selected }: { data: NodeData; selected: boolean }) => {
  const style = (data.config as any)?.style || 'Primary';
  const label = (data.config as any)?.label || 'Boton';

  const styleClasses: Record<string, string> = {
    'Primary': 'bg-primary text-primary-foreground border-primary/20',
    'Secondary': 'bg-secondary text-secondary-foreground border-secondary/40',
    'Success': 'bg-emerald-600 text-white border-emerald-500/20',
    'Danger': 'bg-destructive text-destructive-foreground border-destructive/20',
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" className={cn(handleClass, "!border-emerald-500/50 hover:!bg-emerald-500")} />
      
      <div className={cn(
        "px-4 py-2 rounded-lg border shadow-sm transition-all duration-200 min-min-w-[120px] text-center",
        selected ? "ring-2 ring-emerald-500/50 scale-105" : "hover:scale-102",
        styleClasses[style] || styleClasses.Primary
      )}>
        <div className="flex items-center justify-center gap-2">
          <Icons.MousePointer2 size={12} className="opacity-80" />
          <span className="text-xs font-bold tracking-tight">{label}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="out" className={cn(handleClass, "!border-emerald-500/50 hover:!bg-emerald-500")} />
    </div>
  );
});

export const LogicNode = memo(({ data, selected }: { data: NodeData; selected: boolean }) => {
  return (
    <div className="relative group">
      <Handle type="target" position={Position.Left} className={cn(handleClass, "!border-purple-500/50 hover:!border-purple-500 hover:!bg-purple-500")} />
      <BaseNode 
        data={data} 
        selected={selected} 
        colorClass="bg-purple-500/10 dark:bg-purple-500/20" 
        borderClass="border-purple-500/20" 
        textClass="text-purple-600 dark:text-purple-400" 
      />
      <Handle type="source" position={Position.Right} id="true" className={cn(handleClass, "!border-emerald-500/50 top-1/3 hover:!bg-emerald-500 hover:!border-emerald-500")} />
      <Handle type="source" position={Position.Right} id="false" className={cn(handleClass, "!border-rose-500/50 top-2/3 hover:!bg-rose-500 hover:!border-rose-500")} />
    </div>
  );
});

export const VariableNode = memo(({ data, selected }: { data: NodeData; selected: boolean }) => {
  return (
    <div className="relative group">
      <BaseNode 
        data={data} 
        selected={selected} 
        colorClass="bg-emerald-500/10 dark:bg-emerald-500/20" 
        borderClass="border-emerald-500/20" 
        textClass="text-emerald-600 dark:text-emerald-400" 
      />
      <Handle type="source" position={Position.Right} className={cn(handleClass, "!border-emerald-500/50 hover:!border-emerald-500 hover:!bg-emerald-500")} />
    </div>
  );
});
