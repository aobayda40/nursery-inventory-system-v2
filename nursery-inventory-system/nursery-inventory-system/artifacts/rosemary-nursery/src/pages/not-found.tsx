import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm/50">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/10 rounded-full blur-2xl transform scale-150" />
          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-b from-destructive/10 to-destructive/5 border border-destructive/20 flex items-center justify-center text-destructive shadow-sm rotate-3">
            <AlertCircle className="w-12 h-12 opacity-90 -rotate-3" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-3 relative z-10 pt-4">
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground leading-relaxed">
            The section you are looking for does not exist or has been moved.
          </p>
        </div>
        
        <div className="pt-6 w-full">
          <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2 w-full sm:w-auto cursor-pointer">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
