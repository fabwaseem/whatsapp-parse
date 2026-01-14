import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChatData, ParsedMessage } from '@/types/chat';
import { ChatBubble } from './ChatBubble';
import { DateSeparator } from './DateSeparator';

interface ChatListProps {
  chatData: ChatData;
  searchQuery?: string;
  highlightedMessageId?: string;
  onAudioPlay?: (audioElement: HTMLAudioElement) => void;
  onAudioEnd?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

interface RenderItem {
  type: 'date' | 'message';
  date?: Date;
  message?: ParsedMessage;
  showSender?: boolean;
}

export function ChatList({ chatData, searchQuery, highlightedMessageId, onAudioPlay, onAudioEnd, onDeleteMessage, onEditMessage }: ChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isGroupChat = chatData.participants.length > 2;
  const [stickyDate, setStickyDate] = useState<Date | null>(null);

  // Flatten messages with date separators
  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    let currentDate: string | null = null;
    let lastSender: string | null = null;

    for (const message of chatData.messages) {
      const messageDate = message.timestamp.toDateString();

      if (messageDate !== currentDate) {
        items.push({ type: 'date', date: message.timestamp });
        currentDate = messageDate;
        lastSender = null;
      }

      // Show sender for group chats or when sender changes
      const showSender = isGroupChat && message.sender !== lastSender && message.type !== 'system';
      lastSender = message.sender;

      items.push({ type: 'message', message, showSender });
    }

    return items;
  }, [chatData.messages, isGroupChat]);

  const virtualizer = useVirtualizer({
    count: renderItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const item = renderItems[index];
      if (item.type === 'date') return 48 + 16;
      if (item.message?.type === 'audio') return 120;
      if (item.message?.type === 'image' || item.message?.type === 'video') return 300;
      if (item.message?.type === 'document') return 100;
      const contentLength = item.message?.content.length || 0;
      const minHeight = 80;
      const estimatedHeight = Math.max(minHeight, Math.min(600, contentLength / 2.5 + minHeight));
      return estimatedHeight;
    }, [renderItems]),
    overscan: 10,
  });

  // Scroll to bottom on initial load
  useEffect(() => {
    if (parentRef.current && renderItems.length > 0) {
      setTimeout(() => {
        parentRef.current?.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: 'auto',
        });
      }, 100);
    }
  }, [chatData]);

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightedMessageId && renderItems.length > 0) {
      const index = renderItems.findIndex(
        item => item.type === 'message' && item.message?.id === highlightedMessageId
      );
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [highlightedMessageId, renderItems, virtualizer]);

  useEffect(() => {
    const updateStickyDate = () => {
      const virtualItems = virtualizer.getVirtualItems();
      if (virtualItems.length === 0 || renderItems.length === 0) return;

      const firstVisibleIndex = virtualItems[0]?.index ?? 0;

      let currentDate: Date | null = null;

      for (let i = firstVisibleIndex; i >= 0; i--) {
        const item = renderItems[i];
        if (item.type === 'date' && item.date) {
          currentDate = item.date;
          break;
        }
      }

      if (currentDate) {
        setStickyDate(currentDate);
      }
    };

    updateStickyDate();
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', updateStickyDate, { passive: true });
      return () => {
        scrollElement.removeEventListener('scroll', updateStickyDate);
      };
    }
  }, [renderItems, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto bg-chat-bg relative"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
    >
      {stickyDate && (
        <div className="sticky top-0 z-20 pt-2 pb-1 bg-chat-bg/80 backdrop-blur-sm">
          <DateSeparator date={stickyDate} />
        </div>
      )}
      <div
        className="relative w-full px-4"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const item = renderItems[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {item.type === 'date' && item.date && (
                <DateSeparator date={item.date} />
              )}
              {item.type === 'message' && item.message && (
                <ChatBubble
                  message={item.message}
                  showSender={item.showSender}
                  searchQuery={searchQuery}
                  isHighlighted={item.message.id === highlightedMessageId}
                  onAudioPlay={onAudioPlay}
                  onAudioEnd={onAudioEnd}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
