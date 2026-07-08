import { Sprout } from 'lucide-react';
import { clsx } from "clsx";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export function PlaceholderPage({ title, description, icon: Icon = Sprout }: PlaceholderPageProps) {
  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm/50">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-150" />
          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-sm rotate-3">
            <Icon className="w-12 h-12 opacity-90 -rotate-3" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-3 relative z-10 pt-4">
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full max-w-[200px] pt-6">
          <div className="h-px flex-1 bg-border/80" />
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
            Coming Soon
          </p>
          <div className="h-px flex-1 bg-border/80" />
        </div>
      </div>
    </div>
  );
}
