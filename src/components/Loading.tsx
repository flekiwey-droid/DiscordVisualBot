import { Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="p-4 bg-primary/10 rounded-2xl border border-primary/20 mb-4"
      >
        <Cpu size={32} className="text-primary" />
      </motion.div>
      <h2 className="text-lg font-bold">VisualDiscordBot</h2>
      <p className="text-sm text-muted-foreground mt-1">Iniciando motor...</p>
    </div>
  );
}
