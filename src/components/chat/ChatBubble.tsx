import React from 'react';
import { ParsedMessage } from '@/types/chat';
import { formatTimestamp } from '@/lib/parser/whatsapp-parse';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Ban, FileText, Download, Play, Pause, ChevronDown, ChevronUp, Share2, Edit, Copy, Trash2, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChatBubbleProps {
  message: ParsedMessage;
  showSender?: boolean;
  searchQuery?: string;
  isHighlighted?: boolean;
  onAudioPlay?: (audioElement: HTMLAudioElement) => void;
  onAudioEnd?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-primary/30 text-foreground px-0.5 rounded">
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

const MAX_MESSAGE_LENGTH = 500;

export function ChatBubble({ message, showSender = true, searchQuery, isHighlighted, onAudioPlay, onAudioEnd, onDelete, onEdit }: ChatBubbleProps) {
  const { type, content, sender, timestamp, isOutgoing, mediaFile, id } = message;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        description: 'Message copied to clipboard',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: 'Failed to copy message',
      });
    }
  };

  const handleShare = async () => {
    try {
      // Try Web Share API first if available (works on HTTPS/localhost)
      if (navigator.share) {
        const shareData: ShareData = {
          title: 'WhatsApp Message',
          text: content || (mediaFile ? mediaFile.name : ''),
        };

        // If it's a media message, include the URL
        if (mediaFile && mediaFile.url) {
          shareData.url = mediaFile.url;
        }

        try {
          await navigator.share(shareData);
          toast({
            description: 'Message shared',
          });
          return;
        } catch (shareErr) {
          // If user cancels, don't show error
          if ((shareErr as Error).name === 'AbortError') {
            return;
          }
          // For other errors, fall through to copy
        }
      }

      // Fallback: Copy to clipboard
      const textToCopy = mediaFile && mediaFile.url
        ? `${content || mediaFile.name}\n${mediaFile.url}`
        : content;

      await navigator.clipboard.writeText(textToCopy);
      toast({
        description: 'Message copied to clipboard',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: 'Failed to share message',
      });
    }
  };

  const handleEdit = () => {
    if (type === 'text') {
      setIsEditing(true);
      setEditContent(content);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(id, editContent.trim());
      setIsEditing(false);
      toast({
        description: 'Message updated',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
      toast({
        description: 'Message deleted',
      });
    }
  };

  const shouldTruncate = content.length > MAX_MESSAGE_LENGTH;
  const displayContent = shouldTruncate && !isExpanded
    ? content.substring(0, MAX_MESSAGE_LENGTH)
    : content;

  if (type === 'system') {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-system-message text-system-message-foreground px-4 py-1.5 rounded-lg text-xs text-center max-w-[80%] shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  if (type === 'deleted') {
    return (
      <div className={cn("flex my-1 px-4  ", isOutgoing ? "justify-end" : "justify-start")}>
        <div className={cn(
          "max-w-[75%] px-3 py-2 rounded-lg shadow-sm",
          isOutgoing ? "bg-bubble-outgoing rounded-tr-none" : "bg-bubble-incoming rounded-tl-none"
        )}>
          <p className="text-muted-foreground text-sm italic flex items-center gap-2">
            <Ban className="h-4 w-4" />
            This message was deleted
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-timestamp">{formatTimestamp(timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group flex my-1 px-4", isOutgoing ? "justify-end" : "justify-start")}>
      <div className={cn(
        "relative max-w-[75%] px-3 py-2 rounded-lg shadow-sm transition-all",
        isOutgoing
          ? "bg-bubble-outgoing text-bubble-outgoing-foreground rounded-tr-none"
          : "bg-bubble-incoming text-bubble-incoming-foreground rounded-tl-none",
        isHighlighted && "ring-2 ring-primary ring-offset-2"
      )}>
        {/* Action buttons - visible on hover */}
        <div className={cn(
          "absolute flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10",
          isOutgoing ? "top-1 right-1" : "top-1 left-1"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          {type === 'text' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {showSender && !isOutgoing && (
          <p className="text-xs font-semibold text-primary mb-1">{sender}</p>
        )}

        <MediaContent message={message} onAudioPlay={onAudioPlay} onAudioEnd={onAudioEnd} />

        {type === 'text' && (
          <div className="space-y-1">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdit}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {searchQuery ? highlightText(displayContent, searchQuery) : displayContent}
                </p>
                {shouldTruncate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        View less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        View more
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-timestamp">{formatTimestamp(timestamp)}</span>
          {isOutgoing && <CheckCheck className="h-3 w-3 text-primary" />}
        </div>
      </div>
    </div>
  );
}

function MediaContent({ message, onAudioPlay, onAudioEnd }: { message: ParsedMessage; onAudioPlay?: (audioElement: HTMLAudioElement) => void; onAudioEnd?: (messageId: string) => void }) {
  const { type, mediaFile, content } = message;

  if (type === 'image') {
    if (mediaFile) {
      return (
        <div className="mb-2 px-4 ">
          <img
            src={mediaFile.url}
            alt="Shared image"
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div className="bg-muted/50 rounded-lg p-4 mb-2 text-center">
        <p className="text-muted-foreground text-sm">📷 {content || 'Image omitted'}</p>
      </div>
    );
  }

  if (type === 'video') {
    if (mediaFile) {
      return (
        <div className="mb-2">
          <video
            src={mediaFile.url}
            controls
            className="rounded-lg max-w-full max-h-64"
            preload="metadata"
          />
        </div>
      );
    }
    return (
      <div className="bg-muted/50 rounded-lg p-4 mb-2 text-center">
        <p className="text-muted-foreground text-sm">🎬 {content || 'Video omitted'}</p>
      </div>
    );
  }

  if (type === 'audio') {
    if (mediaFile) {
      return <AudioPlayer mediaFile={mediaFile} messageId={message.id} onAudioPlay={onAudioPlay} onAudioEnd={onAudioEnd} />;
    }
    return (
      <div className="bg-muted/50 rounded-lg p-4 mb-2 text-center">
        <p className="text-muted-foreground text-sm">🎵 {content || 'Audio omitted'}</p>
      </div>
    );
  }

  if (type === 'document') {
    if (mediaFile) {
      return (
        <a
          href={mediaFile.url}
          download={mediaFile.name}
          className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 mb-2 hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-10 w-10 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mediaFile.name}</p>
            <p className="text-xs text-muted-foreground">Document</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
        </a>
      );
    }
    return (
      <div className="bg-muted/50 rounded-lg p-4 mb-2 text-center">
        <p className="text-muted-foreground text-sm">📄 {content || 'Document omitted'}</p>
      </div>
    );
  }

  return null;
}

function AudioPlayer({
  mediaFile,
  messageId,
  onAudioPlay,
  onAudioEnd
}: {
  mediaFile: { url: string; name: string };
  messageId: string;
  onAudioPlay?: (audioElement: HTMLAudioElement) => void;
  onAudioEnd?: (messageId: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (onAudioPlay && audioRef.current) {
        onAudioPlay(audioRef.current);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (onAudioEnd) {
      onAudioEnd(messageId);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onAudioPlay && audioRef.current) {
      onAudioPlay(audioRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted/30 rounded-full p-2 pr-4 mb-2 min-w-[200px] px-4">
      <audio
        ref={audioRef}
        src={mediaFile.url}
        data-message-id={messageId}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={handlePlay}
        preload="metadata"
      />
      <button
        onClick={togglePlay}
        className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatTime(duration)}
        </p>
      </div>
    </div>
  );
}
