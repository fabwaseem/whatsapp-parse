import { ParsedMessage, MessageType, ChatData, MediaFile, DateGroup } from '@/types/chat';

// WhatsApp message patterns for different export formats
const MESSAGE_PATTERNS = [
  // Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)$/i,
  // Format: DD/MM/YYYY, HH:MM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i,
  // Format: MM/DD/YYYY, HH:MM - Sender: Message (US format)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i,
];

const SYSTEM_MESSAGE_PATTERNS = [
  // Format: [DD/MM/YYYY, HH:MM:SS] System message (no colon after sender)
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*(.+)$/i,
  // Format: DD/MM/YYYY, HH:MM - System message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*(.+)$/i,
];

const MEDIA_PATTERNS = {
  image: /<attached:\s*([^>]+\.(jpg|jpeg|png|gif|webp))>/i,
  video: /<attached:\s*([^>]+\.(mp4|mov|avi|mkv|3gp))>/i,
  audio: /<attached:\s*([^>]+\.(opus|ogg|mp3|m4a|wav|aac))>/i,
  document: /<attached:\s*([^>]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip))>/i,
};

const MEDIA_FILE_PATTERNS = {
  image: /\.(jpg|jpeg|png|gif|webp)$/i,
  video: /\.(mp4|mov|avi|mkv|3gp)$/i,
  audio: /\.(opus|ogg|mp3|m4a|wav|aac|ptt)$/i,
  document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip)$/i,
};

// Patterns for omitted media indicators
const OMITTED_PATTERNS = [
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /sticker omitted/i,
  /document omitted/i,
  /GIF omitted/i,
];

const DELETED_MESSAGE_PATTERNS = [
  /this message was deleted/i,
  /you deleted this message/i,
  /message deleted/i,
];

const SYSTEM_INDICATORS = [
  /messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added/i,
  /left/i,
  /removed/i,
  /changed the subject/i,
  /changed this group/i,
  /changed the group/i,
  /security code changed/i,
];

