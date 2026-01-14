import { ChatData } from '@/types/chat';
import { ArrowLeft, Sun, Moon, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface ChatHeaderProps {
  chatData: ChatData;
  defaultUser: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
}

export function ChatHeader({
  chatData,
  defaultUser,
  theme,
  onToggleTheme,
  onBack,
  onToggleSidebar
}: ChatHeaderProps) {
  const isGroupChat = chatData.participants.length > 2;

  const otherUserInfo = useMemo(() => {
    if (isGroupChat) {
      return {
        name: chatData.chatName,
        messageCount: chatData.messageCount,
      };
    }

    const otherUser = chatData.participants.find(p => p !== defaultUser) || chatData.participants[0];
    const otherUserMessageCount = chatData.messages.filter(msg => msg.sender === otherUser).length;

    return {
      name: otherUser,
      messageCount: otherUserMessageCount,
    };
  }, [chatData, defaultUser, isGroupChat]);

  return (
    <header className="bg-chat-header text-chat-header-foreground">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-chat-header-foreground hover:bg-primary/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-chat-header-foreground hover:bg-primary/20 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          {isGroupChat ? (
            <Users className="h-5 w-5" />
          ) : (
            <span className="text-lg font-semibold">
              {otherUserInfo.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{otherUserInfo.name}</h1>
          <p className="text-xs opacity-80 truncate">
            {isGroupChat
              ? `${chatData.participants.length} participants`
              : `${otherUserInfo.messageCount.toLocaleString()} messages`
            }
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="text-chat-header-foreground hover:bg-primary/20"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
