import { useState } from 'react';
import { ChatData } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Search, Replace, Filter, X, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  chatData: ChatData;
  defaultUser: string;
  onDefaultUserChange: (user: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  replaceText: string;
  onReplaceTextChange: (text: string) => void;
  onFindReplace: () => void;
  onFindReplaceAll: () => void;
  onSearchNext: () => void;
  onSearchPrev: () => void;
  searchResultCount: number;
  searchCurrentIndex: number;
  hideMediaOmitted: boolean;
  onHideMediaOmittedChange: (hide: boolean) => void;
  hideTextMessages: boolean;
  onHideTextMessagesChange: (hide: boolean) => void;
  hideMediaMessages: boolean;
  onHideMediaMessagesChange: (hide: boolean) => void;
  hideVoiceNotes: boolean;
  onHideVoiceNotesChange: (hide: boolean) => void;
  hideDeletedMessages: boolean;
  onHideDeletedMessagesChange: (hide: boolean) => void;
  hideSystemMessages: boolean;
  onHideSystemMessagesChange: (hide: boolean) => void;
  onExport: (format: 'txt' | 'json' | 'html' | 'pdf', includeMedia: boolean) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function ChatSidebar({
  chatData,
  defaultUser,
  onDefaultUserChange,
  searchQuery,
  onSearchChange,
  replaceText,
  onReplaceTextChange,
  onFindReplace,
  onFindReplaceAll,
  onSearchNext,
  onSearchPrev,
  searchResultCount,
  searchCurrentIndex,
  hideMediaOmitted,
  onHideMediaOmittedChange,
  hideTextMessages,
  onHideTextMessagesChange,
  hideMediaMessages,
  onHideMediaMessagesChange,
  hideVoiceNotes,
  onHideVoiceNotesChange,
  hideDeletedMessages,
  onHideDeletedMessagesChange,
  hideSystemMessages,
  onHideSystemMessagesChange,
  onExport,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<'txt' | 'json' | 'html' | 'pdf'>('txt');
  const [includeMedia, setIncludeMedia] = useState(false);

  const hasSearchResults = searchQuery.length > 0 && searchResultCount > 0;

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-full w-80 bg-card border-r border-border transition-transform duration-300",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:z-auto"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Options</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Default User (You)
            </Label>
            <Select value={defaultUser} onValueChange={onDefaultUserChange}>
              <SelectTrigger id="default-user">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {chatData.participants.map((participant) => (
                  <SelectItem key={participant} value={participant}>
                    {participant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select yourself to mark your messages as outgoing
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplaceMode(!isReplaceMode)}
                className="h-7 text-xs"
              >
                <Replace className="h-3 w-3 mr-1" />
                {isReplaceMode ? 'Replace' : 'Find'}
              </Button>
            </div>

            <Input
              id="search"
              placeholder="Search in messages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />

            {hasSearchResults && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {searchCurrentIndex + 1} of {searchResultCount}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchPrev}
                    disabled={searchResultCount === 0}
                    className="h-7 px-2"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchNext}
                    disabled={searchResultCount === 0}
                    className="h-7 px-2"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {isReplaceMode && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="replace-text">Replace With</Label>
                  <Input
                    id="replace-text"
                    placeholder="Replacement text..."
                    value={replaceText}
                    onChange={(e) => onReplaceTextChange(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFindReplace}
                    disabled={!searchQuery}
                    className="flex-1"
                  >
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFindReplaceAll}
                    disabled={!searchQuery}
                    className="flex-1"
                  >
                    Replace All
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Label>

            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-text-messages"
                  checked={hideTextMessages}
                  onCheckedChange={(checked) => onHideTextMessagesChange(checked === true)}
                />
                <Label
                  htmlFor="hide-text-messages"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide text messages
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-media-messages"
                  checked={hideMediaMessages}
                  onCheckedChange={(checked) => onHideMediaMessagesChange(checked === true)}
                />
                <Label
                  htmlFor="hide-media-messages"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide media messages (images, videos, documents)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-voice-notes"
                  checked={hideVoiceNotes}
                  onCheckedChange={(checked) => onHideVoiceNotesChange(checked === true)}
                />
                <Label
                  htmlFor="hide-voice-notes"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide voice notes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-deleted-messages"
                  checked={hideDeletedMessages}
                  onCheckedChange={(checked) => onHideDeletedMessagesChange(checked === true)}
                />
                <Label
                  htmlFor="hide-deleted-messages"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide deleted messages
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-system-messages"
                  checked={hideSystemMessages}
                  onCheckedChange={(checked) => onHideSystemMessagesChange(checked === true)}
                />
                <Label
                  htmlFor="hide-system-messages"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide system messages
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-media-omitted"
                  checked={hideMediaOmitted}
                  onCheckedChange={(checked) => onHideMediaOmittedChange(checked === true)}
                />
                <Label
                  htmlFor="hide-media-omitted"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hide &quot;&lt;Media omitted&gt;&quot; messages
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Chat
            </Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="export-format">Format</Label>
                <Select value={exportFormat} onValueChange={(value: 'txt' | 'json' | 'html' | 'pdf') => setExportFormat(value)}>
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">TXT (Plain Text)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-media"
                  checked={includeMedia}
                  onCheckedChange={(checked) => setIncludeMedia(checked === true)}
                />
                <Label
                  htmlFor="include-media"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include media (images, videos, etc.)
                </Label>
              </div>

              <Button
                onClick={() => onExport(exportFormat, includeMedia)}
                className="w-full"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Chat
              </Button>
              <p className="text-xs text-muted-foreground">
                Exports all visible messages (after applying filters)
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