function parseDate(dateStr: string, timeStr: string): Date {
  // Clean up the strings
  dateStr = dateStr.trim();
  timeStr = timeStr.trim().toUpperCase();
  
  // Parse date parts
  const dateParts = dateStr.split('/').map(p => parseInt(p, 10));
  
  // Determine if it's DD/MM/YYYY or MM/DD/YYYY
  // If first part > 12, it must be DD/MM/YYYY
  let day: number, month: number, year: number;
  
  if (dateParts[0] > 12) {
    [day, month, year] = dateParts;
  } else if (dateParts[1] > 12) {
    [month, day, year] = dateParts;
  } else {
    // Assume DD/MM/YYYY as it's more common in WhatsApp exports
    [day, month, year] = dateParts;
  }
  
  // Handle 2-digit years
  if (year < 100) {
    year += year > 50 ? 1900 : 2000;
  }
  
  // Parse time
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
  if (timeParts) {
    hours = parseInt(timeParts[1], 10);
    minutes = parseInt(timeParts[2], 10);
    seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
    
    const meridian = timeParts[4];
    if (meridian) {
      if (meridian === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridian === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  }
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function detectMessageType(content: string, mediaFiles: Map<string, MediaFile>): { type: MessageType; mediaFileName?: string } {
  // Check for deleted messages
  for (const pattern of DELETED_MESSAGE_PATTERNS) {
    if (pattern.test(content)) {
      return { type: 'deleted' };
    }
  }
  
  // Check for omitted media
  for (const pattern of OMITTED_PATTERNS) {
    if (pattern.test(content)) {
      if (/image|sticker|GIF/i.test(content)) return { type: 'image' };
      if (/video/i.test(content)) return { type: 'video' };
      if (/audio/i.test(content)) return { type: 'audio' };
      if (/document/i.test(content)) return { type: 'document' };
    }
  }
  
  // Check for attached media
  for (const [type, pattern] of Object.entries(MEDIA_PATTERNS)) {
    const match = content.match(pattern);
    if (match) {
      return { type: type as MessageType, mediaFileName: match[1] };
    }
  }
  
  // Check for media file references in content
  const fileMatch = content.match(/([A-Z0-9-]+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|opus|ogg|mp3|m4a|pdf|doc|docx))/i);
  if (fileMatch) {
    const fileName = fileMatch[1];
    for (const [type, pattern] of Object.entries(MEDIA_FILE_PATTERNS)) {
      if (pattern.test(fileName)) {
        return { type: type as MessageType, mediaFileName: fileName };
      }
    }
  }
  
  return { type: 'text' };
}

function isSystemMessage(content: string): boolean {
  return SYSTEM_INDICATORS.some(pattern => pattern.test(content));
}

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg_${Date.now()}_${messageIdCounter++}`;
}

export function parseWhatsAppChat(
  chatText: string,
  mediaFiles: Map<string, MediaFile>,
  currentUserHint?: string
): ChatData {
  const lines = chatText.split('\n');
  const messages: ParsedMessage[] = [];
  const participantSet = new Set<string>();
  const senderMessageCounts = new Map<string, number>();
  
  let currentMessage: ParsedMessage | null = null;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    let matched = false;
    
    // Try to match regular message patterns
    for (const pattern of MESSAGE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Finalize previous message
        if (currentMessage) {
          messages.push(currentMessage);
        }
        
        const [, dateStr, timeStr, sender, content] = match;
        const timestamp = parseDate(dateStr, timeStr);
        const senderName = sender.trim();
        
        participantSet.add(senderName);
        senderMessageCounts.set(senderName, (senderMessageCounts.get(senderName) || 0) + 1);
        
        // Detect message type
        let type: MessageType = 'text';
        let mediaFile: MediaFile | undefined;
        
        if (isSystemMessage(content)) {
          type = 'system';
        } else {
          const detected = detectMessageType(content, mediaFiles);
          type = detected.type;
          
          if (detected.mediaFileName) {
            // Try to find the media file
            for (const [fileName, file] of mediaFiles.entries()) {
              if (fileName.toLowerCase().includes(detected.mediaFileName.toLowerCase()) ||
                  detected.mediaFileName.toLowerCase().includes(fileName.toLowerCase().replace(/^.*\//, ''))) {
                mediaFile = file;
                break;
              }
            }
          }
        }
        
        currentMessage = {
          id: generateMessageId(),
          timestamp,
          sender: senderName,
          content: content.trim(),
          type,
          mediaFile,
          isOutgoing: false, // Will be determined later
          rawLine: line,
        };
        
        matched = true;
        break;
      }
    }
    
    // Try system message patterns if no regular match
    if (!matched) {
      for (const pattern of SYSTEM_MESSAGE_PATTERNS) {
        const match = line.match(pattern);
        if (match && !line.includes(': ')) {
          if (currentMessage) {
            messages.push(currentMessage);
          }
          
          const [, dateStr, timeStr, content] = match;
          const timestamp = parseDate(dateStr, timeStr);
          
          currentMessage = {
            id: generateMessageId(),
            timestamp,
            sender: 'System',
            content: content.trim(),
            type: 'system',
            isOutgoing: false,
            rawLine: line,
          };
          
          matched = true;
          break;
        }
      }
    }
    
    // If no pattern matched, it might be a continuation of the previous message
    if (!matched && currentMessage) {
      currentMessage.content += '\n' + line;
    }
  }
  
  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  // Determine the most likely "current user" (the one with most messages, or provided hint)
  let currentUser = currentUserHint;
  if (!currentUser) {
    let maxCount = 0;
    for (const [sender, count] of senderMessageCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        currentUser = sender;
      }
    }
  }
  
  // Mark outgoing messages
  for (const msg of messages) {
    msg.isOutgoing = msg.sender === currentUser;
  }
  
  const participants = Array.from(participantSet).filter(p => p !== 'System');
  
  // Determine chat name
  let chatName = 'WhatsApp Chat';
  if (participants.length === 2) {
    chatName = participants.find(p => p !== currentUser) || participants[0];
  } else if (participants.length > 2) {
    chatName = `Group Chat (${participants.length} participants)`;
  }
  
  return {
    messages,
    participants,
    mediaFiles,
    chatName,
    startDate: messages.length > 0 ? messages[0].timestamp : null,
    endDate: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    messageCount: messages.length,
  };
}

export function groupMessagesByDate(messages: ParsedMessage[]): DateGroup[] {
  const groups = new Map<string, ParsedMessage[]>();
  
  for (const message of messages) {
    const dateKey = message.timestamp.toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  }
  
  return Array.from(groups.entries()).map(([dateStr, msgs]) => ({
    date: new Date(dateStr),
    messages: msgs,
  }));
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
