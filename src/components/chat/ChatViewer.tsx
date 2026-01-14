import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChatData, ParsedMessage } from '@/types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatList } from './ChatList';
import { ChatSidebar } from './ChatSidebar';
import { exportToTXT, exportToJSON, exportToHTML, exportToPDF, downloadFile, downloadZipFile, ExportFormat } from '@/lib/export/chat-exporter';
import { useToast } from '@/hooks/use-toast';

interface ChatViewerProps {
  chatData: ChatData;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBack: () => void;
}

export function ChatViewer({ chatData, theme, onToggleTheme, onBack }: ChatViewerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultUser, setDefaultUser] = useState(chatData.participants[0] || '');
  const [replaceText, setReplaceText] = useState('');
  const [hideMediaOmitted, setHideMediaOmitted] = useState(false);
  const [hideTextMessages, setHideTextMessages] = useState(false);
  const [hideMediaMessages, setHideMediaMessages] = useState(false);
  const [hideVoiceNotes, setHideVoiceNotes] = useState(false);
  const [hideDeletedMessages, setHideDeletedMessages] = useState(false);
  const [hideSystemMessages, setHideSystemMessages] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modifiedMessages, setModifiedMessages] = useState<ParsedMessage[]>(chatData.messages);
  const [searchCurrentIndex, setSearchCurrentIndex] = useState(0);
  const currentPlayingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setModifiedMessages(chatData.messages);
  }, [chatData.messages]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const processedMessages = useMemo(() => {
    return modifiedMessages.map(msg => ({
      ...msg,
      isOutgoing: msg.sender === defaultUser,
    }));
  }, [modifiedMessages, defaultUser]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results: number[] = [];

    processedMessages.forEach((msg, index) => {
      if (msg.content.toLowerCase().includes(query) ||
          msg.sender.toLowerCase().includes(query)) {
        results.push(index);
      }
    });

    return results;
  }, [processedMessages, searchQuery]);

  useEffect(() => {
    setSearchCurrentIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (searchResults.length > 0 && searchCurrentIndex >= searchResults.length) {
      setSearchCurrentIndex(0);
    }
  }, [searchResults, searchCurrentIndex]);

  const handleSearchNext = useCallback(() => {
    if (searchResults.length === 0) return;
    setSearchCurrentIndex((prev) => (prev + 1) % searchResults.length);
  }, [searchResults]);

  const handleSearchPrev = useCallback(() => {
    if (searchResults.length === 0) return;
    setSearchCurrentIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults]);

  const highlightedMessageId = useMemo(() => {
    if (searchResults.length === 0 || searchCurrentIndex >= searchResults.length) return undefined;
    const messageIndex = searchResults[searchCurrentIndex];
    return processedMessages[messageIndex]?.id;
  }, [searchResults, searchCurrentIndex, processedMessages]);

  const handleFindReplace = useCallback(() => {
    if (!searchQuery || searchResults.length === 0) return;

    const messageIndex = searchResults[searchCurrentIndex];
    if (messageIndex !== undefined && processedMessages[messageIndex]) {
      const updated = [...modifiedMessages];
      updated[messageIndex] = {
        ...updated[messageIndex],
        content: updated[messageIndex].content.replace(
          new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          replaceText
        ),
      };
      setModifiedMessages(updated);

      if (searchCurrentIndex < searchResults.length - 1) {
        setSearchCurrentIndex(searchCurrentIndex + 1);
      }
    }
  }, [processedMessages, modifiedMessages, searchQuery, replaceText, searchResults, searchCurrentIndex]);

  const handleFindReplaceAll = useCallback(() => {
    if (!searchQuery) return;

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = modifiedMessages.map(msg => {
      if (msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return {
          ...msg,
          content: msg.content.replace(regex, replaceText),
        };
      }
      return msg;
    });
    setModifiedMessages(updated);
  }, [modifiedMessages, searchQuery, replaceText]);

  const handleAudioPlay = useCallback((audioElement: HTMLAudioElement) => {
    if (currentPlayingAudioRef.current && currentPlayingAudioRef.current !== audioElement) {
      currentPlayingAudioRef.current.pause();
      currentPlayingAudioRef.current.currentTime = 0;
    }
    currentPlayingAudioRef.current = audioElement;
  }, []);

  const filteredChatData = useMemo(() => {
    let messages = processedMessages;

    messages = messages.filter(msg => {
      if (hideTextMessages && msg.type === 'text') {
        return false;
      }

      if (hideMediaMessages && (msg.type === 'image' || msg.type === 'video' || msg.type === 'document')) {
        return false;
      }

      if (hideVoiceNotes && msg.type === 'audio') {
        return false;
      }

      if (hideDeletedMessages && msg.type === 'deleted') {
        return false;
      }

      if (hideSystemMessages && msg.type === 'system') {
        return false;
      }

      if (hideMediaOmitted) {
        const content = msg.content.toLowerCase();
        if (content.includes('omitted') ||
            content.includes('<media omitted>') ||
            content.includes('image omitted') ||
            content.includes('video omitted') ||
            content.includes('audio omitted') ||
            content.includes('sticker omitted') ||
            content.includes('document omitted') ||
            content.includes('gif omitted')) {
          return false;
        }
      }

      return true;
    });

    return {
      ...chatData,
      messages,
    };
  }, [processedMessages, hideMediaOmitted, hideTextMessages, hideMediaMessages, hideVoiceNotes, hideDeletedMessages, hideSystemMessages, chatData]);

  const handleAudioEnd = useCallback((messageId: string) => {
    currentPlayingAudioRef.current = null;

    const currentIndex = filteredChatData.messages.findIndex(msg => msg.id === messageId);
    if (currentIndex === -1) return;

    for (let i = currentIndex + 1; i < filteredChatData.messages.length; i++) {
      const nextMessage = filteredChatData.messages[i];
      if (nextMessage.type === 'audio' && nextMessage.mediaFile) {
        const nextAudioElement = document.querySelector(`audio[data-message-id="${nextMessage.id}"]`) as HTMLAudioElement;
        if (nextAudioElement) {
          nextAudioElement.play();
          currentPlayingAudioRef.current = nextAudioElement;
          return;
        }
      }
    }
  }, [filteredChatData.messages]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    const updated = modifiedMessages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          type: 'deleted' as const,
          content: 'This message was deleted',
        };
      }
      return msg;
    });
    setModifiedMessages(updated);
  }, [modifiedMessages]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const updated = modifiedMessages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: newContent,
        };
      }
      return msg;
    });
    setModifiedMessages(updated);
  }, [modifiedMessages]);

  const handleExport = useCallback(async (format: ExportFormat, includeMedia: boolean) => {
    try {
      const exportData = {
        ...chatData,
        messages: filteredChatData.messages,
      };

      const sanitizedName = chatData.chatName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      if (format === 'txt') {
        const content = exportToTXT(exportData, { includeMedia });
        if (includeMedia) {
          await downloadZipFile(chatData, content, `${sanitizedName}.txt`, format);
          toast({ description: 'Chat exported to ZIP with media' });
        } else {
          downloadFile(content, `${sanitizedName}.txt`, 'text/plain');
          toast({ description: 'Chat exported to TXT' });
        }
      } else if (format === 'json') {
        const content = exportToJSON(exportData, { includeMedia });
        if (includeMedia) {
          await downloadZipFile(chatData, content, `${sanitizedName}.json`, format);
          toast({ description: 'Chat exported to ZIP with media' });
        } else {
          downloadFile(content, `${sanitizedName}.json`, 'application/json');
          toast({ description: 'Chat exported to JSON' });
        }
      } else if (format === 'html') {
        const content = exportToHTML(exportData, { includeMedia });
        if (includeMedia) {
          await downloadZipFile(chatData, content, `${sanitizedName}.html`, format);
          toast({ description: 'Chat exported to ZIP with media' });
        } else {
          downloadFile(content, `${sanitizedName}.html`, 'text/html');
          toast({ description: 'Chat exported to HTML' });
        }
      } else if (format === 'pdf') {
        // PDF uses print dialog, so we can't easily include media in ZIP
        // For now, just use the existing PDF export
        exportToPDF(exportData, { includeMedia });
        toast({ description: 'Opening PDF print dialog...' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to export chat',
      });
    }
  }, [chatData, filteredChatData, toast]);

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        chatData={chatData}
        defaultUser={defaultUser}
        onDefaultUserChange={setDefaultUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        replaceText={replaceText}
        onReplaceTextChange={setReplaceText}
        onFindReplace={handleFindReplace}
        onFindReplaceAll={handleFindReplaceAll}
        onSearchNext={handleSearchNext}
        onSearchPrev={handleSearchPrev}
        searchResultCount={searchResults.length}
        searchCurrentIndex={searchCurrentIndex}
        hideMediaOmitted={hideMediaOmitted}
        onHideMediaOmittedChange={setHideMediaOmitted}
        hideTextMessages={hideTextMessages}
        onHideTextMessagesChange={setHideTextMessages}
        hideMediaMessages={hideMediaMessages}
        onHideMediaMessagesChange={setHideMediaMessages}
        hideVoiceNotes={hideVoiceNotes}
        onHideVoiceNotesChange={setHideVoiceNotes}
        hideDeletedMessages={hideDeletedMessages}
        onHideDeletedMessagesChange={setHideDeletedMessages}
        hideSystemMessages={hideSystemMessages}
        onHideSystemMessagesChange={setHideSystemMessages}
        onExport={handleExport}
        isOpen={sidebarOpen || !isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          chatData={filteredChatData}
          defaultUser={defaultUser}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onBack={onBack}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <ChatList
          chatData={filteredChatData}
          searchQuery={searchQuery}
          highlightedMessageId={highlightedMessageId}
          onAudioPlay={handleAudioPlay}
          onAudioEnd={handleAudioEnd}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
        />
      </div>

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
