import { Shield, Lock, Eye } from 'lucide-react';

export function PrivacyBadge() {
  return (
    <div className="bg-accent/50 border border-accent-foreground/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-accent">
          <Shield className="h-6 w-6 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-lg">Your Privacy is Protected</h3>
      </div>
      
      <div className="grid gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-primary flex-shrink-0" />
          <span>All processing happens locally in your browser</span>
        </div>
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-primary flex-shrink-0" />
          <span>Your data never leaves your device</span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
          <span>No data is uploaded to any server</span>
        </div>
      </div>
    </div>
  );
}
