export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'deleted';

export interface MediaFile {
  name: string;
  type: string;
  blob: Blob;
  url: string;
}

export interface ParsedMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  type: MessageType;
  mediaFile?: MediaFile;
  isOutgoing: boolean;
  rawLine: string;
}

export interface ChatData {
  messages: ParsedMessage[];
  participants: string[];
  mediaFiles: Map<string, MediaFile>;
  chatName: string;
  startDate: Date | null;
  endDate: Date | null;
  messageCount: number;
}

export interface ParsingProgress {
  stage: 'extracting' | 'parsing' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface DateGroup {
  date: Date;
  messages: ParsedMessage[];
}
