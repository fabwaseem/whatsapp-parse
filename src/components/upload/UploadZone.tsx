import { useCallback, useState } from 'react';
import { Upload, FileArchive, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsingProgress } from '@/types/chat';
import { Progress } from '@/components/ui/progress';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  progress?: ParsingProgress;
  error?: string;
}

export function UploadZone({ onFileSelect, isProcessing, progress, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
        "bg-card hover:border-primary/50",
        isDragging && "border-primary bg-accent/50 scale-[1.02]",
        error && "border-destructive/50",
        isProcessing && "pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".zip"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {isProcessing ? (
          <>
            <div className="relative">
              <FileArchive className="h-16 w-16 text-primary" />
              <Loader2 className="h-8 w-8 text-primary animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div className="space-y-2 w-full max-w-xs">
              <p className="text-lg font-medium">{progress?.message || 'Processing...'}</p>
              <Progress value={progress?.progress || 0} className="h-2" />
              <p className="text-sm text-muted-foreground">{Math.round(progress?.progress || 0)}%</p>
            </div>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-16 w-16 text-destructive" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-destructive">Upload Failed</p>
              <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              "p-6 rounded-full bg-primary/10 transition-transform duration-300",
              isDragging && "scale-110"
            )}>
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold">
                {isDragging ? 'Drop your ZIP file here' : 'Upload WhatsApp Export'}
              </p>
              <p className="text-muted-foreground">
                Drag and drop your exported WhatsApp chat ZIP file, or click to browse
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <FileArchive className="h-4 w-4" />
              <span>Accepts .zip files exported from WhatsApp</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
