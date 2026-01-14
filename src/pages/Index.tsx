import { useState, useCallback } from 'react';
import { ChatData, ParsingProgress } from '@/types/chat';
import { extractZipFile } from '@/lib/parser/zip-extractor';
import { parseWhatsAppChat } from '@/lib/parser/whatsapp-parse';
import { useTheme } from '@/hooks/use-theme';
import { Header } from '@/components/layout/Header';
import { UploadZone } from '@/components/upload/UploadZone';
import { PrivacyBadge } from '@/components/upload/PrivacyBadge';
import { ChatViewer } from '@/components/chat/ChatViewer';
import { MessageCircle, FileText, Image, Mic, Film, Sparkles, ArrowRight, Github, ExternalLink } from 'lucide-react';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ParsingProgress | undefined>();
  const [error, setError] = useState<string | undefined>();

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(undefined);
    setProgress({ stage: 'extracting', progress: 0, message: 'Starting...' });

    try {
      // Extract ZIP file
      const { chatText, mediaFiles } = await extractZipFile(file, setProgress);

      setProgress({ stage: 'parsing', progress: 80, message: 'Parsing chat...' });

      // Parse the chat
      const parsedData = parseWhatsAppChat(chatText, mediaFiles);

      setProgress({ stage: 'complete', progress: 100, message: 'Done!' });

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      setChatData(parsedData);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process the ZIP file');
      setProgress({ stage: 'error', progress: 0, message: 'Error' });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setChatData(null);
    setProgress(undefined);
    setError(undefined);
  }, []);

  // Show chat viewer when data is loaded
  if (chatData) {
    return (
      <ChatViewer
        chatData={chatData}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={handleBack}
      />
    );
  }

  // Show upload screen
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5 -z-10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl -z-10" />

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Beautiful Chat Viewer</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              View Your WhatsApp
              <span className="block bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                Chats Beautifully
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your exported WhatsApp chats into a beautiful, searchable experience.
              <span className="block mt-2 text-lg">
                All processing happens locally in your browser.
              </span>
            </p>
          </div>

          <UploadZone
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            progress={progress}
            error={error}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: MessageCircle, label: 'Text Messages', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
              { icon: Image, label: 'Photos', color: 'text-chart-1', bg: 'bg-chart-1/10', border: 'border-chart-1/20' },
              { icon: Mic, label: 'Voice Notes', color: 'text-chart-2', bg: 'bg-chart-2/10', border: 'border-chart-2/20' },
              { icon: Film, label: 'Videos', color: 'text-chart-3', bg: 'bg-chart-3/10', border: 'border-chart-3/20' },
            ].map(({ icon: Icon, label, color, bg, border }) => (
              <div
                key={label}
                className={`group relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 text-center border ${border} hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1`}
              >
                <div className={`inline-flex p-3 rounded-xl ${bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <p className="text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PrivacyBadge />

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl">How to Export</h3>
              </div>
              <ol className="space-y-4">
                {[
                  'Open the WhatsApp chat you want to export',
                  'Tap the menu (⋮) → More → Export chat',
                  'Choose "Include Media" for the full experience',
                  'Save the ZIP file and upload it here',
                ].map((step, index) => (
                  <li key={index} className="flex gap-4 group">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-1.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                100% client-side
              </span>
              <span className="hidden md:inline">•</span>
              <span>No data uploaded</span>
              <span className="hidden md:inline">•</span>
              <span>Privacy-focused</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Created by</span>
                <a
                  href="https://waseemanjum.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Waseem Anjum
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <span className="hidden md:inline">•</span>
              <a
                href="https://github.com/fabwaseem/whatsapp-parse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
