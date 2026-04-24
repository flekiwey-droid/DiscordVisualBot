import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, TerminalSquare } from 'lucide-react';

export function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center text-center max-w-2xl px-4">
        <div className="flex gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border/60 shadow-2xl flex items-center justify-center">
             <Cpu size={32} className="text-primary" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary shadow-[0_0_30px_rgba(88,101,242,0.4)] flex items-center justify-center">
             <TerminalSquare size={32} className="text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6">
          Crea Bots de Discord <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Sin Programar.
          </span>
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          Crea comandos, lógica y eventos visualmente usando una arquitectura basada en Nodos. Simplemente conecta la lógica y enciende tu bot para que funcione en Discord.
        </p>

        <Button 
          size="lg" 
          onClick={signIn}
          className="h-14 px-8 text-base shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full"
        >
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
